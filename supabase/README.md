# Configuração do Banco de Dados no Supabase

## Passos para Aplicar as Migrações

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione o seu projeto
3. Vá para a seção **SQL Editor** (Editor SQL)
4. Clique em **New query** (Nova consulta)
5. Copie o conteúdo do arquivo `001_create_tables.sql` e cole no editor
6. Clique em **Run** (Executar) para aplicar a migração

## Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil dos usuários |
| `lotes` | Lotes de animais |
| `fornecedores` | Fornecedores |
| `visitas_veterinarias` | Visitas veterinárias |
| `manejo_diario` | Manejo diário (manhã e tarde) |
| `estoque` | Estoque do sistema |
| `aplicacoes_saude` | Aplicações de saúde (vacinas, etc.) |
| `mortalidade` | Registros de mortalidade |
| `clientes` | Clientes |
| `vendas` | Vendas |
| `compras` | Compras |
| `subscriptions` | Subscrições dos usuários |

## Políticas de Segurança (RLS)

Todas as tabelas têm políticas de Row Level Security (RLS) habilitadas, garantindo que cada usuário só tenha acesso aos seus próprios dados.

## Triggers Automáticos

1. **Criação de perfil**: Quando um usuário se cadastra, um perfil é criado automaticamente
2. **Criação de estoque**: Quando um perfil é criado, um registro de estoque padrão é criado automaticamente
