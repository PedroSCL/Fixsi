import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAsaasBaseUrl } from "./asaas";

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
