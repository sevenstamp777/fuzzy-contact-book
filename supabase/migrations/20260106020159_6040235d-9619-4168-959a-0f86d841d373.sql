
-- Create pedidos_venda table
CREATE TABLE public.pedidos_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_entrega DATE,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itens_pedido table
CREATE TABLE public.itens_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos_venda(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  ordem_producao_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contas table for payables/receivables
CREATE TABLE public.contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- 'pagar' or 'receber'
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
  pedido_id UUID REFERENCES public.pedidos_venda(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;

-- RLS policies for pedidos_venda
CREATE POLICY "Users can read their own pedidos" ON public.pedidos_venda FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pedidos" ON public.pedidos_venda FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pedidos" ON public.pedidos_venda FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pedidos" ON public.pedidos_venda FOR DELETE USING (auth.uid() = user_id);

-- Helper function for itens_pedido RLS
CREATE OR REPLACE FUNCTION public.owns_pedido(_pedido_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pedidos_venda WHERE id = _pedido_id AND user_id = auth.uid()
  )
$$;

-- RLS policies for itens_pedido
CREATE POLICY "Users can read itens for their own pedidos" ON public.itens_pedido FOR SELECT USING (owns_pedido(pedido_id));
CREATE POLICY "Users can insert itens for their own pedidos" ON public.itens_pedido FOR INSERT WITH CHECK (owns_pedido(pedido_id));
CREATE POLICY "Users can update itens for their own pedidos" ON public.itens_pedido FOR UPDATE USING (owns_pedido(pedido_id)) WITH CHECK (owns_pedido(pedido_id));
CREATE POLICY "Users can delete itens for their own pedidos" ON public.itens_pedido FOR DELETE USING (owns_pedido(pedido_id));

-- RLS policies for contas
CREATE POLICY "Users can read their own contas" ON public.contas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contas" ON public.contas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contas" ON public.contas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contas" ON public.contas FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_pedidos_venda_updated_at BEFORE UPDATE ON public.pedidos_venda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_updated_at BEFORE UPDATE ON public.contas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get next pedido numero
CREATE OR REPLACE FUNCTION public.get_next_pedido_numero(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(numero), 0) + 1 FROM public.pedidos_venda WHERE user_id = _user_id
$$;
