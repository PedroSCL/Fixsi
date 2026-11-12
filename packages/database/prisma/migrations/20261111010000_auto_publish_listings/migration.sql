-- Publicação automática temporária: todo anúncio criado por um profissional
-- fica visível sem depender de verificação manual.

ALTER TABLE "Service" ALTER COLUMN "approved" SET DEFAULT true;
ALTER TABLE "Tool" ALTER COLUMN "approved" SET DEFAULT true;

UPDATE "Service" SET "approved" = true WHERE "approved" = false;
UPDATE "Tool" SET "approved" = true WHERE "approved" = false;
