import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@fixsi/database";
import { deleteAccountData } from "./delete-account";

test("exclui dependências de pedidos compartilhados antes do usuário", async () => {
  const calls: Array<{ model: string; where: unknown }> = [];
  const models = [
    "review",
    "message",
    "proposal",
    "conversation",
    "report",
    "booking",
    "service",
    "tool",
    "identityVerification",
    "professionalAvailability",
    "availabilityException",
    "userRole",
    "session",
    "user",
  ];
  const delegates = Object.fromEntries(
    models.map((model) => [
      model,
      {
        deleteMany: async ({ where }: { where: unknown }) => {
          calls.push({ model, where });
        },
        delete: async ({ where }: { where: unknown }) => {
          calls.push({ model, where });
        },
      },
    ]),
  ) as Record<
    string,
    {
      deleteMany: ({ where }: { where: unknown }) => Promise<void>;
      delete: ({ where }: { where: unknown }) => Promise<void>;
      findMany?: ({ where }: { where: unknown }) => Promise<{ id: string }[]>;
    }
  >;
  delegates.booking.findMany = async ({ where }: { where: unknown }) => {
    assert.deepEqual(where, {
      OR: [
        { clientId: "user-1" },
        { providerId: "user-1" },
        { service: { userId: "user-1" } },
        { tool: { userId: "user-1" } },
      ],
    });
    return [{ id: "booking-1" }];
  };
  const tx = delegates as unknown as Prisma.TransactionClient;

  await deleteAccountData(tx, "user-1");

  assert.deepEqual(
    calls.map(({ model }) => model),
    models,
  );
  assert.deepEqual(calls[0].where, {
    OR: [
      { bookingId: { in: ["booking-1"] } },
      { authorId: "user-1" },
      { targetId: "user-1" },
    ],
  });
  assert.deepEqual(calls[1].where, {
    OR: [
      { conversation: { bookingId: { in: ["booking-1"] } } },
      { senderId: "user-1" },
    ],
  });
  assert.deepEqual(calls.at(-1)?.where, { id: "user-1" });
});
