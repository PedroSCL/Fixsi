import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getEnvironment } from "../config/env";
import { prisma } from "./prisma";
import {
  generateRefreshSecret,
  hashRefreshSecret,
  parseRefreshToken,
  refreshSecretMatches,
  serializeRefreshToken,
} from "./session-token";

export const ACCESS_COOKIE = "serveo_access";
export const REFRESH_COOKIE = "serveo_refresh";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const ROTATION_GRACE_MILLISECONDS = 10 * 1000;
const MAX_ROTATION_ATTEMPTS = 3;

function commonCookieOptions() {
  const environment = getEnvironment();

  return {
    secure: environment.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  } as const;
}

function requestMetadata(request: FastifyRequest) {
  return {
    ipAddress: request.ip.slice(0, 100),
    userAgent: request.headers["user-agent"]?.slice(0, 500) || null,
  };
}

function setSessionCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
) {
  const common = commonCookieOptions();

  reply
    .setCookie(ACCESS_COOKIE, accessToken, {
      ...common,
      path: "/",
      maxAge: ACCESS_TTL_SECONDS,
    })
    .setCookie(REFRESH_COOKIE, refreshToken, {
      ...common,
      // O frontend acessa a API pelo proxy /api da Vercel. O caminho raiz
      // mantém a renovação disponível tanto via proxy quanto diretamente.
      path: "/",
      maxAge: REFRESH_TTL_SECONDS,
    });
}

export function clearSessionCookies(reply: FastifyReply) {
  const common = commonCookieOptions();

  reply
    .clearCookie(ACCESS_COOKIE, { ...common, path: "/" })
    .clearCookie(REFRESH_COOKIE, { ...common, path: "/" });
}

function createAccessToken(
  app: FastifyInstance,
  userId: string,
  sessionId: string,
) {
  return app.jwt.sign({
    id: userId,
    sessionId,
    type: "access",
  });
}

export async function createSession(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  userId: string,
) {
  const secret = generateRefreshSecret();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashRefreshSecret(secret),
      expiresAt,
      ...requestMetadata(request),
    },
  });
  const refreshToken = serializeRefreshToken(session.id, secret);
  const accessToken = createAccessToken(app, userId, session.id);

  setSessionCookies(reply, accessToken, refreshToken);
  return accessToken;
}

export async function rotateSession(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = parseRefreshToken(request.cookies[REFRESH_COOKIE]);
  if (!parsed) return null;

  for (let attempt = 0; attempt < MAX_ROTATION_ATTEMPTS; attempt += 1) {
    const now = new Date();
    const session = await prisma.session.findUnique({
      where: { id: parsed.sessionId },
    });
    if (!session || session.revokedAt || session.expiresAt <= now) {
      return null;
    }

    const matchesCurrent = refreshSecretMatches(
      parsed.secret,
      session.tokenHash,
    );
    const matchesPrevious =
      Boolean(session.previousTokenHash) &&
      Boolean(
        session.previousTokenExpiresAt && session.previousTokenExpiresAt > now,
      ) &&
      refreshSecretMatches(parsed.secret, session.previousTokenHash!);

    if (!matchesCurrent && !matchesPrevious) {
      await prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now },
      });
      return null;
    }

    const nextSecret = generateRefreshSecret();
    const result = await prisma.session.updateMany({
      where: {
        id: session.id,
        tokenHash: session.tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        tokenHash: hashRefreshSecret(nextSecret),
        previousTokenHash: session.tokenHash,
        previousTokenExpiresAt: new Date(
          now.getTime() + ROTATION_GRACE_MILLISECONDS,
        ),
        lastUsedAt: now,
        ...requestMetadata(request),
      },
    });

    if (result.count === 1) {
      const accessToken = createAccessToken(app, session.userId, session.id);
      const refreshToken = serializeRefreshToken(session.id, nextSecret);
      setSessionCookies(reply, accessToken, refreshToken);

      return { accessToken, userId: session.userId };
    }
  }

  return null;
}

export async function revokeSession(request: FastifyRequest) {
  const parsed = parseRefreshToken(request.cookies[REFRESH_COOKIE]);
  if (!parsed) return;

  await prisma.session.updateMany({
    where: { id: parsed.sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
