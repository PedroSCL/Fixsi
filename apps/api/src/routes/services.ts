import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";
import { textVariants } from "../lib/text";

const createServiceSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(3000),
  category: z.string().trim().min(2).max(60),
  priceFrom: z.number().nonnegative().finite().optional(),
  images: z.array(z.string().url()).max(8).default([]),
});

const updateServiceSchema = createServiceSchema.partial();

const listServiceSchema = z.object({
  category: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const reportSchema = z.object({
  reason: z.enum([
    "INAPPROPRIATE_CONTENT",
    "FAKE_SERVICE",
    "WRONG_CATEGORY",
    "CONTACT_OUTSIDE_PLATFORM",
    "SPAM",
    "OTHER",
  ]),
  details: z.string().optional(),
});

export async function servicesRoutes(app: FastifyInstance) {
  // Listar serviços (público)
  app.get("/", async (request, reply) => {
    const { category, search, page, limit } = listServiceSchema.parse(
      request.query,
    );

    const where = {
      approved: true,
      active: true,
      ...(category && {
        category: {
          in: textVariants(category),
          mode: "insensitive" as const,
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          {
            category: {
              in: textVariants(search),
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return reply.send({
      services,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Detalhe de um serviço (público)
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            reviewsReceived: {
              where: { visible: true },
              select: { rating: true, comment: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    if (!service) {
      return reply.code(404).send({ error: "Serviço não encontrado" });
    }

    return reply.send({ service });
  });

  // Criar serviço (autenticado)
  app.post("/", { preHandler: [authenticate] }, async (request, reply) => {
    const body = createServiceSchema.parse(request.body);
    const userId = (request.user as { id: string }).id;

    // Verifica se tem papel de PROFESSIONAL
    const role = await prisma.userRole.findUnique({
      where: { userId_type: { userId, type: "PROFESSIONAL" } },
    });

    if (!role?.active) {
      return reply.code(403).send({
        error: "Apenas Profissionais podem criar serviços",
      });
    }

    // Verifica se a identidade foi verificada
    const verification = await prisma.identityVerification.findUnique({
      where: { userId },
    });

    // Se verificado, publica direto. Se não, fica pendente.
    const approved = verification?.status === "APPROVED";

    const service = await prisma.service.create({
      data: {
        ...body,
        userId,
        approved,
      },
    });

    return reply.code(201).send({
      service,
      message: approved
        ? "Serviço publicado com sucesso"
        : "Serviço criado. Complete a verificação de identidade para publicar.",
    });
  });

  // Editar serviço (autenticado, só o dono)
  app.patch("/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateServiceSchema.parse(request.body);
    const userId = (request.user as { id: string }).id;

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return reply.code(404).send({ error: "Serviço não encontrado" });
    }

    if (service.userId !== userId) {
      return reply.code(403).send({ error: "Sem permissão" });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: body,
    });

    return reply.send({ service: updated });
  });

  // Desativar serviço (autenticado, só o dono)
  app.delete("/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request.user as { id: string }).id;

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return reply.code(404).send({ error: "Serviço não encontrado" });
    }

    if (service.userId !== userId) {
      return reply.code(403).send({ error: "Sem permissão" });
    }

    await prisma.service.update({
      where: { id },
      data: { active: false },
    });

    return reply.code(204).send();
  });

  // Denunciar serviço (autenticado)
  app.post(
    "/:id/report",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = reportSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      const service = await prisma.service.findUnique({ where: { id } });
      if (!service) {
        return reply.code(404).send({ error: "Serviço não encontrado" });
      }

      // Não pode denunciar o próprio serviço
      if (service.userId === userId) {
        return reply
          .code(400)
          .send({ error: "Você não pode denunciar seu próprio serviço" });
      }

      // Verifica se já denunciou esse serviço antes
      const existing = await prisma.report.findFirst({
        where: { serviceId: id, reporterId: userId },
      });
      if (existing) {
        return reply
          .code(409)
          .send({ error: "Você já denunciou esse serviço" });
      }

      await prisma.report.create({
        data: {
          reason: body.reason,
          details: body.details,
          reporterId: userId,
          serviceId: id,
        },
      });

      return reply.code(201).send({ message: "Denúncia registrada" });
    },
  );
}
