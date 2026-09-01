import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEnvironment } from "./env";

const databaseUrl = "postgresql://user:password@localhost:5432/fixsi";

describe("parseEnvironment", () => {
  it("aplica padrões seguros para desenvolvimento", () => {
    const environment = parseEnvironment({ DATABASE_URL: databaseUrl });

    assert.equal(environment.NODE_ENV, "development");
    assert.equal(environment.PORT, 3001);
    assert.equal(environment.FRONTEND_URL, "http://localhost:3000");
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

  it("exige o segredo de autenticação em produção", () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: "production",
          DATABASE_URL: databaseUrl,
        }),
      /JWT_SECRET/,
    );
  });

  it("aceita uma configuração completa de produção", () => {
    const environment = parseEnvironment({
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      JWT_SECRET: "a".repeat(32),
      FRONTEND_URL: "https://fixsi.example.com",
    });

    assert.equal(environment.NODE_ENV, "production");
  });
});
