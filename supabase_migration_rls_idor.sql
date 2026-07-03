-- =====================================================
-- GRANJA DE BOLSO - Migração de RLS (Prevenção Relational IDOR)
-- =====================================================
-- Este script substitui as políticas genéricas "FOR ALL" por políticas
-- mais rígidas que garantem que chaves estrangeiras (especialmente granja_id)
-- pertençam ao mesmo usuário autenticado durante INSERT e UPDATE.

DO $$ 
DECLARE
  table_name text;
  tables_with_granja text[] := ARRAY[
    'fornecedores', 'clientes', 'galpoes', 'profissionais_saude', 
    'animais', 'compras', 'saude_registros', 'estoque_veterinario', 
    'mortalidade_registros', 'manejo_registros', 'disponibilidade_venda', 
    'vendas', 'ingredientes', 'formulacoes', 'estoque_racao_formulada', 'backups'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_with_granja
  LOOP
    -- Remove política antiga se existir (os nomes antigos podiam variar, então apagamos pelo nome exato do script anterior)
    EXECUTE format('DROP POLICY IF EXISTS "Usuários podem acessar seus próprios %s" ON public.%s;', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Usuários podem acessar suas próprias %s" ON public.%s;', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Usuários podem acessar seu próprio %s" ON public.%s;', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Usuários podem acessar sua própria %s" ON public.%s;', table_name, table_name);
    
    -- Recria a política restritiva (Valida user_id e a posse do granja_id no WITH CHECK)
    EXECUTE format('
      CREATE POLICY "Tenant Isolation Policy" ON public.%I FOR ALL 
      USING (auth.uid() = user_id) 
      WITH CHECK (
        auth.uid() = user_id AND 
        (granja_id IS NULL OR EXISTS (
          SELECT 1 FROM public.granjas g 
          WHERE g.id = granja_id AND g.user_id = auth.uid()
        ))
      );
    ', table_name);
  END LOOP;
END $$;
