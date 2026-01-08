import { useState, useEffect, useMemo } from "react";
import { Users, Download, AlertTriangle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import Header from "@/components/Header";
import ClientsTable from "@/components/ClientsTable";
import NewClientDialog from "@/components/NewClientDialog";
import EditClientDialog from "@/components/EditClientDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import ImportCSVDialog from "@/components/ImportCSVDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportToCSV } from "@/lib/export";
import { SortDirection } from "@/components/SortableTableHead";

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
const MAX_IMPORT_ROWS = 200;

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { limits, canCreateCliente, plan } = useSubscription();
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
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();

  // Check if user can create more clients based on plan limits
  const canCreate = canCreateCliente(clients.length);
  const clientLimit = limits.clientes === -1 ? "Ilimitado" : limits.clientes;

  const fetchClients = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Defense in depth: filter by user_id even though RLS handles it
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone, rg, cpf_cnpj, inscricao_estadual, endereco")
        .eq("user_id", user.id)
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
    if (user?.id) {
      fetchClients();
    }
  }, [user?.id]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedClients = useMemo(() => {
    if (!sortKey || !sortDirection) return clients;

    return [...clients].sort((a, b) => {
      const aValue = (a[sortKey as keyof Client] ?? "").toString().toLowerCase();
      const bValue = (b[sortKey as keyof Client] ?? "").toString().toLowerCase();

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  }, [clients, sortKey, sortDirection]);

  // Safe search with null checks on all fields
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return sortedClients;
    const term = searchTerm.toLowerCase();
    return sortedClients.filter(
      (client) =>
        (client.name ?? "").toLowerCase().includes(term) ||
        (client.email ?? "").toLowerCase().includes(term) ||
        (client.phone ?? "").toLowerCase().includes(term) ||
        (client.cpf_cnpj ?? "").toLowerCase().includes(term) ||
        (client.rg ?? "").toLowerCase().includes(term) ||
        (client.inscricao_estadual ?? "").toLowerCase().includes(term)
    );
  }, [sortedClients, searchTerm]);

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

  // Validate a single client row before import
  const validateClientRow = (row: Record<string, string>): string | null => {
    const name = row.name?.trim() || row.nome?.trim();
    if (!name || name.length < 2) {
      return "Nome é obrigatório (mínimo 2 caracteres)";
    }

    const email = row.email?.trim();
    const phone = row.phone?.trim() || row.telefone?.trim();
    
    // Must have at least email or phone
    if (!email && !phone) {
      return "É necessário informar email ou telefone";
    }

    // Basic email format validation if provided
    if (email && !email.includes("@")) {
      return "Formato de email inválido";
    }

    return null;
  };

  const handleImportClients = async (data: Record<string, string>[]): Promise<{ success: number; errors: string[] }> => {
    const errors: string[] = [];

    // Limit check: max rows per import
    if (data.length > MAX_IMPORT_ROWS) {
      errors.push(`Limite máximo de ${MAX_IMPORT_ROWS} registros por importação. Você enviou ${data.length}.`);
      return { success: 0, errors };
    }

    // Plan limit check
    const availableSlots = limits.clientes === -1 
      ? Infinity 
      : limits.clientes - clients.length;
    
    if (data.length > availableSlots) {
      errors.push(`Seu plano permite mais ${availableSlots} cliente(s). Você tentou importar ${data.length}.`);
      return { success: 0, errors };
    }

    // Validate all rows first
    const validRows: Record<string, string>[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const validationError = validateClientRow(row);
      if (validationError) {
        errors.push(`Linha ${i + 1} (${row.name || row.nome || "sem nome"}): ${validationError}`);
      } else {
        validRows.push(row);
      }
    }

    if (validRows.length === 0) {
      return { success: 0, errors };
    }

    // Prepare batch insert
    const clientsToInsert = validRows.map(row => ({
      name: (row.name?.trim() || row.nome?.trim() || "").substring(0, 255),
      email: (row.email?.trim() || "").substring(0, 255),
      phone: (row.phone?.trim() || row.telefone?.trim() || "").substring(0, 50),
      rg: (row.rg?.trim() || null)?.substring(0, 20) || null,
      cpf_cnpj: (row.cpf_cnpj?.trim() || row.cpf?.trim() || row.cnpj?.trim() || null)?.substring(0, 20) || null,
      inscricao_estadual: (row.inscricao_estadual?.trim() || row.ie?.trim() || null)?.substring(0, 20) || null,
      endereco: (row.endereco?.trim() || null)?.substring(0, 500) || null,
      user_id: user?.id,
    }));

    // Batch insert (more efficient than row-by-row)
    try {
      const { error } = await supabase.from("clients").insert(clientsToInsert);

      if (error) {
        errors.push(`Erro ao inserir: ${error.message}`);
        return { success: 0, errors };
      }

      await fetchClients();
      return { success: clientsToInsert.length, errors };
    } catch (err) {
      errors.push("Erro desconhecido ao inserir clientes");
      return { success: 0, errors };
    }
  };

  const clientColumns = [
    { key: "name", label: "Nome", required: true },
    { key: "email", label: "Email", required: true },
    { key: "phone", label: "Telefone", required: true },
    { key: "rg", label: "RG" },
    { key: "cpf_cnpj", label: "CPF/CNPJ" },
    { key: "inscricao_estadual", label: "IE" },
    { key: "endereco", label: "Endereço" },
  ];

  const templateData = {
    name: "João da Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999",
    rg: "12.345.678-9",
    cpf_cnpj: "123.456.789-00",
    inscricao_estadual: "",
    endereco: "Rua Exemplo, 123",
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
    // Check plan limit before creating
    if (!canCreate) {
      toast({
        title: "Limite atingido",
        description: `Seu plano permite até ${clientLimit} clientes. Faça upgrade para cadastrar mais.`,
        variant: "destructive",
      });
      return;
    }

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
          user_id: user?.id,
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
      // Defense in depth: ensure we're updating our own client
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
        .eq("id", id)
        .eq("user_id", user?.id);

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
      // Defense in depth: ensure we're deleting our own client
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", deletingClient.id)
        .eq("user_id", user?.id);

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
            <div className="flex items-center gap-2 flex-wrap">
              <ImportCSVDialog
                onImport={handleImportClients}
                columns={clientColumns}
                entityName="Clientes"
                templateData={templateData}
              />
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

        {/* Plan limit alert */}
        {!canCreate && (
          <Alert className="mb-4 border-destructive bg-destructive/10">
            <Crown className="h-4 w-4 text-destructive" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Limite de {limits.clientes} clientes atingido no plano <strong className="capitalize">{plan}</strong>.
              </span>
              <Button size="sm" onClick={() => navigate("/planos")}>
                Fazer Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage indicator */}
        {limits.clientes !== -1 && canCreate && (
          <Alert className="mb-4 border-muted">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você tem {clients.length} de {limits.clientes} clientes cadastrados no plano {plan}.
            </AlertDescription>
          </Alert>
        )}

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
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
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
