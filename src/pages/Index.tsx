import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ClientsTable from "@/components/ClientsTable";
import NewClientDialog from "@/components/NewClientDialog";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (data: {
    name: string;
    email: string;
    phone: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("clients").insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Cliente cadastrado!",
        description: `${data.name} foi adicionado com sucesso.`,
      });

      await fetchClients();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar cliente",
        description: "Não foi possível cadastrar o cliente. Tente novamente.",
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
                Clientes
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie todos os seus clientes em um só lugar.
              </p>
            </div>
            <NewClientDialog
              onSubmit={handleCreateClient}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {isLoading
                ? "Carregando..."
                : `${clients.length} cliente${clients.length !== 1 ? "s" : ""} cadastrado${clients.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          <ClientsTable clients={clients} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Index;
