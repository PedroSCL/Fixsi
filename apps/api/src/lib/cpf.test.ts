import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidCpf, maskCpf, normalizeCpf } from "./cpf";

describe("CPF", () => {
  it("aceita CPF válido com ou sem máscara", () => {
    assert.equal(isValidCpf("52998224725"), true);
    assert.equal(isValidCpf("529.982.247-25"), true);
  });

  it("rejeita dígitos verificadores inválidos e sequências repetidas", () => {
    assert.equal(isValidCpf("52998224724"), false);
    assert.equal(isValidCpf("11111111111"), false);
    assert.equal(isValidCpf("123"), false);
  });

  it("normaliza e mascara sem expor o documento completo", () => {
    assert.equal(normalizeCpf("529.982.247-25"), "52998224725");
    assert.equal(maskCpf("52998224725"), "***.982.247-**");
  });
});
