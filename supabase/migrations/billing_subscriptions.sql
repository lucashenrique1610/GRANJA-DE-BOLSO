create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan_code text not null default 'free',
  plan_name text not null default 'Sem assinatura ativa',
  status text not null default 'inactive',
  billing_interval text,
  billing_interval_count integer,
  currency text not null default 'brl',
  amount_cents integer,
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_user_id_key unique (user_id)
);

alter table public.user_subscriptions enable row level security;

grant select on public.user_subscriptions to authenticated;

create policy "user_subscriptions_select_own"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);
