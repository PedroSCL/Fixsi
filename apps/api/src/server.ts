import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { authRoutes } from "./routes/auth";
import { servicesRoutes } from "./routes/services";
import { toolsRoutes } from "./routes/tools";
import { bookingsRoutes } from "./routes/bookings";
import { adminRoutes } from "./routes/admin";
import { conversationsRoutes } from "./routes/conversations";
import { setupSocket } from "./lib/socket";
import { reviewsRoutes } from "./routes/reviews";

const app = Fastify({ logger: true });

async function main() {
  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-trocar-depois",
  });

  await app.register(authRoutes,          { prefix: "/auth" });
  await app.register(servicesRoutes,      { prefix: "/services" });
  await app.register(toolsRoutes,         { prefix: "/tools" });
  await app.register(bookingsRoutes,      { prefix: "/bookings" });
  await app.register(adminRoutes,         { prefix: "/admin" });
  await app.register(conversationsRoutes, { prefix: "/conversations" });
  await app.register(reviewsRoutes, { prefix: "/reviews" });

  app.get("/health", async () => ({ status: "ok" }));

  // Precisa fazer o listen antes de pegar o httpServer
  await app.listen({ port: 3001, host: "0.0.0.0" });

  // Configura o Socket.io usando o servidor HTTP do Fastify
  setupSocket(
    app.server,
    process.env.JWT_SECRET || "dev-secret-trocar-depois"
  );

  console.log("🚀 API rodando em http://localhost:3001");
  console.log("🔌 WebSocket pronto em ws://localhost:3001");
}

main();