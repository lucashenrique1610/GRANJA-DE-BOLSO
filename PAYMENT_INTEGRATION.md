# Guia de Integração de Pagamentos

Este sistema suporta pagamentos via **PIX (Mercado Pago)** e **Cartão de Crédito (Stripe)**.

## 1. Mercado Pago (PIX)

A integração já está configurada.

### Configuração
As credenciais devem estar no arquivo `.env.local` (ou Variáveis de Ambiente na Vercel).
- `MERCADOPAGO_ACCESS_TOKEN`: Token de produção ou sandbox.

### Webhook
A URL de notificação é configurada automaticamente:
- Local: Desabilitado (para evitar erros)
- Produção: `https://seu-dominio.com/api/mercadopago/webhook`

O Webhook processa pagamentos aprovados e libera o acesso automaticamente.

---

## 2. Stripe (Cartões)

### Passos para Configuração

1. **Crie uma conta no Stripe:** [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Obtenha as Chaves de API:**
   - Vá em "Developers" -> "API keys".
   - Copie a `Secret key` (começa com `sk_test_` ou `sk_live_`).
   - Adicione ao `.env.local` como `STRIPE_SECRET_KEY`.

3. **Configure o Produto (`prod_Th0dV7HbKuVTGi`):**
   - No Dashboard do Stripe, localize o produto com ID **`prod_Th0dV7HbKuVTGi`**.
   - Dentro deste produto, adicione 3 Preços (Prices) recorrentes:
     - **Mensal** (ex: R$ 29,90 / mês)
     - **Trimestral** (ex: R$ 79,90 / 3 meses)
     - **Semestral** (ex: R$ 149,90 / 6 meses)
   - Copie o **API ID** de cada preço (começa com `price_...`).
   - Cole no arquivo `.env.local`:
     ```env
     # ...
     STRIPE_PRICE_ID_MENSAL=price_CopiadoDoMensal
     STRIPE_PRICE_ID_TRIMESTRAL=price_CopiadoDoTrimestral
     STRIPE_PRICE_ID_SEMESTRAL=price_CopiadoDoSemestral
     ```

4. **Configure o Webhook:**
   - Vá em "Developers" -> "Webhooks" -> "Add endpoint".
   - URL do Endpoint: `https://seu-dominio.com/api/stripe/webhook`
   - Eventos para ouvir:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copie o `Signing secret` (começa com `whsec_...`).
   - Adicione ao `.env.local` como `STRIPE_WEBHOOK_SECRET`.

### Testando
Execute o script de verificação para garantir que tudo está conectado:
```bash
node scripts/verify-stripe.js
```

---

## 3. Painel Administrativo

Acesse `/admin/assinaturas` para visualizar assinaturas.
- O painel lista assinaturas do banco de dados.
- Permite confirmar manualmente assinaturas se necessário.

## 4. Segurança

- **PCI Compliance:** O sistema utiliza o Checkout do Stripe e do Mercado Pago, garantindo que nenhum dado de cartão passe pelos servidores da aplicação.
- **Validação de Webhooks:** Todos os webhooks verificam assinaturas criptográficas (Stripe Signature) ou tokens para garantir autenticidade.
