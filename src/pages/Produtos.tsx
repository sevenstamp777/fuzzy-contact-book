import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import ProdutosTable from "@/components/ProdutosTable";
import NewProdutoDialog from "@/components/NewProdutoDialog";
import EditProdutoDialog from "@/components/EditProdutoDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
import { SortDirection } from "@/components/SortableTableHead";

export interface Insumo {
  id: string;
  nome: string;
  unidade_medida: string;
  custo_unitario: number;
}

export interface ProdutoInsumo {
  id: string;
  insumo_id: string;
  quantidade: number;
  insumo?: Insumo;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  margem_lucro: number;
  produto_insumos?: ProdutoInsumo[];
}

const ITEMS_PER_PAGE = 10;

const Produtos = () => {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProduto, setDeletingProduto] = useState<Produto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          id, nome, categoria, descricao, margem_lucro,
          produto_insumos(id, insumo_id, quantidade, insumo:insumos(id, nome, unidade_medida, custo_unitario))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInsumos = async () => {
    const { data } = await supabase
      .from("insumos")
      .select("id, nome, unidade_medida, custo_unitario")
      .order("nome");
    setInsumos(data || []);
  };

  useEffect(() => {
    fetchProdutos();
    fetchInsumos();
  }, []);

  const calcularCustoTotal = (produto: Produto) => {
    if (!produto.produto_insumos) return 0;
    return produto.produto_insumos.reduce((total, pi) => {
      const custoInsumo = Number(pi.insumo?.custo_unitario || 0);
      return total + custoInsumo * Number(pi.quantidade);
    }, 0);
  };

  const calcularPrecoVenda = (produto: Produto) => {
    const custoTotal = calcularCustoTotal(produto);
    const margem = Number(produto.margem_lucro) / 100;
    return custoTotal * (1 + margem);
  };

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
    if (!sortKey || !sortDirection) return produtos;

    return [...produtos].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortKey === "custo_total") {
        aValue = calcularCustoTotal(a);
        bValue = calcularCustoTotal(b);
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else if (sortKey === "preco_venda") {
        aValue = calcularPrecoVenda(a);
        bValue = calcularPrecoVenda(b);
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else if (sortKey === "margem_lucro") {
        aValue = Number(a.margem_lucro);
        bValue = Number(b.margem_lucro);
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        aValue = (a[sortKey as keyof Produto] || "").toString().toLowerCase();
        bValue = (b[sortKey as keyof Produto] || "").toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return String(aValue).localeCompare(String(bValue));
      }
      return String(bValue).localeCompare(String(aValue));
    });
  }, [produtos, sortKey, sortDirection]);

  const filteredProdutos = useMemo(() => {
    if (!searchTerm.trim()) return sortedProdutos;
    const term = searchTerm.toLowerCase();
    return sortedProdutos.filter(
      (produto) =>
        produto.nome.toLowerCase().includes(term) ||
        produto.categoria?.toLowerCase().includes(term) ||
        produto.descricao?.toLowerCase().includes(term)
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
      custo_total: calcularCustoTotal(p).toFixed(2),
      margem_lucro: `${p.margem_lucro}%`,
      preco_venda: calcularPrecoVenda(p).toFixed(2),
    }));
    exportToCSV(exportData, "produtos", [
      { key: "nome", label: "Nome" },
      { key: "categoria", label: "Categoria" },
      { key: "descricao", label: "Descrição" },
      { key: "custo_total", label: "Custo Total (R$)" },
      { key: "margem_lucro", label: "Margem de Lucro" },
      { key: "preco_venda", label: "Preço de Venda (R$)" },
    ]);
    toast({
      title: "Exportação concluída!",
      description: `${filteredProdutos.length} produto(s) exportado(s) para CSV.`,
    });
  };

  const handleCreateProduto = async (data: {
    nome: string;
    categoria: string | null;
    descricao: string | null;
    margem_lucro: number;
    insumos: { insumo_id: string; quantidade: number }[];
  }) => {
    setIsSubmitting(true);
    try {
      const { data: produtoData, error: produtoError } = await supabase
        .from("produtos")
        .insert([{
          nome: data.nome,
          categoria: data.categoria,
          descricao: data.descricao,
          margem_lucro: data.margem_lucro,
          user_id: user?.id,
        }])
        .select()
        .single();

      if (produtoError) throw produtoError;

      if (data.insumos.length > 0) {
        const produtoInsumos = data.insumos.map((i) => ({
          produto_id: produtoData.id,
          insumo_id: i.insumo_id,
          quantidade: i.quantidade,
        }));
        const { error: insumosError } = await supabase
          .from("produto_insumos")
          .insert(produtoInsumos);
        if (insumosError) throw insumosError;
      }

      toast({
        title: "Produto cadastrado!",
        description: `${data.nome} foi adicionado com sucesso.`,
      });

      await fetchProdutos();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar produto",
        description: "Não foi possível cadastrar o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduto = (produto: Produto) => {
    setEditingProduto(produto);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduto = async (
    id: string,
    data: {
      nome: string;
      categoria: string | null;
      descricao: string | null;
      margem_lucro: number;
      insumos: { insumo_id: string; quantidade: number }[];
    }
  ) => {
    setIsSubmitting(true);
    try {
      const { error: produtoError } = await supabase
        .from("produtos")
        .update({
          nome: data.nome,
          categoria: data.categoria,
          descricao: data.descricao,
          margem_lucro: data.margem_lucro,
        })
        .eq("id", id);

      if (produtoError) throw produtoError;

      // Delete existing insumos and insert new ones
      await supabase.from("produto_insumos").delete().eq("produto_id", id);

      if (data.insumos.length > 0) {
        const produtoInsumos = data.insumos.map((i) => ({
          produto_id: id,
          insumo_id: i.insumo_id,
          quantidade: i.quantidade,
        }));
        const { error: insumosError } = await supabase
          .from("produto_insumos")
          .insert(produtoInsumos);
        if (insumosError) throw insumosError;
      }

      toast({
        title: "Produto atualizado!",
        description: `${data.nome} foi atualizado com sucesso.`,
      });

      setIsEditDialogOpen(false);
      setEditingProduto(null);
      await fetchProdutos();
    } catch (error) {
      toast({
        title: "Erro ao atualizar produto",
        description: "Não foi possível atualizar o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduto = (produto: Produto) => {
    setDeletingProduto(produto);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduto) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", deletingProduto.id);

      if (error) throw error;

      toast({
        title: "Produto removido!",
        description: `${deletingProduto.nome} foi removido com sucesso.`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingProduto(null);
      await fetchProdutos();
    } catch (error) {
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto. Tente novamente.",
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
                Produtos
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie seus produtos e calcule preços automaticamente.
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
              <NewProdutoDialog
                onSubmit={handleCreateProduto}
                isSubmitting={isSubmitting}
                insumos={insumos}
              />
            </div>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              <span>
                {isLoading
                  ? "Carregando..."
                  : `${filteredProdutos.length} produto${filteredProdutos.length !== 1 ? "s" : ""} encontrado${filteredProdutos.length !== 1 ? "s" : ""}`}
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

          <ProdutosTable
            produtos={paginatedProdutos}
            isLoading={isLoading}
            onEdit={handleEditProduto}
            onDelete={handleDeleteProduto}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            calcularCustoTotal={calcularCustoTotal}
            calcularPrecoVenda={calcularPrecoVenda}
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
      </main>

      <EditProdutoDialog
        produto={editingProduto}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateProduto}
        isSubmitting={isSubmitting}
        insumos={insumos}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir o produto "${deletingProduto?.nome}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Produtos;
