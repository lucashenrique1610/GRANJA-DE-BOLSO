
-- Enable Row Level Security (RLS) for clientes table
alter table if exists clientes enable row level security;

-- Policy: Users can manage (select, insert, update, delete) their own clients
-- Assumes user_id column exists and matches auth.uid()
create policy "Users can manage own clients" on clientes
  for all using (auth.uid() = user_id);

-- Create index on user_id for performance
create index if not exists clientes_user_id_idx on clientes(user_id);
