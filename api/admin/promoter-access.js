import { withRole } from '../../server/auth.js';
import { withObservability } from '../../server/observability.js';
import { readJsonBody } from '../../server/billing-store.js';

export default withObservability(
  withRole('admin', async function handler(req, res, authResult, ctx) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({ error: 'Metodo nao permitido.' });
      return;
    }

    try {
      const { userId, enabled, notes } = await readJsonBody(req);

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'Informe o usuario alvo.' });
        return;
      }

      if (typeof enabled !== 'boolean') {
        res.status(400).json({ error: 'Informe se o acesso de divulgador deve ser ativado ou removido.' });
        return;
      }

      const { data, error } = await authResult.requestClient.rpc('admin_set_user_divulgador', {
        target_user_id: userId,
        enabled,
        notes: typeof notes === 'string' ? notes : null,
      });

      if (error) {
        throw error;
      }

      ctx.info('promoter.access.updated', { targetUserId: userId, enabled });
      res.status(200).json({
        user: data,
        message: enabled
          ? 'Usuario promovido a divulgador com sucesso.'
          : 'Acesso de divulgador removido com sucesso.',
        requestId: ctx.requestId,
      });
    } catch (error) {
      ctx.error('promoter.access.failed', error, { targetUserId: req.body?.userId ?? null });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Falha ao atualizar o acesso de divulgador.',
        requestId: ctx.requestId,
      });
    }
  }),
);