import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { textVariants } from "./text";

describe("textVariants", () => {
  it("gera uma alternativa sem acentos", () => {
    assert.deepEqual(textVariants("Elétrica"), ["Elétrica", "Eletrica"]);
  });

  it("remove espaços externos", () => {
    assert.deepEqual(textVariants("  Hidráulica  "), [
      "Hidráulica",
      "Hidraulica",
    ]);
  });

  it("não duplica textos que já estão sem acentos", () => {
    assert.deepEqual(textVariants("Pintura"), ["Pintura"]);
  });
});
