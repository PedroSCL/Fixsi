import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

const createServiceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  priceFrom: z.number().optional(),
  images: z.array(z.string()).default([]),
});

const updateServiceSchema = createServiceSchema.partial();

const listServiceSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export async function servicesRoutes(app: FastifyInstance) {
  // Listar serviços (público)
  app.get("/", async (request, reply) => {
    const { category, search, page, limit } = listServiceSchema.parse(
      request.query
    );

    const where = {
      approved: true,
      active: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
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
  app.post(
    "/",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = createServiceSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      // Verifica se o usuário tem papel de PROFESSIONAL
      const role = await prisma.userRole.findUnique({
        where: { userId_type: { userId, type: "PROFESSIONAL" } },
      });

      if (!role) {
        return reply.code(403).send({
          error: "Apenas Profissionais podem criar serviços",
        });
      }

      const service = await prisma.service.create({
        data: {
          ...body,
          userId,
        },
      });

      return reply.code(201).send({ service });
    }
  );

  // Editar serviço (autenticado, só o dono)
  app.patch(
    "/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
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
    }
  );

  // Desativar serviço (autenticado, só o dono)
  app.delete(
    "/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const service = await prisma.service.findUnique({ where: { id } });

      if (!service) {
        return reply.code(404).send({ error: "Serviço não encontrado" });
      }

      if (service.userId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      // Não deletamos do banco, só desativamos
      await prisma.service.update({
        where: { id },
        data: { active: false },
      });

      return reply.code(204).send();
    }
  );
}