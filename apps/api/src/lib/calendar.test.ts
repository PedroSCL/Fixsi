import assert from "node:assert/strict";
import test from "node:test";
import {
  addUtcDays,
  formatDateOnly,
  isDateAvailable,
  parseDateOnly,
  todayUtc,
} from "./calendar";

test("parseia data sem sofrer deslocamento de fuso", () => {
  assert.equal(formatDateOnly(parseDateOnly("2026-09-27")), "2026-09-27");
});

test("rejeita datas inexistentes", () => {
  assert.throws(() => parseDateOnly("2026-02-31"), /Data inválida/);
});

test("exceção substitui a regra semanal", () => {
  const saturday = parseDateOnly("2026-09-26");
  assert.equal(isDateAvailable(saturday, [1, 2, 3, 4, 5], new Map()), false);
  assert.equal(
    isDateAvailable(saturday, [1, 2, 3, 4, 5], new Map([["2026-09-26", true]])),
    true,
  );
});

test("soma dias em UTC", () => {
  assert.equal(
    formatDateOnly(addUtcDays(parseDateOnly("2026-12-31"), 1)),
    "2027-01-01",
  );
});

test("considera o dia civil de São Paulo no servidor UTC", () => {
  assert.equal(
    formatDateOnly(todayUtc(new Date("2026-09-23T01:30:00.000Z"))),
    "2026-09-22",
  );
});
