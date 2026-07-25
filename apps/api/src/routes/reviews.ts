import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function reviewsRoutes(app: FastifyInstance) {
  // Criar avaliação
  app.post(
    "/bookings/:bookingId/review",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { bookingId } = request.params as { bookingId: string };
      const body = createReviewSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: { select: { userId: true } },
          tool: { select: { userId: true } },
          reviews: true,
        },
      });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      // Só pode avaliar bookings concluídos
      if (booking.status !== "COMPLETED") {
        return reply.code(400).send({
          error: "Só é possível avaliar bookings concluídos",
        });
      }

      const providerId = booking.service?.userId || booking.tool?.userId;

      // Só o cliente ou o profissional/locador podem avaliar
      const isClient = booking.clientId === userId;
      const isProvider = providerId === userId;

      if (!isClient && !isProvider) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      // Quem está avaliando e quem está sendo avaliado
      // Cliente avalia o profissional, profissional avalia o cliente
      const authorId = userId;
      const targetId = isClient ? providerId! : booking.clientId;

      // Verifica se já avaliou esse booking
      const existingReview = await prisma.review.findFirst({
        where: { bookingId, authorId },
      });

      if (existingReview) {
        return reply.code(409).send({
          error: "Você já avaliou esse booking",
        });
      }

      // Cria a avaliação — começa invisível
      const review = await prisma.review.create({
        data: {
          rating: body.rating,
          comment: body.comment,
          bookingId,
          authorId,
          targetId,
          visible: false,
        },
      });

      // Verifica se a outra parte já avaliou
      const otherReview = await prisma.review.findFirst({
        where: {
          bookingId,
          authorId: targetId,
        },
      });

      // Se ambos avaliaram, torna as duas visíveis
      if (otherReview) {
        await prisma.review.updateMany({
          where: { bookingId },
          data: { visible: true },
        });
      }

      return reply.code(201).send({
        review,
        message: otherReview
          ? "Avaliação publicada! Você já pode ver a avaliação que recebeu."
          : "Avaliação registrada. Ela ficará visível quando a outra parte também avaliar.",
      });
    },
  );

  // Ver avaliações de um usuário (público)
  app.get("/users/:userId/reviews", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const reviews = await prisma.review.findMany({
      where: {
        targetId: userId,
        visible: true,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcula a média de avaliações
    const average =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return reply.send({
      reviews,
      average: Math.round(average * 10) / 10,
      total: reviews.length,
    });
  });
}
