import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";
import {
  DEFAULT_WEEKDAYS,
  addUtcDays,
  formatDateOnly,
  isDateAvailable,
  parseDateOnly,
  todayUtc,
} from "../lib/calendar";

const createBookingSchema = z
  .object({
    serviceId: z.string().optional(),
    toolId: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) =>
      Number(Boolean(data.serviceId)) + Number(Boolean(data.toolId)) === 1,
    { message: "Informe apenas um serviceId ou toolId" },
  );

const createProposalSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  description: z.string().trim().max(240).optional(),
  expiresAt: z.string().optional(),
});

export async function bookingsRoutes(app: FastifyInstance) {
  // Criar booking (cliente autenticado)
  app.post("/", { preHandler: [authenticate] }, async (request, reply) => {
    const body = createBookingSchema.parse(request.body);
    const clientId = (request.user as { id: string }).id;
    const startDate = parseDateOnly(body.startDate);
    const endDate = body.endDate ? parseDateOnly(body.endDate) : null;

    if (startDate < todayUtc() || (endDate && endDate < startDate)) {
      return reply.code(400).send({ error: "Período do agendamento inválido" });
    }

    // Verifica se tem papel de CLIENT
    const role = await prisma.userRole.findUnique({
      where: { userId_type: { userId: clientId, type: "CLIENT" } },
    });

    if (!role?.active) {
      return reply.code(403).send({
        error: "Apenas Clientes podem fazer agendamentos",
      });
    }

    // Valida se o serviço ou ferramenta existe e está disponível
    let providerId = "";
    if (body.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: body.serviceId },
      });
      if (!service || !service.approved || !service.active) {
        return reply
          .code(404)
          .send({ error: "Serviço não encontrado ou indisponível" });
      }
      // Cliente não pode contratar a si mesmo
      if (service.userId === clientId) {
        return reply
          .code(400)
          .send({ error: "Você não pode contratar seu próprio serviço" });
      }
      providerId = service.userId;

      const [rules, exception, occupied] = await Promise.all([
        prisma.professionalAvailability.findMany({
          where: { userId: providerId, active: true },
          select: { weekday: true },
        }),
        prisma.availabilityException.findUnique({
          where: { userId_date: { userId: providerId, date: startDate } },
          select: { available: true },
        }),
        prisma.booking.findFirst({
          where: {
            providerId,
            startDate: { gte: startDate, lt: addUtcDays(startDate, 1) },
            status: { in: ["CONFIRMED", "IN_PROGRESS"] },
          },
          select: { id: true },
        }),
      ]);
      const weekdays = rules.length
        ? rules.map((rule) => rule.weekday)
        : DEFAULT_WEEKDAYS;
      const exceptions = new Map<string, boolean>();
      if (exception) {
        exceptions.set(formatDateOnly(startDate), exception.available);
      }

      if (!isDateAvailable(startDate, weekdays, exceptions) || occupied) {
        return reply.code(409).send({
          error: "O profissional não está disponível nesta data",
        });
      }
    }

    if (body.toolId) {
      const tool = await prisma.tool.findUnique({
        where: { id: body.toolId },
      });
      if (!tool || !tool.approved || !tool.available) {
        return reply
          .code(404)
          .send({ error: "Ferramenta não encontrada ou indisponível" });
      }
      if (tool.userId === clientId) {
        return reply
          .code(400)
          .send({ error: "Você não pode alugar sua própria ferramenta" });
      }
      providerId = tool.userId;
    }

    // Cria o Booking e a Conversation numa transação
    // Os dois precisam ser criados juntos — sem conversa, não tem como negociar
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          clientId,
          providerId,
          serviceId: body.serviceId,
          toolId: body.toolId,
          startDate,
          endDate,
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
        service: {
          select: { id: true, title: true, category: true, userId: true },
        },
        tool: {
          select: { id: true, title: true, category: true, userId: true },
        },
        client: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });

    return reply.code(201).send({ booking: fullBooking });
  });

  // Listar bookings do usuário logado
  app.get("/", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request.user as { id: string }).id;

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
      },
      include: {
        service: {
          select: { id: true, title: true, category: true, userId: true },
        },
        tool: {
          select: { id: true, title: true, category: true, userId: true },
        },
        conversation: { select: { id: true } },
        proposal: true,
        client: { select: { id: true, name: true, avatarUrl: true } },
        provider: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ bookings });
  });

  // Detalhe do booking com mensagens
  app.get("/:id", { preHandler: [authenticate] }, async (request, reply) => {
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
      },
    });

    if (!booking) {
      return reply.code(404).send({ error: "Booking não encontrado" });
    }

    // Só o cliente ou o profissional responsável podem ver
    if (booking.clientId !== userId && booking.providerId !== userId) {
      return reply.code(403).send({ error: "Sem permissão" });
    }

    return reply.send({ booking });
  });

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

      // Só o profissional dono do anúncio pode enviar proposta
      const providerId = booking.service?.userId || booking.tool?.userId;
      if (providerId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      if (!booking.conversation) {
        return reply.code(400).send({ error: "Conversa não encontrada" });
      }

      if (booking.status !== "PENDING") {
        return reply.code(409).send({
          error: "Este pedido não está mais recebendo propostas",
        });
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
    },
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
        (p) => p.id === proposalId,
      );

      if (!proposal) {
        return reply.code(404).send({ error: "Proposta não encontrada" });
      }

      if (
        proposal.status === "ACCEPTED" &&
        proposal.bookingId === id &&
        ["CONFIRMED", "IN_PROGRESS"].includes(booking.status)
      ) {
        return reply.send({
          message:
            booking.status === "CONFIRMED"
              ? "Proposta já aceita. O serviço está confirmado."
              : "Proposta já aceita. O serviço está em andamento.",
        });
      }

      if (proposal.status !== "PENDING") {
        return reply
          .code(400)
          .send({ error: "Proposta não está mais disponível" });
      }

      try {
        // O índice parcial no banco é a última proteção contra duas confirmações
        // simultâneas para o mesmo profissional e a mesma data.
        await prisma.$transaction(async (tx) => {
          await tx.proposal.update({
            where: { id: proposalId },
            data: { status: "ACCEPTED", bookingId: id },
          });

          await tx.proposal.updateMany({
            where: {
              conversationId: proposal.conversationId,
              id: { not: proposalId },
              status: "PENDING",
            },
            data: { status: "REJECTED" },
          });

          await tx.booking.update({
            where: { id },
            data: { status: "CONFIRMED" },
          });
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        ) {
          return reply.code(409).send({
            error: "Esta data acabou de ser ocupada. Escolha outra data.",
          });
        }
        throw error;
      }

      return reply.send({
        message: "Proposta aceita. O serviço está confirmado.",
      });
    },
  );

  // O profissional inicia o serviço confirmado na data combinada.
  app.patch(
    "/:id/start",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;
      const booking = await prisma.booking.findUnique({ where: { id } });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }
      if (booking.providerId !== userId) {
        return reply.code(403).send({
          error: "Apenas o profissional responsável pode iniciar o serviço",
        });
      }
      if (booking.status !== "CONFIRMED") {
        return reply
          .code(409)
          .send({ error: "Este serviço não está confirmado" });
      }
      if (booking.startDate > todayUtc()) {
        return reply.code(409).send({
          error: "O serviço só pode ser iniciado na data agendada",
        });
      }

      await prisma.booking.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
      return reply.send({ message: "Serviço iniciado" });
    },
  );

  // O profissional informa que terminou. O booking continua em andamento até
  // o cliente confirmar a entrega.
  app.patch(
    "/:id/finish",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          service: { select: { userId: true } },
          tool: { select: { userId: true } },
        },
      });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      const providerId = booking.service?.userId || booking.tool?.userId;
      if (providerId !== userId) {
        return reply.code(403).send({
          error: "Apenas o profissional responsável pode informar a conclusão",
        });
      }

      if (booking.status !== "IN_PROGRESS") {
        return reply.code(409).send({
          error: "Só é possível finalizar um serviço em andamento",
        });
      }

      if (booking.providerCompletedAt) {
        return reply.send({
          message: "Conclusão já informada. Aguardando confirmação do cliente.",
        });
      }

      await prisma.booking.update({
        where: { id },
        data: { providerCompletedAt: new Date() },
      });

      return reply.send({
        message: "Serviço finalizado. Aguardando confirmação do cliente.",
      });
    },
  );

  // O cliente confirma a entrega depois que o profissional informa a conclusão.
  app.patch(
    "/:id/complete",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({ where: { id } });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      if (booking.clientId !== userId) {
        return reply.code(403).send({
          error: "Apenas o cliente pode confirmar a entrega do serviço",
        });
      }

      if (booking.status !== "IN_PROGRESS") {
        return reply.code(409).send({
          error: "Só é possível confirmar um serviço em andamento",
        });
      }

      if (!booking.providerCompletedAt) {
        return reply.code(409).send({
          error:
            "O profissional ainda não informou que o serviço foi finalizado",
        });
      }

      await prisma.booking.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      return reply.send({
        message: "Serviço concluído. Por favor, avalie o profissional.",
      });
    },
  );
}
