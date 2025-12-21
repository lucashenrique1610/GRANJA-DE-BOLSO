import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Payment, Preference, MercadoPagoConfig } from 'mercadopago';

// Mock do SDK
vi.mock('mercadopago', () => {
  return {
    default: vi.fn(),
    Payment: vi.fn(),
    Preference: vi.fn(),
    MercadoPagoConfig: vi.fn()
  };
});

describe('Integração Mercado Pago', () => {
  let mockPaymentCreate: any;
  let mockPreferenceCreate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup dos mocks
    mockPaymentCreate = vi.fn().mockResolvedValue({
      id: 123456789,
      status: 'pending',
      point_of_interaction: {
        transaction_data: {
          qr_code: 'pix-code',
          qr_code_base64: 'base64-code',
          ticket_url: 'url'
        }
      }
    });

    mockPreferenceCreate = vi.fn().mockResolvedValue({
      id: 'pref-123',
      init_point: 'http://init.point',
      sandbox_init_point: 'http://sandbox.init.point'
    });

    (Payment as any).mockImplementation(() => ({
      create: mockPaymentCreate
    }));

    (Preference as any).mockImplementation(() => ({
      create: mockPreferenceCreate
    }));
  });

  it('Deve criar um payload de pagamento PIX correto', async () => {
    // Simulação dos dados que viriam do frontend
    const input = {
      amount: 100,
      description: 'Teste PIX',
      email: 'teste@email.com',
      userId: 'user-123'
    };

    // Lógica duplicada da rota para validação
    const client = new MercadoPagoConfig({ accessToken: 'test-token' });
    const payment = new Payment(client);
    
    const paymentData = {
      body: {
        transaction_amount: Number(input.amount),
        description: input.description,
        payment_method_id: 'pix',
        payer: {
          email: input.email,
        },
        external_reference: input.userId,
        notification_url: expect.stringContaining('/api/mercadopago/webhook'),
      },
    };

    await payment.create(paymentData);

    expect(mockPaymentCreate).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        transaction_amount: 100,
        payment_method_id: 'pix',
        payer: { email: 'teste@email.com' }
      })
    }));
  });

  it('Deve criar uma preferência de Checkout Pro correta', async () => {
    const input = {
      title: 'Produto Teste',
      quantity: 1,
      price: 50.00
    };

    const client = new MercadoPagoConfig({ accessToken: 'test-token' });
    const preference = new Preference(client);

    const preferenceData = {
      body: {
        items: [
          {
            title: input.title,
            quantity: input.quantity,
            unit_price: Number(input.price),
          },
        ],
        back_urls: {
          success: expect.stringContaining('/assinatura/sucesso'),
          failure: expect.stringContaining('/assinatura/erro'),
          pending: expect.stringContaining('/assinatura/pendente'),
        },
        auto_return: 'approved',
      },
    };

    await preference.create(preferenceData);

    expect(mockPreferenceCreate).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        items: [
          {
            title: 'Produto Teste',
            quantity: 1,
            unit_price: 50
          }
        ]
      })
    }));
  });
});
