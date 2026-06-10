
-- Migration to create application tables
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Lotes
create table if not exists lotes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  quantidade integer not null default 0,
  fornecedor text,
  data_compra date,
  valor_lote numeric(10,2) default 0,
  valor_ave numeric(10,2) default 0,
  tipo text,
  raca text,
  femeas integer default 0,
  machos integer default 0,
  nome text,
  localizacao text,
  finalidade text,
  observacoes text,
  documentos text[], -- Array of URLs
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table lotes enable row level security;
create policy "Users can manage their own lotes" on lotes
  for all using (auth.uid() = user_id);

-- 2. Visitas Veterinarias
create table if not exists visitas_veterinarias (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lote_id uuid references lotes(id) on delete cascade,
  data date not null,
  tipo_procedimento text,
  veterinario text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table visitas_veterinarias enable row level security;
create policy "Users can manage their own visitas" on visitas_veterinarias
  for all using (auth.uid() = user_id);

-- 3. Manejo Diario
create table if not exists manejo_diario (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null,
  periodo text not null check (periodo in ('manha', 'tarde')),
  lote_id uuid references lotes(id) on delete set null,
  status text,
  ovos integer default 0,
  ovos_danificados integer default 0,
  racao numeric(10,2) default 0,
  agua numeric(10,2) default 0,
  porta text,
  outros text,
  peso_ovos numeric(10,2) default 0,
  classificacao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, data, periodo, lote_id)
);

alter table manejo_diario enable row level security;
create policy "Users can manage their own manejo" on manejo_diario
  for all using (auth.uid() = user_id);

-- 4. Estoque (Singleton per user)
create table if not exists estoque (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ovos integer default 0,
  galinhas_vivas integer default 0,
  galinhas_limpas integer default 0,
  cama_aves numeric(10,2) default 0,
  updated_at timestamptz default now()
);

alter table estoque enable row level security;
create policy "Users can manage their own estoque" on estoque
  for all using (auth.uid() = user_id);

-- 5. Aplicacoes Saude
create table if not exists aplicacoes_saude (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lote_id uuid references lotes(id) on delete set null,
  data date not null,
  fase text,
  tipo text,
  nome text,
  veterinario text,
  quantidade numeric(10,2) default 0,
  observacoes text,
  proxima_dose text,
  data_proxima date,
  formulacao_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table aplicacoes_saude enable row level security;
create policy "Users can manage their own saude" on aplicacoes_saude
  for all using (auth.uid() = user_id);

-- 6. Mortalidade
create table if not exists mortalidade (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lote_id uuid references lotes(id) on delete set null,
  data date not null,
  quantidade integer default 0,
  causa text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table mortalidade enable row level security;
create policy "Users can manage their own mortalidade" on mortalidade
  for all using (auth.uid() = user_id);

-- 7. Fornecedores
create table if not exists fornecedores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  cpf_cnpj text,
  telefone text,
  endereco text,
  produtos text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table fornecedores enable row level security;
create policy "Users can manage their own fornecedores" on fornecedores
  for all using (auth.uid() = user_id);

-- 8. Compras
create table if not exists compras (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null,
  fornecedor_id uuid references fornecedores(id) on delete set null,
  fornecedor_nome text, -- Backup name in case provider is deleted or manual entry
  tipo text,
  quantidade numeric(10,2) default 0,
  valor numeric(10,2) default 0,
  descricao text,
  categoria text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table compras enable row level security;
create policy "Users can manage their own compras" on compras
  for all using (auth.uid() = user_id);

-- 9. Vendas
create table if not exists vendas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null,
  cliente_id uuid references clientes(id) on delete set null,
  cliente_nome text, -- Backup name
  produto text,
  quantidade numeric(10,2) default 0,
  pagamento text,
  valor numeric(10,2) default 0,
  lote_id uuid references lotes(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vendas enable row level security;
create policy "Users can manage their own vendas" on vendas
  for all using (auth.uid() = user_id);

