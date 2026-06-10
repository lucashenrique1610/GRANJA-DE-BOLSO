-- =============================================
-- GRANJA DE BOLSO - SCHEMA FINAL (COMPATÍVEL COM SUPABASE)
-- =============================================

-- =============================================
-- 1. TABELA BÁSICA: LOTES
-- =============================================
CREATE TABLE IF NOT EXISTS public.lotes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
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

-- =============================================
-- 2. TABELA BÁSICA: FORNECEDORES
-- =============================================
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    telefone TEXT,
    endereco TEXT,
    produtos TEXT
);

-- =============================================
-- 3. TABELA BÁSICA: VISITAS VETERINÁRIAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.visitas_veterinarias (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    lote_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    tipo_procedimento TEXT,
    veterinario TEXT,
    observacoes TEXT
);

-- =============================================
-- 4. TABELA BÁSICA: MANEJO DIÁRIO
-- =============================================
CREATE TABLE IF NOT EXISTS public.manejo_diario (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
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
    classificacao TEXT
);

-- =============================================
-- 5. TABELA BÁSICA: ESTOQUE
-- =============================================
CREATE TABLE IF NOT EXISTS public.estoque (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ovos INTEGER DEFAULT 0,
    galinhas_vivas INTEGER DEFAULT 0,
    galinhas_limpas INTEGER DEFAULT 0,
    cama_aves INTEGER DEFAULT 0
);

-- =============================================
-- 6. TABELA BÁSICA: APLICAÇÕES DE SAÚDE
-- =============================================
CREATE TABLE IF NOT EXISTS public.aplicacoes_saude (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
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

-- =============================================
-- 7. TABELA BÁSICA: MORTALIDADE
-- =============================================
CREATE TABLE IF NOT EXISTS public.mortalidade (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    lote_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    causa TEXT,
    observacoes TEXT
);

-- =============================================
-- 8. TABELA BÁSICA: CLIENTES
-- =============================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome TEXT NOT NULL,
    endereco TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    tipo TEXT NOT NULL
);

-- =============================================
-- 9. TABELA BÁSICA: VENDAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.vendas (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
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

-- =============================================
-- 10. TABELA BÁSICA: COMPRAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.compras (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
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
-- 11. TABELA BÁSICA: SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'trial',
    plan TEXT,
    payment_id TEXT
);

-- =============================================
-- 12. TABELA BÁSICA: PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT,
    full_name TEXT,
    avatar_url TEXT
);

-- =============================================
-- FIM DO SCHEMA - TABELAS CRIADAS!
-- =============================================
