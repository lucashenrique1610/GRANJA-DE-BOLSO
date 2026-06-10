-- =============================================
-- GRANJA DE BOLSO - SCHEMA COMPLETO DO SUPABASE
-- Versão: 1.0.0
-- Data: 2026-06-10
-- =============================================

-- =============================================
-- CONFIGURAÇÕES INICIAIS
-- =============================================
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =============================================
-- TABELA DE PERFIS (PROFILES)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT
);

-- =============================================
-- FUNÇÃO: ATUALIZAR updated_at AUTOMATICAMENTE
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER: CRIAR PERFIL QUANDO USUÁRIO SE CADASTRAR
-- =============================================
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

-- =============================================
-- TRIGGER: ATUALIZAR updated_at NO profiles
-- =============================================
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TABELA DE LOTES (LOTES)
-- =============================================
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
    documentos TEXT[],
    ativo BOOLEAN DEFAULT TRUE
);

DROP TRIGGER IF EXISTS set_lotes_updated_at ON public.lotes;
CREATE TRIGGER set_lotes_updated_at
    BEFORE UPDATE ON public.lotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TABELA DE FORNECEDORES (FORNECEDORES)
-- =============================================
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    telefone TEXT,
    endereco TEXT,
    produtos TEXT,
    email TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

DROP TRIGGER IF EXISTS set_fornecedores_updated_at ON public.fornecedores;
CREATE TRIGGER set_fornecedores_updated_at
    BEFORE UPDATE ON public.fornecedores
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TABELA DE VISITAS VETERINÁRIAS (VISITAS_VETERINARIAS)
-- =============================================
CREATE TABLE IF NOT EXISTS public.visitas_veterinarias (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    tipo_procedimento TEXT,
    veterinario TEXT,
    observacoes TEXT,
    custo NUMERIC,
    diagnostico TEXT,
    receita TEXT
);

-- =============================================
-- TABELA DE MANEJO DIÁRIO (MANEJO_DIARIO)
-- =============================================
CREATE TABLE IF NOT EXISTS public.manejo_diario (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    periodo TEXT NOT NULL CHECK (periodo IN ('manha', 'tarde')),
    status TEXT,
    ovos INTEGER NOT NULL DEFAULT 0,
    ovos_danificados INTEGER NOT NULL DEFAULT 0,
    racao INTEGER NOT NULL DEFAULT 0,
    agua INTEGER NOT NULL DEFAULT 0,
    porta TEXT,
    outros TEXT,
    peso_ovos NUMERIC NOT NULL DEFAULT 0,
    classificacao TEXT,
    temperatura NUMERIC,
    umidade NUMERIC,
    UNIQUE(user_id, data, periodo)
);

-- =============================================
-- TABELA DE ESTOQUE (ESTOQUE)
-- =============================================
CREATE TABLE IF NOT EXISTS public.estoque (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ovos INTEGER DEFAULT 0,
    galinhas_vivas INTEGER DEFAULT 0,
    galinhas_limpas INTEGER DEFAULT 0,
    cama_aves INTEGER DEFAULT 0,
    racao INTEGER DEFAULT 0,
    medicamentos INTEGER DEFAULT 0,
    outros_insumos INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS set_estoque_updated_at ON public.estoque;
CREATE TRIGGER set_estoque_updated_at
    BEFORE UPDATE ON public.estoque
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TRIGGER: CRIAR ESTOQUE PARA NOVOS USUÁRIOS
-- =============================================
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
-- TABELA DE APLICAÇÕES DE SAÚDE (APLICACOES_SAUDE)
-- =============================================
CREATE TABLE IF NOT EXISTS public.aplicacoes_saude (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
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
    formulacao_id TEXT,
    custo NUMERIC,
    lote_produto TEXT
);

-- =============================================
-- TABELA DE MORTALIDADE (MORTALIDADE)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mortalidade (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    causa TEXT,
    observacoes TEXT,
    tipo_ave TEXT,
    idade_dias INTEGER
);

-- =============================================
-- TABELA DE CLIENTES (CLIENTES)
-- =============================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome TEXT NOT NULL,
    endereco TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    tipo TEXT CHECK (tipo IN ('fisico', 'juridico')) NOT NULL,
    email TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

DROP TRIGGER IF EXISTS set_clientes_updated_at ON public.clientes;
CREATE TRIGGER set_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TABELA DE VENDAS (VENDAS)
-- =============================================
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
    valor_unitario NUMERIC,
    lote_id TEXT REFERENCES lotes(id) ON DELETE CASCADE,
    observacoes TEXT,
    status TEXT DEFAULT 'concluida'
);

-- =============================================
-- TABELA DE COMPRAS (COMPRAS)
-- =============================================
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
    valor_unitario NUMERIC,
    descricao TEXT,
    categoria TEXT,
    nota_fiscal TEXT,
    observacoes TEXT
);

-- =============================================
-- TABELA DE SUBSCRIÇÕES (SUBSCRIPTIONS)
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'trial',
    plan TEXT,
    payment_id TEXT,
    subscription_id TEXT,
    price_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id)
);

-- =============================================
-- TABELA DE AUDITORIA (AUDIT_LOGS)
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT
);

-- =============================================
-- TABELA DE PREFERÊNCIAS DO USUÁRIO (USER_PREFERENCES)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tema TEXT DEFAULT 'claro',
    notificacoes JSONB DEFAULT '{}'::jsonb,
    unidades JSONB DEFAULT '{}'::jsonb,
    sistema JSONB DEFAULT '{}'::jsonb,
    clima JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TABELA DE DICAS (TIPS)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tips (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- TABELA DE INTERAÇÕES COM DICAS (TIP_FEEDBACK)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tip_feedback (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tip_id TEXT REFERENCES tips(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT NOT NULL,
    path TEXT
);

-- =============================================
-- ÍNDICES PARA MELHORAR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_lotes_user_id ON public.lotes(user_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id ON public.fornecedores(user_id);
CREATE INDEX IF NOT EXISTS idx_visitas_veterinarias_user_id ON public.visitas_veterinarias(user_id);
CREATE INDEX IF NOT EXISTS idx_visitas_veterinarias_lote_id ON public.visitas_veterinarias(lote_id);
CREATE INDEX IF NOT EXISTS idx_manejo_diario_user_id ON public.manejo_diario(user_id);
CREATE INDEX IF NOT EXISTS idx_manejo_diario_lote_id ON public.manejo_diario(lote_id);
CREATE INDEX IF NOT EXISTS idx_estoque_user_id ON public.estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_saude_user_id ON public.aplicacoes_saude(user_id);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_saude_lote_id ON public.aplicacoes_saude(lote_id);
CREATE INDEX IF NOT EXISTS idx_mortalidade_user_id ON public.mortalidade(user_id);
CREATE INDEX IF NOT EXISTS idx_mortalidade_lote_id ON public.mortalidade(lote_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON public.vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON public.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_lote_id ON public.vendas(lote_id);
CREATE INDEX IF NOT EXISTS idx_compras_user_id ON public.compras(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_fornecedor_id ON public.compras(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tip_feedback_user_id ON public.tip_feedback(user_id);

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================
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
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_feedback ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - PROFILES
-- =============================================
CREATE POLICY "Usuários podem ver o próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =============================================
-- POLÍTICAS RLS - LOTES
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - FORNECEDORES
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - VISITAS_VETERINARIAS
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - MANEJO_DIARIO
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - ESTOQUE
-- =============================================
CREATE POLICY "Usuários podem ver seu próprio estoque"
ON public.estoque FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio estoque"
ON public.estoque FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio estoque"
ON public.estoque FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - APLICACOES_SAUDE
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - MORTALIDADE
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - CLIENTES
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - VENDAS
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - COMPRAS
-- =============================================
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

-- =============================================
-- POLÍTICAS RLS - SUBSCRIPTIONS
-- =============================================
CREATE POLICY "Usuários podem ver sua própria subscrição"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir sua própria subscrição"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria subscrição"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - AUDIT_LOGS
-- =============================================
CREATE POLICY "Usuários podem ver seus próprios logs de auditoria"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios logs de auditoria"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - USER_PREFERENCES
-- =============================================
CREATE POLICY "Usuários podem ver suas próprias preferências"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias preferências"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias preferências"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - TIPS (PÚBLICAS PARA TODOS)
-- =============================================
CREATE POLICY "Todos podem ver as dicas ativas"
ON public.tips FOR SELECT
USING (active = TRUE);

-- =============================================
-- POLÍTICAS RLS - TIP_FEEDBACK
-- =============================================
CREATE POLICY "Usuários podem ver seu próprio feedback de dicas"
ON public.tip_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio feedback de dicas"
ON public.tip_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DADOS INICIAIS: TIPS (DICAS)
-- =============================================
INSERT INTO public.tips (id, title, description, category, priority) VALUES
('tip-001', 'Registre compras de ração', 'Manter compras atualizadas ajuda no controle de custos e estoque.', 'compras', 1),
('tip-002', 'Mantenha cadastro de fornecedores', 'Dados completos facilitam negociações e reposição rápida.', 'fornecedores', 2),
('tip-003', 'Atualize dados dos clientes', 'Contato e CPF/CNPJ corretos agilizam vendas e faturamento.', 'clientes', 2),
('tip-004', 'Ajuste proteína conforme fase das aves', 'Evita desperdício e melhora desempenho na postura.', 'manejo', 3),
('tip-005', 'Monitore clima para conforto térmico', 'Ventilação e sombra reduzem estresse e mortalidade.', 'clima', 3),
('tip-006', 'Explore o banco de conhecimento', 'Dicas práticas sobre manejo, saúde, alimentação e vendas.', 'geral', 1),
('tip-007', 'Registre todas as visitas veterinárias', 'Mantenha o histórico de saúde das aves em dia.', 'saude', 2),
('tip-008', 'Controle diário de mortalidade', 'Essencial para identificar problemas de saúde cedo.', 'saude', 1),
('tip-009', 'Atualize estoque regularmente', 'Evita surpresas e mantém o funcionamento da granja.', 'estoque', 1),
('tip-010', 'Faça backups periódicos', 'Garanta a segurança dos seus dados importantes.', 'sistema', 1)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FIM DO SCHEMA COMPLETO
-- =============================================
