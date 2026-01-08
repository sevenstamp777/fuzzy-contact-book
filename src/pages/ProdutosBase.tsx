import { useState, useEffect, useMemo } from "react";
import { Box, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
import { SortDirection } from "@/components/SortableTableHead";
import ProdutosBaseTable from "@/components/ProdutosBaseTable";
import NewProdutoBaseDialog from "@/components/NewProdutoBaseDialog";
import EditProdutoBaseDialog from "@/components/EditProdutoBaseDialog";

export interface Supplier {
  id: string;
  nome_fornecedor: string;
}

export interface ProdutoBase {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  custo_aquisicao: number;
  fornecedor_id: string | null;
  fornecedor?: { nome_fornecedor: string } | null;
}

const ITEMS_PER_PAGE = 10;

const ProdutosBase = () => {
  const { user } = useAuth();
  const [produtosBase, setProdutosBase] = useState<ProdutoBase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduto, setEditingProduto] = useState<ProdutoBase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProduto, setDeletingProduto] = useState<ProdutoBase | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();

  const fetchProdutosBase = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("produtos_base")
        .select(`
          id, nome, descricao, categoria, custo_aquisicao, fornecedor_id,
          fornecedor:suppliers(nome_fornecedor)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProdutosBase(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos base",
        description: "Não foi possível carregar a lista de produtos base.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from("suppliers")
      .select("id, nome_fornecedor")
      .eq("user_id", user.id)
      .order("nome_fornecedor");
    setSuppliers(data || []);
  };

  useEffect(() => {
    if (user?.id) {
      fetchProdutosBase();
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

  const sortedProdutos = useMemo(() => {
    if (!sortKey || !sortDirection) return produtosBase;

    return [...produtosBase].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortKey === "fornecedor") {
        aValue = a.fornecedor?.nome_fornecedor || "";
        bValue = b.fornecedor?.nome_fornecedor || "";
      } else if (sortKey === "custo_aquisicao") {
        aValue = Number(a.custo_aquisicao) || 0;
        bValue = Number(b.custo_aquisicao) || 0;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        aValue = (a[sortKey as keyof ProdutoBase] ?? "").toString().toLowerCase();
        bValue = (b[sortKey as keyof ProdutoBase] ?? "").toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return String(aValue).localeCompare(String(bValue));
      }
      return String(bValue).localeCompare(String(aValue));
    });
  }, [produtosBase, sortKey, sortDirection]);

  const filteredProdutos = useMemo(() => {
    if (!searchTerm.trim()) return sortedProdutos;
    const term = searchTerm.toLowerCase();
    return sortedProdutos.filter(
      (p) =>
        (p.nome ?? "").toLowerCase().includes(term) ||
        (p.categoria ?? "").toLowerCase().includes(term) ||
        (p.fornecedor?.nome_fornecedor ?? "").toLowerCase().includes(term)
    );
  }, [sortedProdutos, searchTerm]);

  const totalPages = Math.ceil(filteredProdutos.length / pageSize);
  const paginatedProdutos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProdutos.slice(start, start + pageSize);
  }, [filteredProdutos, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleExportCSV = () => {
    const exportData = filteredProdutos.map((p) => ({
      nome: p.nome,
      categoria: p.categoria || "-",
      descricao: p.descricao || "-",
      custo_aquisicao: p.custo_aquisicao,
      fornecedor: p.fornecedor?.nome_fornecedor || "-",
    }));
    exportToCSV(exportData, "produtos_base", [
      { key: "nome", label: "Nome" },
      { key: "categoria", label: "Categoria" },
      { key: "descricao", label: "Descrição" },
      { key: "custo_aquisicao", label: "Custo de Aquisição (R$)" },
      { key: "fornecedor", label: "Fornecedor" },
    ]);
    toast({
      title: "Exportação concluída!",
      description: `${filteredProdutos.length} produto(s) base exportado(s) para CSV.`,
    });
  };

  const handleCreateProduto = async (data: {
    nome: string;
    categoria: string | null;
    descricao: string | null;
    custo_aquisicao: number;
    fornecedor_id: string | null;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("produtos_base").insert([{ ...data, user_id: user?.id }]);

      if (error) throw error;

      toast({
        title: "Produto base cadastrado!",
        description: `${data.nome} foi adicionado com sucesso.`,
      });

      await fetchProdutosBase();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar produto base",
        description: "Não foi possível cadastrar o produto base. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduto = (produto: ProdutoBase) => {
    setEditingProduto(produto);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduto = async (
    id: string,
    data: {
      nome: string;
      categoria: string | null;
      descricao: string | null;
      custo_aquisicao: number;
      fornecedor_id: string | null;
    }
  ) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("produtos_base")
        .update(data)
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Produto base atualizado!",
        description: `${data.nome} foi atualizado com sucesso.`,
      });

      setIsEditDialogOpen(false);
      setEditingProduto(null);
      await fetchProdutosBase();
    } catch (error) {
      toast({
        title: "Erro ao atualizar produto base",
        description: "Não foi possível atualizar o produto base. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduto = (produto: ProdutoBase) => {
    setDeletingProduto(produto);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduto) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("produtos_base")
        .delete()
        .eq("id", deletingProduto.id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Produto base removido!",
        description: `${deletingProduto.nome} foi removido com sucesso.`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingProduto(null);
      await fetchProdutosBase();
    } catch (error) {
      toast({
        title: "Erro ao remover produto base",
        description: "Não foi possível remover o produto base. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Produtos Base
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie seus produtos base (canecas, camisetas, chaveiros, etc.).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-border"
                onClick={handleExportCSV}
                disabled={filteredProdutos.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <NewProdutoBaseDialog
                onSubmit={handleCreateProduto}
                isSubmitting={isSubmitting}
                suppliers={suppliers}
              />
            </div>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="h-4 w-4" />
              <span>
                {isLoading
                  ? "Carregando..."
                  : `${filteredProdutos.length} produto${filteredProdutos.length !== 1 ? "s" : ""} base encontrado${filteredProdutos.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, categoria..."
              />
            </div>
          </div>

          <ProdutosBaseTable
            produtos={paginatedProdutos}
            isLoading={isLoading}
            onEdit={handleEditProduto}
            onDelete={handleDeleteProduto}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {!isLoading && filteredProdutos.length > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredProdutos.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>

      <EditProdutoBaseDialog
        produto={editingProduto}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateProduto}
        isSubmitting={isSubmitting}
        suppliers={suppliers}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Produto Base"
        description={`Tem certeza que deseja excluir o produto base "${deletingProduto?.nome}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </main>
  );
};

export default ProdutosBase;