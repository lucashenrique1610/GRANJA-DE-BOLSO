-- =============================================
-- GRANJA DE BOLSO - BANCO DE DADOS COMPLETO
-- =============================================
-- Este é o ÚNICO arquivo que você precisa executar no Supabase!
-- =============================================

-- 1. Limpeza (DROP) de tabelas antigas para evitar conflitos
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS manejo_diario CASCADE;
DROP TABLE IF EXISTS visitas_veterinarias CASCADE;
DROP TABLE IF EXISTS aplicacoes_saude CASCADE;
DROP TABLE IF EXISTS mortalidade CASCADE;
DROP TABLE IF EXISTS estoque CASCADE;
DROP TABLE IF EXISTS lotes CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS fornecedores CASCADE;
DROP TABLE IF EXISTS tip_feedbacks CASCADE;
DROP TABLE IF EXISTS tip_preferences CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS pix_transactions CASCADE;
DROP TABLE IF EXISTS backups CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Função Auxiliar para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$ LANGUAGE 'plpgsql';

-- =============================================
-- 4. CRIAÇÃO DAS TABELAS (ORDENADA)
-- =============================================

-- TABLE: clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    endereco TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    tipo TEXT CHECK (tipo IN ('fisico', 'juridico')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own clientes" ON clientes FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_clientes_modtime BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: fornecedores
CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    telefone TEXT,
    endereco TEXT,
    produtos TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fornecedores" ON fornecedores FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_fornecedores_modtime BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: lotes
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    fornecedor TEXT,
    data_compra DATE,
    valor_lote NUMERIC(10,2) DEFAULT 0,
    valor_ave NUMERIC(10,2) DEFAULT 0,
    tipo TEXT,
    raca TEXT,
    femeas INTEGER DEFAULT 0,
    machos INTEGER DEFAULT 0,
    nome TEXT,
    localizacao TEXT,
    finalidade TEXT,
    observacoes TEXT,
    documentos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own lotes" ON lotes FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_lotes_modtime BEFORE UPDATE ON lotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: visitas_veterinarias
CREATE TABLE visitas_veterinarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo_procedimento TEXT,
    veterinario TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visitas_veterinarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own visitas" ON visitas_veterinarias FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_visitas_modtime BEFORE UPDATE ON visitas_veterinarias FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: manejo_diario
CREATE TABLE manejo_diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    periodo TEXT NOT NULL CHECK (periodo IN ('manha', 'tarde')),
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    status TEXT,
    ovos INTEGER DEFAULT 0,
    ovos_danificados INTEGER DEFAULT 0,
    racao NUMERIC(10,2) DEFAULT 0,
    agua NUMERIC(10,2) DEFAULT 0,
    porta TEXT,
    outros TEXT,
    peso_ovos NUMERIC(10,2) DEFAULT 0,
    classificacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data, periodo, lote_id)
);

ALTER TABLE manejo_diario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own manejo" ON manejo_diario FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_manejo_modtime BEFORE UPDATE ON manejo_diario FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: estoque
CREATE TABLE estoque (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ovos INTEGER DEFAULT 0,
    galinhas_vivas INTEGER DEFAULT 0,
    galinhas_limpas INTEGER DEFAULT 0,
    cama_aves NUMERIC(10,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own estoque" ON estoque FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_estoque_modtime BEFORE UPDATE ON estoque FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: aplicacoes_saude
CREATE TABLE aplicacoes_saude (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    data DATE NOT NULL,
    fase TEXT,
    tipo TEXT,
    nome TEXT,
    veterinario TEXT,
    quantidade NUMERIC(10,2) DEFAULT 0,
    observacoes TEXT,
    proxima_dose TEXT,
    data_proxima DATE,
    formulacao_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE aplicacoes_saude ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saude" ON aplicacoes_saude FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_saude_modtime BEFORE UPDATE ON aplicacoes_saude FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: mortalidade
CREATE TABLE mortalidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    data DATE NOT NULL,
    quantidade INTEGER DEFAULT 0,
    causa TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mortalidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own mortalidade" ON mortalidade FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_mortalidade_modtime BEFORE UPDATE ON mortalidade FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: compras
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
    fornecedor_nome TEXT,
    tipo TEXT,
    quantidade NUMERIC(10,2) DEFAULT 0,
    valor NUMERIC(10,2) DEFAULT 0,
    descricao TEXT,
    categoria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own compras" ON compras FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_compras_modtime BEFORE UPDATE ON compras FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: vendas
CREATE TABLE vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome TEXT,
    produto TEXT,
    quantidade NUMERIC(10,2) DEFAULT 0,
    pagamento TEXT,
    valor NUMERIC(10,2) DEFAULT 0,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vendas" ON vendas FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_vendas_modtime BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: tip_feedbacks
CREATE TABLE tip_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT,
    ts BIGINT,
    path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tip_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tip_feedbacks" ON tip_feedbacks FOR ALL USING (auth.uid() = user_id);

-- TABLE: tip_preferences
CREATE TABLE tip_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    dismissed TEXT[],
    irrelevant TEXT[],
    last_shown JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tip_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tip_preferences" ON tip_preferences FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_tip_prefs_modtime BEFORE UPDATE ON tip_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT,
    entity TEXT,
    entity_id TEXT,
    details TEXT,
    user_metadata TEXT
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own audit_logs" ON audit_logs FOR ALL USING (auth.uid() = user_id);

-- TABLE: profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    nome TEXT,
    telefone TEXT,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: subscriptions
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
    price_id TEXT,
    quantity INTEGER,
    cancel_at_period_end BOOLEAN,
    created TIMESTAMPTZ DEFAULT NOW(),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subscription" ON subscriptions FOR ALL USING (user_id = auth.uid()::TEXT);

-- TABLE: pix_transactions
CREATE TABLE pix_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mercadopago_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    qr_code TEXT,
    qr_code_base64 TEXT,
    ticket_url TEXT,
    plan_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pix transactions" ON pix_transactions FOR ALL USING (user_id = auth.uid()::TEXT);
CREATE TRIGGER update_pix_modtime BEFORE UPDATE ON pix_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLE: backups
CREATE TABLE backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    data TEXT NOT NULL,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL,
    size INTEGER,
    version TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS backups_user_id_idx ON backups(user_id);

ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own backups" ON backups FOR ALL USING (user_id = auth.uid());

-- =============================================
-- 5. ÍNDICES DE PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id ON fornecedores(user_id);
CREATE INDEX IF NOT EXISTS idx_lotes_user_id ON lotes(user_id);
CREATE INDEX IF NOT EXISTS idx_visitas_user_id ON visitas_veterinarias(user_id);
CREATE INDEX IF NOT EXISTS idx_manejo_user_id ON manejo_diario(user_id);
CREATE INDEX IF NOT EXISTS idx_estoque_user_id ON estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_saude_user_id ON aplicacoes_saude(user_id);
CREATE INDEX IF NOT EXISTS idx_mortalidade_user_id ON mortalidade(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_user_id ON compras(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_tip_feedbacks_user_id ON tip_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_tip_preferences_user_id ON tip_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- =============================================
-- FIM DO SCRIPT!
-- =============================================
