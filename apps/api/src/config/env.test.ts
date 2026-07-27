import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEnvironment } from "./env";

const databaseUrl = "postgresql://user:password@localhost:5432/serveo";

describe("parseEnvironment", () => {
  it("aplica padrões seguros para desenvolvimento", () => {
    const environment = parseEnvironment({ DATABASE_URL: databaseUrl });

    assert.equal(environment.NODE_ENV, "development");
    assert.equal(environment.PORT, 3001);
    assert.equal(environment.FRONTEND_URL, "http://localhost:3000");
    assert.equal(environment.ASAAS_ENV, "sandbox");
  });

  it("converte a porta informada como texto", () => {
    const environment = parseEnvironment({
      DATABASE_URL: databaseUrl,
      PORT: "4100",
    });

    assert.equal(environment.PORT, 4100);
  });

  it("rejeita uma porta inválida", () => {
    assert.throws(
      () =>
        parseEnvironment({
          DATABASE_URL: databaseUrl,
          PORT: "70000",
        }),
      /PORT/,
    );
  });

  it("exige segredos e credenciais financeiras em produção", () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: "production",
          DATABASE_URL: databaseUrl,
        }),
      /JWT_SECRET.*ASAAS_API_KEY.*ASAAS_WEBHOOK_TOKEN/,
    );
  });

  it("aceita uma configuração completa de produção", () => {
    const environment = parseEnvironment({
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      JWT_SECRET: "a".repeat(32),
      ASAAS_ENV: "production",
      ASAAS_API_KEY: "asaas-key",
      ASAAS_WEBHOOK_TOKEN: "webhook-token-with-32-characters",
      FRONTEND_URL: "https://serveo.example.com",
    });

    assert.equal(environment.NODE_ENV, "production");
    assert.equal(environment.ASAAS_ENV, "production");
  });
});
