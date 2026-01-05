import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ClientsTable from "@/components/ClientsTable";
import NewClientDialog from "@/components/NewClientDialog";
import EditClientDialog from "@/components/EditClientDialog";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  rg: string | null;
  cpf_cnpj: string | null;
  inscricao_estadual: string | null;
  endereco: string | null;
}

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone, rg, cpf_cnpj, inscricao_estadual, endereco")
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
    rg: string;
    cpf_cnpj: string;
    inscricao_estadual?: string;
    endereco: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("clients").insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          rg: data.rg,
          cpf_cnpj: data.cpf_cnpj,
          inscricao_estadual: data.inscricao_estadual || null,
          endereco: data.endereco,
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

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async (
    id: string,
    data: {
      name: string;
      email: string;
      phone: string;
      rg: string;
      cpf_cnpj: string;
      inscricao_estadual?: string;
      endereco: string;
    }
  ) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          rg: data.rg,
          cpf_cnpj: data.cpf_cnpj,
          inscricao_estadual: data.inscricao_estadual || null,
          endereco: data.endereco,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
      });

      setIsEditDialogOpen(false);
      setEditingClient(null);
      await fetchClients();
    } catch (error) {
      toast({
        title: "Erro ao atualizar cliente",
        description: "Não foi possível atualizar o cliente. Tente novamente.",
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

          <ClientsTable clients={clients} isLoading={isLoading} onEdit={handleEditClient} />
        </div>
      </main>

      <EditClientDialog
        client={editingClient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateClient}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Index;
