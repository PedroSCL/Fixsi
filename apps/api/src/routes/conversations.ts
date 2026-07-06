import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

const sendMessageSchema = z.object({
  content: z.string().min(1),
  imageUrl: z.string().optional(),
});

export async function conversationsRoutes(app: FastifyInstance) {
  // Buscar histórico de mensagens de uma conversa
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          booking: {
            include: {
              service: { select: { userId: true, title: true } },
              tool: { select: { userId: true, title: true } },
              client: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          messages: {
            include: {
              sender: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          proposals: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!conversation) {
        return reply.code(404).send({ error: "Conversa não encontrada" });
      }

      // Verifica permissão
      const clientId = conversation.booking.clientId;
      const providerId =
        conversation.booking.service?.userId ||
        conversation.booking.tool?.userId;

      if (userId !== clientId && userId !== providerId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      return reply.send({ conversation });
    }
  );

  // Enviar mensagem via HTTP (alternativa ao WebSocket)
  app.post(
    "/:id/messages",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = sendMessageSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      const conversation = await prisma.conversation.findUnique({
        where: { id },
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
        return reply.code(404).send({ error: "Conversa não encontrada" });
      }

      const clientId = conversation.booking.clientId;
      const providerId =
        conversation.booking.service?.userId ||
        conversation.booking.tool?.userId;

      if (userId !== clientId && userId !== providerId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      const message = await prisma.message.create({
        data: {
          content: body.content,
          imageUrl: body.imageUrl,
          conversationId: id,
          senderId: userId,
        },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return reply.code(201).send({ message });
    }
  );
}