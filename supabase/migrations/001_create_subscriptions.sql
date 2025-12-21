-- Create a table for subscriptions
create table subscriptions (
  id text primary key, -- Stripe Subscription ID
  user_id text, -- ID do usuário no sistema (pode ser email ou UUID)
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

-- Enable Row Level Security (RLS)
alter table subscriptions enable row level security;

-- Policy: Users can view their own subscriptions (assuming user_id matches auth.uid())
-- Adjust this policy based on how you handle user IDs (email vs auth.uid)
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid()::text = user_id);

-- Policy: Only service role can insert/update/delete (handled by admin client)
create policy "Service role manages all" on subscriptions
  for all using (auth.role() = 'service_role');
