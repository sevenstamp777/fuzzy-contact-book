-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN rg text,
ADD COLUMN cpf_cnpj text,
ADD COLUMN inscricao_estadual text,
ADD COLUMN endereco text;

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome_fornecedor TEXT NOT NULL,
  nome_contato TEXT NOT NULL,
  email TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Allow public read access" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.suppliers FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();