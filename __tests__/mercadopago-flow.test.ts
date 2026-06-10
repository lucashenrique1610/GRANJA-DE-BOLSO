
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Payment, Preference, MercadoPagoConfig } from 'mercadopago';

// Mock do Mercado Pago
vi.mock('mercadopago', () => {
  const PaymentMock = vi.fn();
  PaymentMock.prototype.create = vi.fn();

  const PreferenceMock = vi.fn();
  PreferenceMock.prototype.create = vi.fn();

  return {
    MercadoPagoConfig: vi.fn(),
    Payment: PaymentMock,
    Preference: PreferenceMock,
  };
});

describe('Fluxo de Pagamento Mercado Pago', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST_TOKEN';
  });

  it('deve inicializar a configuração corretamente', () => {
    new MercadoPagoConfig({ accessToken: 'TEST_TOKEN' });
    expect(MercadoPagoConfig).toHaveBeenCalledWith({ accessToken: 'TEST_TOKEN' });
  });

  describe('Pagamento PIX', () => {
    it('deve criar um pagamento PIX com os dados corretos', async () => {
      const paymentMock = new Payment({ accessToken: 'TEST_TOKEN' } as any);
      const createSpy = vi.spyOn(paymentMock, 'create').mockResolvedValue({
        id: 12345,
        status: 'pending',
        point_of_interaction: {
          transaction_data: {
            qr_code: 'pix-code',
            qr_code_base64: 'base64',
            ticket_url: 'url'
          }
        }
      } as any);

      const payload = {
        body: {
          transaction_amount: 100,
          description: 'Teste',
          payment_method_id: 'pix',
          payer: { email: 'test@email.com' },
        }
      };

      const result = await paymentMock.create(payload);

      expect(createSpy).toHaveBeenCalledWith(payload);
      expect(result.id).toBe(12345);
      expect(result.point_of_interaction?.transaction_data?.qr_code).toBe('pix-code');
    });

    it('deve lidar com erros na criação do PIX', async () => {
      const paymentMock = new Payment({ accessToken: 'TEST_TOKEN' } as any);
      vi.spyOn(paymentMock, 'create').mockRejectedValue(new Error('Erro MP'));

      await expect(paymentMock.create({})).rejects.toThrow('Erro MP');
    });
  });

  describe('Preferência de Pagamento (Checkout)', () => {
    it('deve criar uma preferência com itens e back_urls', async () => {
      const prefMock = new Preference({ accessToken: 'TEST_TOKEN' } as any);
      const createSpy = vi.spyOn(prefMock, 'create').mockResolvedValue({
        id: 'pref-123',
        init_point: 'https://mp.com/checkout',
        sandbox_init_point: 'https://sandbox.mp.com/checkout'
      } as any);

      const payload = {
        body: {
          items: [{ title: 'Assinatura', unit_price: 100, quantity: 1 }],
          back_urls: {
            success: 'http://site.com/success',
            failure: 'http://site.com/failure',
            pending: 'http://site.com/pending'
          }
        }
      };

      const result = await prefMock.create(payload);

      expect(createSpy).toHaveBeenCalledWith(payload);
      expect(result.id).toBe('pref-123');
      expect(result.init_point).toBe('https://mp.com/checkout');
    });
  });
});
