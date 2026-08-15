import { listAdminUsersOverview } from '../../server/admin-store.js';
import { withRole } from '../../server/auth.js';
import { withObservability } from '../../server/observability.js';

export default withObservability(
  withRole('admin', async function handler(req, res, _authResult, ctx) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: 'Metodo nao permitido.' });
      return;
    }

    try {
      const payload = await listAdminUsersOverview();
      ctx.info('admin.overview.loaded', { userCount: payload.users?.length });
      res.status(200).json({ ...payload, requestId: ctx.requestId });
    } catch (error) {
      ctx.error('admin.overview.failed', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Falha ao carregar o painel administrativo.',
        requestId: ctx.requestId,
      });
    }
  }),
);