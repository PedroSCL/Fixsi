import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// Define o formato esperado dos dados de cadastro
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authRoutes(app: FastifyInstance) {
  // Cadastro
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    // Verifica se o email já existe
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return reply.code(409).send({ error: "Email já cadastrado" });
    }

    // Criptografa a senha (nunca salvamos em texto puro)
    const hashedPassword = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    // Gera o token JWT já no cadastro, pra logar automaticamente
    const token = app.jwt.sign({ id: user.id, role: user.role });

    return reply.code(201).send({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  });

  // Login
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      return reply.code(401).send({ error: "Email ou senha inválidos" });
    }

    // Compara a senha enviada com a senha criptografada salva
    const validPassword = await bcrypt.compare(body.password, user.password);
    if (!validPassword) {
      return reply.code(401).send({ error: "Email ou senha inválidos" });
    }

    const token = app.jwt.sign({ id: user.id, role: user.role });

    return reply.send({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  });
}