-- Criar tabelas de sequência para ordens e pedidos
CREATE TABLE IF NOT EXISTS public.ordem_numero_sequences (
  user_id UUID PRIMARY KEY,
  next_numero INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.pedido_numero_sequences (
  user_id UUID PRIMARY KEY,
  next_numero INTEGER NOT NULL DEFAULT 1
);

-- Habilitar RLS
ALTER TABLE public.ordem_numero_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_numero_sequences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sequências de ordens
CREATE POLICY "Users can manage their own ordem sequence"
  ON public.ordem_numero_sequences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para sequências de pedidos
CREATE POLICY "Users can manage their own pedido sequence"
  ON public.pedido_numero_sequences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Substituir função get_next_ordem_numero (atômica e segura)
CREATE OR REPLACE FUNCTION public.get_next_ordem_numero(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Validar que o usuário só pode acessar seus próprios números
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: você só pode gerar números para seu próprio usuário';
  END IF;
  
  -- Inserir ou atualizar atomicamente e retornar o número
  INSERT INTO ordem_numero_sequences (user_id, next_numero)
  VALUES (_user_id, 2)
  ON CONFLICT (user_id) DO UPDATE
  SET next_numero = ordem_numero_sequences.next_numero + 1
  RETURNING next_numero - 1 INTO next_num;
  
  RETURN next_num;
END;
$$;

-- Substituir função get_next_pedido_numero (atômica e segura)
CREATE OR REPLACE FUNCTION public.get_next_pedido_numero(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Validar que o usuário só pode acessar seus próprios números
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: você só pode gerar números para seu próprio usuário';
  END IF;
  
  -- Inserir ou atualizar atomicamente e retornar o número
  INSERT INTO pedido_numero_sequences (user_id, next_numero)
  VALUES (_user_id, 2)
  ON CONFLICT (user_id) DO UPDATE
  SET next_numero = pedido_numero_sequences.next_numero + 1
  RETURNING next_numero - 1 INTO next_num;
  
  RETURN next_num;
END;
$$;

-- Inicializar sequências com os valores atuais existentes
INSERT INTO ordem_numero_sequences (user_id, next_numero)
SELECT user_id, COALESCE(MAX(numero), 0) + 1
FROM ordens_producao
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET next_numero = EXCLUDED.next_numero;

INSERT INTO pedido_numero_sequences (user_id, next_numero)
SELECT user_id, COALESCE(MAX(numero), 0) + 1
FROM pedidos_venda
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET next_numero = EXCLUDED.next_numero;