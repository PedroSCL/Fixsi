import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

const createBookingSchema = z.object({
  serviceId: z.string().optional(),
  toolId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
}).refine((data) => data.serviceId || data.toolId, {
  message: "Informe um serviceId ou toolId",
});

const createProposalSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function bookingsRoutes(app: FastifyInstance) {
  // Criar booking (cliente autenticado)
  app.post(
    "/",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = createBookingSchema.parse(request.body);
      const clientId = (request.user as { id: string }).id;

      // Verifica se tem papel de CLIENT
      const role = await prisma.userRole.findUnique({
        where: { userId_type: { userId: clientId, type: "CLIENT" } },
      });

      if (!role) {
        return reply.code(403).send({
          error: "Apenas Clientes podem fazer agendamentos",
        });
      }

      // Valida se o serviço ou ferramenta existe e está disponível
      if (body.serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: body.serviceId },
        });
        if (!service || !service.approved || !service.active) {
          return reply.code(404).send({ error: "Serviço não encontrado ou indisponível" });
        }
        // Cliente não pode contratar a si mesmo
        if (service.userId === clientId) {
          return reply.code(400).send({ error: "Você não pode contratar seu próprio serviço" });
        }
      }

      if (body.toolId) {
        const tool = await prisma.tool.findUnique({
          where: { id: body.toolId },
        });
        if (!tool || !tool.approved || !tool.available) {
          return reply.code(404).send({ error: "Ferramenta não encontrada ou indisponível" });
        }
        if (tool.userId === clientId) {
          return reply.code(400).send({ error: "Você não pode alugar sua própria ferramenta" });
        }
      }

      // Cria o Booking e a Conversation numa transação
      // Os dois precisam ser criados juntos — sem conversa, não tem como negociar
      const booking = await prisma.$transaction(async (tx) => {
        const newBooking = await tx.booking.create({
          data: {
            clientId,
            serviceId: body.serviceId,
            toolId: body.toolId,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : null,
            status: "PENDING",
          },
        });

        await tx.conversation.create({
          data: { bookingId: newBooking.id },
        });

        return newBooking;
      });

      // Busca o booking completo com a conversa incluída
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          conversation: true,
          service: { select: { id: true, title: true, category: true } },
          tool: { select: { id: true, title: true, category: true } },
          client: { select: { id: true, name: true } },
        },
      });

      return reply.code(201).send({ booking: fullBooking });
    }
  );

  // Listar bookings do usuário logado
  app.get(
    "/",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;

      const bookings = await prisma.booking.findMany({
        where: { clientId: userId },
        include: {
          service: { select: { id: true, title: true, category: true } },
          tool: { select: { id: true, title: true, category: true } },
          proposal: true,
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({ bookings });
    }
  );

  // Detalhe do booking com mensagens
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              category: true,
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          tool: {
            select: {
              id: true,
              title: true,
              category: true,
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          client: { select: { id: true, name: true, avatarUrl: true } },
          conversation: {
            include: {
              messages: {
                include: {
                  sender: { select: { id: true, name: true, avatarUrl: true } },
                },
                orderBy: { createdAt: "asc" },
              },
              proposals: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
          payment: true,
        },
      });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      // Só o cliente ou o profissional/locador podem ver
      const providerId =
        booking.service?.user?.id || booking.tool?.user?.id;

      if (booking.clientId !== userId && providerId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      return reply.send({ booking });
    }
  );

  // Profissional envia proposta de orçamento
  app.post(
    "/:id/proposals",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = createProposalSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          conversation: true,
          service: { select: { userId: true } },
          tool: { select: { userId: true } },
        },
      });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      // Só o profissional/locador dono do serviço pode enviar proposta
      const providerId = booking.service?.userId || booking.tool?.userId;
      if (providerId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      if (!booking.conversation) {
        return reply.code(400).send({ error: "Conversa não encontrada" });
      }

      const proposal = await prisma.proposal.create({
        data: {
          amount: body.amount,
          description: body.description,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          conversationId: booking.conversation.id,
          senderId: userId,
          status: "PENDING",
        },
      });

      return reply.code(201).send({ proposal });
    }
  );

  // Cliente aceita proposta
  app.patch(
    "/:id/proposals/:proposalId/accept",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id, proposalId } = request.params as {
        id: string;
        proposalId: string;
      };
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { conversation: { include: { proposals: true } } },
      });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      // Só o cliente pode aceitar
      if (booking.clientId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      const proposal = booking.conversation?.proposals.find(
        (p) => p.id === proposalId
      );

      if (!proposal) {
        return reply.code(404).send({ error: "Proposta não encontrada" });
      }

      if (proposal.status !== "PENDING") {
        return reply.code(400).send({ error: "Proposta não está mais disponível" });
      }

      // Aceita a proposta e atualiza o booking numa transação
      await prisma.$transaction(async (tx) => {
        await tx.proposal.update({
          where: { id: proposalId },
          data: { status: "ACCEPTED", bookingId: id },
        });

        // Rejeita as outras propostas pendentes
        await tx.proposal.updateMany({
          where: {
            conversationId: proposal.conversationId,
            id: { not: proposalId },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        });

        // Booking avança para aguardando pagamento
        await tx.booking.update({
          where: { id },
          data: { status: "AWAITING_PAYMENT" },
        });
      });

      return reply.send({
        message: "Proposta aceita. Realize o pagamento para confirmar.",
      });
    }
  );

  // Cliente confirma conclusão do serviço
  app.patch(
    "/:id/complete",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      if (booking.clientId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      if (booking.status !== "IN_PROGRESS") {
        return reply.code(400).send({
          error: "Só é possível concluir bookings em andamento",
        });
      }

      await prisma.booking.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      return reply.send({
        message: "Serviço concluído. Por favor, avalie o profissional.",
      });
    }
  );
}