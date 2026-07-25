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
import { paymentsRoutes } from "./routes/payments";

const app = Fastify({ logger: true });

async function main() {
  const isProduction = process.env.NODE_ENV === "production";
  const jwtSecret = process.env.JWT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
    throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres em produção");
  }

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(cors, {
    origin: frontendUrl,
  });

  await app.register(jwt, {
    secret: jwtSecret || "development-only-secret-not-for-production",
    sign: { expiresIn: "15m" },
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(servicesRoutes, { prefix: "/services" });
  await app.register(toolsRoutes, { prefix: "/tools" });
  await app.register(bookingsRoutes, { prefix: "/bookings" });
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(conversationsRoutes, { prefix: "/conversations" });
  await app.register(reviewsRoutes, { prefix: "/reviews" });
  await app.register(paymentsRoutes, { prefix: "/payments" });

  app.get("/health", async () => ({ status: "ok" }));

  // Precisa fazer o listen antes de pegar o httpServer
  await app.listen({
    port: Number(process.env.PORT) || 3001,
    host: "0.0.0.0",
  });

  // Configura o Socket.io usando o servidor HTTP do Fastify
  setupSocket(app.server, app.jwt);

  console.log("🚀 API rodando em http://localhost:3001");
  console.log("🔌 WebSocket pronto em ws://localhost:3001");
}

main();
