-- ATENÇÃO: Este script recria o esquema do banco de dados para garantir consistência de tipos (UUID).
-- Isso pode APAGAR dados existentes nas tabelas listadas abaixo.
-- Execute no Editor SQL do Supabase.

-- 1. Limpeza (DROP) de tabelas antigas para evitar conflitos de tipo (ex: bigint vs uuid)
drop table if exists vendas cascade;
drop table if exists compras cascade;
drop table if exists manejo_diario cascade;
drop table if exists visitas_veterinarias cascade;
drop table if exists aplicacoes_saude cascade;
drop table if exists mortalidade cascade;
drop table if exists estoque cascade;
drop table if exists lotes cascade;
drop table if exists clientes cascade;
drop table if exists fornecedores cascade;
drop table if exists tip_feedbacks cascade;
drop table if exists tip_preferences cascade;
drop table if exists audit_logs cascade;

-- 2. Extensões
create extension if not exists "uuid-ossp";

-- 3. Função Auxiliar para updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- 4. Criação das Tabelas e Políticas

-- TABLE: clientes (Deve vir antes de vendas)
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  endereco text,
  telefone text,
  cpf_cnpj text,
  tipo text check (tipo in ('fisico', 'juridico')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table clientes enable row level security;
create policy "Users can manage their own clientes" on clientes for all using (auth.uid() = user_id);
create trigger update_clientes_modtime before update on clientes for each row execute procedure update_updated_at_column();

-- TABLE: fornecedores (Deve vir antes de lotes e compras)
create table fornecedores (
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
create policy "Users can manage their own fornecedores" on fornecedores for all using (auth.uid() = user_id);
create trigger update_fornecedores_modtime before update on fornecedores for each row execute procedure update_updated_at_column();

-- TABLE: lotes
create table lotes (
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
  documentos text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table lotes enable row level security;
create policy "Users can manage their own lotes" on lotes for all using (auth.uid() = user_id);
create trigger update_lotes_modtime before update on lotes for each row execute procedure update_updated_at_column();

-- TABLE: visitas_veterinarias
create table visitas_veterinarias (
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
create policy "Users can manage their own visitas" on visitas_veterinarias for all using (auth.uid() = user_id);
create trigger update_visitas_modtime before update on visitas_veterinarias for each row execute procedure update_updated_at_column();

-- TABLE: manejo_diario
create table manejo_diario (
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
create policy "Users can manage their own manejo" on manejo_diario for all using (auth.uid() = user_id);
create trigger update_manejo_modtime before update on manejo_diario for each row execute procedure update_updated_at_column();

-- TABLE: estoque (Singleton)
create table estoque (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ovos integer default 0,
  galinhas_vivas integer default 0,
  galinhas_limpas integer default 0,
  cama_aves numeric(10,2) default 0,
  updated_at timestamptz default now()
);

alter table estoque enable row level security;
create policy "Users can manage their own estoque" on estoque for all using (auth.uid() = user_id);
create trigger update_estoque_modtime before update on estoque for each row execute procedure update_updated_at_column();

-- TABLE: aplicacoes_saude
create table aplicacoes_saude (
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
create policy "Users can manage their own saude" on aplicacoes_saude for all using (auth.uid() = user_id);
create trigger update_saude_modtime before update on aplicacoes_saude for each row execute procedure update_updated_at_column();

-- TABLE: mortalidade
create table mortalidade (
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
create policy "Users can manage their own mortalidade" on mortalidade for all using (auth.uid() = user_id);
create trigger update_mortalidade_modtime before update on mortalidade for each row execute procedure update_updated_at_column();

-- TABLE: compras
create table compras (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null,
  fornecedor_id uuid references fornecedores(id) on delete set null,
  fornecedor_nome text,
  tipo text,
  quantidade numeric(10,2) default 0,
  valor numeric(10,2) default 0,
  descricao text,
  categoria text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table compras enable row level security;
create policy "Users can manage their own compras" on compras for all using (auth.uid() = user_id);
create trigger update_compras_modtime before update on compras for each row execute procedure update_updated_at_column();

-- TABLE: vendas
create table vendas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null,
  cliente_id uuid references clientes(id) on delete set null,
  cliente_nome text,
  produto text,
  quantidade numeric(10,2) default 0,
  pagamento text,
  valor numeric(10,2) default 0,
  lote_id uuid references lotes(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vendas enable row level security;
create policy "Users can manage their own vendas" on vendas for all using (auth.uid() = user_id);
create trigger update_vendas_modtime before update on vendas for each row execute procedure update_updated_at_column();

-- TABLE: tip_feedbacks
create table tip_feedbacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text,
  ts bigint,
  path text,
  created_at timestamptz default now()
);

alter table tip_feedbacks enable row level security;
create policy "Users can manage their own tip_feedbacks" on tip_feedbacks for all using (auth.uid() = user_id);

-- TABLE: tip_preferences (Singleton)
create table tip_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dismissed text[],
  irrelevant text[],
  last_shown jsonb,
  updated_at timestamptz default now()
);

alter table tip_preferences enable row level security;
create policy "Users can manage their own tip_preferences" on tip_preferences for all using (auth.uid() = user_id);
create trigger update_tip_prefs_modtime before update on tip_preferences for each row execute procedure update_updated_at_column();

-- TABLE: audit_logs
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  timestamp timestamptz default now(),
  action text,
  entity text,
  entity_id text,
  details text,
  user_metadata text
);

alter table audit_logs enable row level security;
create policy "Users can manage their own audit_logs" on audit_logs for all using (auth.uid() = user_id);

-- 5. Índices de Performance para Isolamento (user_id)
create index if not exists idx_clientes_user_id on clientes(user_id);
create index if not exists idx_fornecedores_user_id on fornecedores(user_id);
create index if not exists idx_lotes_user_id on lotes(user_id);
create index if not exists idx_visitas_user_id on visitas_veterinarias(user_id);
create index if not exists idx_manejo_user_id on manejo_diario(user_id);
create index if not exists idx_estoque_user_id on estoque(user_id);
create index if not exists idx_saude_user_id on aplicacoes_saude(user_id);
create index if not exists idx_mortalidade_user_id on mortalidade(user_id);
create index if not exists idx_compras_user_id on compras(user_id);
create index if not exists idx_vendas_user_id on vendas(user_id);
create index if not exists idx_tip_feedbacks_user_id on tip_feedbacks(user_id);
create index if not exists idx_tip_preferences_user_id on tip_preferences(user_id);
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);

