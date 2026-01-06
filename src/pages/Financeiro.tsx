import { useState, useEffect } from "react";
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, CheckCircle, Clock, AlertTriangle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conta {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  observacao: string | null;
  pedido_id: string | null;
  fornecedor_id: string | null;
  cliente_id: string | null;
  suppliers?: { nome_fornecedor: string } | null;
  clients?: { name: string } | null;
}

interface Supplier {
  id: string;
  nome_fornecedor: string;
}

interface Client {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500/20 text-yellow-500",
  pago: "bg-green-500/20 text-green-500",
  atrasado: "bg-red-500/20 text-red-500",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
};

const Financeiro = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contas, setContas] = useState<Conta[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("todas");

  // Form state
  const [tipo, setTipo] = useState<"pagar" | "receber">("pagar");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [observacao, setObservacao] = useState("");

  const fetchContas = async () => {
    const { data, error } = await supabase
      .from("contas")
      .select(`
        *,
        suppliers:fornecedor_id (nome_fornecedor),
        clients:cliente_id (name)
      `)
      .order("data_vencimento", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar contas", variant: "destructive" });
    } else {
      // Update status for overdue accounts
      const updatedData = (data || []).map(conta => {
        if (conta.status === "pendente" && isPast(new Date(conta.data_vencimento)) && !isToday(new Date(conta.data_vencimento))) {
          return { ...conta, status: "atrasado" };
        }
        return conta;
      });
      setContas(updatedData);
    }
    setIsLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, nome_fornecedor").order("nome_fornecedor");
    setSuppliers(data || []);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name").order("name");
    setClients(data || []);
  };

  useEffect(() => {
    fetchContas();
    fetchSuppliers();
    fetchClients();
  }, []);

  const handleCreateConta = async () => {
    if (!user || !descricao || !valor || !dataVencimento) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("contas").insert({
      user_id: user.id,
      tipo,
      descricao,
      valor: parseFloat(valor),
      data_vencimento: dataVencimento,
      fornecedor_id: tipo === "pagar" && fornecedorId ? fornecedorId : null,
      cliente_id: tipo === "receber" && clienteId ? clienteId : null,
      observacao: observacao || null,
    });

    if (error) {
      toast({ title: "Erro ao criar conta", variant: "destructive" });
    } else {
      toast({ title: "Conta criada com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
      fetchContas();
    }
  };

  const handleMarcarPago = async (conta: Conta) => {
    const { error } = await supabase
      .from("contas")
      .update({
        status: "pago",
        data_pagamento: new Date().toISOString().split("T")[0],
      })
      .eq("id", conta.id);

    if (error) {
      toast({ title: "Erro ao atualizar conta", variant: "destructive" });
    } else {
      toast({ title: "Conta marcada como paga!" });
      fetchContas();
    }
  };

  const handleDeleteConta = async (id: string) => {
    const { error } = await supabase.from("contas").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir conta", variant: "destructive" });
    } else {
      toast({ title: "Conta excluída com sucesso!" });
      fetchContas();
    }
  };

  const resetForm = () => {
    setTipo("pagar");
    setDescricao("");
    setValor("");
    setDataVencimento("");
    setFornecedorId("");
    setClienteId("");
    setObservacao("");
  };

  const filteredContas = contas.filter(c => {
    const matchesSearch = c.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "todas" ||
      (activeTab === "pagar" && c.tipo === "pagar") ||
      (activeTab === "receber" && c.tipo === "receber") ||
      (activeTab === "atrasadas" && c.status === "atrasado");
    return matchesSearch && matchesTab;
  });

  const totals = {
    pagar: contas.filter(c => c.tipo === "pagar" && c.status !== "pago").reduce((acc, c) => acc + c.valor, 0),
    receber: contas.filter(c => c.tipo === "receber" && c.status !== "pago").reduce((acc, c) => acc + c.valor, 0),
    atrasadas: contas.filter(c => c.status === "atrasado").reduce((acc, c) => acc + c.valor, 0),
    pagas: contas.filter(c => c.status === "pago").reduce((acc, c) => acc + (c.tipo === "receber" ? c.valor : -c.valor), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Financeiro
            </h2>
            <p className="mt-1 text-muted-foreground">
              Controle de contas a pagar e receber
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Conta</DialogTitle>
                <DialogDescription>Adicione uma conta a pagar ou receber</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={tipo} onValueChange={(v: "pagar" | "receber") => setTipo(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagar">Conta a Pagar</SelectItem>
                      <SelectItem value="receber">Conta a Receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder="Descrição da conta"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={e => setValor(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Vencimento *</Label>
                    <Input
                      type="date"
                      value={dataVencimento}
                      onChange={e => setDataVencimento(e.target.value)}
                    />
                  </div>
                </div>

                {tipo === "pagar" && (
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={fornecedorId} onValueChange={setFornecedorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nome_fornecedor}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {tipo === "receber" && (
                  <div className="space-y-2">
                    <Label>Cliente</Label>
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
                )}

                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    placeholder="Observações..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateConta}>Criar Conta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Pagar</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">R$ {totals.pagar.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">R$ {totals.receber.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-500">R$ {totals.atrasadas.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totals.receber - totals.pagar >= 0 ? "text-green-500" : "text-red-500"}`}>
                R$ {(totals.receber - totals.pagar).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="pagar">A Pagar</TabsTrigger>
                  <TabsTrigger value="receber">A Receber</TabsTrigger>
                  <TabsTrigger value="atrasadas">Atrasadas</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar contas..."
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
            ) : filteredContas.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContas.map(conta => (
                      <TableRow key={conta.id}>
                        <TableCell>
                          <Badge variant={conta.tipo === "receber" ? "default" : "secondary"}>
                            {conta.tipo === "receber" ? "Receber" : "Pagar"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{conta.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              {conta.tipo === "pagar"
                                ? conta.suppliers?.nome_fornecedor
                                : conta.clients?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className={conta.tipo === "receber" ? "text-green-500" : "text-red-500"}>
                          {conta.tipo === "receber" ? "+" : "-"} R$ {conta.valor.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[conta.status]}>
                            {statusLabels[conta.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {conta.status !== "pago" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarcarPago(conta)}
                                title="Marcar como pago"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteConta(conta.id)}
                            >
                              <Clock className="h-4 w-4 text-destructive" />
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
      </main>
    </div>
  );
};

export default Financeiro;
