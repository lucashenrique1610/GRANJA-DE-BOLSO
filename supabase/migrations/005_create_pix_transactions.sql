-- Create a table for PIX transactions
create table pix_transactions (
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

-- Enable Row Level Security (RLS)
alter table pix_transactions enable row level security;

-- Policy: Users can view their own transactions
create policy "Users can view own pix transactions" on pix_transactions
  for select using (auth.uid()::text = user_id);

-- Policy: Service role can manage all
create policy "Service role manages pix transactions" on pix_transactions
  for all using (auth.role() = 'service_role');
