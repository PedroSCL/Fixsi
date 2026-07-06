import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { prisma } from "./prisma";

export function setupSocket(httpServer: HttpServer, jwtSecret: string) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Middleware de autenticação — verifica o JWT no handshake
  // Antes de conectar, o frontend envia o token
  // Se for inválido, a conexão é recusada
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Token não fornecido"));
    }

    try {
      // Verifica o token manualmente (sem o Fastify aqui)
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, jwtSecret) as { id: string };
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
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

      // Só o cliente e o profissional/locador podem entrar
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
      async (data: { conversationId: string; content: string; imageUrl?: string }) => {
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
      }
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