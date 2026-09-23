-- Unifica o antigo papel LOCADOR com PROFESSIONAL sem perder contas existentes.
-- Se o usuário já possuía os dois papéis, preserva PROFESSIONAL e remove a duplicata.
UPDATE "UserRole" AS professional
SET "active" = professional."active" OR landlord."active"
FROM "UserRole" AS landlord
WHERE professional."userId" = landlord."userId"
  AND professional."type" = 'PROFESSIONAL'
  AND landlord."type" = 'LOCADOR';

DELETE FROM "UserRole" AS landlord
USING "UserRole" AS professional
WHERE landlord."userId" = professional."userId"
  AND landlord."type" = 'LOCADOR'
  AND professional."type" = 'PROFESSIONAL';

UPDATE "UserRole"
SET "type" = 'PROFESSIONAL'
WHERE "type" = 'LOCADOR';

-- Todo profissional também pode contratar como cliente.
UPDATE "UserRole" AS client
SET "active" = TRUE
WHERE client."type" = 'CLIENT'
  AND EXISTS (
    SELECT 1
    FROM "UserRole" AS professional
    WHERE professional."userId" = client."userId"
      AND professional."type" = 'PROFESSIONAL'
      AND professional."active" = TRUE
  );

INSERT INTO "UserRole" ("id", "type", "active", "createdAt", "userId")
SELECT
  'role_client_' || md5(professional."userId"),
  'CLIENT',
  TRUE,
  CURRENT_TIMESTAMP,
  professional."userId"
FROM "UserRole" AS professional
WHERE professional."type" = 'PROFESSIONAL'
  AND professional."active" = TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM "UserRole" AS client
    WHERE client."userId" = professional."userId"
      AND client."type" = 'CLIENT'
  );

-- O PostgreSQL não remove valores de enum diretamente; recriamos o tipo final.
ALTER TABLE "UserRole"
ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

DROP TYPE "UserRoleType";

CREATE TYPE "UserRoleType" AS ENUM ('CLIENT', 'PROFESSIONAL', 'ADMIN');

ALTER TABLE "UserRole"
ALTER COLUMN "type" TYPE "UserRoleType" USING "type"::"UserRoleType";
