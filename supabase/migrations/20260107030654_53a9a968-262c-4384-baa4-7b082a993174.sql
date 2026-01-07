
-- 1. Adicionar campos de auditoria às tabelas de sequência
ALTER TABLE public.ordem_numero_sequences 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.pedido_numero_sequences 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Trocar INTEGER por BIGINT
ALTER TABLE public.ordem_numero_sequences 
ALTER COLUMN next_numero TYPE BIGINT;

ALTER TABLE public.pedido_numero_sequences 
ALTER COLUMN next_numero TYPE BIGINT;

-- 3. Recriar função get_next_ordem_numero (sem parâmetro, usando auth.uid() diretamente)
CREATE OR REPLACE FUNCTION public.get_next_ordem_numero()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = on
AS $$
DECLARE
  next_num BIGINT;
  v_user_id UUID := auth.uid();
BEGIN
  -- Validar que há um usuário autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;
  
  -- Inserir ou atualizar atomicamente e retornar o número
  INSERT INTO ordem_numero_sequences (user_id, next_numero, created_at, updated_at)
  VALUES (v_user_id, 2, now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET next_numero = ordem_numero_sequences.next_numero + 1,
      updated_at = now()
  RETURNING next_numero - 1 INTO next_num;
  
  RETURN next_num;
END;
$$;

-- 4. Recriar função get_next_pedido_numero (sem parâmetro, usando auth.uid() diretamente)
CREATE OR REPLACE FUNCTION public.get_next_pedido_numero()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = on
AS $$
DECLARE
  next_num BIGINT;
  v_user_id UUID := auth.uid();
BEGIN
  -- Validar que há um usuário autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;
  
  -- Inserir ou atualizar atomicamente e retornar o número
  INSERT INTO pedido_numero_sequences (user_id, next_numero, created_at, updated_at)
  VALUES (v_user_id, 2, now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET next_numero = pedido_numero_sequences.next_numero + 1,
      updated_at = now()
  RETURNING next_numero - 1 INTO next_num;
  
  RETURN next_num;
END;
$$;

-- 5. Dropar as funções antigas que recebiam parâmetro (para evitar sobrecarga)
DROP FUNCTION IF EXISTS public.get_next_ordem_numero(UUID);
DROP FUNCTION IF EXISTS public.get_next_pedido_numero(UUID);

-- 6. Índices explícitos (mesmo com PK, para documentação)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ordem_seq_user ON ordem_numero_sequences (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedido_seq_user ON pedido_numero_sequences (user_id);
