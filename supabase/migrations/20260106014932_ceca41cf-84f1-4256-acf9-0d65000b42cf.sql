-- Adicionar campos de estoque à tabela insumos
ALTER TABLE public.insumos 
ADD COLUMN quantidade_estoque NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN estoque_minimo NUMERIC NOT NULL DEFAULT 0;

-- Criar tabela de movimentações de estoque
CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insumo_id UUID NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'producao')),
  quantidade NUMERIC NOT NULL,
  quantidade_anterior NUMERIC NOT NULL,
  quantidade_posterior NUMERIC NOT NULL,
  observacao TEXT,
  ordem_producao_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de ordens de produção
CREATE TABLE public.ordens_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_producao', 'concluida', 'cancelada')),
  custo_total NUMERIC NOT NULL DEFAULT 0,
  data_prevista DATE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar sequência para número da ordem por usuário
CREATE SEQUENCE IF NOT EXISTS ordens_producao_numero_seq START 1;

-- Adicionar foreign key de movimentações para ordens
ALTER TABLE public.movimentacoes_estoque 
ADD CONSTRAINT fk_movimentacoes_ordem 
FOREIGN KEY (ordem_producao_id) REFERENCES public.ordens_producao(id) ON DELETE SET NULL;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para movimentacoes_estoque
CREATE POLICY "Users can read their own movimentacoes"
ON public.movimentacoes_estoque FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movimentacoes"
ON public.movimentacoes_estoque FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movimentacoes"
ON public.movimentacoes_estoque FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movimentacoes"
ON public.movimentacoes_estoque FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Políticas RLS para ordens_producao
CREATE POLICY "Users can read their own ordens"
ON public.ordens_producao FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ordens"
ON public.ordens_producao FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ordens"
ON public.ordens_producao FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ordens"
ON public.ordens_producao FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em ordens_producao
CREATE TRIGGER update_ordens_producao_updated_at
BEFORE UPDATE ON public.ordens_producao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar próximo número de ordem por usuário
CREATE OR REPLACE FUNCTION public.get_next_ordem_numero(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(numero), 0) + 1
  FROM public.ordens_producao
  WHERE user_id = _user_id
$$;