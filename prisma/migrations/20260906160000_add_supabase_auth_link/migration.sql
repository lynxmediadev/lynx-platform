-- FASE 1: vincula perfiles Prisma con Supabase Auth sin eliminar el sistema legacy.
ALTER TABLE "User"
  ADD COLUMN "supabaseAuthUserId" UUID,
  ADD COLUMN "authLinkedAt" TIMESTAMP(3),
  ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX "User_supabaseAuthUserId_key"
  ON "User"("supabaseAuthUserId");
