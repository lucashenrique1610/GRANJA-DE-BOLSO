-- Auth hardening and least-privilege controls
-- - Force RLS on all tenant tables
-- - Revoke broad grants from anon/authenticated
-- - Grant DML only to authenticated users
-- - Enforce ownership on foreign-key style references to reduce IDOR risk

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.granjas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores FORCE ROW LEVEL SECURITY;
ALTER TABLE public.clientes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.galpoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais_saude FORCE ROW LEVEL SECURITY;
ALTER TABLE public.animais FORCE ROW LEVEL SECURITY;
ALTER TABLE public.compras FORCE ROW LEVEL SECURITY;
ALTER TABLE public.saude_registros FORCE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_veterinario FORCE ROW LEVEL SECURITY;
ALTER TABLE public.mortalidade_registros FORCE ROW LEVEL SECURITY;
ALTER TABLE public.manejo_registros FORCE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidade_venda FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vendas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ingredientes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.formulacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_racao_formulada FORCE ROW LEVEL SECURITY;
ALTER TABLE public.backups FORCE ROW LEVEL SECURITY;

REVOKE USAGE ON SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

GRANT
  SELECT,
  INSERT,
  UPDATE,
  DELETE
ON TABLE
  public.users,
  public.granjas,
  public.fornecedores,
  public.clientes,
  public.galpoes,
  public.profissionais_saude,
  public.animais,
  public.compras,
  public.saude_registros,
  public.estoque_veterinario,
  public.mortalidade_registros,
  public.manejo_registros,
  public.disponibilidade_venda,
  public.vendas,
  public.ingredientes,
  public.formulacoes,
  public.estoque_racao_formulada,
  public.backups
TO authenticated;

ALTER TABLE public.profissionais_saude
  DROP CONSTRAINT IF EXISTS profissionais_saude_access_level_check;

ALTER TABLE public.profissionais_saude
  ADD CONSTRAINT profissionais_saude_access_level_check
  CHECK (access_level IN ('visualizacao', 'registro', 'gestao'));

CREATE OR REPLACE FUNCTION public.assert_owner_reference(
  ref_table REGCLASS,
  ref_id UUID,
  expected_user_id UUID,
  field_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  ref_user_id UUID;
BEGIN
  IF ref_id IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('SELECT user_id FROM %s WHERE id = $1', ref_table)
    INTO ref_user_id
    USING ref_id;

  IF ref_user_id IS NULL THEN
    RAISE EXCEPTION '% reference is invalid or not accessible for this user.', field_name
      USING ERRCODE = '42501';
  END IF;

  IF ref_user_id <> expected_user_id THEN
    RAISE EXCEPTION '% belongs to another user.', field_name
      USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_granja_scoped_reference(
  ref_table REGCLASS,
  ref_id UUID,
  expected_user_id UUID,
  expected_granja_id UUID,
  field_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  ref_user_id UUID;
  ref_granja_id UUID;
BEGIN
  IF ref_id IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('SELECT user_id, granja_id FROM %s WHERE id = $1', ref_table)
    INTO ref_user_id, ref_granja_id
    USING ref_id;

  IF ref_user_id IS NULL THEN
    RAISE EXCEPTION '% reference is invalid or not accessible for this user.', field_name
      USING ERRCODE = '42501';
  END IF;

  IF ref_user_id <> expected_user_id THEN
    RAISE EXCEPTION '% belongs to another user.', field_name
      USING ERRCODE = '42501';
  END IF;

  IF expected_granja_id IS NOT NULL AND ref_granja_id IS DISTINCT FROM expected_granja_id THEN
    RAISE EXCEPTION '% belongs to another granja.', field_name
      USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_granja_owner_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_animais_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.fornecedores', NEW.supplier_id, NEW.user_id, NEW.granja_id, 'supplier_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_compras_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.fornecedores', NEW.supplier_id, NEW.user_id, NEW.granja_id, 'supplier_id');
  PERFORM public.assert_granja_scoped_reference('public.animais', NEW.linked_animal_id, NEW.user_id, NEW.granja_id, 'linked_animal_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_saude_registros_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.animais', NEW.animal_id, NEW.user_id, NEW.granja_id, 'animal_id');
  PERFORM public.assert_granja_scoped_reference('public.galpoes', NEW.galpao_id, NEW.user_id, NEW.granja_id, 'galpao_id');
  PERFORM public.assert_granja_scoped_reference('public.profissionais_saude', NEW.professional_id, NEW.user_id, NEW.granja_id, 'professional_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_estoque_veterinario_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.fornecedores', NEW.supplier_id, NEW.user_id, NEW.granja_id, 'supplier_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_mortalidade_registros_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.animais', NEW.animal_id, NEW.user_id, NEW.granja_id, 'animal_id');
  PERFORM public.assert_granja_scoped_reference('public.galpoes', NEW.galpao_id, NEW.user_id, NEW.granja_id, 'galpao_id');
  PERFORM public.assert_granja_scoped_reference('public.profissionais_saude', NEW.responsible_professional_id, NEW.user_id, NEW.granja_id, 'responsible_professional_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_manejo_registros_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.animais', NEW.animal_id, NEW.user_id, NEW.granja_id, 'animal_id');
  PERFORM public.assert_granja_scoped_reference('public.formulacoes', NEW.formulation_id, NEW.user_id, NEW.granja_id, 'formulation_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_vendas_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.clientes', NEW.client_id, NEW.user_id, NEW.granja_id, 'client_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_formulacoes_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.animais', NEW.animal_id, NEW.user_id, NEW.granja_id, 'animal_id');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_estoque_racao_formulada_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_owner_reference('public.granjas', NEW.granja_id, NEW.user_id, 'granja_id');
  PERFORM public.assert_granja_scoped_reference('public.formulacoes', NEW.formulation_id, NEW.user_id, NEW.granja_id, 'formulation_id');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_fornecedores_granja_owner ON public.fornecedores;
CREATE TRIGGER trg_validate_fornecedores_granja_owner
BEFORE INSERT OR UPDATE ON public.fornecedores
FOR EACH ROW
EXECUTE FUNCTION public.validate_granja_owner_only();

DROP TRIGGER IF EXISTS trg_validate_clientes_granja_owner ON public.clientes;
CREATE TRIGGER trg_validate_clientes_granja_owner
BEFORE INSERT OR UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.validate_granja_owner_only();

DROP TRIGGER IF EXISTS trg_validate_galpoes_granja_owner ON public.galpoes;
CREATE TRIGGER trg_validate_galpoes_granja_owner
BEFORE INSERT OR UPDATE ON public.galpoes
FOR EACH ROW
EXECUTE FUNCTION public.validate_granja_owner_only();

DROP TRIGGER IF EXISTS trg_validate_profissionais_granja_owner ON public.profissionais_saude;
CREATE TRIGGER trg_validate_profissionais_granja_owner
BEFORE INSERT OR UPDATE ON public.profissionais_saude
FOR EACH ROW
EXECUTE FUNCTION public.validate_granja_owner_only();

DROP TRIGGER IF EXISTS trg_validate_disponibilidade_granja_owner ON public.disponibilidade_venda;
CREATE TRIGGER trg_validate_disponibilidade_granja_owner
BEFORE INSERT OR UPDATE ON public.disponibilidade_venda
FOR EACH ROW
EXECUTE FUNCTION public.validate_granja_owner_only();

DROP TRIGGER IF EXISTS trg_validate_ingredientes_granja_owner ON public.ingredientes;
CREATE TRIGGER trg_validate_ingredientes_granja_owner
BEFORE INSERT OR UPDATE ON public.ingredientes
FOR EACH ROW
EXECUTE FUNCTION public.validate_granja_owner_only();

DROP TRIGGER IF EXISTS trg_validate_backups_granja_owner ON public.backups;
CREATE TRIGGER trg_validate_backups_granja_owner
BEFORE INSERT OR UPDATE ON public.backups
FOR EACH ROW
EXECUTE FUNCTION public.validate_granja_owner_only();

DROP TRIGGER IF EXISTS trg_validate_animais_ownership ON public.animais;
CREATE TRIGGER trg_validate_animais_ownership
BEFORE INSERT OR UPDATE ON public.animais
FOR EACH ROW
EXECUTE FUNCTION public.validate_animais_ownership();

DROP TRIGGER IF EXISTS trg_validate_compras_ownership ON public.compras;
CREATE TRIGGER trg_validate_compras_ownership
BEFORE INSERT OR UPDATE ON public.compras
FOR EACH ROW
EXECUTE FUNCTION public.validate_compras_ownership();

DROP TRIGGER IF EXISTS trg_validate_saude_registros_ownership ON public.saude_registros;
CREATE TRIGGER trg_validate_saude_registros_ownership
BEFORE INSERT OR UPDATE ON public.saude_registros
FOR EACH ROW
EXECUTE FUNCTION public.validate_saude_registros_ownership();

DROP TRIGGER IF EXISTS trg_validate_estoque_veterinario_ownership ON public.estoque_veterinario;
CREATE TRIGGER trg_validate_estoque_veterinario_ownership
BEFORE INSERT OR UPDATE ON public.estoque_veterinario
FOR EACH ROW
EXECUTE FUNCTION public.validate_estoque_veterinario_ownership();

DROP TRIGGER IF EXISTS trg_validate_mortalidade_registros_ownership ON public.mortalidade_registros;
CREATE TRIGGER trg_validate_mortalidade_registros_ownership
BEFORE INSERT OR UPDATE ON public.mortalidade_registros
FOR EACH ROW
EXECUTE FUNCTION public.validate_mortalidade_registros_ownership();

DROP TRIGGER IF EXISTS trg_validate_manejo_registros_ownership ON public.manejo_registros;
CREATE TRIGGER trg_validate_manejo_registros_ownership
BEFORE INSERT OR UPDATE ON public.manejo_registros
FOR EACH ROW
EXECUTE FUNCTION public.validate_manejo_registros_ownership();

DROP TRIGGER IF EXISTS trg_validate_vendas_ownership ON public.vendas;
CREATE TRIGGER trg_validate_vendas_ownership
BEFORE INSERT OR UPDATE ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.validate_vendas_ownership();

DROP TRIGGER IF EXISTS trg_validate_formulacoes_ownership ON public.formulacoes;
CREATE TRIGGER trg_validate_formulacoes_ownership
BEFORE INSERT OR UPDATE ON public.formulacoes
FOR EACH ROW
EXECUTE FUNCTION public.validate_formulacoes_ownership();

DROP TRIGGER IF EXISTS trg_validate_estoque_racao_formulada_ownership ON public.estoque_racao_formulada;
CREATE TRIGGER trg_validate_estoque_racao_formulada_ownership
BEFORE INSERT OR UPDATE ON public.estoque_racao_formulada
FOR EACH ROW
EXECUTE FUNCTION public.validate_estoque_racao_formulada_ownership();
