-- 007_advanced_policies.sql
-- Script Abrangente de Políticas de Segurança, Integridade e Performance
-- Desenvolvido para Supabase/PostgreSQL

-- ==============================================================================
-- 1. POLÍTICAS DE SEGURANÇA E CONTROLE DE ACESSO
-- ==============================================================================

-- 1.1. Revogar permissões públicas padrão para garantir "Secure by Default"
-- Revoga permissão de criar tabelas no schema public para usuários anonimos/autenticados
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;

-- 1.2. Reforçar RLS (Row Level Security)
-- Garante que todas as tabelas futuras tenham RLS habilitado por padrão
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- (As tabelas já existentes foram configuradas no script 006, mas reforçamos aqui a segurança de funções)
-- Funções de segurança devem ser SECURITY DEFINER para rodar com permissões do dono, mas com search_path seguro
ALTER FUNCTION update_updated_at_column() SET search_path = public;

-- ==============================================================================
-- 2. POLÍTICAS DE INTEGRIDADE DE DADOS (DATA INTEGRITY)
-- ==============================================================================

-- 2.1. Adicionar Constraints de Validação (CHECK Constraints)
-- Garante que dados numéricos lógicos não sejam negativos

-- Tabela Lotes
ALTER TABLE lotes ADD CONSTRAINT check_lotes_quantidade_positiva CHECK (quantidade >= 0);
ALTER TABLE lotes ADD CONSTRAINT check_lotes_valores_positivos CHECK (valor_lote >= 0 AND valor_ave >= 0);
ALTER TABLE lotes ADD CONSTRAINT check_lotes_contagem_aves CHECK (femeas + machos <= quantidade); -- A soma não pode exceder o total (pode ser menor se houver não sexados)

-- Tabela Estoque
ALTER TABLE estoque ADD CONSTRAINT check_estoque_ovos_positivos CHECK (ovos >= 0);
ALTER TABLE estoque ADD CONSTRAINT check_estoque_aves_positivas CHECK (galinhas_vivas >= 0 AND galinhas_limpas >= 0);

-- Tabela Compras
ALTER TABLE compras ADD CONSTRAINT check_compras_qtd_valor CHECK (quantidade >= 0 AND valor >= 0);

-- Tabela Vendas
ALTER TABLE vendas ADD CONSTRAINT check_vendas_qtd_valor CHECK (quantidade >= 0 AND valor >= 0);

-- Tabela Manejo Diario
ALTER TABLE manejo_diario ADD CONSTRAINT check_manejo_ovos CHECK (ovos >= 0 AND ovos_danificados >= 0);
ALTER TABLE manejo_diario ADD CONSTRAINT check_manejo_insumos CHECK (racao >= 0 AND agua >= 0);

-- ==============================================================================
-- 3. POLÍTICAS DE PERFORMANCE (INDEXING & TUNING)
-- ==============================================================================

-- 3.1. Índices para Consultas de Intervalo de Data (Range Queries)
-- Muito comum em dashboards (ex: "vendas do mês")
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data);
CREATE INDEX IF NOT EXISTS idx_compras_data ON compras(data);
CREATE INDEX IF NOT EXISTS idx_manejo_data ON manejo_diario(data);
CREATE INDEX IF NOT EXISTS idx_mortalidade_data ON mortalidade(data);
CREATE INDEX IF NOT EXISTS idx_visitas_data ON visitas_veterinarias(data);

-- 3.2. Índices para Chaves Estrangeiras (Foreign Keys)
-- Melhora performance de JOINs e evita table scans em deletes em cascata
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_lote_id ON vendas(lote_id);
CREATE INDEX IF NOT EXISTS idx_compras_fornecedor_id ON compras(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_manejo_lote_id ON manejo_diario(lote_id);
CREATE INDEX IF NOT EXISTS idx_mortalidade_lote_id ON mortalidade(lote_id);

-- 3.3. Configuração de Manutenção Automática (Autovacuum Tuning)
-- Ajuste para tabelas de alto volume de inserção/atualização (Ex: audit_logs, manejo_diario)
-- Reduz o threshold para acionar o vacuum mais frequentemente e evitar inchaço
ALTER TABLE audit_logs SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE manejo_diario SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- ==============================================================================
-- 4. POLÍTICAS DE MONITORAMENTO
-- ==============================================================================

-- 4.1. Habilitar extensão de estatísticas (se disponível/permissão concedida)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 4.2. Views de Monitoramento para Administradores
-- View para identificar queries lentas (requer pg_stat_statements)
CREATE OR REPLACE VIEW admin_slow_queries AS
SELECT 
    query, 
    calls, 
    total_exec_time / calls as avg_time_ms, 
    rows / calls as avg_rows 
FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 20;

-- View para monitorar tamanho das tabelas e necessidade de vacuum
CREATE OR REPLACE VIEW admin_table_stats AS
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- ==============================================================================
-- 5. POLÍTICAS DE CONEXÃO DO APLICATIVO
-- ==============================================================================

-- 5.1. Timeouts de Sessão para Segurança
-- Evita que queries mal otimizadas travem o banco de dados por muito tempo
-- Aplica-se apenas ao role 'authenticated' (usuários do app)
ALTER ROLE authenticated SET statement_timeout = '15s'; -- 15 segundos máximo por query
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '60s'; -- Desconecta transações ociosas

-- Nota: Configurações de Pool (pool_size) e SSL são gerenciadas no nível do Transaction Pooler (Supavisor) 
-- nas configurações do painel do Supabase, não via SQL direto.
