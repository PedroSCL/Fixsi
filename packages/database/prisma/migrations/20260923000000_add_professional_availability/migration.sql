-- Agenda recorrente e exceções de disponibilidade do profissional.
CREATE TABLE "ProfessionalAvailability" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ProfessionalAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "available" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- O responsável fica gravado no pedido para consultas rápidas e para que o
-- banco consiga impedir duas confirmações do mesmo profissional no mesmo dia.
ALTER TABLE "Booking" ADD COLUMN "providerId" TEXT;

UPDATE "Booking" AS booking
SET "providerId" = service."userId"
FROM "Service" AS service
WHERE booking."serviceId" = service."id";

UPDATE "Booking" AS booking
SET "providerId" = tool."userId"
FROM "Tool" AS tool
WHERE booking."providerId" IS NULL AND booking."toolId" = tool."id";

ALTER TABLE "Booking" ALTER COLUMN "providerId" SET NOT NULL;

CREATE UNIQUE INDEX "ProfessionalAvailability_userId_weekday_key"
ON "ProfessionalAvailability"("userId", "weekday");
CREATE INDEX "ProfessionalAvailability_userId_active_idx"
ON "ProfessionalAvailability"("userId", "active");
CREATE UNIQUE INDEX "AvailabilityException_userId_date_key"
ON "AvailabilityException"("userId", "date");
CREATE INDEX "AvailabilityException_userId_date_idx"
ON "AvailabilityException"("userId", "date");
CREATE INDEX "Booking_providerId_startDate_idx"
ON "Booking"("providerId", "startDate");

-- Apenas pedidos efetivamente confirmados/em andamento ocupam a data. Pedidos
-- pendentes podem coexistir até o profissional e o cliente fecharem a proposta.
CREATE UNIQUE INDEX "Booking_provider_confirmed_day_key"
ON "Booking"("providerId", ("startDate"::date))
WHERE "status" IN ('CONFIRMED', 'IN_PROGRESS');

ALTER TABLE "ProfessionalAvailability"
ADD CONSTRAINT "ProfessionalAvailability_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AvailabilityException"
ADD CONSTRAINT "AvailabilityException_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
