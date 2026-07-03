import { listAdminUsersOverview } from '../../server/admin-store.js';
import { withRole } from '../../server/auth.js';

export default withRole('admin', async function handler(req, res, authResult) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const payload = await listAdminUsersOverview();
    res.status(200).json(payload);
  } catch (error) {
    console.error('Erro ao carregar overview administrativo:', error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Falha ao carregar o painel administrativo.',
    });
  }
});
