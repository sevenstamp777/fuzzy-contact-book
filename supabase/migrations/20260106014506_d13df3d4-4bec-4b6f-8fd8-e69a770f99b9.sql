-- Adicionar coluna user_id às tabelas existentes
ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.insumos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.produtos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remover políticas antigas (permissivas demais)
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;

DROP POLICY IF EXISTS "Authenticated users can read insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can insert insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can update insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can delete insumos" ON public.insumos;

DROP POLICY IF EXISTS "Authenticated users can read produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can insert produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can update produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can delete produtos" ON public.produtos;

DROP POLICY IF EXISTS "Authenticated users can read produto_insumos" ON public.produto_insumos;
DROP POLICY IF EXISTS "Authenticated users can insert produto_insumos" ON public.produto_insumos;
DROP POLICY IF EXISTS "Authenticated users can update produto_insumos" ON public.produto_insumos;
DROP POLICY IF EXISTS "Authenticated users can delete produto_insumos" ON public.produto_insumos;

-- Criar novas políticas RLS para clients (isolamento por user_id)
CREATE POLICY "Users can read their own clients"
ON public.clients FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Criar novas políticas RLS para suppliers (isolamento por user_id)
CREATE POLICY "Users can read their own suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suppliers"
ON public.suppliers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
ON public.suppliers FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
ON public.suppliers FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Criar novas políticas RLS para insumos (isolamento por user_id)
CREATE POLICY "Users can read their own insumos"
ON public.insumos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insumos"
ON public.insumos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insumos"
ON public.insumos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insumos"
ON public.insumos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Criar novas políticas RLS para produtos (isolamento por user_id)
CREATE POLICY "Users can read their own produtos"
ON public.produtos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own produtos"
ON public.produtos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own produtos"
ON public.produtos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own produtos"
ON public.produtos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Criar função auxiliar para verificar propriedade de produto
CREATE OR REPLACE FUNCTION public.owns_produto(_produto_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.produtos
    WHERE id = _produto_id
      AND user_id = auth.uid()
  )
$$;

-- Criar novas políticas RLS para produto_insumos (baseado na propriedade do produto)
CREATE POLICY "Users can read produto_insumos for their own produtos"
ON public.produto_insumos FOR SELECT
TO authenticated
USING (public.owns_produto(produto_id));

CREATE POLICY "Users can insert produto_insumos for their own produtos"
ON public.produto_insumos FOR INSERT
TO authenticated
WITH CHECK (public.owns_produto(produto_id));

CREATE POLICY "Users can update produto_insumos for their own produtos"
ON public.produto_insumos FOR UPDATE
TO authenticated
USING (public.owns_produto(produto_id))
WITH CHECK (public.owns_produto(produto_id));

CREATE POLICY "Users can delete produto_insumos for their own produtos"
ON public.produto_insumos FOR DELETE
TO authenticated
USING (public.owns_produto(produto_id));