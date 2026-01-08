import { useState, useEffect, useMemo } from "react";
import { Package, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";

import InsumosTable from "@/components/InsumosTable";
import NewInsumoDialog from "@/components/NewInsumoDialog";
import EditInsumoDialog from "@/components/EditInsumoDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import ImportCSVDialog from "@/components/ImportCSVDialog";
import DemoBanner from "@/components/DemoBanner";
import LoadDemoPrompt from "@/components/LoadDemoPrompt";
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
  usos_por_unidade: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  fornecedor?: { nome_fornecedor: string } | null;
}

export interface Supplier {
  id: string;
  nome_fornecedor: string;
}

const ITEMS_PER_PAGE = 10;
const MAX_IMPORT_ROWS = 200;

const UNIDADE_LABELS: Record<string, string> = {
  un: "Unidade",
  kg: "Quilograma",
  ml: "Mililitro",
  m: "Metro",
};

const Insumos = () => {
  const { user } = useAuth();
  const { isDemoMode, hasDemoData, isLoadingDemo, loadDemoData, clearDemoData, checkDemoStatus } = useDemo();
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
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Defense in depth: filter by user_id even though RLS handles it
      const { data, error } = await supabase
        .from("insumos")
        .select(`
          id, nome, unidade_medida, fornecedor_id, preco_compra, quantidade_embalagem, custo_unitario, usos_por_unidade, quantidade_estoque, estoque_minimo,
          fornecedor:suppliers(nome_fornecedor)
        `)
        .eq("user_id", user.id)
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
      fetchInsumos();
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
        aValue = (a[sortKey as keyof Insumo] ?? "").toString().toLowerCase();
        bValue = (b[sortKey as keyof Insumo] ?? "").toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return String(aValue).localeCompare(String(bValue));
      }
      return String(bValue).localeCompare(String(aValue));
    });
  }, [insumos, sortKey, sortDirection]);

  // Safe search with null checks on all fields
  const filteredInsumos = useMemo(() => {
    if (!searchTerm.trim()) return sortedInsumos;
    const term = searchTerm.toLowerCase();
    return sortedInsumos.filter(
      (insumo) =>
        (insumo.nome ?? "").toLowerCase().includes(term) ||
        (insumo.fornecedor?.nome_fornecedor ?? "").toLowerCase().includes(term) ||
        (UNIDADE_LABELS[insumo.unidade_medida] ?? "").toLowerCase().includes(term)
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
      usos_por_unidade: i.usos_por_unidade,
      custo_por_uso: i.usos_por_unidade > 0 ? i.custo_unitario / i.usos_por_unidade : i.custo_unitario,
    }));
    exportToCSV(exportData, "insumos", [
      { key: "nome", label: "Nome" },
      { key: "unidade_medida", label: "Unidade de Medida" },
      { key: "fornecedor", label: "Fornecedor" },
      { key: "preco_compra", label: "Preço de Compra" },
      { key: "quantidade_embalagem", label: "Qtd. na Embalagem" },
      { key: "custo_unitario", label: "Custo Unitário" },
      { key: "usos_por_unidade", label: "Usos por Unidade" },
      { key: "custo_por_uso", label: "Custo por Uso" },
    ]);
    toast({
      title: "Exportação concluída!",
      description: `${filteredInsumos.length} insumo(s) exportado(s) para CSV.`,
    });
  };

  const handleImportInsumos = async (data: Record<string, string>[]): Promise<{ success: number; errors: string[] }> => {
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
      const nome = row.nome?.trim();
      if (!nome || nome.length < 2) {
        errors.push(`Linha ${i + 1}: Nome é obrigatório (mínimo 2 caracteres)`);
      } else {
        validRows.push(row);
      }
    }

    if (validRows.length === 0) {
      return { success: 0, errors };
    }

    // Prepare batch insert
    const insumosToInsert = validRows.map(row => ({
      nome: (row.nome?.trim() || "").substring(0, 255),
      unidade_medida: (row.unidade_medida?.toLowerCase() as "un" | "kg" | "ml" | "m") || "un",
      preco_compra: parseFloat(row.preco_compra?.replace(",", ".") || "0"),
      quantidade_embalagem: parseFloat(row.quantidade_embalagem?.replace(",", ".") || "1") || 1,
      estoque_minimo: parseFloat(row.estoque_minimo?.replace(",", ".") || "0"),
      fornecedor_id: null,
      user_id: user?.id,
    }));

    try {
      const { error } = await supabase.from("insumos").insert(insumosToInsert);

      if (error) {
        errors.push(`Erro ao inserir: ${error.message}`);
        return { success: 0, errors };
      }

      await fetchInsumos();
      return { success: insumosToInsert.length, errors };
    } catch (err) {
      errors.push("Erro desconhecido ao inserir insumos");
      return { success: 0, errors };
    }
  };

  const insumoColumns = [
    { key: "nome", label: "Nome", required: true },
    { key: "unidade_medida", label: "Unidade (un/kg/ml/m)" },
    { key: "preco_compra", label: "Preço de Compra" },
    { key: "quantidade_embalagem", label: "Qtd. na Embalagem" },
    { key: "estoque_minimo", label: "Estoque Mínimo" },
  ];

  const insumoTemplateData = {
    nome: "Farinha de Trigo",
    unidade_medida: "kg",
    preco_compra: "25.00",
    quantidade_embalagem: "5",
    estoque_minimo: "10",
  };

  const handleCreateInsumo = async (data: {
    nome: string;
    unidade_medida: "un" | "kg" | "ml" | "m";
    fornecedor_id: string | null;
    preco_compra: number;
    quantidade_embalagem: number;
    estoque_minimo: number;
    usos_por_unidade: number;
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
      usos_por_unidade: number;
    }
  ) => {
    setIsSubmitting(true);
    try {
      // Defense in depth: ensure we're updating our own insumo
      const { error } = await supabase
        .from("insumos")
        .update(data)
        .eq("id", id)
        .eq("user_id", user?.id);

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
      // Defense in depth: ensure we're deleting our own insumo
      const { error } = await supabase
        .from("insumos")
        .delete()
        .eq("id", deletingInsumo.id)
        .eq("user_id", user?.id);

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
          <div className="flex items-center gap-2 flex-wrap">
            <ImportCSVDialog
              onImport={handleImportInsumos}
              columns={insumoColumns}
              entityName="Insumos"
              templateData={insumoTemplateData}
            />
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

      {isDemoMode && (
        <DemoBanner 
          onClearDemo={async () => {
            await clearDemoData();
            await fetchInsumos();
            await checkDemoStatus();
          }} 
          isClearing={isLoadingDemo} 
        />
      )}

      {!isLoading && insumos.length === 0 && !hasDemoData && (
        <LoadDemoPrompt 
          onLoadDemo={async () => {
            await loadDemoData();
            await fetchInsumos();
            await checkDemoStatus();
          }}
          isLoading={isLoadingDemo}
          entityName="insumos, produtos, clientes e fornecedores"
        />
      )}

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
    </main>
  );
};

export default Insumos;
