
-- =============================================================================
-- SCRIPT DE AUDITORIA DE USUÁRIOS E DADOS (SEGURO)
-- =============================================================================
-- Este script foi desenhado para ser rodado no SQL Editor do Supabase.
-- Ele permite inspecionar dados de usuários sem expor credenciais (senhas).
-- =============================================================================

-- 1. BUSCAR USUÁRIO POR EMAIL
-- Substitua 'email@alvo.com' pelo email desejado
SELECT 
    id as user_id,
    email,
    raw_user_meta_data as metadados,
    created_at as data_cadastro,
    last_sign_in_at as ultimo_login,
    banned_until as banido_ate
FROM auth.users
WHERE email = 'email@alvo.com'; -- <--- EDITE AQUI

-- 2. BUSCAR USUÁRIO POR ID (UUID)
-- Útil quando você tem apenas o ID dos logs
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000000'; -- <--- EDITE AQUI

-- 3. RELATÓRIO DE VOLUME DE DADOS (TOP 10 USUÁRIOS)
-- Identifica heavy users ou possíveis abusos
SELECT 
    u.email,
    count(distinct l.id) as qtd_lotes,
    count(distinct c.id) as qtd_clientes,
    count(distinct v.id) as qtd_vendas,
    count(distinct s.id) as assinaturas
FROM auth.users u
LEFT JOIN public.lotes l ON u.id = l.user_id
LEFT JOIN public.clientes c ON u.id = c.user_id
LEFT JOIN public.vendas v ON u.id = v.user_id
LEFT JOIN public.subscriptions s ON u.id::text = s.user_id -- Note o cast para text se necessário
GROUP BY u.email
ORDER BY qtd_lotes DESC
LIMIT 10;

-- 4. VERIFICAR INTEGRIDADE DE ASSINATURA (CRÍTICO)
-- Verifica se o status no banco bate com o esperado para um usuário
SELECT 
    u.email,
    s.id as subscription_id,
    s.status,
    s.current_period_end,
    s.plan_id
FROM auth.users u
JOIN public.subscriptions s ON u.id::text = s.user_id
WHERE u.email = 'email@alvo.com'; -- <--- EDITE AQUI

-- 5. AUDITORIA DE SEGURANÇA (ADMIN)
-- Lista usuários que não confirmaram email mas têm dados (Potencial conta fake)
SELECT u.email, u.created_at
FROM auth.users u
JOIN public.lotes l ON u.id = l.user_id
WHERE u.email_confirmed_at IS NULL;
