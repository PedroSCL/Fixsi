import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { authRoutes } from "./routes/auth";
import { servicesRoutes } from "./routes/services";
import { toolsRoutes } from "./routes/tools";
import { bookingsRoutes } from "./routes/bookings";
import { adminRoutes } from "./routes/admin";
import { conversationsRoutes } from "./routes/conversations";
import { setupSocket } from "./lib/socket";
import { reviewsRoutes } from "./routes/reviews";
import { availabilityRoutes } from "./routes/availability";
import { getEnvironment } from "./config/env";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./lib/session";

// O Render encaminha o IP original pelo proxy. Sem essa opção, todos os
// visitantes podem compartilhar o IP do balanceador e esgotar o rate limit.
const app = Fastify({ logger: true, trustProxy: true });

async function main() {
  const environment = getEnvironment();
  const allowedOrigin = new URL(environment.FRONTEND_URL).origin;

  await app.register(helmet);

  await app.register(rateLimit, {
    // Limites globais por IP podem agrupar usuários atrás do proxy/CDN e
    // bloquear o aplicativo inteiro. Rotas sensíveis, como login, cadastro e
    // renovação de sessão, mantêm limites próprios mais restritivos.
    global: false,
  });

  await app.register(cors, {
    // Normaliza uma eventual barra final configurada no provedor.
    origin: allowedOrigin,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  await app.register(cookie);

  await app.register(jwt, {
    secret:
      environment.JWT_SECRET || "development-only-secret-not-for-production",
    sign: { expiresIn: "15m" },
    cookie: {
      cookieName: ACCESS_COOKIE,
      signed: false,
    },
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "Dados inválidos",
        fields: error.flatten().fieldErrors,
      });
    }

    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const message =
        error instanceof Error ? error.message : "Requisição inválida";
      return reply.code(statusCode).send({ error: message });
    }

    request.log.error(error);
    return reply.code(500).send({ error: "Erro interno do servidor" });
  });

  const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  app.addHook("onRequest", async (request, reply) => {
    const usesSessionCookie = Boolean(
      request.cookies[ACCESS_COOKIE] || request.cookies[REFRESH_COOKIE],
    );
    if (
      usesSessionCookie &&
      unsafeMethods.has(request.method) &&
      request.headers.origin !== allowedOrigin
    ) {
      return reply.code(403).send({ error: "Origem da requisição inválida" });
    }
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(servicesRoutes, { prefix: "/services" });
  await app.register(toolsRoutes, { prefix: "/tools" });
  await app.register(bookingsRoutes, { prefix: "/bookings" });
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(conversationsRoutes, { prefix: "/conversations" });
  await app.register(reviewsRoutes, { prefix: "/reviews" });
  await app.register(availabilityRoutes, { prefix: "/availability" });

  app.get("/health", async () => ({ status: "ok" }));

  // Precisa fazer o listen antes de pegar o httpServer
  await app.listen({
    port: environment.PORT,
    host: "0.0.0.0",
  });

  // Configura o Socket.io usando o servidor HTTP do Fastify
  setupSocket(app.server, app.jwt);

  console.log(`🚀 API rodando na porta ${environment.PORT}`);
  console.log(`🔌 WebSocket pronto na porta ${environment.PORT}`);
}

main();
