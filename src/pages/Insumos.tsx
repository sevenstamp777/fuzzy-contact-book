import { useState, useEffect, useMemo } from "react";
import { Package, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import InsumosTable from "@/components/InsumosTable";
import NewInsumoDialog from "@/components/NewInsumoDialog";
import EditInsumoDialog from "@/components/EditInsumoDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
import { SortDirection } from "@/components/SortableTableHead";

export interface Insumo {
  id: string;
  nome: string;
  unidade_medida: "un" | "kg" | "ml" | "m";
  fornecedor_id: string | null;
  preco_compra: number;
  quantidade_embalagem: number;
  custo_unitario: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  fornecedor?: { nome_fornecedor: string } | null;
}

export interface Supplier {
  id: string;
  nome_fornecedor: string;
}

const ITEMS_PER_PAGE = 10;

const UNIDADE_LABELS: Record<string, string> = {
  un: "Unidade",
  kg: "Quilograma",
  ml: "Mililitro",
  m: "Metro",
};

const Insumos = () => {
  const { user } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingInsumo, setDeletingInsumo] = useState<Insumo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();

  const fetchInsumos = async () => {
    try {
      const { data, error } = await supabase
        .from("insumos")
        .select(`
          id, nome, unidade_medida, fornecedor_id, preco_compra, quantidade_embalagem, custo_unitario, quantidade_estoque, estoque_minimo,
          fornecedor:suppliers(nome_fornecedor)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInsumos(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar insumos",
        description: "Não foi possível carregar a lista de insumos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("id, nome_fornecedor")
      .order("nome_fornecedor");
    setSuppliers(data || []);
  };

  useEffect(() => {
    fetchInsumos();
    fetchSuppliers();
  }, []);

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

  const sortedInsumos = useMemo(() => {
    if (!sortKey || !sortDirection) return insumos;

    return [...insumos].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortKey === "fornecedor") {
        aValue = a.fornecedor?.nome_fornecedor || "";
        bValue = b.fornecedor?.nome_fornecedor || "";
      } else if (["preco_compra", "quantidade_embalagem", "custo_unitario"].includes(sortKey)) {
        aValue = Number(a[sortKey as keyof Insumo]) || 0;
        bValue = Number(b[sortKey as keyof Insumo]) || 0;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        aValue = (a[sortKey as keyof Insumo] || "").toString().toLowerCase();
        bValue = (b[sortKey as keyof Insumo] || "").toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return String(aValue).localeCompare(String(bValue));
      }
      return String(bValue).localeCompare(String(aValue));
    });
  }, [insumos, sortKey, sortDirection]);

  const filteredInsumos = useMemo(() => {
    if (!searchTerm.trim()) return sortedInsumos;
    const term = searchTerm.toLowerCase();
    return sortedInsumos.filter(
      (insumo) =>
        insumo.nome.toLowerCase().includes(term) ||
        insumo.fornecedor?.nome_fornecedor?.toLowerCase().includes(term) ||
        UNIDADE_LABELS[insumo.unidade_medida]?.toLowerCase().includes(term)
    );
  }, [sortedInsumos, searchTerm]);

  const totalPages = Math.ceil(filteredInsumos.length / pageSize);
  const paginatedInsumos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInsumos.slice(start, start + pageSize);
  }, [filteredInsumos, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleExportCSV = () => {
    const exportData = filteredInsumos.map((i) => ({
      nome: i.nome,
      unidade_medida: UNIDADE_LABELS[i.unidade_medida],
      fornecedor: i.fornecedor?.nome_fornecedor || "-",
      preco_compra: i.preco_compra,
      quantidade_embalagem: i.quantidade_embalagem,
      custo_unitario: i.custo_unitario,
    }));
    exportToCSV(exportData, "insumos", [
      { key: "nome", label: "Nome" },
      { key: "unidade_medida", label: "Unidade de Medida" },
      { key: "fornecedor", label: "Fornecedor" },
      { key: "preco_compra", label: "Preço de Compra" },
      { key: "quantidade_embalagem", label: "Qtd. na Embalagem" },
      { key: "custo_unitario", label: "Custo Unitário" },
    ]);
    toast({
      title: "Exportação concluída!",
      description: `${filteredInsumos.length} insumo(s) exportado(s) para CSV.`,
    });
  };

  const handleCreateInsumo = async (data: {
    nome: string;
    unidade_medida: "un" | "kg" | "ml" | "m";
    fornecedor_id: string | null;
    preco_compra: number;
    quantidade_embalagem: number;
    estoque_minimo: number;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("insumos").insert([{ ...data, user_id: user?.id }]);

      if (error) throw error;

      toast({
        title: "Insumo cadastrado!",
        description: `${data.nome} foi adicionado com sucesso.`,
      });

      await fetchInsumos();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar insumo",
        description: "Não foi possível cadastrar o insumo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInsumo = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setIsEditDialogOpen(true);
  };

  const handleUpdateInsumo = async (
    id: string,
    data: {
      nome: string;
      unidade_medida: "un" | "kg" | "ml" | "m";
      fornecedor_id: string | null;
      preco_compra: number;
      quantidade_embalagem: number;
      estoque_minimo: number;
    }
  ) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("insumos")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Insumo atualizado!",
        description: `${data.nome} foi atualizado com sucesso.`,
      });

      setIsEditDialogOpen(false);
      setEditingInsumo(null);
      await fetchInsumos();
    } catch (error) {
      toast({
        title: "Erro ao atualizar insumo",
        description: "Não foi possível atualizar o insumo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInsumo = (insumo: Insumo) => {
    setDeletingInsumo(insumo);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingInsumo) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("insumos")
        .delete()
        .eq("id", deletingInsumo.id);

      if (error) throw error;

      toast({
        title: "Insumo removido!",
        description: `${deletingInsumo.nome} foi removido com sucesso.`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingInsumo(null);
      await fetchInsumos();
    } catch (error) {
      toast({
        title: "Erro ao remover insumo",
        description: "Não foi possível remover o insumo. Tente novamente.",
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
                Insumos
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie os materiais básicos para seus produtos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-border"
                onClick={handleExportCSV}
                disabled={filteredInsumos.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <NewInsumoDialog
                onSubmit={handleCreateInsumo}
                isSubmitting={isSubmitting}
                suppliers={suppliers}
              />
            </div>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>
                {isLoading
                  ? "Carregando..."
                  : `${filteredInsumos.length} insumo${filteredInsumos.length !== 1 ? "s" : ""} encontrado${filteredInsumos.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, fornecedor..."
              />
            </div>
          </div>

          <InsumosTable
            insumos={paginatedInsumos}
            isLoading={isLoading}
            onEdit={handleEditInsumo}
            onDelete={handleDeleteInsumo}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {!isLoading && filteredInsumos.length > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredInsumos.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </main>

      <EditInsumoDialog
        insumo={editingInsumo}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateInsumo}
        isSubmitting={isSubmitting}
        suppliers={suppliers}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Insumo"
        description={`Tem certeza que deseja excluir o insumo "${deletingInsumo?.nome}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Insumos;
