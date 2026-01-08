import { useState, useEffect, useMemo } from "react";
import { Truck, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import Header from "@/components/Header";
import SuppliersTable from "@/components/SuppliersTable";
import NewSupplierDialog from "@/components/NewSupplierDialog";
import EditSupplierDialog from "@/components/EditSupplierDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import ImportCSVDialog from "@/components/ImportCSVDialog";
import DemoBanner from "@/components/DemoBanner";
import LoadDemoPrompt from "@/components/LoadDemoPrompt";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
import { SortDirection } from "@/components/SortableTableHead";

interface Supplier {
  id: string;
  nome_fornecedor: string;
  nome_contato: string;
  email: string;
}

const ITEMS_PER_PAGE = 10;
const MAX_IMPORT_ROWS = 200;

const Suppliers = () => {
  const { user } = useAuth();
  const { isDemoMode, hasDemoData, isLoadingDemo, loadDemoData, clearDemoData, checkDemoStatus } = useDemo();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Defense in depth: filter by user_id even though RLS handles it
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, nome_fornecedor, nome_contato, email")
        .eq("user_id", user.id)
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
    if (user?.id) {
      fetchSuppliers();
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

  const sortedSuppliers = useMemo(() => {
    if (!sortKey || !sortDirection) return suppliers;

    return [...suppliers].sort((a, b) => {
      const aValue = (a[sortKey as keyof Supplier] ?? "").toString().toLowerCase();
      const bValue = (b[sortKey as keyof Supplier] ?? "").toString().toLowerCase();

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  }, [suppliers, sortKey, sortDirection]);

  // Safe search with null checks on all fields
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return sortedSuppliers;
    const term = searchTerm.toLowerCase();
    return sortedSuppliers.filter(
      (supplier) =>
        (supplier.nome_fornecedor ?? "").toLowerCase().includes(term) ||
        (supplier.nome_contato ?? "").toLowerCase().includes(term) ||
        (supplier.email ?? "").toLowerCase().includes(term)
    );
  }, [sortedSuppliers, searchTerm]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleExportCSV = () => {
    exportToCSV(filteredSuppliers, "fornecedores", [
      { key: "nome_fornecedor", label: "Nome do Fornecedor" },
      { key: "nome_contato", label: "Nome do Contato" },
      { key: "email", label: "Email" },
    ]);
    toast({
      title: "Exportação concluída!",
      description: `${filteredSuppliers.length} fornecedor(es) exportado(s) para CSV.`,
    });
  };

  const handleImportSuppliers = async (data: Record<string, string>[]): Promise<{ success: number; errors: string[] }> => {
    const errors: string[] = [];

    // Limit check: max rows per import
    if (data.length > MAX_IMPORT_ROWS) {
      errors.push(`Limite máximo de ${MAX_IMPORT_ROWS} registros por importação. Você enviou ${data.length}.`);
      return { success: 0, errors };
    }

    // Validate and prepare batch
    const validRows: Record<string, string>[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const nome = row.nome_fornecedor?.trim() || row.nome?.trim();
      if (!nome || nome.length < 2) {
        errors.push(`Linha ${i + 1}: Nome do fornecedor é obrigatório (mínimo 2 caracteres)`);
      } else {
        validRows.push(row);
      }
    }

    if (validRows.length === 0) {
      return { success: 0, errors };
    }

    // Prepare batch insert
    const suppliersToInsert = validRows.map(row => ({
      nome_fornecedor: (row.nome_fornecedor?.trim() || row.nome?.trim() || "").substring(0, 255),
      nome_contato: (row.nome_contato?.trim() || row.contato?.trim() || "").substring(0, 255),
      email: (row.email?.trim() || "").substring(0, 255),
      user_id: user?.id,
    }));

    try {
      const { error } = await supabase.from("suppliers").insert(suppliersToInsert);

      if (error) {
        errors.push(`Erro ao inserir: ${error.message}`);
        return { success: 0, errors };
      }

      await fetchSuppliers();
      return { success: suppliersToInsert.length, errors };
    } catch (err) {
      errors.push("Erro desconhecido ao inserir fornecedores");
      return { success: 0, errors };
    }
  };

  const supplierColumns = [
    { key: "nome_fornecedor", label: "Nome do Fornecedor", required: true },
    { key: "nome_contato", label: "Nome do Contato", required: true },
    { key: "email", label: "Email", required: true },
  ];

  const templateData = {
    nome_fornecedor: "Fornecedor ABC",
    nome_contato: "Maria Silva",
    email: "contato@fornecedor.com",
  };

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
          user_id: user?.id,
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

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSupplier = async (
    id: string,
    data: {
      nome_fornecedor: string;
      nome_contato: string;
      email: string;
    }
  ) => {
    setIsSubmitting(true);
    try {
      // Defense in depth: ensure we're updating our own supplier
      const { error } = await supabase
        .from("suppliers")
        .update({
          nome_fornecedor: data.nome_fornecedor,
          nome_contato: data.nome_contato,
          email: data.email,
        })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Fornecedor atualizado!",
        description: `${data.nome_fornecedor} foi atualizado com sucesso.`,
      });

      setIsEditDialogOpen(false);
      setEditingSupplier(null);
      await fetchSuppliers();
    } catch (error) {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: "Não foi possível atualizar o fornecedor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;

    setIsDeleting(true);
    try {
      // Defense in depth: ensure we're deleting our own supplier
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", deletingSupplier.id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Fornecedor removido!",
        description: `${deletingSupplier.nome_fornecedor} foi removido com sucesso.`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingSupplier(null);
      await fetchSuppliers();
    } catch (error) {
      toast({
        title: "Erro ao remover fornecedor",
        description: "Não foi possível remover o fornecedor. Tente novamente.",
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
                Fornecedores
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie todos os seus fornecedores em um só lugar.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ImportCSVDialog
                onImport={handleImportSuppliers}
                columns={supplierColumns}
                entityName="Fornecedores"
                templateData={templateData}
              />
              <Button
                variant="outline"
                className="gap-2 border-border"
                onClick={handleExportCSV}
                disabled={filteredSuppliers.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <NewSupplierDialog
                onSubmit={handleCreateSupplier}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <DemoBanner 
            onClearDemo={async () => {
              await clearDemoData();
              await fetchSuppliers();
              await checkDemoStatus();
            }} 
            isClearing={isLoadingDemo} 
          />
        )}

        {/* Load demo prompt for empty state */}
        {!isLoading && suppliers.length === 0 && !hasDemoData && (
          <LoadDemoPrompt 
            onLoadDemo={async () => {
              await loadDemoData();
              await fetchSuppliers();
              await checkDemoStatus();
            }}
            isLoading={isLoadingDemo}
            entityName="fornecedores, clientes, insumos e produtos"
          />
        )}

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>
                {isLoading
                  ? "Carregando..."
                  : `${filteredSuppliers.length} fornecedor${filteredSuppliers.length !== 1 ? "es" : ""} encontrado${filteredSuppliers.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, contato, email..."
              />
            </div>
          </div>

          <SuppliersTable
            suppliers={paginatedSuppliers}
            isLoading={isLoading}
            onEdit={handleEditSupplier}
            onDelete={handleDeleteSupplier}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {!isLoading && filteredSuppliers.length > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredSuppliers.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </main>

      <EditSupplierDialog
        supplier={editingSupplier}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateSupplier}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${deletingSupplier?.nome_fornecedor}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Suppliers;
