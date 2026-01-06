-- Make user_id NOT NULL with default to auth.uid() for clients table
ALTER TABLE public.clients 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Make user_id NOT NULL with default to auth.uid() for suppliers table
ALTER TABLE public.suppliers 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Make user_id NOT NULL with default to auth.uid() for insumos table
ALTER TABLE public.insumos 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Make user_id NOT NULL with default to auth.uid() for produtos table
ALTER TABLE public.produtos 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();