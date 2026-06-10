-- =============================================
-- GRANJA DE BOLSO - SCHEMA SEGURO DO SUPABASE
-- Versão: 1.0.0
-- =============================================

-- =============================================
-- PASSO 1: CRIAR TABELAS SEM DEPENDÊNCIAS EXTERNAS
-- =============================================

-- 1. Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT,
    full_name TEXT,
    avatar_url TEXT
);

-- 2. Tabela de Lotes (primeira tabela com dependências)
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

-- 4. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome TEXT NOT NULL,
    endereco TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    tipo TEXT NOT NULL
);

-- 5. Tabela de Estoque
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

-- 6. Tabela de Subscrições
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

-- =============================================
-- PASSO 2: CRIAR TABELAS QUE DEPENDEM DAS ANTERIORES
-- =============================================

-- 7. Tabela de Visitas Veterinárias (depende de lotes)
CREATE TABLE IF NOT EXISTS public.visitas_veterinarias (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    tipo_procedimento TEXT,
    veterinario TEXT,
    observacoes TEXT
);

-- 8. Tabela de Manejo Diário (depende de lotes)
CREATE TABLE IF NOT EXISTS public.manejo_diario (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT,
    data TEXT NOT NULL,
    periodo TEXT NOT NULL,
    status TEXT,
    ovos INTEGER NOT NULL DEFAULT 0,
    ovos_danificados INTEGER NOT NULL DEFAULT 0,
    racao INTEGER NOT NULL DEFAULT 0,
    agua INTEGER NOT NULL DEFAULT 0,
    porta TEXT,
    outros TEXT,
    peso_ovos NUMERIC NOT NULL DEFAULT 0,
    classificacao TEXT,
    UNIQUE(user_id, data, periodo)
);

-- 9. Tabela de Aplicações de Saúde (depende de lotes)
CREATE TABLE IF NOT EXISTS public.aplicacoes_saude (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    fase TEXT,
    tipo TEXT,
    nome TEXT NOT NULL,
    veterinario TEXT,
    quantidade INTEGER NOT NULL,
    observacoes TEXT,
    proxima_dose TEXT,
    data_proxima TEXT,
    formulacao_id TEXT
);

-- 10. Tabela de Mortalidade (depende de lotes)
CREATE TABLE IF NOT EXISTS public.mortalidade (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    causa TEXT,
    observacoes TEXT
);

-- 11. Tabela de Vendas (depende de clientes e lotes)
CREATE TABLE IF NOT EXISTS public.vendas (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cliente_id TEXT,
    cliente_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    produto TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    pagamento TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    lote_id TEXT
);

-- 12. Tabela de Compras (depende de fornecedores)
CREATE TABLE IF NOT EXISTS public.compras (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    fornecedor_id TEXT,
    fornecedor_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    tipo TEXT,
    quantidade INTEGER NOT NULL,
    valor NUMERIC NOT NULL,
    descricao TEXT,
    categoria TEXT
);

-- =============================================
-- PASSO 3: ADICIONAR CHAVES ESTRANGEIRAS (SE NECESSÁRIO)
-- =============================================
-- Nota: Estamos usando TEXT para IDs ao invés de referências diretas para evitar erros de ordem

-- =============================================
-- PASSO 4: CRIAR FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para lotes
DROP TRIGGER IF EXISTS set_lotes_updated_at ON public.lotes;
CREATE TRIGGER set_lotes_updated_at
    BEFORE UPDATE ON public.lotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para fornecedores
DROP TRIGGER IF EXISTS set_fornecedores_updated_at ON public.fornecedores;
CREATE TRIGGER set_fornecedores_updated_at
    BEFORE UPDATE ON public.fornecedores
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para clientes
DROP TRIGGER IF EXISTS set_clientes_updated_at ON public.clientes;
CREATE TRIGGER set_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para estoque
DROP TRIGGER IF EXISTS set_estoque_updated_at ON public.estoque;
CREATE TRIGGER set_estoque_updated_at
    BEFORE UPDATE ON public.estoque
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar perfil quando usuário se cadastra
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

-- Função para criar estoque automaticamente
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
-- PASSO 5: HABILITAR RLS E CRIAR POLÍTICAS
-- =============================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas_veterinarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manejo_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicacoes_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortalidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para Lotes
CREATE POLICY IF NOT EXISTS "Users can view their own lotes" ON public.lotes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own lotes" ON public.lotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own lotes" ON public.lotes
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own lotes" ON public.lotes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Fornecedores
CREATE POLICY IF NOT EXISTS "Users can view their own fornecedores" ON public.fornecedores
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own fornecedores" ON public.fornecedores
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own fornecedores" ON public.fornecedores
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own fornecedores" ON public.fornecedores
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Clientes
CREATE POLICY IF NOT EXISTS "Users can view their own clientes" ON public.clientes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own clientes" ON public.clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own clientes" ON public.clientes
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own clientes" ON public.clientes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Estoque
CREATE POLICY IF NOT EXISTS "Users can view their own estoque" ON public.estoque
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own estoque" ON public.estoque
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own estoque" ON public.estoque
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para Subscriptions
CREATE POLICY IF NOT EXISTS "Users can view their own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para Visitas Veterinárias
CREATE POLICY IF NOT EXISTS "Users can view their own visitas" ON public.visitas_veterinarias
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own visitas" ON public.visitas_veterinarias
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own visitas" ON public.visitas_veterinarias
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own visitas" ON public.visitas_veterinarias
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Manejo Diário
CREATE POLICY IF NOT EXISTS "Users can view their own manejo" ON public.manejo_diario
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own manejo" ON public.manejo_diario
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own manejo" ON public.manejo_diario
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own manejo" ON public.manejo_diario
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Aplicações de Saúde
CREATE POLICY IF NOT EXISTS "Users can view their own aplicacoes" ON public.aplicacoes_saude
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own aplicacoes" ON public.aplicacoes_saude
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own aplicacoes" ON public.aplicacoes_saude
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own aplicacoes" ON public.aplicacoes_saude
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Mortalidade
CREATE POLICY IF NOT EXISTS "Users can view their own mortalidade" ON public.mortalidade
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own mortalidade" ON public.mortalidade
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own mortalidade" ON public.mortalidade
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own mortalidade" ON public.mortalidade
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Vendas
CREATE POLICY IF NOT EXISTS "Users can view their own vendas" ON public.vendas
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own vendas" ON public.vendas
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own vendas" ON public.vendas
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own vendas" ON public.vendas
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Compras
CREATE POLICY IF NOT EXISTS "Users can view their own compras" ON public.compras
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own compras" ON public.compras
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own compras" ON public.compras
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own compras" ON public.compras
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIM DO SCHEMA
-- =============================================
