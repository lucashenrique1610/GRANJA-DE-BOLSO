-- =====================================================
-- MIGRATION: Seção de Investimentos
-- Arquivo: supabase_investimentos.sql
-- Descrição: Cria as tabelas investment_projects e
--            investment_items com RLS e políticas de
--            segurança alinhadas ao padrão do sistema.
-- Idempotente: Pode ser executado múltiplas vezes.
-- =====================================================

-- =====================================================
-- PASSO 1: REMOVER POLÍTICAS ANTIGAS (se existirem)
-- Usa bloco DO $$ para evitar erro 42P01 quando as
-- tabelas ainda não existem.
-- =====================================================
DO $$
BEGIN
  -- investment_projects
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'investment_projects') THEN
    DROP POLICY IF EXISTS "Usuários podem acessar seus próprios projetos de investimento"  ON public.investment_projects;
    DROP POLICY IF EXISTS "Usuários podem inserir seus próprios projetos de investimento"   ON public.investment_projects;
    DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios projetos de investimento" ON public.investment_projects;
    DROP POLICY IF EXISTS "Usuários podem deletar seus próprios projetos de investimento"   ON public.investment_projects;
    DROP POLICY IF EXISTS "Usuários podem ver seus próprios projetos de investimento"       ON public.investment_projects;
    DROP POLICY IF EXISTS "Usuários podem criar seus próprios projetos de investimento"     ON public.investment_projects;
  END IF;

  -- investment_items
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'investment_items') THEN
    DROP POLICY IF EXISTS "Usuários podem acessar itens dos seus projetos"                          ON public.investment_items;
    DROP POLICY IF EXISTS "Usuários podem inserir itens nos seus projetos"                          ON public.investment_items;
    DROP POLICY IF EXISTS "Usuários podem atualizar itens dos seus projetos"                        ON public.investment_items;
    DROP POLICY IF EXISTS "Usuários podem deletar itens dos seus projetos"                          ON public.investment_items;
    DROP POLICY IF EXISTS "Usuários podem ver itens dos seus projetos de investimento"              ON public.investment_items;
    DROP POLICY IF EXISTS "Usuários podem adicionar itens aos seus projetos de investimento"        ON public.investment_items;
    DROP POLICY IF EXISTS "Usuários podem atualizar itens dos seus projetos de investimento"        ON public.investment_items;
    DROP POLICY IF EXISTS "Usuários podem deletar itens dos seus projetos de investimento"          ON public.investment_items;
  END IF;
END;
$$;

-- =====================================================
-- PASSO 2: REMOVER TABELAS ANTIGAS (em ordem)
-- =====================================================
DROP TABLE IF EXISTS public.investment_items CASCADE;
DROP TABLE IF EXISTS public.investment_projects CASCADE;

-- =====================================================
-- PASSO 3: CRIAR TABELAS
-- =====================================================

-- Tabela: investment_projects
-- Representa um projeto de investimento criado pelo usuário.
-- Pode ser gerado pela calculadora ou criado manualmente.
CREATE TABLE public.investment_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Vínculo obrigatório com o usuário autenticado
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vínculo opcional com uma granja específica do usuário
  granja_id       UUID REFERENCES public.granjas(id) ON DELETE SET NULL,

  -- Dados do projeto
  nome            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'planejamento'
                  CHECK (status IN ('planejamento', 'em_andamento', 'concluido', 'cancelado')),
  data_inicio     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_conclusao  TIMESTAMPTZ,

  -- Flag que indica se o projeto foi editado manualmente após ser gerado pela calculadora
  is_customized   BOOLEAN NOT NULL DEFAULT FALSE,

  -- Parâmetros da calculadora que geraram este projeto (snapshot para auditoria)
  -- Armazenados como JSONB para preservar flexibilidade sem poluir colunas
  calc_params     JSONB
  -- Exemplo de calc_params:
  -- {
  --   "aves": 200, "fase": "postura", "sistema": "caipira",
  --   "piquete": "recomendado", "incluirMaoDeObra": true,
  --   "incluirLegalizacao": true,
  --   "modulos": { "infraestrutura": true, "equipamentos": true,
  --                "alimentacao_sanidade": true, "aves": true }
  -- }
);

-- Tabela: investment_items
-- Representa cada item/linha dentro de um projeto de investimento.
-- Equivale ao tipo InvestmentItem do frontend (src/types.ts).
CREATE TABLE public.investment_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Vínculo obrigatório com o usuário (desnormalizado para simplificar as políticas RLS)
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vínculo com o projeto pai
  project_id       UUID NOT NULL REFERENCES public.investment_projects(id) ON DELETE CASCADE,

  -- Dados do item
  categoria        TEXT NOT NULL
                   CHECK (categoria IN ('infraestrutura', 'equipamentos', 'mao_de_obra', 'licencas', 'outros')),
  descricao        TEXT NOT NULL,
  quantidade       NUMERIC NOT NULL DEFAULT 1 CHECK (quantidade >= 0),
  preco_unitario   NUMERIC NOT NULL DEFAULT 0  CHECK (preco_unitario >= 0)
);

-- =====================================================
-- PASSO 4: ÍNDICES DE PERFORMANCE
-- =====================================================

-- Projetos por usuário (consulta mais frequente)
CREATE INDEX IF NOT EXISTS idx_investment_projects_user_id
  ON public.investment_projects(user_id);

-- Projetos por granja
CREATE INDEX IF NOT EXISTS idx_investment_projects_granja_id
  ON public.investment_projects(granja_id);

-- Itens por projeto (JOIN frequente)
CREATE INDEX IF NOT EXISTS idx_investment_items_project_id
  ON public.investment_items(project_id);

-- Itens por usuário (RLS scan)
CREATE INDEX IF NOT EXISTS idx_investment_items_user_id
  ON public.investment_items(user_id);

-- =====================================================
-- PASSO 5: TRIGGER updated_at AUTOMÁTICO
-- =====================================================

-- Função genérica para atualizar updated_at (reutilizável)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplica o trigger na tabela de projetos
DROP TRIGGER IF EXISTS trg_investment_projects_updated_at ON public.investment_projects;
CREATE TRIGGER trg_investment_projects_updated_at
  BEFORE UPDATE ON public.investment_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- PASSO 6: HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.investment_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_items    ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 7: POLÍTICAS RLS
-- Padrão do sistema: 4 políticas por tabela (CRUD).
-- Segurança anti-IDOR: projetos validam user_id direto;
-- itens validam via JOIN com o projeto pai.
-- =====================================================

-- ---------- investment_projects ----------

-- SELECT: usuário vê apenas seus próprios projetos
CREATE POLICY "Usuários podem ver seus próprios projetos de investimento"
  ON public.investment_projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: usuário só pode inserir projetos com seu próprio user_id
CREATE POLICY "Usuários podem criar seus próprios projetos de investimento"
  ON public.investment_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuário só pode atualizar projetos que são seus
CREATE POLICY "Usuários podem atualizar seus próprios projetos de investimento"
  ON public.investment_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: usuário só pode deletar projetos que são seus
CREATE POLICY "Usuários podem deletar seus próprios projetos de investimento"
  ON public.investment_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ---------- investment_items ----------
-- Proteção anti-IDOR dupla:
--   1. user_id no item deve bater com auth.uid()
--   2. project_id deve apontar para um projeto que pertence ao auth.uid()
--   (o segundo check evita que alguém insira itens em projetos alheios
--    mesmo falsificando o user_id por alguma brecha futura)

-- SELECT
CREATE POLICY "Usuários podem ver itens dos seus projetos de investimento"
  ON public.investment_items
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investment_projects p
      WHERE p.id = investment_items.project_id
        AND p.user_id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Usuários podem adicionar itens aos seus projetos de investimento"
  ON public.investment_items
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investment_projects p
      WHERE p.id = investment_items.project_id
        AND p.user_id = auth.uid()
    )
  );

-- UPDATE
CREATE POLICY "Usuários podem atualizar itens dos seus projetos de investimento"
  ON public.investment_items
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investment_projects p
      WHERE p.id = investment_items.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investment_projects p
      WHERE p.id = investment_items.project_id
        AND p.user_id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "Usuários podem deletar itens dos seus projetos de investimento"
  ON public.investment_items
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investment_projects p
      WHERE p.id = investment_items.project_id
        AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- PASSO 8: FUNÇÕES RPC (SECURITY DEFINER)
-- As funções rodam com permissão elevada mas sempre
-- verificam auth.uid() internamente, garantindo isolamento.
-- =====================================================

-- ----- RPC: Criar Projeto de Investimento -----
DROP FUNCTION IF EXISTS public.create_investment_project(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION public.create_investment_project(
  p_granja_id      UUID      DEFAULT NULL,
  p_nome           TEXT      DEFAULT 'Novo Projeto',
  p_status         TEXT      DEFAULT 'planejamento',
  p_data_inicio    TIMESTAMPTZ DEFAULT NOW(),
  p_data_conclusao TIMESTAMPTZ DEFAULT NULL,
  p_is_customized  BOOLEAN   DEFAULT FALSE,
  p_calc_params    JSONB     DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id   UUID;
  v_project_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  -- Valida que a granja pertence ao usuário (se informada)
  IF p_granja_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.granjas WHERE id = p_granja_id AND user_id = v_user_id
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Granja não encontrada ou sem permissão');
    END IF;
  END IF;

  INSERT INTO public.investment_projects (
    user_id, granja_id, nome, status, data_inicio, data_conclusao, is_customized, calc_params
  ) VALUES (
    v_user_id, p_granja_id, p_nome, p_status, p_data_inicio, p_data_conclusao, p_is_customized, p_calc_params
  ) RETURNING id INTO v_project_id;

  RETURN json_build_object(
    'success',    true,
    'project_id', v_project_id,
    'message',    'Projeto criado com sucesso!'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----- RPC: Atualizar Projeto de Investimento -----
DROP FUNCTION IF EXISTS public.update_investment_project(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION public.update_investment_project(
  p_project_id     UUID,
  p_nome           TEXT        DEFAULT NULL,
  p_status         TEXT        DEFAULT NULL,
  p_data_inicio    TIMESTAMPTZ DEFAULT NULL,
  p_data_conclusao TIMESTAMPTZ DEFAULT NULL,
  p_is_customized  BOOLEAN     DEFAULT NULL,
  p_calc_params    JSONB       DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_rows    INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  UPDATE public.investment_projects
  SET
    nome           = COALESCE(p_nome,           nome),
    status         = COALESCE(p_status,         status),
    data_inicio    = COALESCE(p_data_inicio,    data_inicio),
    data_conclusao = COALESCE(p_data_conclusao, data_conclusao),
    is_customized  = COALESCE(p_is_customized,  is_customized),
    calc_params    = COALESCE(p_calc_params,    calc_params)
  WHERE id = p_project_id AND user_id = v_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Projeto não encontrado ou sem permissão');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Projeto atualizado com sucesso!');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----- RPC: Deletar Projeto de Investimento -----
DROP FUNCTION IF EXISTS public.delete_investment_project(UUID);

CREATE OR REPLACE FUNCTION public.delete_investment_project(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_rows    INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  -- O CASCADE nas FK cuida dos investment_items automaticamente
  DELETE FROM public.investment_projects
  WHERE id = p_project_id AND user_id = v_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Projeto não encontrado ou sem permissão');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Projeto deletado com sucesso!');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----- RPC: Listar Projetos com Totais -----
DROP FUNCTION IF EXISTS public.list_my_investment_projects(UUID);

CREATE OR REPLACE FUNCTION public.list_my_investment_projects(
  p_granja_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  granja_id       UUID,
  nome            TEXT,
  status          TEXT,
  data_inicio     TIMESTAMPTZ,
  data_conclusao  TIMESTAMPTZ,
  is_customized   BOOLEAN,
  calc_params     JSONB,
  total_items     BIGINT,
  total_investido NUMERIC
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.created_at,
    p.updated_at,
    p.granja_id,
    p.nome,
    p.status,
    p.data_inicio,
    p.data_conclusao,
    p.is_customized,
    p.calc_params,
    COUNT(i.id)                              AS total_items,
    COALESCE(SUM(i.quantidade * i.preco_unitario), 0) AS total_investido
  FROM public.investment_projects p
  LEFT JOIN public.investment_items i ON i.project_id = p.id
  WHERE p.user_id = v_user_id
    AND (p_granja_id IS NULL OR p.granja_id = p_granja_id)
  GROUP BY p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----- RPC: Buscar Projeto Completo (com itens) -----
DROP FUNCTION IF EXISTS public.get_investment_project(UUID);

CREATE OR REPLACE FUNCTION public.get_investment_project(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_project  RECORD;
  v_items    JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  SELECT * INTO v_project
  FROM public.investment_projects
  WHERE id = p_project_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Projeto não encontrado ou sem permissão');
  END IF;

  SELECT json_agg(
    json_build_object(
      'id',             i.id,
      'projectId',      i.project_id,
      'categoria',      i.categoria,
      'descricao',      i.descricao,
      'quantidade',     i.quantidade,
      'precoUnitario',  i.preco_unitario,
      'createdAt',      i.created_at
    ) ORDER BY i.created_at ASC
  ) INTO v_items
  FROM public.investment_items i
  WHERE i.project_id = p_project_id AND i.user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'project', json_build_object(
      'id',            v_project.id,
      'nome',          v_project.nome,
      'status',        v_project.status,
      'dataInicio',    v_project.data_inicio,
      'dataConclusao', v_project.data_conclusao,
      'isCustomized',  v_project.is_customized,
      'calcParams',    v_project.calc_params,
      'createdAt',     v_project.created_at,
      'updatedAt',     v_project.updated_at,
      'items',         COALESCE(v_items, '[]'::JSON)
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----- RPC: Salvar Projeto Completo (upsert + itens em batch) -----
-- Recebe o projeto inteiro como JSON e faz upsert atômico.
-- Ideal para sincronizar o estado local do frontend de uma vez.
DROP FUNCTION IF EXISTS public.save_investment_project(JSON);

CREATE OR REPLACE FUNCTION public.save_investment_project(p_payload JSON)
RETURNS JSON AS $$
DECLARE
  v_user_id    UUID;
  v_project_id UUID;
  v_granja_id  UUID;
  v_item       JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  v_project_id := (p_payload->>'id')::UUID;
  v_granja_id  := NULLIF(p_payload->>'granjaId', '')::UUID;

  -- Valida granja (se informada)
  IF v_granja_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.granjas WHERE id = v_granja_id AND user_id = v_user_id
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Granja não encontrada ou sem permissão');
    END IF;
  END IF;

  -- Upsert do projeto
  INSERT INTO public.investment_projects (
    id, user_id, granja_id, nome, status, data_inicio, data_conclusao, is_customized, calc_params
  ) VALUES (
    v_project_id,
    v_user_id,
    v_granja_id,
    p_payload->>'nome',
    COALESCE(p_payload->>'status', 'planejamento'),
    COALESCE((p_payload->>'dataInicio')::TIMESTAMPTZ, NOW()),
    NULLIF(p_payload->>'dataConclusao', '')::TIMESTAMPTZ,
    COALESCE((p_payload->>'isCustomized')::BOOLEAN, FALSE),
    p_payload->'calcParams'
  )
  ON CONFLICT (id) DO UPDATE SET
    granja_id      = EXCLUDED.granja_id,
    nome           = EXCLUDED.nome,
    status         = EXCLUDED.status,
    data_inicio    = EXCLUDED.data_inicio,
    data_conclusao = EXCLUDED.data_conclusao,
    is_customized  = EXCLUDED.is_customized,
    calc_params    = EXCLUDED.calc_params
  WHERE investment_projects.user_id = v_user_id; -- Proteção IDOR no upsert

  -- Verifica se o upsert foi permitido (proteção anti-IDOR)
  IF NOT EXISTS (
    SELECT 1 FROM public.investment_projects WHERE id = v_project_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado ao projeto');
  END IF;

  -- Remove todos os itens antigos do projeto e reinserção em batch
  DELETE FROM public.investment_items WHERE project_id = v_project_id AND user_id = v_user_id;

  FOR v_item IN SELECT * FROM json_array_elements(COALESCE(p_payload->'items', '[]'::JSON))
  LOOP
    INSERT INTO public.investment_items (
      id, user_id, project_id, categoria, descricao, quantidade, preco_unitario
    ) VALUES (
      COALESCE(NULLIF(v_item->>'id', '')::UUID, gen_random_uuid()),
      v_user_id,
      v_project_id,
      v_item->>'categoria',
      v_item->>'descricao',
      (v_item->>'quantidade')::NUMERIC,
      (v_item->>'precoUnitario')::NUMERIC
    );
  END LOOP;

  RETURN json_build_object(
    'success',    true,
    'project_id', v_project_id,
    'message',    'Projeto salvo com sucesso!'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PASSO 9: PERMISSÕES
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_items    TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_investment_project(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_investment_project(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_investment_project(UUID)                                                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_investment_projects(UUID)                                                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_investment_project(UUID)                                                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_investment_project(JSON)                                                         TO authenticated;

-- =====================================================
-- FIM DO SCRIPT — supabase_investimentos.sql
-- =====================================================
