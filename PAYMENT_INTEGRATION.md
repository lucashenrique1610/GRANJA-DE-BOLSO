# Guia de Integração de Pagamentos

Este sistema utiliza exclusivamente o **Mercado Pago** para processamento de pagamentos (PIX e Cartões).

## 1. Mercado Pago

A integração suporta:
- **PIX:** Pagamento instantâneo com liberação imediata.
- **Cartão de Crédito/Boleto:** Via Checkout Pro do Mercado Pago.

### Configuração
As credenciais devem estar no arquivo `.env.local` (ou Variáveis de Ambiente na Vercel).
- `MERCADOPAGO_ACCESS_TOKEN`: Token de produção ou sandbox (obrigatório).

### Webhook
A URL de notificação deve ser configurada no painel do Mercado Pago:
- URL: `https://seu-dominio.com/api/mercadopago/webhook`
- Eventos: `payment`

O Webhook processa pagamentos aprovados e libera o acesso automaticamente.

## 2. Painel Administrativo

Acesse `/admin/assinaturas` para visualizar assinaturas.
- O painel lista assinaturas do banco de dados.
- Permite confirmar manualmente assinaturas se necessário.

## 3. Segurança

- **PCI Compliance:** O sistema utiliza o Checkout do Mercado Pago, garantindo que nenhum dado de cartão passe pelos servidores da aplicação.
- **Validação de Webhooks:** O sistema valida a origem das notificações do Mercado Pago.
