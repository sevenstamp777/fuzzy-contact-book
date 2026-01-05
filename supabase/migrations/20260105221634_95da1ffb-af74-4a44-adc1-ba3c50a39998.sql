
-- Drop existing RESTRICTIVE policies on clients table
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;

-- Create new PERMISSIVE policies for clients
CREATE POLICY "Authenticated users can read clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (true);

-- Drop existing RESTRICTIVE policies on suppliers table
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;

-- Create new PERMISSIVE policies for suppliers
CREATE POLICY "Authenticated users can read suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suppliers"
ON public.suppliers
FOR DELETE
TO authenticated
USING (true);

-- Drop existing RESTRICTIVE policies on insumos table
DROP POLICY IF EXISTS "Authenticated users can delete insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can insert insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can read insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can update insumos" ON public.insumos;

-- Create new PERMISSIVE policies for insumos
CREATE POLICY "Authenticated users can read insumos"
ON public.insumos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert insumos"
ON public.insumos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update insumos"
ON public.insumos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete insumos"
ON public.insumos
FOR DELETE
TO authenticated
USING (true);

-- Drop existing RESTRICTIVE policies on produtos table
DROP POLICY IF EXISTS "Authenticated users can delete produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can insert produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can read produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can update produtos" ON public.produtos;

-- Create new PERMISSIVE policies for produtos
CREATE POLICY "Authenticated users can read produtos"
ON public.produtos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert produtos"
ON public.produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update produtos"
ON public.produtos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete produtos"
ON public.produtos
FOR DELETE
TO authenticated
USING (true);

-- Drop existing RESTRICTIVE policies on produto_insumos table
DROP POLICY IF EXISTS "Authenticated users can delete produto_insumos" ON public.produto_insumos;
DROP POLICY IF EXISTS "Authenticated users can insert produto_insumos" ON public.produto_insumos;
DROP POLICY IF EXISTS "Authenticated users can read produto_insumos" ON public.produto_insumos;
DROP POLICY IF EXISTS "Authenticated users can update produto_insumos" ON public.produto_insumos;

-- Create new PERMISSIVE policies for produto_insumos
CREATE POLICY "Authenticated users can read produto_insumos"
ON public.produto_insumos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert produto_insumos"
ON public.produto_insumos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update produto_insumos"
ON public.produto_insumos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete produto_insumos"
ON public.produto_insumos
FOR DELETE
TO authenticated
USING (true);

-- Fix profiles policies as well
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
