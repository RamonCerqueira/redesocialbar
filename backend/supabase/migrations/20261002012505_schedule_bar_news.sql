-- Generated with supabase migration new schedule_bar_news; additive and backwards compatible.
ALTER TABLE public."Advertisement" ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
