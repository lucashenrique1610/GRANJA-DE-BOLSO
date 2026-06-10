
# Relatório de Análise Supabase

## 1. Conectividade
- **Status**: ✅ Conectado
- **Ambiente**: Produção/Teste (URL: https://ftcwktgdedxjsalysdis.supabase.co)
- **Latência**:
  - Auth: ~2ms
  - Database: ~100-200ms

## 2. Estrutura do Banco de Dados
### Tabelas Encontradas (Sincronizadas)
- `profiles`: Perfis de usuários.
- `subscriptions`: Assinaturas Stripe.
- `backups`: Backups criptografados.
- `clientes`: Cadastro de clientes.

### Tabelas Não Encontradas (Apenas LocalStorage)
As seguintes tabelas parecem existir apenas no navegador (LocalStorage) e não estão sincronizadas com o Supabase atualmente:
- `lotes`
- `manejo`
- `estoque`
- `vendas`
- `compras`
- `fornecedores`
- `mortalidade`
- `saude`

## 3. Análise de Segurança (RLS)
- **`profiles`**: ✅ Seguro (RLS Ativo). Apenas leitura pública, edição pelo proprietário.
- **`backups`**: ✅ Seguro (RLS Ativo). Acesso restrito ao proprietário.
- **`subscriptions`**: ✅ Seguro (RLS Ativo). Leitura pelo proprietário.
- **`clientes`**: ⚠️ **CRÍTICO**. Estava publicamente acessível (Anon role via todos os registros).
  - **Correção**: Criada migração `004_secure_clientes.sql` para ativar RLS e restringir acesso via `user_id`.

## 4. Problemas de Código Identificados
1. **Inconsistência de Dados em Clientes**:
   - `DataService.ts` envia `cpfCnpj` (camelCase).
   - API Route (`/api/clientes`) espera `cpf_cnpj` (snake_case).
   - **Consequência**: O campo CPF/CNPJ pode não estar sendo salvo corretamente ou gerando erros de validação.
   - **Ação Recomendada**: Ajustar `DataService.ts` para mapear os campos corretamente antes do envio.

## 5. Recomendações
1. Aplicar a migração `004_secure_clientes.sql` no painel do Supabase (SQL Editor).
2. Considerar migrar as tabelas locais (`lotes`, `manejo`, etc.) para o Supabase se o objetivo for persistência em nuvem multi-dispositivo.
