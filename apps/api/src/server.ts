import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { authRoutes } from "./routes/auth";
import { servicesRoutes } from "./routes/services";

const app = Fastify({ logger: true });

async function main() {
  // Segurança: headers HTTP protegidos automaticamente
  await app.register(helmet);

  // Impede spam de requisições (100 por minuto, por IP)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Libera o frontend a acessar essa API (por enquanto, qualquer origem em dev)
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  });

  // Autenticação por token (login)
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-trocar-depois",
  });

  // Rotas de autenticação (cadastro e login)
  await app.register(authRoutes, { prefix: "/auth" });

  await app.register(servicesRoutes, { prefix: "/services" });

  // Rota de teste simples
  app.get("/health", async () => {
    return { status: "ok" };
  });

  await app.listen({ port: 3001, host: "0.0.0.0" });
  console.log("🚀 API rodando em http://localhost:3001");
}

main();