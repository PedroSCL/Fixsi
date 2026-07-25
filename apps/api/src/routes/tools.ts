import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

const createToolSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(3000),
  category: z.string().trim().min(2).max(60),
  pricePerDay: z.number().positive().finite(),
  usageRules: z.string().trim().max(2000).optional(),
  images: z.array(z.string().url()).max(8).default([]),
});

const updateToolSchema = createToolSchema.partial();

const listToolSchema = z.object({
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

export async function toolsRoutes(app: FastifyInstance) {
  // Listar ferramentas (público)
  app.get("/", async (request, reply) => {
    const { category, search, page, limit } = listToolSchema.parse(
      request.query
    );

    const where = {
      approved: true,
      available: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
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
      prisma.tool.count({ where }),
    ]);

    return reply.send({
      tools,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Detalhe de uma ferramenta (público)
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const tool = await prisma.tool.findUnique({
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

    if (!tool) {
      return reply.code(404).send({ error: "Ferramenta não encontrada" });
    }

    return reply.send({ tool });
  });

  // Criar ferramenta (autenticado)
  app.post(
    "/",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = createToolSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      // Verifica se tem papel de LOCADOR
      const role = await prisma.userRole.findUnique({
        where: { userId_type: { userId, type: "LOCADOR" } },
      });

      if (!role) {
        return reply.code(403).send({
          error: "Apenas Locadores podem cadastrar ferramentas",
        });
      }

      // Verifica se identidade foi verificada
      const verification = await prisma.identityVerification.findUnique({
        where: { userId },
      });

      const approved = verification?.status === "APPROVED";

      const tool = await prisma.tool.create({
        data: {
          ...body,
          userId,
          approved,
        },
      });

      return reply.code(201).send({
        tool,
        message: approved
          ? "Ferramenta publicada com sucesso"
          : "Ferramenta criada. Complete a verificação de identidade para publicar.",
      });
    }
  );

  // Editar ferramenta (autenticado, só o dono)
  app.patch(
    "/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateToolSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      const tool = await prisma.tool.findUnique({ where: { id } });

      if (!tool) {
        return reply.code(404).send({ error: "Ferramenta não encontrada" });
      }

      if (tool.userId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      const updated = await prisma.tool.update({
        where: { id },
        data: body,
      });

      return reply.send({ tool: updated });
    }
  );

  // Desativar ferramenta (autenticado, só o dono)
  app.delete(
    "/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const tool = await prisma.tool.findUnique({ where: { id } });

      if (!tool) {
        return reply.code(404).send({ error: "Ferramenta não encontrada" });
      }

      if (tool.userId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      await prisma.tool.update({
        where: { id },
        data: { available: false },
      });

      return reply.code(204).send();
    }
  );

  // Denunciar ferramenta (autenticado)
  app.post(
    "/:id/report",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = reportSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      const tool = await prisma.tool.findUnique({ where: { id } });
      if (!tool) {
        return reply.code(404).send({ error: "Ferramenta não encontrada" });
      }

      if (tool.userId === userId) {
        return reply.code(400).send({
          error: "Você não pode denunciar sua própria ferramenta",
        });
      }

      const existing = await prisma.report.findFirst({
        where: { toolId: id, reporterId: userId },
      });
      if (existing) {
        return reply.code(409).send({
          error: "Você já denunciou essa ferramenta",
        });
      }

      await prisma.report.create({
        data: {
          reason: body.reason,
          details: body.details,
          reporterId: userId,
          toolId: id,
        },
      });

      return reply.code(201).send({ message: "Denúncia registrada" });
    }
  );
}
