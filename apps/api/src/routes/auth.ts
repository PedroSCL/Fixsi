import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";
import {
  clearSessionCookies,
  createSession,
  revokeSession,
  rotateSession,
} from "../lib/session";
import { isValidCpf, maskCpf, normalizeCpf } from "../lib/cpf";
import { isValidBrazilianPhone, normalizePhone } from "../lib/phone";
import { rolesForAccountType } from "../lib/account-roles";
import { deleteAccountData } from "../lib/delete-account";
import { disconnectUserSockets } from "../lib/socket";

const cpfSchema = z
  .string()
  .transform(normalizeCpf)
  .refine(isValidCpf, "Informe um CPF válido");

const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine(
    isValidBrazilianPhone,
    "Informe um telefone brasileiro válido com DDD",
  );

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .max(128, "Senha deve ter no máximo 128 caracteres")
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número")
    .regex(
      /[^a-zA-Z0-9]/,
      "Senha deve conter pelo menos um caractere especial",
    ),
  phone: phoneSchema,
  cpf: cpfSchema,
  role: z.enum(["CLIENT", "PROFESSIONAL"]).default("CLIENT"),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
  confirmation: z.literal("EXCLUIR"),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: phoneSchema,
    avatarUrl: z
      .union([z.string().trim().url(), z.literal(""), z.null()])
      .optional(),
    cpf: cpfSchema.optional(),
    currentPassword: z.string().min(1).max(128).optional(),
    accountType: z.enum(["CLIENT", "PROFESSIONAL"]).optional(),
  })
  .superRefine((values, context) => {
    if (values.cpf && !values.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Informe sua senha atual para alterar o CPF",
      });
    }
  });

export async function authRoutes(app: FastifyInstance) {
  // Cadastro
  app.post(
    "/register",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const body = registerSchema.parse(request.body);

      // Verifica email duplicado
      const existingEmail = await prisma.user.findUnique({
        where: { email: body.email },
      });
      if (existingEmail) {
        return reply.code(409).send({ error: "Email já cadastrado" });
      }

      // Verifica CPF duplicado
      const existingCpf = await prisma.user.findUnique({
        where: { cpf: body.cpf },
      });
      if (existingCpf) {
        return reply.code(409).send({ error: "CPF já cadastrado" });
      }

      const hashedPassword = await bcrypt.hash(body.password, 12);

      // Cria o usuário e o papel escolhido numa transação só
      // (transação = as duas operações acontecem juntas ou nenhuma acontece)
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: body.name,
            email: body.email,
            password: hashedPassword,
            phone: body.phone,
            cpf: body.cpf,
          },
        });

        const roles = rolesForAccountType(body.role);
        await tx.userRole.createMany({
          data: roles.map((type) => ({ userId: newUser.id, type })),
        });

        return newUser;
      });

      const token = await createSession(app, request, reply, user.id);

      return reply.code(201).send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          roles: rolesForAccountType(body.role),
        },
        token,
      });
    },
  );

  // Login
  app.post(
    "/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
        include: { roles: true }, // traz os papéis junto
      });

      if (!user) {
        return reply.code(401).send({ error: "Email ou senha inválidos" });
      }

      const validPassword = await bcrypt.compare(body.password, user.password);
      if (!validPassword) {
        return reply.code(401).send({ error: "Email ou senha inválidos" });
      }

      const token = await createSession(app, request, reply, user.id);

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          roles: user.roles
            .filter((role) => role.active)
            .map((role) => role.type),
        },
        token,
      });
    },
  );

  app.post(
    "/refresh",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const session = await rotateSession(app, request, reply);

      if (!session) {
        clearSessionCookies(reply);
        return reply.code(401).send({ error: "Sessão inválida ou expirada" });
      }

      return reply.send({
        token: session.accessToken,
        expiresIn: 15 * 60,
      });
    },
  );

  app.post("/logout", async (request, reply) => {
    await revokeSession(request);
    clearSessionCookies(reply);
    return reply.code(204).send();
  });

  app.post(
    "/logout-all",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;

      await prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      clearSessionCookies(reply);

      return reply.code(204).send();
    },
  );

  app.delete(
    "/me",
    {
      preHandler: [authenticate],
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const body = deleteAccountSchema.parse(request.body);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user || !(await bcrypt.compare(body.password, user.password))) {
        return reply.code(403).send({ error: "Senha atual incorreta" });
      }

      await prisma.$transaction(
        (tx) => deleteAccountData(tx, userId),
        { timeout: 30_000 },
      );
      disconnectUserSockets(userId);
      clearSessionCookies(reply);
      return reply.code(204).send();
    },
  );

  app.get("/me", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request.user as { id: string }).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        avatarUrl: true,
        createdAt: true,
        roles: {
          where: { active: true },
          select: { type: true },
        },
      },
    });

    if (!user) {
      return reply.code(404).send({ error: "Usuário não encontrado" });
    }

    const { cpf, ...safeUser } = user;
    return reply.send({
      user: {
        ...safeUser,
        cpfMasked: maskCpf(cpf),
        cpfValid: isValidCpf(cpf),
        roles: user.roles.map((role) => role.type),
      },
    });
  });

  app.patch(
    "/profile",
    {
      preHandler: [authenticate],
      config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const body = updateProfileSchema.parse(request.body);
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { cpf: true, password: true },
      });

      if (!currentUser) {
        return reply.code(404).send({ error: "Usuário não encontrado" });
      }

      const cpfChanged = Boolean(body.cpf && body.cpf !== currentUser.cpf);

      if (cpfChanged) {
        const validPassword = await bcrypt.compare(
          body.currentPassword || "",
          currentUser.password,
        );
        if (!validPassword) {
          return reply.code(403).send({ error: "Senha atual incorreta" });
        }

        const existingCpf = await prisma.user.findFirst({
          where: {
            cpf: body.cpf,
            id: { not: userId },
          },
          select: { id: true },
        });
        if (existingCpf) {
          return reply.code(409).send({ error: "CPF já cadastrado" });
        }
      }

      const user = await prisma.$transaction(async (tx) => {
        if (body.accountType) {
          await tx.userRole.upsert({
            where: { userId_type: { userId, type: "CLIENT" } },
            create: { userId, type: "CLIENT", active: true },
            update: { active: true },
          });

          if (body.accountType === "PROFESSIONAL") {
            await tx.userRole.upsert({
              where: { userId_type: { userId, type: "PROFESSIONAL" } },
              create: { userId, type: "PROFESSIONAL", active: true },
              update: { active: true },
            });
          } else {
            await tx.userRole.updateMany({
              where: { userId, type: "PROFESSIONAL" },
              data: { active: false },
            });
          }
        }

        return tx.user.update({
          where: { id: userId },
          data: {
            name: body.name,
            phone: body.phone,
            avatarUrl: body.avatarUrl || null,
            ...(cpfChanged
              ? {
                  cpf: body.cpf,
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
            avatarUrl: true,
            roles: {
              where: { active: true },
              select: { type: true },
            },
          },
        });
      });

      const { cpf, ...safeUser } = user;
      return reply.send({
        user: {
          ...safeUser,
          cpfMasked: maskCpf(cpf),
          cpfValid: isValidCpf(cpf),
          roles: user.roles.map((role) => role.type),
        },
      });
    },
  );
}
