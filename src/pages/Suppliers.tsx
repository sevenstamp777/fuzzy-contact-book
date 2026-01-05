import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SuppliersTable from "@/components/SuppliersTable";
import NewSupplierDialog from "@/components/NewSupplierDialog";

interface Supplier {
  id: string;
  nome_fornecedor: string;
  nome_contato: string;
  email: string;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, nome_fornecedor, nome_contato, email")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar fornecedores",
        description: "Não foi possível carregar a lista de fornecedores.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (data: {
    nome_fornecedor: string;
    nome_contato: string;
    email: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("suppliers").insert([
        {
          nome_fornecedor: data.nome_fornecedor,
          nome_contato: data.nome_contato,
          email: data.email,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Fornecedor cadastrado!",
        description: `${data.nome_fornecedor} foi adicionado com sucesso.`,
      });

      await fetchSuppliers();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar fornecedor",
        description: "Não foi possível cadastrar o fornecedor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Fornecedores
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie todos os seus fornecedores em um só lugar.
              </p>
            </div>
            <NewSupplierDialog
              onSubmit={handleCreateSupplier}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>
              {isLoading
                ? "Carregando..."
                : `${suppliers.length} fornecedor${suppliers.length !== 1 ? "es" : ""} cadastrado${suppliers.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          <SuppliersTable suppliers={suppliers} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Suppliers;
