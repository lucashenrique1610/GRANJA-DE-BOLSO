-- 1. Tabela de Perfis (Já existe geralmente no auth.users, mas vamos criar uma tabela de perfis)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT
);

-- Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tabela de Lotes
CREATE TABLE IF NOT EXISTS public.lotes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quantidade INTEGER NOT NULL,
  fornecedor TEXT NOT NULL,
  data_compra TEXT,
  valor_lote NUMERIC NOT NULL,
  valor_ave NUMERIC NOT NULL,
  tipo TEXT NOT NULL,
  raca TEXT NOT NULL,
  femeas INTEGER NOT NULL,
  machos INTEGER NOT NULL,
  nome TEXT,
  localizacao TEXT,
  finalidade TEXT,
  observacoes TEXT,
  documentos TEXT[]
);

-- 3. Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  endereco TEXT,
  produtos TEXT
);

-- 4. Tabela de Visitas Veterinárias
CREATE TABLE IF NOT EXISTS public.visitas_veterinarias (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data TEXT NOT NULL,
  tipo_procedimento TEXT,
  veterinario TEXT,
  observacoes TEXT
);

-- 5. Tabela de Manejo Diário
CREATE TABLE IF NOT EXISTS public.manejo_diario (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  periodo TEXT NOT NULL CHECK (periodo IN ('manha', 'tarde')),
  status TEXT,
  ovos INTEGER NOT NULL,
  ovos_danificados INTEGER NOT NULL,
  racao INTEGER NOT NULL,
  agua INTEGER NOT NULL,
  porta TEXT,
  outros TEXT,
  peso_ovos NUMERIC NOT NULL,
  classificacao TEXT,
  UNIQUE(user_id, data, periodo)
);

-- 6. Tabela de Estoque
CREATE TABLE IF NOT EXISTS public.estoque (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ovos INTEGER DEFAULT 0,
  galinhas_vivas INTEGER DEFAULT 0,
  galinhas_limpas INTEGER DEFAULT 0,
  cama_aves INTEGER DEFAULT 0,
  UNIQUE(user_id)
);

-- 7. Tabela de Aplicações de Saúde
CREATE TABLE IF NOT EXISTS public.aplicacoes_saude (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data TEXT NOT NULL,
  fase TEXT,
  tipo TEXT,
  nome TEXT,
  veterinario TEXT,
  quantidade INTEGER NOT NULL,
  observacoes TEXT,
  proxima_dose TEXT,
  data_proxima TEXT,
  formulacao_id TEXT
);

-- 8. Tabela de Mortalidade
CREATE TABLE IF NOT EXISTS public.mortalidade (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  causa TEXT,
  observacoes TEXT
);

-- 9. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  tipo TEXT CHECK (tipo IN ('fisico', 'juridico')) NOT NULL
);

-- 10. Tabela de Vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id TEXT REFERENCES clientes(id) ON DELETE CASCADE,
  cliente_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data TEXT NOT NULL,
  produto TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  pagamento TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE
);

-- 11. Tabela de Compras
CREATE TABLE IF NOT EXISTS public.compras (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fornecedor_id TEXT REFERENCES fornecedores(id) ON DELETE CASCADE,
  fornecedor_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data TEXT NOT NULL,
  tipo TEXT,
  quantidade INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  descricao TEXT,
  categoria TEXT
);

-- 12. Tabela de Subscrições (Já pode existir, mas vamos confirmar)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'trial',
  plan TEXT,
  payment_id TEXT,
  UNIQUE(user_id)
);

-- Trigger para criar estoque automaticamente para cada novo usuário
CREATE OR REPLACE FUNCTION public.create_estoque_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.estoque (user_id, ovos, galinhas_vivas, galinhas_limpas, cama_aves)
  VALUES (NEW.id, 0, 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_estoque_on_new_profile ON public.profiles;
CREATE TRIGGER create_estoque_on_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_estoque_for_user();

-- =============================================
-- Políticas de RLS (Row Level Security)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas_veterinarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manejo_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicacoes_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortalidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Usuários podem ver o próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Políticas para Lotes
CREATE POLICY "Usuários podem ver seus próprios lotes"
ON public.lotes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios lotes"
ON public.lotes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios lotes"
ON public.lotes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios lotes"
ON public.lotes FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Fornecedores
CREATE POLICY "Usuários podem ver seus próprios fornecedores"
ON public.fornecedores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios fornecedores"
ON public.fornecedores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios fornecedores"
ON public.fornecedores FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios fornecedores"
ON public.fornecedores FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Visitas Veterinárias
CREATE POLICY "Usuários podem ver suas próprias visitas"
ON public.visitas_veterinarias FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias visitas"
ON public.visitas_veterinarias FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias visitas"
ON public.visitas_veterinarias FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias visitas"
ON public.visitas_veterinarias FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Manejo Diário
CREATE POLICY "Usuários podem ver seu próprio manejo"
ON public.manejo_diario FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio manejo"
ON public.manejo_diario FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio manejo"
ON public.manejo_diario FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seu próprio manejo"
ON public.manejo_diario FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Estoque
CREATE POLICY "Usuários podem ver seu próprio estoque"
ON public.estoque FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio estoque"
ON public.estoque FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio estoque"
ON public.estoque FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas para Aplicações de Saúde
CREATE POLICY "Usuários podem ver suas próprias aplicações"
ON public.aplicacoes_saude FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias aplicações"
ON public.aplicacoes_saude FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias aplicações"
ON public.aplicacoes_saude FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias aplicações"
ON public.aplicacoes_saude FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Mortalidade
CREATE POLICY "Usuários podem ver seus próprios registros de mortalidade"
ON public.mortalidade FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios registros de mortalidade"
ON public.mortalidade FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios registros de mortalidade"
ON public.mortalidade FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios registros de mortalidade"
ON public.mortalidade FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Clientes
CREATE POLICY "Usuários podem ver seus próprios clientes"
ON public.clientes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios clientes"
ON public.clientes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios clientes"
ON public.clientes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios clientes"
ON public.clientes FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Vendas
CREATE POLICY "Usuários podem ver suas próprias vendas"
ON public.vendas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias vendas"
ON public.vendas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias vendas"
ON public.vendas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias vendas"
ON public.vendas FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Compras
CREATE POLICY "Usuários podem ver suas próprias compras"
ON public.compras FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias compras"
ON public.compras FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias compras"
ON public.compras FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias compras"
ON public.compras FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para Subscrições
CREATE POLICY "Usuários podem ver sua própria subscrição"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);
