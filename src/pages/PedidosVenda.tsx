import { useState, useEffect } from "react";
import { Plus, Search, ShoppingCart, Eye, Trash2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Produto {
  id: string;
  nome: string;
  margem_lucro: number;
}

interface ProdutoInsumo {
  insumo_id: string;
  quantidade: number;
  insumos: {
    id: string;
    nome: string;
    custo_unitario: number;
  };
}

interface ItemPedido {
  id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto?: Produto;
}

interface Pedido {
  id: string;
  numero: number;
  cliente_id: string;
  status: string;
  data_pedido: string;
  data_entrega: string | null;
  valor_total: number;
  observacao: string | null;
  clients: Client;
  itens?: ItemPedido[];
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500/20 text-yellow-500",
  confirmado: "bg-blue-500/20 text-blue-500",
  em_producao: "bg-purple-500/20 text-purple-500",
  concluido: "bg-green-500/20 text-green-500",
  cancelado: "bg-red-500/20 text-red-500",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_producao: "Em Produção",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const PedidosVenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  
  // Form state
  const [clienteId, setClienteId] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos_venda")
      .select(`
        *,
        clients (id, name, email)
      `)
      .order("numero", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar pedidos", variant: "destructive" });
    } else {
      setPedidos(data || []);
    }
    setIsLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name, email").order("name");
    setClients(data || []);
  };

  const fetchProdutos = async () => {
    const { data } = await supabase.from("produtos").select("id, nome, margem_lucro").order("nome");
    setProdutos(data || []);
  };

  useEffect(() => {
    fetchPedidos();
    fetchClients();
    fetchProdutos();
  }, []);

  const calcularPrecoVenda = async (produtoId: string): Promise<number> => {
    const { data: produtoInsumos } = await supabase
      .from("produto_insumos")
      .select(`
        quantidade,
        insumos (custo_unitario)
      `)
      .eq("produto_id", produtoId);

    const produto = produtos.find(p => p.id === produtoId);
    if (!produtoInsumos || !produto) return 0;

    const custoTotal = produtoInsumos.reduce((acc, pi) => {
      const custo = (pi.insumos as any)?.custo_unitario || 0;
      return acc + (pi.quantidade * custo);
    }, 0);

    return custoTotal * (1 + produto.margem_lucro / 100);
  };

  const addItem = async () => {
    if (produtos.length === 0) return;
    
    const produtoId = produtos[0].id;
    const preco = await calcularPrecoVenda(produtoId);
    
    setItens([...itens, {
      produto_id: produtoId,
      quantidade: 1,
      preco_unitario: preco,
      subtotal: preco,
    }]);
  };

  const updateItem = async (index: number, field: string, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    
    if (field === "produto_id") {
      const preco = await calcularPrecoVenda(value);
      newItens[index].preco_unitario = preco;
      newItens[index].subtotal = preco * newItens[index].quantidade;
    } else if (field === "quantidade") {
      newItens[index].subtotal = newItens[index].preco_unitario * value;
    }
    
    setItens(newItens);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const valorTotal = itens.reduce((acc, item) => acc + item.subtotal, 0);

  const handleCreatePedido = async () => {
    if (!user || !clienteId || itens.length === 0) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      // Get next numero
      const { data: numeroData } = await supabase.rpc("get_next_pedido_numero", { _user_id: user.id });
      
      // Create pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos_venda")
        .insert({
          numero: numeroData,
          cliente_id: clienteId,
          user_id: user.id,
          data_entrega: dataEntrega || null,
          valor_total: valorTotal,
          observacao: observacao || null,
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Create itens
      const itensData = itens.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
      }));

      const { error: itensError } = await supabase.from("itens_pedido").insert(itensData);
      if (itensError) throw itensError;

      // Create conta a receber
      await supabase.from("contas").insert({
        user_id: user.id,
        tipo: "receber",
        descricao: `Pedido #${numeroData} - ${clients.find(c => c.id === clienteId)?.name}`,
        valor: valorTotal,
        data_vencimento: dataEntrega || new Date().toISOString().split("T")[0],
        pedido_id: pedido.id,
        cliente_id: clienteId,
      });

      toast({ title: "Pedido criado com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
      fetchPedidos();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao criar pedido", variant: "destructive" });
    }
  };

  const handleGerarOrdens = async (pedido: Pedido) => {
    if (!user) return;

    try {
      // Fetch itens do pedido
      const { data: itensPedido } = await supabase
        .from("itens_pedido")
        .select("*")
        .eq("pedido_id", pedido.id);

      if (!itensPedido || itensPedido.length === 0) {
        toast({ title: "Nenhum item encontrado no pedido", variant: "destructive" });
        return;
      }

      // Create ordem de produção for each item
      for (const item of itensPedido) {
        const { data: numeroData } = await supabase.rpc("get_next_ordem_numero", { _user_id: user.id });
        
        // Calculate cost
        const { data: produtoInsumos } = await supabase
          .from("produto_insumos")
          .select(`quantidade, insumos (custo_unitario)`)
          .eq("produto_id", item.produto_id);

        const custoTotal = (produtoInsumos || []).reduce((acc, pi) => {
          const custo = (pi.insumos as any)?.custo_unitario || 0;
          return acc + (pi.quantidade * custo * item.quantidade);
        }, 0);

        const { data: ordem } = await supabase
          .from("ordens_producao")
          .insert({
            numero: numeroData,
            produto_id: item.produto_id,
            user_id: user.id,
            quantidade: item.quantidade,
            custo_total: custoTotal,
            data_prevista: pedido.data_entrega,
            observacao: `Gerado automaticamente do Pedido #${pedido.numero}`,
          })
          .select()
          .single();

        // Link ordem to item
        if (ordem) {
          await supabase
            .from("itens_pedido")
            .update({ ordem_producao_id: ordem.id })
            .eq("id", item.id);
        }
      }

      // Update pedido status
      await supabase
        .from("pedidos_venda")
        .update({ status: "em_producao" })
        .eq("id", pedido.id);

      toast({ title: "Ordens de produção geradas com sucesso!" });
      fetchPedidos();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao gerar ordens", variant: "destructive" });
    }
  };

  const handleViewPedido = async (pedido: Pedido) => {
    const { data: itensData } = await supabase
      .from("itens_pedido")
      .select(`*, produtos:produto_id (id, nome)`)
      .eq("pedido_id", pedido.id);

    setSelectedPedido({ ...pedido, itens: itensData || [] });
    setIsViewDialogOpen(true);
  };

  const handleDeletePedido = async (id: string) => {
    const { error } = await supabase.from("pedidos_venda").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Erro ao excluir pedido", variant: "destructive" });
    } else {
      toast({ title: "Pedido excluído com sucesso!" });
      fetchPedidos();
    }
  };

  const resetForm = () => {
    setClienteId("");
    setDataEntrega("");
    setObservacao("");
    setItens([]);
  };

  const filteredPedidos = pedidos.filter(p =>
    p.numero.toString().includes(searchTerm) ||
    p.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Pedidos de Venda
            </h2>
            <p className="mt-1 text-muted-foreground">
              Gerencie os pedidos dos seus clientes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Pedido de Venda</DialogTitle>
                <DialogDescription>Crie um novo pedido para um cliente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Entrega</Label>
                    <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Itens do Pedido</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                    </Button>
                  </div>
                  
                  {itens.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum item adicionado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {itens.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center p-2 border rounded-md">
                          <Select
                            value={item.produto_id}
                            onValueChange={v => updateItem(index, "produto_id", v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={e => updateItem(index, "quantidade", parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <span className="text-sm w-24 text-right">
                            R$ {item.subtotal.toFixed(2)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end border-t pt-4">
                  <span className="text-lg font-bold">
                    Total: R$ {valorTotal.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    placeholder="Observações do pedido..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreatePedido}>Criar Pedido</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> Pedidos
                </CardTitle>
                <CardDescription>{filteredPedidos.length} pedido(s) encontrado(s)</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : filteredPedidos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPedidos.map(pedido => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">#{pedido.numero}</TableCell>
                        <TableCell>{pedido.clients?.name}</TableCell>
                        <TableCell>
                          {format(new Date(pedido.data_pedido), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {pedido.data_entrega
                            ? format(new Date(pedido.data_entrega), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell>R$ {pedido.valor_total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[pedido.status]}>
                            {statusLabels[pedido.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPedido(pedido)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {pedido.status === "pendente" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleGerarOrdens(pedido)}
                                title="Gerar Ordens de Produção"
                              >
                                <Play className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePedido(pedido.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Pedido #{selectedPedido?.numero}</DialogTitle>
              <DialogDescription>Detalhes do pedido</DialogDescription>
            </DialogHeader>
            {selectedPedido && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <p className="font-medium">{selectedPedido.clients?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={`ml-2 ${statusColors[selectedPedido.status]}`}>
                      {statusLabels[selectedPedido.status]}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data do Pedido:</span>
                    <p className="font-medium">
                      {format(new Date(selectedPedido.data_pedido), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Entrega:</span>
                    <p className="font-medium">
                      {selectedPedido.data_entrega
                        ? format(new Date(selectedPedido.data_entrega), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {selectedPedido.itens?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{(item.produto as any)?.nome || "Produto"}</span>
                        <span>{item.quantidade}x R$ {item.preco_unitario.toFixed(2)}</span>
                        <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <span className="text-lg font-bold">
                    Total: R$ {selectedPedido.valor_total.toFixed(2)}
                  </span>
                </div>

                {selectedPedido.observacao && (
                  <div>
                    <span className="text-muted-foreground text-sm">Observação:</span>
                    <p className="text-sm">{selectedPedido.observacao}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PedidosVenda;
