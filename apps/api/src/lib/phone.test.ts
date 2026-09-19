import assert from "node:assert/strict";
import test from "node:test";
import { isValidBrazilianPhone, normalizePhone } from "./phone";

test("normaliza telefones brasileiros formatados", () => {
  assert.equal(normalizePhone("(12) 3131-2311"), "1231312311");
  assert.equal(normalizePhone("(61) 99999-0000"), "61999990000");
});

test("aceita telefone fixo e celular com DDD válido", () => {
  assert.equal(isValidBrazilianPhone("(12) 3131-2311"), true);
  assert.equal(isValidBrazilianPhone("(61) 99999-0000"), true);
});

test("rejeita DDD, tamanho e padrões inválidos", () => {
  assert.equal(isValidBrazilianPhone("(10) 3131-2311"), false);
  assert.equal(isValidBrazilianPhone("123456789"), false);
  assert.equal(isValidBrazilianPhone("11111111111"), false);
  assert.equal(isValidBrazilianPhone("(61) 89999-0000"), false);
});
