import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";
import {
  addUtcDays,
  DEFAULT_WEEKDAYS,
  formatDateOnly,
  isDateAvailable,
  parseDateOnly,
  todayUtc,
} from "../lib/calendar";

const rangeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

const weeklySchema = z.object({
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
});

const exceptionSchema = z.object({
  date: z.string(),
  available: z.boolean(),
});

async function requireProfessional(userId: string) {
  const role = await prisma.userRole.findUnique({
    where: { userId_type: { userId, type: "PROFESSIONAL" } },
  });
  return Boolean(role?.active);
}

export async function availabilityRoutes(app: FastifyInstance) {
  // Agenda pública usada pelo calendário da página do serviço.
  app.get("/:professionalId", async (request, reply) => {
    const { professionalId } = request.params as { professionalId: string };
    const query = rangeSchema.parse(request.query);
    const from = parseDateOnly(query.from);
    const to = parseDateOnly(query.to);
    const days = Math.floor((to.getTime() - from.getTime()) / 86_400_000);

    if (from < todayUtc() || days < 0 || days > 92) {
      return reply.code(400).send({ error: "Período de consulta inválido" });
    }

    if (!(await requireProfessional(professionalId))) {
      return reply.code(404).send({ error: "Profissional não encontrado" });
    }

    const [rules, overrides, occupied] = await Promise.all([
      prisma.professionalAvailability.findMany({
        where: { userId: professionalId, active: true },
        select: { weekday: true },
      }),
      prisma.availabilityException.findMany({
        where: { userId: professionalId, date: { gte: from, lte: to } },
        select: { date: true, available: true },
      }),
      prisma.booking.findMany({
        where: {
          providerId: professionalId,
          startDate: { gte: from, lte: to },
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        },
        select: { startDate: true },
      }),
    ]);

    const weekdays = rules.length
      ? rules.map((rule) => rule.weekday)
      : DEFAULT_WEEKDAYS;
    const exceptions = new Map(
      overrides.map((item) => [formatDateOnly(item.date), item.available]),
    );
    const unavailable = new Set(
      occupied.map((item) => formatDateOnly(item.startDate)),
    );
    const availableDates: string[] = [];

    for (let cursor = from; cursor <= to; cursor = addUtcDays(cursor, 1)) {
      const key = formatDateOnly(cursor);
      if (
        isDateAvailable(cursor, weekdays, exceptions) &&
        !unavailable.has(key)
      ) {
        availableDates.push(key);
      }
    }

    return reply.send({ availableDates });
  });

  app.get(
    "/me/settings",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      if (!(await requireProfessional(userId))) {
        return reply
          .code(403)
          .send({ error: "Perfil profissional necessário" });
      }

      const [rules, exceptions] = await Promise.all([
        prisma.professionalAvailability.findMany({
          where: { userId, active: true },
          select: { weekday: true },
          orderBy: { weekday: "asc" },
        }),
        prisma.availabilityException.findMany({
          where: { userId, date: { gte: todayUtc() } },
          select: { date: true, available: true },
          orderBy: { date: "asc" },
          take: 100,
        }),
      ]);

      return reply.send({
        weekdays: rules.length
          ? rules.map((rule) => rule.weekday)
          : DEFAULT_WEEKDAYS,
        exceptions: exceptions.map((item) => ({
          date: formatDateOnly(item.date),
          available: item.available,
        })),
      });
    },
  );

  app.put(
    "/me/weekdays",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const { weekdays } = weeklySchema.parse(request.body);
      if (!(await requireProfessional(userId))) {
        return reply
          .code(403)
          .send({ error: "Perfil profissional necessário" });
      }

      const uniqueWeekdays = [...new Set(weekdays)].sort();
      await prisma.$transaction(async (tx) => {
        await tx.professionalAvailability.deleteMany({ where: { userId } });
        if (uniqueWeekdays.length) {
          await tx.professionalAvailability.createMany({
            data: uniqueWeekdays.map((weekday) => ({ userId, weekday })),
          });
        }
      });

      return reply.send({ weekdays: uniqueWeekdays });
    },
  );

  app.put(
    "/me/exceptions",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const body = exceptionSchema.parse(request.body);
      const date = parseDateOnly(body.date);
      if (date < todayUtc()) {
        return reply
          .code(400)
          .send({ error: "A data não pode estar no passado" });
      }
      if (!(await requireProfessional(userId))) {
        return reply
          .code(403)
          .send({ error: "Perfil profissional necessário" });
      }

      await prisma.availabilityException.upsert({
        where: { userId_date: { userId, date } },
        update: { available: body.available },
        create: { userId, date, available: body.available },
      });
      return reply.send({ date: body.date, available: body.available });
    },
  );

  app.delete(
    "/me/exceptions/:date",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const { date: rawDate } = request.params as { date: string };
      const date = parseDateOnly(rawDate);
      if (!(await requireProfessional(userId))) {
        return reply
          .code(403)
          .send({ error: "Perfil profissional necessário" });
      }
      await prisma.availabilityException.deleteMany({
        where: { userId, date },
      });
      return reply.code(204).send();
    },
  );
}
