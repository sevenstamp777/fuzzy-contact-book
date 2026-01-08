import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";

import ProdutosTable from "@/components/ProdutosTable";
import NewProdutoDialog from "@/components/NewProdutoDialog";
import EditProdutoDialog from "@/components/EditProdutoDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import DemoBanner from "@/components/DemoBanner";
import LoadDemoPrompt from "@/components/LoadDemoPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToCSV } from "@/lib/export";
import { SortDirection } from "@/components/SortableTableHead";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export interface Insumo {
  id: string;
  nome: string;
  unidade_medida: string;
  custo_unitario: number;
  usos_por_unidade: number;
}

export interface ProdutoBase {
  id: string;
  nome: string;
  custo_aquisicao: number;
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
  produto_base_id: string | null;
  tempo_producao_minutos: number;
  produto_insumos?: ProdutoInsumo[];
  produto_base?: ProdutoBase | null;
}

export interface ConfiguracaoCusto {
  custo_hora_trabalho: number;
  horas_trabalho_mes: number;
}

export interface DespesaFixa {
  valor_mensal: number;
  ativo: boolean;
}

const ITEMS_PER_PAGE = 10;

const Produtos = () => {
  const { user } = useAuth();
  const { isDemoMode, hasDemoData, isLoadingDemo, loadDemoData, clearDemoData, checkDemoStatus } = useDemo();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [produtosBase, setProdutosBase] = useState<ProdutoBase[]>([]);
  const [configCusto, setConfigCusto] = useState<ConfiguracaoCusto | null>(null);
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
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

  // Calcular custo hora total (trabalho + rateio despesas)
  const custoHoraTotal = useMemo(() => {
    if (!configCusto) return 0;
    const totalDespesas = despesasFixas
      .filter(d => d.ativo)
      .reduce((sum, d) => sum + Number(d.valor_mensal), 0);
    const despesaPorHora = configCusto.horas_trabalho_mes > 0 
      ? totalDespesas / configCusto.horas_trabalho_mes 
      : 0;
    return Number(configCusto.custo_hora_trabalho) + despesaPorHora;
  }, [configCusto, despesasFixas]);

  const fetchProdutos = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          id, nome, categoria, descricao, margem_lucro, produto_base_id, tempo_producao_minutos,
          produto_insumos(id, insumo_id, quantidade, insumo:insumos(id, nome, unidade_medida, custo_unitario, usos_por_unidade)),
          produto_base:produtos_base(id, nome, custo_aquisicao)
        `)
        .eq("user_id", user.id)
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
    if (!user?.id) return;

    const { data } = await supabase
      .from("insumos")
      .select("id, nome, unidade_medida, custo_unitario, usos_por_unidade")
      .eq("user_id", user.id)
      .order("nome");
    setInsumos(data || []);
  };

  const fetchProdutosBase = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("produtos_base")
      .select("id, nome, custo_aquisicao")
      .eq("user_id", user.id)
      .order("nome");
    setProdutosBase(data || []);
  };

  const fetchConfigCusto = async () => {
    if (!user?.id) return;

    const { data: config } = await supabase
      .from("configuracao_custos")
      .select("custo_hora_trabalho, horas_trabalho_mes")
      .eq("user_id", user.id)
      .maybeSingle();
    setConfigCusto(config);

    const { data: despesas } = await supabase
      .from("despesas_fixas")
      .select("valor_mensal, ativo")
      .eq("user_id", user.id);
    setDespesasFixas(despesas || []);
  };

  useEffect(() => {
    if (user?.id) {
      fetchProdutos();
      fetchInsumos();
      fetchProdutosBase();
      fetchConfigCusto();
    }
  }, [user?.id]);

  const calcularCustoTotal = (produto: Produto) => {
    // 1. Custo do produto base
    const custoProdutoBase = produto.produto_base 
      ? Number(produto.produto_base.custo_aquisicao) 
      : 0;

    // 2. Custo dos insumos (usando custo por uso)
    const custoInsumos = (produto.produto_insumos || []).reduce((total, pi) => {
      if (!pi.insumo) return total;
      const custoUnitario = Number(pi.insumo.custo_unitario || 0);
      const usosPorUnidade = Number(pi.insumo.usos_por_unidade || 1);
      const custoPorUso = usosPorUnidade > 0 ? custoUnitario / usosPorUnidade : custoUnitario;
      return total + custoPorUso * Number(pi.quantidade);
    }, 0);

    // 3. Custo de mão de obra (tempo × custo hora)
    const tempoHoras = Number(produto.tempo_producao_minutos || 0) / 60;
    const custoMaoDeObra = tempoHoras * custoHoraTotal;

    return custoProdutoBase + custoInsumos + custoMaoDeObra;
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
        aValue = (a[sortKey as keyof Produto] ?? "").toString().toLowerCase();
        bValue = (b[sortKey as keyof Produto] ?? "").toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return String(aValue).localeCompare(String(bValue));
      }
      return String(bValue).localeCompare(String(aValue));
    });
  }, [produtos, sortKey, sortDirection, custoHoraTotal]);

  const filteredProdutos = useMemo(() => {
    if (!searchTerm.trim()) return sortedProdutos;
    const term = searchTerm.toLowerCase();
    return sortedProdutos.filter(
      (produto) =>
        (produto.nome ?? "").toLowerCase().includes(term) ||
        (produto.categoria ?? "").toLowerCase().includes(term) ||
        (produto.descricao ?? "").toLowerCase().includes(term) ||
        (produto.produto_base?.nome ?? "").toLowerCase().includes(term)
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
      produto_base: p.produto_base?.nome || "-",
      tempo_minutos: p.tempo_producao_minutos,
      custo_total: calcularCustoTotal(p).toFixed(2),
      margem_lucro: `${p.margem_lucro}%`,
      preco_venda: calcularPrecoVenda(p).toFixed(2),
    }));
    exportToCSV(exportData, "produtos", [
      { key: "nome", label: "Nome" },
      { key: "categoria", label: "Categoria" },
      { key: "produto_base", label: "Produto Base" },
      { key: "tempo_minutos", label: "Tempo (min)" },
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
    produto_base_id: string | null;
    tempo_producao_minutos: number;
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
          produto_base_id: data.produto_base_id,
          tempo_producao_minutos: data.tempo_producao_minutos,
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
      produto_base_id: string | null;
      tempo_producao_minutos: number;
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
          produto_base_id: data.produto_base_id,
          tempo_producao_minutos: data.tempo_producao_minutos,
        })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (produtoError) throw produtoError;

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
        .eq("id", deletingProduto.id)
        .eq("user_id", user?.id);

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
    <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Produtos Finais
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie seus produtos personalizados com cálculo completo de custos.
              </p>
              {custoHoraTotal > 0 && (
                <p className="text-xs text-primary mt-1">
                  Custo hora configurado: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(custoHoraTotal)}/h
                </p>
              )}
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
                produtosBase={produtosBase}
                custoHoraTotal={custoHoraTotal}
                produtosCount={produtos.length}
              />
            </div>
          </div>
        </div>

        {isDemoMode && hasDemoData && <DemoBanner onClearDemo={clearDemoData} isClearing={isLoadingDemo} />}
        {!hasDemoData && !isLoading && produtos.length === 0 && (
          <LoadDemoPrompt onLoadDemo={loadDemoData} isLoading={isLoadingDemo} entityName="produtos e insumos" />
        )}

        {/* Gráfico de composição de custos */}
        {produtos.length > 0 && !isLoading && (
          <Card className="mb-6 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Composição de Custos</CardTitle>
              <CardDescription>Distribuição média entre base, insumos e mão de obra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {(() => {
                  const totais = produtos.reduce(
                    (acc, p) => {
                      const custoBase = p.produto_base ? Number(p.produto_base.custo_aquisicao) : 0;
                      const custoInsumos = (p.produto_insumos || []).reduce((total, pi) => {
                        if (!pi.insumo) return total;
                        const custoUnitario = Number(pi.insumo.custo_unitario || 0);
                        const usosPorUnidade = Number(pi.insumo.usos_por_unidade || 1);
                        const custoPorUso = usosPorUnidade > 0 ? custoUnitario / usosPorUnidade : custoUnitario;
                        return total + custoPorUso * Number(pi.quantidade);
                      }, 0);
                      const tempoHoras = Number(p.tempo_producao_minutos || 0) / 60;
                      const custoMaoDeObra = tempoHoras * custoHoraTotal;
                      return {
                        base: acc.base + custoBase,
                        insumos: acc.insumos + custoInsumos,
                        maoDeObra: acc.maoDeObra + custoMaoDeObra,
                      };
                    },
                    { base: 0, insumos: 0, maoDeObra: 0 }
                  );
                  const composicaoData = [
                    { name: "Produto Base", value: totais.base, color: "hsl(199, 89%, 48%)" },
                    { name: "Insumos", value: totais.insumos, color: "hsl(173, 80%, 40%)" },
                    { name: "Mão de Obra", value: totais.maoDeObra, color: "hsl(280, 65%, 60%)" },
                  ].filter(d => d.value > 0);

                  if (composicaoData.length === 0) {
                    return (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        Configure custos para ver a composição
                      </div>
                    );
                  }

                  const formatCurrency = (value: number) => 
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={composicaoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {composicaoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar produtos..."
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
          custoHoraTotal={custoHoraTotal}
        />

        {filteredProdutos.length > 0 && (
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

        <EditProdutoDialog
          produto={editingProduto}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleUpdateProduto}
          isSubmitting={isSubmitting}
          insumos={insumos}
          produtosBase={produtosBase}
          custoHoraTotal={custoHoraTotal}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          title="Remover Produto"
          description={`Tem certeza que deseja remover "${deletingProduto?.nome}"? Esta ação não pode ser desfeita.`}
        />
    </main>
  );
};

export default Produtos;