import { FastifyRequest, FastifyReply } from "fastify";

// Esse middleware é usado como "preHandler" nas rotas protegidas.
// Ele verifica se o token JWT veio no header Authorization,
// e se for válido, coloca os dados do usuário em request.user
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Token inválido ou ausente" });
  }
}