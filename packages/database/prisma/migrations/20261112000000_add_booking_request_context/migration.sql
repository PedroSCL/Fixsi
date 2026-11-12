-- Contexto informado pelo cliente para o profissional calcular o orçamento.
-- As colunas permanecem opcionais para preservar pedidos criados antes deste fluxo.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingUrgency') THEN
    CREATE TYPE "BookingUrgency" AS ENUM ('FLEXIBLE', 'SOON', 'URGENT');
  END IF;
END $$;

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "requestDescription" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "urgency" "BookingUrgency" NOT NULL DEFAULT 'FLEXIBLE';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "budgetReference" DECIMAL(12,2);
