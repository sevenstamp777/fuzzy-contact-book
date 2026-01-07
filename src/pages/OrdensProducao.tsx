import { useState, useEffect, useMemo } from "react";
import { Factory, Plus, Play, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProdutoInsumo {
  insumo_id: string;
  quantidade: number;
  insumo: {
    id: string;
    nome: string;
    unidade_medida: string;
    custo_unitario: number;
    quantidade_estoque: number;
  };
}

interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  margem_lucro: number;
  produto_insumos: ProdutoInsumo[];
}

interface OrdemProducao {
  id: string;
  numero: number;
  produto_id: string;
  quantidade: number;
  status: string;
  custo_total: number;
  data_prevista: string | null;
  data_conclusao: string | null;
  observacao: string | null;
  created_at: string;
  produto?: { nome: string; categoria: string | null };
}

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  em_producao: { label: "Em Produção", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  concluida: { label: "Concluída", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  cancelada: { label: "Cancelada", color: "bg-red-500/10 text-red-600 border-red-500/30" },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const OrdensProducao = () => {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemProducao | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [formProdutoId, setFormProdutoId] = useState("");
  const [formQuantidade, setFormQuantidade] = useState("1");
  const [formDataPrevista, setFormDataPrevista] = useState("");
  const [formObservacao, setFormObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchOrdens = async () => {
    const { data, error } = await supabase
      .from("ordens_producao")
      .select(`
        id, numero, produto_id, quantidade, status, custo_total, data_prevista, data_conclusao, observacao, created_at,
        produto:produtos(nome, categoria)
      `)
      .order("created_at", { ascending: false });

    if (!error) setOrdens(data || []);
  };

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        id, nome, categoria, margem_lucro,
        produto_insumos(insumo_id, quantidade, insumo:insumos(id, nome, unidade_medida, custo_unitario, quantidade_estoque))
      `)
      .order("nome");

    if (!error) setProdutos(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrdens(), fetchProdutos()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const calcularCustoTotal = (produto: Produto, quantidade: number) => {
    if (!produto.produto_insumos) return 0;
    const custoUnitario = produto.produto_insumos.reduce((total, pi) => {
      return total + (pi.insumo?.custo_unitario || 0) * pi.quantidade;
    }, 0);
    return custoUnitario * quantidade;
  };

  const verificarEstoqueDisponivel = (produto: Produto, quantidade: number) => {
    if (!produto.produto_insumos) return { disponivel: true, faltantes: [] };
    
    const faltantes: { nome: string; necessario: number; disponivel: number; unidade: string }[] = [];
    
    for (const pi of produto.produto_insumos) {
      const necessario = pi.quantidade * quantidade;
      const disponivel = pi.insumo?.quantidade_estoque || 0;
      
      if (necessario > disponivel) {
        faltantes.push({
          nome: pi.insumo?.nome || "Insumo",
          necessario,
          disponivel,
          unidade: pi.insumo?.unidade_medida || "un",
        });
      }
    }
    
    return { disponivel: faltantes.length === 0, faltantes };
  };

  const filteredOrdens = useMemo(() => {
    if (!searchTerm.trim()) return ordens;
    const term = searchTerm.toLowerCase();
    return ordens.filter(
      (o) =>
        o.numero.toString().includes(term) ||
        o.produto?.nome?.toLowerCase().includes(term) ||
        STATUS_CONFIG[o.status]?.label.toLowerCase().includes(term)
    );
  }, [ordens, searchTerm]);

  const totalPages = Math.ceil(filteredOrdens.length / pageSize);
  const paginatedOrdens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrdens.slice(start, start + pageSize);
  }, [filteredOrdens, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleProdutoChange = (produtoId: string) => {
    setFormProdutoId(produtoId);
    const produto = produtos.find((p) => p.id === produtoId);
    setSelectedProduto(produto || null);
  };

  const handleOpenCreate = () => {
    setFormProdutoId("");
    setFormQuantidade("1");
    setFormDataPrevista("");
    setFormObservacao("");
    setSelectedProduto(null);
    setIsCreateDialogOpen(true);
  };

  const handleCreateOrdem = async () => {
    if (!user || !formProdutoId) return;

    const quantidade = parseInt(formQuantidade);
    if (isNaN(quantidade) || quantidade < 1) {
      toast({ title: "Quantidade inválida", variant: "destructive" });
      return;
    }

    const produto = produtos.find((p) => p.id === formProdutoId);
    if (!produto) return;

    setIsSubmitting(true);

    try {
      // Obter próximo número
      const { data: numeroData } = await supabase.rpc("get_next_ordem_numero");
      const numero = numeroData || 1;

      const custoTotal = calcularCustoTotal(produto, quantidade);

      const { error } = await supabase.from("ordens_producao").insert([
        {
          user_id: user.id,
          numero,
          produto_id: formProdutoId,
          quantidade,
          custo_total: custoTotal,
          data_prevista: formDataPrevista || null,
          observacao: formObservacao || null,
        },
      ]);

      if (error) throw error;

      toast({ title: `Ordem #${numero} criada com sucesso!` });
      setIsCreateDialogOpen(false);
      await fetchOrdens();
    } catch (error) {
      toast({ title: "Erro ao criar ordem", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ordem: OrdemProducao, novoStatus: string) => {
    if (!user) return;

    // Se estiver concluindo, verificar e baixar estoque
    if (novoStatus === "concluida") {
      const produto = produtos.find((p) => p.id === ordem.produto_id);
      if (!produto) return;

      const { disponivel, faltantes } = verificarEstoqueDisponivel(produto, ordem.quantidade);
      if (!disponivel) {
        toast({
          title: "Estoque insuficiente",
          description: faltantes.map((f) => `${f.nome}: necessário ${f.necessario}, disponível ${f.disponivel}`).join("; "),
          variant: "destructive",
        });
        return;
      }

      try {
        // Baixar estoque de cada insumo
        for (const pi of produto.produto_insumos) {
          const quantidadeNecessaria = pi.quantidade * ordem.quantidade;
          const estoqueAtual = pi.insumo?.quantidade_estoque || 0;
          const novoEstoque = estoqueAtual - quantidadeNecessaria;

          await supabase
            .from("insumos")
            .update({ quantidade_estoque: novoEstoque })
            .eq("id", pi.insumo_id);

          await supabase.from("movimentacoes_estoque").insert([
            {
              insumo_id: pi.insumo_id,
              user_id: user.id,
              tipo: "producao",
              quantidade: quantidadeNecessaria,
              quantidade_anterior: estoqueAtual,
              quantidade_posterior: novoEstoque,
              observacao: `Ordem de produção #${ordem.numero}`,
              ordem_producao_id: ordem.id,
            },
          ]);
        }
      } catch (error) {
        toast({ title: "Erro ao baixar estoque", variant: "destructive" });
        return;
      }
    }

    const { error } = await supabase
      .from("ordens_producao")
      .update({
        status: novoStatus,
        data_conclusao: novoStatus === "concluida" ? new Date().toISOString() : null,
      })
      .eq("id", ordem.id);

    if (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } else {
      toast({ title: `Status atualizado para "${STATUS_CONFIG[novoStatus]?.label}"` });
      await Promise.all([fetchOrdens(), fetchProdutos()]);
    }
  };

  const handleViewDetails = (ordem: OrdemProducao) => {
    setSelectedOrdem(ordem);
    const produto = produtos.find((p) => p.id === ordem.produto_id);
    setSelectedProduto(produto || null);
    setIsDetailsDialogOpen(true);
  };

  const insumosNecessarios = useMemo(() => {
    if (!selectedProduto || !selectedOrdem) return [];
    return selectedProduto.produto_insumos.map((pi) => ({
      nome: pi.insumo?.nome || "Insumo",
      quantidade: pi.quantidade * selectedOrdem.quantidade,
      unidade: pi.insumo?.unidade_medida || "un",
      disponivel: pi.insumo?.quantidade_estoque || 0,
      suficiente: (pi.insumo?.quantidade_estoque || 0) >= pi.quantidade * selectedOrdem.quantidade,
    }));
  }, [selectedProduto, selectedOrdem]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Ordens de Produção
              </h2>
              <p className="mt-1 text-muted-foreground">
                Gerencie as ordens de produção e acompanhe o consumo de insumos.
              </p>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2 gradient-primary">
              <Plus className="h-4 w-4" />
              Nova Ordem
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {["pendente", "em_producao", "concluida", "cancelada"].map((status) => {
            const count = ordens.filter((o) => o.status === status).length;
            const config = STATUS_CONFIG[status];
            return (
              <Card key={status} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="animate-slide-up">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Factory className="h-4 w-4" />
              <span>{filteredOrdens.length} ordem(ns)</span>
            </div>
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por número, produto..."
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/50">
                  <TableHead>Nº</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginatedOrdens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhuma ordem encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrdens.map((ordem) => {
                    const config = STATUS_CONFIG[ordem.status];
                    return (
                      <TableRow key={ordem.id} className="border-border">
                        <TableCell className="font-medium">#{ordem.numero}</TableCell>
                        <TableCell>{ordem.produto?.nome || "-"}</TableCell>
                        <TableCell className="text-center">{ordem.quantidade}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(ordem.custo_total)}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(ordem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleViewDetails(ordem)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {ordem.status === "pendente" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(ordem, "em_producao")}
                                title="Iniciar produção"
                                className="text-blue-500"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {ordem.status === "em_producao" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(ordem, "concluida")}
                                title="Concluir"
                                className="text-green-500"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {(ordem.status === "pendente" || ordem.status === "em_producao") && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(ordem, "cancelada")}
                                title="Cancelar"
                                className="text-red-500"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && filteredOrdens.length > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredOrdens.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </main>

      {/* Dialog de Criar Ordem */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Produção</DialogTitle>
            <DialogDescription>
              Selecione o produto e a quantidade a ser produzida.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={formProdutoId} onValueChange={handleProdutoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} {p.categoria && `(${p.categoria})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={formQuantidade}
                onChange={(e) => setFormQuantidade(e.target.value)}
              />
            </div>
            {selectedProduto && (
              <Card className="border-border bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Insumos Necessários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {selectedProduto.produto_insumos.map((pi) => {
                    const qtdNecessaria = pi.quantidade * parseInt(formQuantidade || "1");
                    const disponivel = pi.insumo?.quantidade_estoque || 0;
                    const suficiente = disponivel >= qtdNecessaria;
                    return (
                      <div key={pi.insumo_id} className="flex justify-between">
                        <span>{pi.insumo?.nome}</span>
                        <span className={suficiente ? "text-green-600" : "text-red-600"}>
                          {qtdNecessaria} / {disponivel} {pi.insumo?.unidade_medida}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border flex justify-between font-medium">
                    <span>Custo Total Estimado:</span>
                    <span>{formatCurrency(calcularCustoTotal(selectedProduto, parseInt(formQuantidade || "1")))}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="space-y-2">
              <Label>Data Prevista (opcional)</Label>
              <Input
                type="date"
                value={formDataPrevista}
                onChange={(e) => setFormDataPrevista(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={formObservacao}
                onChange={(e) => setFormObservacao(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrdem} disabled={isSubmitting || !formProdutoId}>
              {isSubmitting ? "Criando..." : "Criar Ordem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ordem #{selectedOrdem?.numero}</DialogTitle>
            <DialogDescription>
              Detalhes da ordem de produção
            </DialogDescription>
          </DialogHeader>
          {selectedOrdem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Produto:</span>
                  <p className="font-medium">{selectedOrdem.produto?.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantidade:</span>
                  <p className="font-medium">{selectedOrdem.quantidade} unidade(s)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>
                    <Badge variant="outline" className={STATUS_CONFIG[selectedOrdem.status].color}>
                      {STATUS_CONFIG[selectedOrdem.status].label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Custo Total:</span>
                  <p className="font-medium">{formatCurrency(selectedOrdem.custo_total)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Criado em:</span>
                  <p>{format(new Date(selectedOrdem.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                {selectedOrdem.data_prevista && (
                  <div>
                    <span className="text-muted-foreground">Data Prevista:</span>
                    <p>{format(new Date(selectedOrdem.data_prevista), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                )}
                {selectedOrdem.data_conclusao && (
                  <div>
                    <span className="text-muted-foreground">Concluído em:</span>
                    <p>{format(new Date(selectedOrdem.data_conclusao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  </div>
                )}
              </div>
              {selectedOrdem.observacao && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Observação:</span>
                  <p>{selectedOrdem.observacao}</p>
                </div>
              )}
              {insumosNecessarios.length > 0 && (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Insumos Necessários</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {insumosNecessarios.map((insumo, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{insumo.nome}</span>
                        <span className={insumo.suficiente ? "text-green-600" : "text-red-600"}>
                          {insumo.quantidade} {insumo.unidade} (disp: {insumo.disponivel})
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdensProducao;
