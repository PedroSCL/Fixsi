-- Sincroniza o banco Neon criado antes das migrations versionadas com a
-- estrutura atual usada pela Fixsi. Não altera nem remove cobranças existentes.

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerId" TEXT;

UPDATE "Booking" AS booking
SET "providerId" = service."userId"
FROM "Service" AS service
WHERE booking."providerId" IS NULL AND booking."serviceId" = service."id";

UPDATE "Booking" AS booking
SET "providerId" = tool."userId"
FROM "Tool" AS tool
WHERE booking."providerId" IS NULL AND booking."toolId" = tool."id";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Booking" WHERE "providerId" IS NULL) THEN
    ALTER TABLE "Booking" ALTER COLUMN "providerId" SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Booking_providerId_startDate_idx"
ON "Booking"("providerId", "startDate");

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_provider_confirmed_day_key"
ON "Booking"("providerId", ("startDate"::date))
WHERE "status" IN ('CONFIRMED', 'IN_PROGRESS');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Booking_providerId_fkey'
  ) THEN
    ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProfessionalAvailability" (
  "id" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "ProfessionalAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AvailabilityException" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "available" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalAvailability_userId_weekday_key"
ON "ProfessionalAvailability"("userId", "weekday");
CREATE INDEX IF NOT EXISTS "ProfessionalAvailability_userId_active_idx"
ON "ProfessionalAvailability"("userId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilityException_userId_date_key"
ON "AvailabilityException"("userId", "date");
CREATE INDEX IF NOT EXISTS "AvailabilityException_userId_date_idx"
ON "AvailabilityException"("userId", "date");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProfessionalAvailability_userId_fkey') THEN
    ALTER TABLE "ProfessionalAvailability" ADD CONSTRAINT "ProfessionalAvailability_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AvailabilityException_userId_fkey') THEN
    ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'SUPERSEDED';
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
