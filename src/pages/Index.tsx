import { useState, useEffect, useMemo } from "react";
import { Users, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ClientsTable from "@/components/ClientsTable";
import NewClientDialog from "@/components/NewClientDialog";
import EditClientDialog from "@/components/EditClientDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";

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

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
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

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.toLowerCase().includes(term) ||
        (client.cpf_cnpj && client.cpf_cnpj.toLowerCase().includes(term))
    );
  }, [clients, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleExportCSV = () => {
    exportToCSV(filteredClients, "clientes", [
      { key: "name", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telefone" },
      { key: "rg", label: "RG" },
      { key: "cpf_cnpj", label: "CPF/CNPJ" },
      { key: "inscricao_estadual", label: "IE" },
      { key: "endereco", label: "Endereço" },
    ]);
    toast({
      title: "Exportação concluída!",
      description: `${filteredClients.length} cliente(s) exportado(s) para CSV.`,
    });
  };

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

  const handleDeleteClient = (client: Client) => {
    setDeletingClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", deletingClient.id);

      if (error) throw error;

      toast({
        title: "Cliente removido!",
        description: `${deletingClient.name} foi removido com sucesso.`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingClient(null);
      await fetchClients();
    } catch (error) {
      toast({
        title: "Erro ao remover cliente",
        description: "Não foi possível remover o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-border"
                onClick={handleExportCSV}
                disabled={filteredClients.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <NewClientDialog
                onSubmit={handleCreateClient}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {isLoading
                  ? "Carregando..."
                  : `${filteredClients.length} cliente${filteredClients.length !== 1 ? "s" : ""} encontrado${filteredClients.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, email, telefone..."
              />
            </div>
          </div>

          <ClientsTable
            clients={paginatedClients}
            isLoading={isLoading}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />

          {!isLoading && filteredClients.length > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredClients.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </main>

      <EditClientDialog
        client={editingClient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateClient}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente "${deletingClient?.name}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Index;
