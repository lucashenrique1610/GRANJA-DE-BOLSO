-- Script para Inspecionar Dados por Usuário (Conta)
-- Copie e cole este código no SQL Editor do Supabase

-- 1. Listar todos os usuários cadastrados e seus IDs
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users
ORDER BY created_at DESC;

-- 2. Relatório Geral: Quantidade de dados por usuário
-- Mostra quantos lotes, clientes e vendas cada usuário possui
SELECT 
    u.email,
    count(distinct l.id) as total_lotes,
    count(distinct c.id) as total_clientes,
    count(distinct v.id) as total_vendas
FROM auth.users u
LEFT JOIN lotes l ON u.id = l.user_id
LEFT JOIN clientes c ON u.id = c.user_id
LEFT JOIN vendas v ON u.id = v.user_id
GROUP BY u.email;

-- 3. Ver Lotes de um usuário específico (Substitua o email abaixo)
SELECT 
    u.email,
    l.nome as nome_lote,
    l.quantidade,
    l.finalidade,
    l.tipo
FROM lotes l
JOIN auth.users u ON l.user_id = u.id
WHERE u.email = 'usuario@exemplo.com'; -- <--- Coloque o email do usuário aqui

-- 4. Ver Vendas de um usuário específico
SELECT 
    u.email,
    v.data,
    v.produto,
    v.valor,
    c.nome as cliente_nome
FROM vendas v
JOIN auth.users u ON v.user_id = u.id
LEFT JOIN clientes c ON v.cliente_id = c.id
WHERE u.email = 'usuario@exemplo.com'; -- <--- Coloque o email do usuário aqui
