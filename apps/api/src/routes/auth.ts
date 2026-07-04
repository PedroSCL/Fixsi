import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número")
    .regex(/[^a-zA-Z0-9]/, "Senha deve conter pelo menos um caractere especial"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  role: z.enum(["CLIENT", "PROFESSIONAL", "LOCADOR"]).default("CLIENT"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  // Cadastro
  app.post("/register", async (request, reply) => {
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

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          type: body.role,
        },
      });

      return newUser;
    });

    const token = app.jwt.sign({ id: user.id });

    return reply.code(201).send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      token,
    });
  });

  // Login
  app.post("/login", async (request, reply) => {
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

    const token = app.jwt.sign({ id: user.id });

    return reply.send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles.map((r) => r.type),
      },
      token,
    });
  });
}