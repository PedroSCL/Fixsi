import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

// Valida o access token enviado no cookie HttpOnly (ou, temporariamente, no
// header legado) e confirma que a sessão continua ativa no banco.
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify();
    const payload = request.user as { id: string; sessionId?: string };

    // Tokens antigos sem sessionId continuam válidos temporariamente durante
    // a migração do frontend. Eles serão removidos após o deploy completo.
    if (payload.sessionId) {
      const activeSession = await prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });

      if (!activeSession) {
        return reply.code(401).send({ error: "Sessão inválida ou revogada" });
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true },
      });
      if (!user) {
        return reply.code(401).send({ error: "Conta não encontrada" });
      }
    }
  } catch {
    return reply.code(401).send({ error: "Token inválido ou ausente" });
  }
}
