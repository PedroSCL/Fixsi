import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

async function requireAdmin(request: any, reply: any) {
  await authenticate(request, reply);
  if (reply.sent) return;
  const userId = (request.user as { id: string }).id;

  const adminRole = await prisma.userRole.findUnique({
    where: { userId_type: { userId, type: "ADMIN" } },
  });

  if (!adminRole) {
    return reply.code(403).send({ error: "Acesso restrito a administradores" });
  }
}

export async function adminRoutes(app: FastifyInstance) {
  // Listar denúncias abertas
  app.get(
    "/reports",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const reports = await prisma.report.findMany({
        where: { status: "OPEN" },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          service: { select: { id: true, title: true } },
          tool: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return reply.send({ reports });
    },
  );

  // Desativar serviço denunciado
  app.patch(
    "/services/:id/deactivate",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.service.update({
        where: { id },
        data: { active: false },
      });

      await prisma.report.updateMany({
        where: { serviceId: id, status: "OPEN" },
        data: { status: "REVIEWED" },
      });

      return reply.send({ message: "Serviço desativado" });
    },
  );

  app.patch(
    "/tools/:id/deactivate",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.$transaction([
        prisma.tool.update({
          where: { id },
          data: { available: false },
        }),
        prisma.report.updateMany({
          where: { toolId: id, status: "OPEN" },
          data: { status: "REVIEWED" },
        }),
      ]);

      return reply.send({ message: "Ferramenta desativada" });
    },
  );

  // Dispensar denúncia (serviço está ok)
  app.patch(
    "/reports/:id/dismiss",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.report.update({
        where: { id },
        data: { status: "DISMISSED" },
      });

      return reply.send({ message: "Denúncia dispensada" });
    },
  );
}
