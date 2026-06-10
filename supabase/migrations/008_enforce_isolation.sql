-- MIGRATION: 008_enforce_isolation.sql
-- DESCRIPTION: Enforce strict data isolation per user.
-- FIX: Simplified syntax and separated policies where necessary to avoid parser errors.

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_isolation" ON public.profiles;
DROP POLICY IF EXISTS "Isolation: Profiles (All)" ON public.profiles;

CREATE POLICY "profiles_isolation"
ON public.profiles
FOR ALL
TO authenticated
USING ( id = auth.uid() )
WITH CHECK ( id = auth.uid() );

-- 2. CLIENTES
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_isolation" ON public.clientes;
DROP POLICY IF EXISTS "Isolation: Clientes (All)" ON public.clientes;

CREATE POLICY "clientes_isolation"
ON public.clientes
FOR ALL
TO authenticated
USING ( user_id::text = auth.uid()::text )
WITH CHECK ( user_id::text = auth.uid()::text );

-- 3. BACKUPS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backups_isolation" ON public.backups;
DROP POLICY IF EXISTS "Isolation: Backups (All)" ON public.backups;

CREATE POLICY "backups_isolation"
ON public.backups
FOR ALL
TO authenticated
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );

-- 4. SUBSCRIPTIONS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_isolation" ON public.subscriptions;
DROP POLICY IF EXISTS "Isolation: Subscriptions (All)" ON public.subscriptions;

CREATE POLICY "subscriptions_isolation"
ON public.subscriptions
FOR ALL
TO authenticated
USING ( user_id = auth.uid()::text )
WITH CHECK ( user_id = auth.uid()::text );

-- 5. PIX TRANSACTIONS
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pix_transactions_isolation" ON public.pix_transactions;
DROP POLICY IF EXISTS "Isolation: Pix Transactions (All)" ON public.pix_transactions;

CREATE POLICY "pix_transactions_isolation"
ON public.pix_transactions
FOR ALL
TO authenticated
USING ( user_id = auth.uid()::text )
WITH CHECK ( user_id = auth.uid()::text );
