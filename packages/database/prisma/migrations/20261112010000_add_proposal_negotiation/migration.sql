-- Uma negociação tem uma única proposta pendente por conversa. Cada nova
-- contraproposta preserva o histórico e substitui a anterior.

ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'SUPERSEDED';
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "materialsIncluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "estimatedDuration" TEXT;
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "round" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "replacesProposalId" TEXT;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "conversationId" ORDER BY "createdAt" DESC, "id" DESC
  ) AS position
  FROM "Proposal"
  WHERE "status" = 'PENDING'
)
UPDATE "Proposal" proposal
SET "status" = 'REJECTED'
FROM ranked
WHERE proposal."id" = ranked."id" AND ranked.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "Proposal_replacesProposalId_key"
ON "Proposal"("replacesProposalId");
CREATE INDEX IF NOT EXISTS "Proposal_conversationId_status_idx"
ON "Proposal"("conversationId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Proposal_one_pending_per_conversation_key"
ON "Proposal"("conversationId")
WHERE "status" = 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Proposal_replacesProposalId_fkey') THEN
    ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_replacesProposalId_fkey"
    FOREIGN KEY ("replacesProposalId") REFERENCES "Proposal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
