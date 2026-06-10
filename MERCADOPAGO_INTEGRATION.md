# Integração Mercado Pago - Granja Bolso

Este documento descreve a integração do Mercado Pago no sistema Granja Bolso, cobrindo pagamentos via PIX e Checkout Pro.

## Configuração

### Variáveis de Ambiente

Para que a integração funcione, as seguintes variáveis de ambiente devem estar configuradas no arquivo `.env.local`:

```env
# Token de acesso do Mercado Pago (Produção ou Teste)
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui

# URL do Webhook (para receber notificações de pagamento)
# Em desenvolvimento local, você pode usar ferramentas como ngrok
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Webhook

O sistema possui um endpoint de webhook em `/api/mercadopago/webhook`. Você deve configurar esta URL no painel do Mercado Pago para receber notificações de pagamentos (topics: `payment`).

O webhook é responsável por:
1. Receber a notificação de mudança de status do pagamento.
2. Verificar o status atual do pagamento na API do Mercado Pago.
3. Identificar o usuário através do campo `external_reference`.
4. Atualizar a tabela de assinaturas no Supabase.

## Fluxo de Pagamento

### PIX

1. O usuário seleciona o plano e escolhe "PIX".
2. O frontend chama `/api/mercadopago/pix`.
3. O backend cria um pagamento no Mercado Pago.
4. O QR Code e o código "Copia e Cola" são retornados.
5. O usuário vê a tela de confirmação com o QR Code.
6. Ao pagar, o Mercado Pago envia um webhook.
7. O backend processa o webhook e ativa a assinatura.

### Cartão / Checkout Pro

1. O usuário seleciona o plano e escolhe "Cartão de Crédito".
2. O frontend chama `/api/mercadopago/preference`.
3. O backend cria uma preferência de pagamento.
4. O frontend redireciona o usuário para o Checkout do Mercado Pago.
5. Após o pagamento, o usuário é redirecionado de volta (configurável em `back_urls`).
6. O webhook também processa a confirmação deste pagamento.

## Estrutura de Arquivos

- `lib/mercadopago.ts`: Inicialização do cliente Mercado Pago.
- `app/api/mercadopago/pix/route.ts`: Endpoint para criação de pagamento PIX.
- `app/api/mercadopago/preference/route.ts`: Endpoint para criação de preferência (Checkout Pro).
- `app/api/mercadopago/webhook/route.ts`: Endpoint para recebimento de notificações.
- `contexts/subscription-context.tsx`: Gerenciamento de estado da assinatura no frontend.
- `app/assinatura/pagamento/page.tsx`: Tela de exibição do QR Code PIX.

## Testes

Para testar em ambiente de desenvolvimento:
1. Use as credenciais de teste do Mercado Pago (Sandbox).
2. Utilize usuários de teste (um Vendedor e um Comprador) criados no painel do Mercado Pago.
3. Para testar webhooks localmente, utilize o `ngrok` para expor sua porta local e configure a URL no painel do Mercado Pago.
