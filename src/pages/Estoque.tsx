import { useState, useEffect, useMemo } from "react";
import { Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Insumo {
  id: string;
  nome: string;
  unidade_medida: string;
  quantidade_estoque: number;
  estoque_minimo: number;
}

interface Movimentacao {
  id: string;
  insumo_id: string;
  tipo: string;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_posterior: number;
  observacao: string | null;
  created_at: string;
  insumo?: { nome: string };
}

const ITEMS_PER_PAGE = 10;

const UNIDADE_LABELS: Record<string, string> = {
  un: "un",
  kg: "kg",
  ml: "ml",
  m: "m",
};

const TIPO_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  entrada: { label: "Entrada", color: "bg-green-500/10 text-green-500", icon: <ArrowUpCircle className="h-4 w-4" /> },
  saida: { label: "Saída", color: "bg-red-500/10 text-red-500", icon: <ArrowDownCircle className="h-4 w-4" /> },
  ajuste: { label: "Ajuste", color: "bg-blue-500/10 text-blue-500", icon: <RefreshCw className="h-4 w-4" /> },
  producao: { label: "Produção", color: "bg-purple-500/10 text-purple-500", icon: <Package className="h-4 w-4" /> },
};

const Estoque = () => {
  const { user } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [movTipo, setMovTipo] = useState<string>("entrada");
  const [movQuantidade, setMovQuantidade] = useState("");
  const [movObservacao, setMovObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchInsumos = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from("insumos")
      .select("id, nome, unidade_medida, quantidade_estoque, estoque_minimo")
      .eq("user_id", user.id)
      .order("nome");

    if (!error) setInsumos(data || []);
  };

  const fetchMovimentacoes = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("movimentacoes_estoque")
      .select(`
        id, insumo_id, tipo, quantidade, quantidade_anterior, quantidade_posterior, observacao, created_at,
        insumo:insumos(nome)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) setMovimentacoes(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchInsumos(), fetchMovimentacoes()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const insumosEmBaixa = useMemo(() => {
    return insumos.filter((i) => i.quantidade_estoque <= i.estoque_minimo);
  }, [insumos]);

  const filteredInsumos = useMemo(() => {
    if (!searchTerm.trim()) return insumos;
    const term = searchTerm.toLowerCase();
    return insumos.filter((i) => i.nome.toLowerCase().includes(term));
  }, [insumos, searchTerm]);

  const totalPages = Math.ceil(filteredInsumos.length / pageSize);
  const paginatedInsumos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInsumos.slice(start, start + pageSize);
  }, [filteredInsumos, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleOpenMovimentacao = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    setMovTipo("entrada");
    setMovQuantidade("");
    setMovObservacao("");
    setIsDialogOpen(true);
  };

  const handleSubmitMovimentacao = async () => {
    if (!selectedInsumo || !user) return;

    const quantidade = parseFloat(movQuantidade);
    if (isNaN(quantidade) || quantidade <= 0) {
      toast({ title: "Quantidade inválida", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const quantidadeAnterior = selectedInsumo.quantidade_estoque;
      let quantidadePosterior: number;

      if (movTipo === "entrada") {
        quantidadePosterior = quantidadeAnterior + quantidade;
      } else if (movTipo === "saida" || movTipo === "producao") {
        quantidadePosterior = quantidadeAnterior - quantidade;
        if (quantidadePosterior < 0) {
          toast({ title: "Estoque insuficiente", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      } else {
        quantidadePosterior = quantidade; // ajuste define o valor diretamente
      }

      // Atualizar estoque do insumo
      const { error: updateError } = await supabase
        .from("insumos")
        .update({ quantidade_estoque: quantidadePosterior })
        .eq("id", selectedInsumo.id);

      if (updateError) throw updateError;

      // Registrar movimentação
      const { error: movError } = await supabase.from("movimentacoes_estoque").insert([
        {
          insumo_id: selectedInsumo.id,
          user_id: user.id,
          tipo: movTipo,
          quantidade: movTipo === "ajuste" ? Math.abs(quantidadePosterior - quantidadeAnterior) : quantidade,
          quantidade_anterior: quantidadeAnterior,
          quantidade_posterior: quantidadePosterior,
          observacao: movObservacao || null,
        },
      ]);

      if (movError) throw movError;

      toast({ title: "Movimentação registrada!" });
      setIsDialogOpen(false);
      await Promise.all([fetchInsumos(), fetchMovimentacoes()]);
    } catch (error) {
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Controle de Estoque
          </h2>
          <p className="mt-1 text-muted-foreground">
            Gerencie o estoque de insumos e visualize movimentações.
          </p>
        </div>

        {/* Alertas de estoque baixo */}
        {insumosEmBaixa.length > 0 && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5 animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {insumosEmBaixa.map((insumo) => (
                  <Badge key={insumo.id} variant="outline" className="border-yellow-500/50 text-yellow-600">
                    {insumo.nome}: {insumo.quantidade_estoque} {UNIDADE_LABELS[insumo.unidade_medida]} (mín: {insumo.estoque_minimo})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="estoque" className="animate-slide-up">
          <TabsList className="mb-4">
            <TabsTrigger value="estoque">Estoque Atual</TabsTrigger>
            <TabsTrigger value="movimentacoes">Histórico de Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="estoque">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{filteredInsumos.length} insumo(s)</span>
              </div>
              <div className="w-full sm:w-72">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por nome..."
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/50">
                    <TableHead>Insumo</TableHead>
                    <TableHead className="text-center">Estoque Atual</TableHead>
                    <TableHead className="text-center">Estoque Mínimo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : paginatedInsumos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum insumo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedInsumos.map((insumo) => {
                      const emBaixa = insumo.quantidade_estoque <= insumo.estoque_minimo;
                      return (
                        <TableRow key={insumo.id} className="border-border">
                          <TableCell className="font-medium">{insumo.nome}</TableCell>
                          <TableCell className="text-center">
                            {insumo.quantidade_estoque} {UNIDADE_LABELS[insumo.unidade_medida]}
                          </TableCell>
                          <TableCell className="text-center">
                            {insumo.estoque_minimo} {UNIDADE_LABELS[insumo.unidade_medida]}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={emBaixa ? "destructive" : "secondary"}>
                              {emBaixa ? "Baixo" : "Normal"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMovimentacao(insumo)}
                            >
                              Movimentar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

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
          </TabsContent>

          <TabsContent value="movimentacoes">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/50">
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Anterior → Posterior</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhuma movimentação registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimentacoes.map((mov) => {
                      const tipoInfo = TIPO_LABELS[mov.tipo] || { label: mov.tipo, color: "bg-muted", icon: null };
                      return (
                        <TableRow key={mov.id} className="border-border">
                          <TableCell className="text-sm">
                            {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{mov.insumo?.nome || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${tipoInfo.color} gap-1`}>
                              {tipoInfo.icon}
                              {tipoInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{mov.quantidade}</TableCell>
                          <TableCell className="text-center">
                            {mov.quantidade_anterior} → {mov.quantidade_posterior}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {mov.observacao || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de Movimentação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
            <DialogDescription>
              {selectedInsumo?.nome} - Estoque atual: {selectedInsumo?.quantidade_estoque}{" "}
              {selectedInsumo ? UNIDADE_LABELS[selectedInsumo.unidade_medida] : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <Select value={movTipo} onValueChange={setMovTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {movTipo === "ajuste" ? "Nova Quantidade em Estoque" : "Quantidade"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={movQuantidade}
                onChange={(e) => setMovQuantidade(e.target.value)}
                placeholder={movTipo === "ajuste" ? "Nova quantidade total" : "Quantidade a movimentar"}
              />
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={movObservacao}
                onChange={(e) => setMovObservacao(e.target.value)}
                placeholder="Motivo da movimentação..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitMovimentacao} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
