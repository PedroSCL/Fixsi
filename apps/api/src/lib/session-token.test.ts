import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateRefreshSecret,
  hashRefreshSecret,
  parseRefreshToken,
  refreshSecretMatches,
  serializeRefreshToken,
} from "./session-token";

describe("refresh session token", () => {
  it("serializa e recupera o identificador e o segredo", () => {
    const value = serializeRefreshToken("session-id", "secret-value");

    assert.deepEqual(parseRefreshToken(value), {
      sessionId: "session-id",
      secret: "secret-value",
    });
  });

  it("rejeita valores malformados", () => {
    assert.equal(parseRefreshToken(undefined), null);
    assert.equal(parseRefreshToken("sem-separador"), null);
    assert.equal(parseRefreshToken(".sem-id"), null);
    assert.equal(parseRefreshToken("sem-segredo."), null);
  });

  it("compara o segredo utilizando seu hash", () => {
    const secret = generateRefreshSecret();
    const hash = hashRefreshSecret(secret);

    assert.equal(refreshSecretMatches(secret, hash), true);
    assert.equal(refreshSecretMatches(`${secret}alterado`, hash), false);
  });

  it("gera segredos diferentes", () => {
    assert.notEqual(generateRefreshSecret(), generateRefreshSecret());
  });
});
