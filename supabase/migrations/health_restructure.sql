-- Reestruturacao do modulo de saude
ALTER TABLE public.saude_registros
ADD COLUMN IF NOT EXISTS consultation_cost NUMERIC,
ADD COLUMN IF NOT EXISTS return_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS treatment_type TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS next_dose_date TIMESTAMPTZ;

COMMENT ON COLUMN public.saude_registros.consultation_cost IS 'Valor monetario da consulta';
COMMENT ON COLUMN public.saude_registros.return_date IS 'Data de retorno da consulta';
COMMENT ON COLUMN public.saude_registros.treatment_type IS 'Tipo do tratamento: vacina ou medicamento';
COMMENT ON COLUMN public.saude_registros.product_name IS 'Nome do produto aplicado';
COMMENT ON COLUMN public.saude_registros.next_dose_date IS 'Data da proxima dose do tratamento';

CREATE INDEX IF NOT EXISTS idx_saude_registros_next_dose_date
ON public.saude_registros (next_dose_date)
WHERE next_dose_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saude_registros_return_date
ON public.saude_registros (return_date)
WHERE return_date IS NOT NULL;
