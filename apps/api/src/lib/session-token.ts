import crypto from "node:crypto";

export function generateRefreshSecret() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function serializeRefreshToken(sessionId: string, secret: string) {
  return `${sessionId}.${secret}`;
}

export function parseRefreshToken(value: string | undefined) {
  if (!value) return null;

  const separator = value.indexOf(".");
  if (separator < 1 || separator === value.length - 1) return null;

  return {
    sessionId: value.slice(0, separator),
    secret: value.slice(separator + 1),
  };
}

export function refreshSecretMatches(secret: string, expectedHash: string) {
  const received = Buffer.from(hashRefreshSecret(secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}
