# Arquitetura de Segurança e Isolamento de Dados

Este documento descreve a implementação do sistema de isolamento de dados por conta (Multi-Tenancy) no Granja Bolso 2, garantindo que usuários só acessem seus próprios dados.

## 1. Visão Geral

A arquitetura de segurança é baseada em "Defense in Depth" (Defesa em Profundidade), combinando:
1.  **Row Level Security (RLS)** no Banco de Dados (PostgreSQL/Supabase).
2.  **Verificação de Aplicação (Middleware)** nas rotas de API Next.js.
3.  **Auditoria Automática** de tentativas de acesso não autorizado.

## 2. Camada de Banco de Dados (Supabase/PostgreSQL)

### Row Level Security (RLS)
Todas as tabelas contendo dados de usuários (ex: `lotes`, `clientes`, `financeiro`) possuem RLS habilitado.
As políticas garantem que um usuário só pode ver/editar linhas onde `user_id` corresponde ao seu ID de autenticação (`auth.uid()`).

Exemplo de política:
```sql
create policy "Users can manage their own lotes" on lotes
  for all using (auth.uid() = user_id);
```

### Índices de Performance
Para garantir que o isolamento não degrade a performance, foram criados índices na coluna `user_id` em todas as tabelas críticas. Isso otimiza os filtros aplicados automaticamente pelo RLS.

## 3. Camada de Aplicação (API Next.js)

### Middleware de Segurança (`lib/security.ts`)
Foi criado um módulo centralizado para validação de acesso:

- **`verifyResourceAccess(req, table, resourceId)`**:
    - Autentica o usuário via token JWT.
    - Verifica se o recurso existe no banco (bypass RLS para distinção de erro).
    - Compara `resource.user_id` com `authenticated_user.id`.
    - Se houver divergência (tentativa de acesso a dados de outro), retorna status `forbidden` e registra log.
    - Se não existir, retorna `not_found`.

### Padrão de Implementação em Rotas
Todas as rotas de API (`app/api/*`) devem seguir este padrão:

```typescript
// Exemplo em route.ts
export async function PUT(req, { params }) {
  // 1. Verificar Isolamento
  const access = await verifyResourceAccess(req, "tabela", params.id)
  if (access.status !== "granted") return handleAccessError(access)

  // 2. Executar Operação
  // Seguro: usuário autenticado e dono do recurso confirmado
  await supabaseAdmin.from("tabela").update(...).eq("id", params.id)
}
```

## 4. Auditoria e Monitoramento

Tentativas de violação de isolamento (ex: um usuário tentando acessar ID de outro) são registradas automaticamente na tabela `audit_logs` com a ação `security_violation`.

Campos registrados:
- `user_id`: Quem tentou acessar.
- `entity`: Tabela alvo.
- `entity_id`: ID do recurso alvo.
- `details`: Descrição do evento.
- `user_metadata`: IP e outros metadados.

## 5. Testes

Os testes de isolamento estão localizados em `__tests__/data-isolation.test.ts` e validam:
- Acesso permitido ao próprio recurso.
- Acesso negado (403) a recurso de terceiro.
- Registro correto de logs de auditoria.
- Tratamento de recurso inexistente (404).
