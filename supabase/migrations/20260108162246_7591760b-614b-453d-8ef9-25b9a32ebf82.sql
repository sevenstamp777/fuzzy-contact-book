-- 1. Adicionar campo de rendimento aos insumos (sem coluna gerada)
ALTER TABLE public.insumos 
ADD COLUMN IF NOT EXISTS usos_por_unidade NUMERIC NOT NULL DEFAULT 1;

-- 2. Atualizar tabela produtos para incluir produto base e tempo de produção
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS produto_base_id UUID,
ADD COLUMN IF NOT EXISTS tempo_producao_minutos NUMERIC NOT NULL DEFAULT 0;

-- 3. Tabela de Produtos Base (canecas, camisetas, etc.)
CREATE TABLE public.produtos_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  custo_aquisicao NUMERIC NOT NULL DEFAULT 0,
  fornecedor_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Adicionar FK após criar a tabela
ALTER TABLE public.produtos 
ADD CONSTRAINT fk_produtos_produto_base 
FOREIGN KEY (produto_base_id) REFERENCES public.produtos_base(id) ON DELETE SET NULL;

-- 5. Tabela de Despesas Fixas
CREATE TABLE public.despesas_fixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'outros',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Tabela de Configuração de Custos (custo hora, etc.)
CREATE TABLE public.configuracao_custos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  custo_hora_trabalho NUMERIC NOT NULL DEFAULT 0,
  horas_trabalho_mes NUMERIC NOT NULL DEFAULT 176,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. RLS para produtos_base
ALTER TABLE public.produtos_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own produtos_base" 
ON public.produtos_base FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own produtos_base" 
ON public.produtos_base FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own produtos_base" 
ON public.produtos_base FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own produtos_base" 
ON public.produtos_base FOR DELETE 
USING (auth.uid() = user_id);

-- 8. RLS para despesas_fixas
ALTER TABLE public.despesas_fixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own despesas_fixas" 
ON public.despesas_fixas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own despesas_fixas" 
ON public.despesas_fixas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own despesas_fixas" 
ON public.despesas_fixas FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own despesas_fixas" 
ON public.despesas_fixas FOR DELETE 
USING (auth.uid() = user_id);

-- 9. RLS para configuracao_custos
ALTER TABLE public.configuracao_custos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own configuracao_custos" 
ON public.configuracao_custos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own configuracao_custos" 
ON public.configuracao_custos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own configuracao_custos" 
ON public.configuracao_custos FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own configuracao_custos" 
ON public.configuracao_custos FOR DELETE 
USING (auth.uid() = user_id);

-- 10. Triggers para updated_at
CREATE TRIGGER update_produtos_base_updated_at
BEFORE UPDATE ON public.produtos_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_despesas_fixas_updated_at
BEFORE UPDATE ON public.despesas_fixas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracao_custos_updated_at
BEFORE UPDATE ON public.configuracao_custos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();