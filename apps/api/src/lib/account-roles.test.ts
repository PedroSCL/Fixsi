import assert from "node:assert/strict";
import test from "node:test";
import { rolesForAccountType } from "./account-roles";

test("cliente recebe apenas o papel de cliente", () => {
  assert.deepEqual(rolesForAccountType("CLIENT"), ["CLIENT"]);
});

test("profissional também recebe o papel de cliente", () => {
  assert.deepEqual(rolesForAccountType("PROFESSIONAL"), [
    "CLIENT",
    "PROFESSIONAL",
  ]);
});
