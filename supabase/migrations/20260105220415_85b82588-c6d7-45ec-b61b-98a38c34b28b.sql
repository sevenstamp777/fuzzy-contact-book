
-- Create enum for unit of measure
CREATE TYPE public.unidade_medida AS ENUM ('un', 'kg', 'ml', 'm');

-- Create insumos table
CREATE TABLE public.insumos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  unidade_medida unidade_medida NOT NULL DEFAULT 'un',
  fornecedor_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  preco_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade_embalagem DECIMAL(10,3) NOT NULL DEFAULT 1,
  custo_unitario DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE WHEN quantidade_embalagem > 0 THEN preco_compra / quantidade_embalagem ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create produtos table
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT,
  margem_lucro DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create produto_insumos junction table
CREATE TABLE public.produto_insumos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  insumo_id UUID NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(produto_id, insumo_id)
);

-- Enable RLS on all tables
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_insumos ENABLE ROW LEVEL SECURITY;

-- RLS policies for insumos
CREATE POLICY "Authenticated users can read insumos"
ON public.insumos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert insumos"
ON public.insumos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update insumos"
ON public.insumos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete insumos"
ON public.insumos FOR DELETE TO authenticated USING (true);

-- RLS policies for produtos
CREATE POLICY "Authenticated users can read produtos"
ON public.produtos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert produtos"
ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update produtos"
ON public.produtos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete produtos"
ON public.produtos FOR DELETE TO authenticated USING (true);

-- RLS policies for produto_insumos
CREATE POLICY "Authenticated users can read produto_insumos"
ON public.produto_insumos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert produto_insumos"
ON public.produto_insumos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update produto_insumos"
ON public.produto_insumos FOR UPDATE TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete produto_insumos"
ON public.produto_insumos FOR DELETE TO authenticated USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_insumos_updated_at
BEFORE UPDATE ON public.insumos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
