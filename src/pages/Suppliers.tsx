import { useState, useEffect, useMemo } from "react";
import { Truck, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SuppliersTable from "@/components/SuppliersTable";
import NewSupplierDialog from "@/components/NewSupplierDialog";
import EditSupplierDialog from "@/components/EditSupplierDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";

interface Supplier {
  id: string;
  nome_fornecedor: string;
  nome_contato: string;
  email: string;
}

const ITEMS_PER_PAGE = 10;

const Suppliers = () => {
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

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (supplier) =>
        supplier.nome_fornecedor.toLowerCase().includes(term) ||
        supplier.nome_contato.toLowerCase().includes(term) ||
        supplier.email.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

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
      const { error } = await supabase
        .from("suppliers")
        .update({
          nome_fornecedor: data.nome_fornecedor,
          nome_contato: data.nome_contato,
          email: data.email,
        })
        .eq("id", id);

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
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", deletingSupplier.id);

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
            <div className="flex items-center gap-2">
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
