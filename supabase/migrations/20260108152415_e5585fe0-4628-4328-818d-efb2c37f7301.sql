-- Add demo tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS demo_loaded boolean DEFAULT false;

-- Add demo flag to track demo data in each table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
ALTER TABLE public.insumos ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;