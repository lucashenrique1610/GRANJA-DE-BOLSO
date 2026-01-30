
# Guia Técnico de Segurança e Auditoria: Supabase & Dados de Usuários

Este guia define os protocolos e procedimentos para consultar, auditar e gerenciar dados de usuários no Supabase de forma segura, respeitando as políticas de isolamento (RLS) e a privacidade dos dados.

## 1. Acesso ao Dashboard e Tabela de Usuários

A tabela `auth.users` é uma tabela de sistema protegida e não reside no schema `public`. Ela contém credenciais e metadados sensíveis.

### Passos para Navegação Segura:
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2. Selecione o projeto `SISTEMA GRANJA BOLSO 2`.
3. No menu lateral, clique em **Authentication** -> **Users**.
   - **Visualização:** Aqui você vê lista básica (Email, Phone, Created At, Last Sign In, User UID).
   - **Ação:** Use esta tela para bloquear, desbloquear ou enviar e-mails de recuperação. Não use para consultar dados de negócio (lotes, vendas).
4. Para dados brutos, vá em **Table Editor** -> Schema `auth` -> Tabela `users`.
   - **Nota:** O acesso direto a esta tabela deve ser restrito a Administradores do Projeto.

## 2. Métodos de Filtragem e Busca

### Pelo Dashboard (Interface Gráfica)
- Use a barra de busca no topo da lista de usuários em **Authentication** para filtrar por:
  - Email
  - Nome (se estiver nos metadados)
  - UID

### Via SQL Editor (Recomendado para Auditoria)
Para correlações complexas (ex: "Usuários com assinaturas ativas"), use o SQL Editor.
Nunca execute `SELECT * FROM auth.users` sem um `LIMIT` em produção.

## 3. Implementação de Row Level Security (RLS)

O RLS é a camada de defesa primária. Ele garante que, mesmo que o cliente frontend seja comprometido, ele só possa acessar seus próprios dados.

### Padrão de Isolamento Adotado
No nosso projeto, todas as tabelas sensíveis (`lotes`, `clientes`, `subscriptions`, etc.) devem ter RLS habilitado com a seguinte política padrão:

```sql
-- Exemplo de Política de Isolamento Estrita
ALTER TABLE public.sua_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolamento por Usuário"
ON public.sua_tabela
FOR ALL
TO authenticated
USING ( user_id = auth.uid() )
WITH CHECK ( user_id = auth.uid() );
```

### Explicação:
- `FOR ALL`: Cobre SELECT, INSERT, UPDATE, DELETE.
- `TO authenticated`: Apenas usuários logados.
- `USING`: Filtra quais linhas o usuário pode **ver/alterar**.
- `WITH CHECK`: Garante que o usuário não possa **criar** ou **atualizar** um registro para outro `user_id`.

## 4. Queries SQL Seguras (Exemplos)

Utilize o arquivo `supabase/queries/secure_user_audit.sql` para consultas prontas.

### Buscar Usuário por Email (Sem expor hash de senha)
```sql
SELECT id, email, raw_user_meta_data, last_sign_in_at
FROM auth.users
WHERE email = 'usuario@exemplo.com';
```

### Auditar Dados de um Usuário (Cross-Schema)
```sql
-- Variável para evitar erro de digitação do UUID
\set target_user_id 'uuid-do-usuario-aqui'

SELECT 'Lotes' as tabela, count(*) as qtd FROM public.lotes WHERE user_id = :'target_user_id'
UNION ALL
SELECT 'Clientes', count(*) FROM public.clientes WHERE user_id = :'target_user_id';
```

## 5. Permissões e Roles no PostgreSQL

O Supabase gerencia roles automaticamente, mas você deve entender:

- **`anon`**: Usuário não logado. Deve ter acesso MÍNIMO (apenas leitura em tabelas públicas, se houver).
- **`authenticated`**: Usuário logado. Acesso restrito via RLS.
- **`service_role`**: Superusuário da API. **Ignora RLS**.
  - **PERIGO:** Nunca use a chave `SUPABASE_SERVICE_ROLE_KEY` no frontend (React/Next.js).
  - **USO:** Apenas em Edge Functions ou API Routes seguras (`/app/api/...`) no backend.

**Configuração Recomendada:**
Revogue permissões excessivas do role `anon` se não forem necessárias:
```sql
REVOKE ALL ON public.lotes FROM anon;
```

## 6. Auditoria e Logs

### Logs do Supabase
- Vá em **Database** -> **Logs** no Dashboard.
- Monitore erros de `PGRST` (PostgREST) que indicam tentativas de acesso bloqueado (403 Forbidden).

### Logs de Aplicação
Implementamos logs detalhados em `lib/auth-helper.ts` e nas API Routes.
- **Sucesso:** `[Auth] User authenticated: uuid...`
- **Falha:** `[AuthHelper] Falha ao verificar token...`

## 7. Testes de Segurança

Antes de qualquer deploy, execute o script de teste de segurança automatizado:

```bash
npm run test:security
# ou
npx vitest __tests__/crud-operations.test.ts
```

Este teste valida explicitamente:
1. Se um usuário consegue ler dados de outro (Deve falhar/retornar vazio).
2. Se um usuário consegue editar dados de outro (Deve falhar).

## 8. Procedimentos de Transição e "Impersonation"

Se precisar "ver o que o usuário vê" para suporte:

**NUNCA** peça a senha do usuário.

**Procedimento Seguro (Via Banco de Dados):**
1. Use o SQL Editor para consultar os dados filtrando pelo ID do usuário.
2. Não altere dados diretamente via Dashboard a menos que seja uma correção crítica de bug.

**Procedimento Seguro (Via App - Impersonation):**
*Atualmente não implementado na interface para segurança.*
Se necessário, um Admin deve usar a API Route `/api/admin/inspect?userId=...` (protegida por chave de serviço) que retorna um JSON com os dados, sem logar como o usuário.

---
**Documento mantido por:** Equipe de Desenvolvimento
**Revisão:** 30/01/2026
