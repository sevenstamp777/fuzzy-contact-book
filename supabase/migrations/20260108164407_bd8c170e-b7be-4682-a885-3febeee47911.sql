-- Add CNPJ, telefone and endereco fields to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS endereco text;