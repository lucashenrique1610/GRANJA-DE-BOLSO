-- MIGRATION: 009_fix_and_enforce_isolation.sql
-- DESCRIPTION: Ensure tables exist and enforce strict data isolation per user.
-- NOTE: This script is idempotent (safe to run multiple times).

-- =============================================================================
-- 1. TABLE: SUBSCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text primary key, -- Stripe Subscription ID
  user_id text, -- ID do usuário no sistema
  status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  price_id text,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  metadata jsonb
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_isolation" ON public.subscriptions;
DROP POLICY IF EXISTS "Isolation: Subscriptions (All)" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role manages all" ON public.subscriptions;

CREATE POLICY "subscriptions_isolation"
ON public.subscriptions
FOR ALL
TO authenticated
USING ( user_id = auth.uid()::text )
WITH CHECK ( user_id = auth.uid()::text );

-- =============================================================================
-- 2. TABLE: PIX TRANSACTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pix_transactions (
  id uuid default gen_random_uuid() primary key,
  mercadopago_id text not null unique,
  user_id text not null,
  amount numeric not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  qr_code text,
  qr_code_base64 text,
  ticket_url text,
  plan_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pix_transactions_isolation" ON public.pix_transactions;
DROP POLICY IF EXISTS "Isolation: Pix Transactions (All)" ON public.pix_transactions;
DROP POLICY IF EXISTS "Users can view own pix transactions" ON public.pix_transactions;
DROP POLICY IF EXISTS "Service role manages pix transactions" ON public.pix_transactions;

CREATE POLICY "pix_transactions_isolation"
ON public.pix_transactions
FOR ALL
TO authenticated
USING ( user_id = auth.uid()::text )
WITH CHECK ( user_id = auth.uid()::text );

-- =============================================================================
-- 3. TABLE: BACKUPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  data text not null,
  salt text not null,
  iv text not null,
  size integer,
  version text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS backups_user_id_idx ON public.backups(user_id);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backups_isolation" ON public.backups;
DROP POLICY IF EXISTS "Isolation: Backups (All)" ON public.backups;
DROP POLICY IF EXISTS "Users can view own backups" ON public.backups;
DROP POLICY IF EXISTS "Users can insert own backups" ON public.backups;
DROP POLICY IF EXISTS "Users can delete own backups" ON public.backups;

CREATE POLICY "backups_isolation"
ON public.backups
FOR ALL
TO authenticated
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );

-- =============================================================================
-- 4. TABLE: CLIENTES
-- =============================================================================
-- Ensure table exists (though usually it's created by app logic or previous migrations)
-- We'll assume it exists or create a basic structure if needed, but adding columns is safer.
-- Note: 'clientes' might not have a strict schema defined in previous migrations I saw,
-- but 004_secure_clientes.sql implies it exists. I will add the column safely.

-- (Skipping CREATE TABLE for clientes to avoid conflict if it has complex schema not fully known, 
-- but ensuring the column exists is critical)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'user_id') THEN
        -- If table doesn't exist, this will fail. So we check table existence first.
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') THEN
            ALTER TABLE public.clientes ADD COLUMN user_id uuid REFERENCES auth.users(id);
        END IF;
    END IF;
END $$;

-- If table clientes exists, enforce isolation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS clientes_user_id_idx ON public.clientes(user_id)';
        EXECUTE 'ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'DROP POLICY IF EXISTS "clientes_isolation" ON public.clientes';
        EXECUTE 'DROP POLICY IF EXISTS "Isolation: Clientes (All)" ON public.clientes';
        EXECUTE 'DROP POLICY IF EXISTS "Users can manage own clients" ON public.clientes';
        
        EXECUTE 'CREATE POLICY "clientes_isolation" ON public.clientes FOR ALL TO authenticated USING ( user_id::text = auth.uid()::text ) WITH CHECK ( user_id::text = auth.uid()::text )';
    END IF;
END $$;

-- =============================================================================
-- 5. TABLE: PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  nome text,
  telefone text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_isolation" ON public.profiles;
DROP POLICY IF EXISTS "Isolation: Profiles (All)" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "profiles_isolation"
ON public.profiles
FOR ALL
TO authenticated
USING ( id = auth.uid() )
WITH CHECK ( id = auth.uid() );
