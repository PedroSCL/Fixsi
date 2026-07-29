import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AsaasApiError,
  asaasPublicErrorMessage,
  getAsaasBaseUrl,
} from "./asaas";

describe("getAsaasBaseUrl", () => {
  it("usa o endpoint atual de sandbox", () => {
    assert.equal(
      getAsaasBaseUrl("sandbox"),
      "https://api-sandbox.asaas.com/v3",
    );
  });

  it("usa o endpoint atual de produção", () => {
    assert.equal(getAsaasBaseUrl("production"), "https://api.asaas.com/v3");
  });
});

describe("asaasPublicErrorMessage", () => {
  it("preserva a validação útil sem expor credenciais", () => {
    const error = new AsaasApiError(400, [
      { code: "invalid_cpfCnpj", description: "CPF inválido." },
    ]);

    assert.equal(
      asaasPublicErrorMessage(error),
      "Não foi possível gerar o PIX. CPF inválido.",
    );
  });

  it("não expõe detalhes de autenticação do provedor", () => {
    const error = new AsaasApiError(401, [
      {
        code: "invalid_environment",
        description: "A chave pertence a outro ambiente.",
      },
    ]);

    assert.equal(
      asaasPublicErrorMessage(error),
      "O pagamento está temporariamente indisponível por uma falha de configuração.",
    );
  });
});
