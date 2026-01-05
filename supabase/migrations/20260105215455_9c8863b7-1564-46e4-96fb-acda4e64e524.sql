-- Drop existing public policies on clients table
DROP POLICY IF EXISTS "Allow public delete access" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert access" ON public.clients;
DROP POLICY IF EXISTS "Allow public read access" ON public.clients;
DROP POLICY IF EXISTS "Allow public update access" ON public.clients;

-- Create new authenticated-only policies for clients
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
USING (true);

CREATE POLICY "Authenticated users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (true);

-- Drop existing public policies on suppliers table
DROP POLICY IF EXISTS "Allow public delete access" ON public.suppliers;
DROP POLICY IF EXISTS "Allow public insert access" ON public.suppliers;
DROP POLICY IF EXISTS "Allow public read access" ON public.suppliers;
DROP POLICY IF EXISTS "Allow public update access" ON public.suppliers;

-- Create new authenticated-only policies for suppliers
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
USING (true);

CREATE POLICY "Authenticated users can delete suppliers"
ON public.suppliers
FOR DELETE
TO authenticated
USING (true);