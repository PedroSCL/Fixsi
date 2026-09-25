import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import fastifyCookie from "@fastify/cookie";
import { prisma } from "./prisma";
import { getEnvironment } from "../config/env";
import { ACCESS_COOKIE } from "./session";

let socketServer: SocketServer | null = null;

export function disconnectUserSockets(userId: string) {
  socketServer?.in(`user:${userId}`).disconnectSockets(true);
}

export function setupSocket(
  httpServer: HttpServer,
  jwt: { verify: (token: string) => unknown },
) {
  const environment = getEnvironment();
  const allowedOrigin = new URL(environment.FRONTEND_URL).origin;
  const io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  socketServer = io;

  // O navegador envia o cookie HttpOnly durante o handshake. O token explícito
  // permanece aceito temporariamente para clientes antigos durante o rollout.
  io.use(async (socket, next) => {
    const cookies = fastifyCookie.parse(socket.handshake.headers.cookie || "");
    const token = socket.handshake.auth.token || cookies[ACCESS_COOKIE];
    if (!token) {
      return next(new Error("Token não fornecido"));
    }

    try {
      const decoded = jwt.verify(token) as {
        id: string;
        sessionId?: string;
      };

      if (decoded.sessionId) {
        const activeSession = await prisma.session.findFirst({
          where: {
            id: decoded.sessionId,
            userId: decoded.id,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          select: { id: true },
        });

        if (!activeSession) {
          return next(new Error("Sessão inválida ou revogada"));
        }
      } else {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true },
        });
        if (!user) {
          return next(new Error("Conta não encontrada"));
        }
      }

      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    console.log(`Usuário conectado: ${userId}`);

    // Entrar numa sala de conversa
    // O frontend chama isso quando abre o chat de um booking
    socket.on("join_conversation", async (conversationId: string) => {
      // Verifica se o usuário tem permissão nessa conversa
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          booking: {
            include: {
              service: { select: { userId: true } },
              tool: { select: { userId: true } },
            },
          },
        },
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversa não encontrada" });
        return;
      }

      const clientId = conversation.booking.clientId;
      const providerId =
        conversation.booking.service?.userId ||
        conversation.booking.tool?.userId;

      // Só o cliente e o profissional responsável podem entrar
      if (userId !== clientId && userId !== providerId) {
        socket.emit("error", { message: "Sem permissão" });
        return;
      }

      socket.join(conversationId);
      socket.emit("joined", { conversationId });
      console.log(`Usuário ${userId} entrou na conversa ${conversationId}`);
    });

    // Enviar mensagem
    socket.on(
      "send_message",
      async (data: {
        conversationId: string;
        content: string;
        imageUrl?: string;
      }) => {
        const { conversationId, content, imageUrl } = data;

        if (!content?.trim() && !imageUrl) {
          socket.emit("error", { message: "Mensagem vazia" });
          return;
        }

        // Verifica se o usuário está na sala
        if (!socket.rooms.has(conversationId)) {
          socket.emit("error", { message: "Entre na conversa primeiro" });
          return;
        }

        try {
          // Salva a mensagem no banco
          const message = await prisma.message.create({
            data: {
              content: content?.trim() || "",
              imageUrl,
              conversationId,
              senderId: userId,
            },
            include: {
              sender: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          });

          // Emite a mensagem para todos na sala (incluindo quem enviou)
          // Assim o remetente também vê a mensagem confirmada e salva
          io.to(conversationId).emit("new_message", message);
        } catch {
          socket.emit("error", { message: "Erro ao enviar mensagem" });
        }
      },
    );

    // Usuário está digitando — feedback visual no chat
    socket.on("typing", (conversationId: string) => {
      socket.to(conversationId).emit("user_typing", { userId });
    });

    socket.on("disconnect", () => {
      console.log(`Usuário desconectado: ${userId}`);
    });
  });

  return io;
}
