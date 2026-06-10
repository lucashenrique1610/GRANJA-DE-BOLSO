-- Drop the existing table to ensure clean state
DROP TABLE IF EXISTS backups;

-- Create backups table with correct schema
create table backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  data text not null, -- Encrypted JSON data
  salt text not null, -- Encryption salt
  iv text not null,   -- Initialization vector
  size integer,       -- Size in bytes
  version text,       -- Backup version (e.g., "2.0")
  note text,          -- Optional user note
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table backups enable row level security;

-- Policies
create policy "Users can view own backups" on backups
  for select using (auth.uid() = user_id);

create policy "Users can insert own backups" on backups
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own backups" on backups
  for delete using (auth.uid() = user_id);

-- Create index for faster queries by user
create index if not exists backups_user_id_idx on backups(user_id);
