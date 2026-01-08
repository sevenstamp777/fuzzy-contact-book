import { useState, useEffect } from "react";
import { Settings, Plus, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface DespesaFixa {
  id: string;
  nome: string;
  valor_mensal: number;
  tipo: string;
  ativo: boolean;
}

interface ConfiguracaoCusto {
  id: string;
  custo_hora_trabalho: number;
  horas_trabalho_mes: number;
}

const TIPOS_DESPESA = [
  { value: "aluguel", label: "Aluguel" },
  { value: "energia", label: "Energia Elétrica" },
  { value: "internet", label: "Internet" },
  { value: "agua", label: "Água" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const ConfiguracaoCustos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Configuração de custo hora
  const [config, setConfig] = useState<ConfiguracaoCusto | null>(null);
  const [custoHora, setCustoHora] = useState<number>(0);
  const [horasMes, setHorasMes] = useState<number>(176);
  
  // Despesas fixas
  const [despesas, setDespesas] = useState<DespesaFixa[]>([]);
  const [novaDespesa, setNovaDespesa] = useState({
    nome: "",
    valor_mensal: 0,
    tipo: "outros",
  });

  const fetchData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Buscar configuração de custos
      const { data: configData } = await supabase
        .from("configuracao_custos")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (configData) {
        setConfig(configData);
        setCustoHora(Number(configData.custo_hora_trabalho));
        setHorasMes(Number(configData.horas_trabalho_mes));
      }

      // Buscar despesas fixas
      const { data: despesasData } = await supabase
        .from("despesas_fixas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setDespesas(despesasData || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleSaveConfig = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      if (config) {
        // Atualizar
        const { error } = await supabase
          .from("configuracao_custos")
          .update({
            custo_hora_trabalho: custoHora,
            horas_trabalho_mes: horasMes,
          })
          .eq("id", config.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        // Inserir
        const { data, error } = await supabase
          .from("configuracao_custos")
          .insert([{
            user_id: user.id,
            custo_hora_trabalho: custoHora,
            horas_trabalho_mes: horasMes,
          }])
          .select()
          .single();
        
        if (error) throw error;
        setConfig(data);
      }

      toast({
        title: "Configuração salva!",
        description: "As configurações de custo foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDespesa = async () => {
    if (!user?.id || !novaDespesa.nome.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("despesas_fixas")
        .insert([{
          user_id: user.id,
          nome: novaDespesa.nome,
          valor_mensal: novaDespesa.valor_mensal,
          tipo: novaDespesa.tipo,
        }]);
      
      if (error) throw error;

      toast({
        title: "Despesa adicionada!",
        description: `${novaDespesa.nome} foi adicionada com sucesso.`,
      });

      setNovaDespesa({ nome: "", valor_mensal: 0, tipo: "outros" });
      await fetchData();
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar a despesa.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDespesa = async (despesa: DespesaFixa) => {
    try {
      const { error } = await supabase
        .from("despesas_fixas")
        .update({ ativo: !despesa.ativo })
        .eq("id", despesa.id)
        .eq("user_id", user?.id);
      
      if (error) throw error;

      setDespesas(despesas.map(d => 
        d.id === despesa.id ? { ...d, ativo: !d.ativo } : d
      ));
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a despesa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDespesa = async (id: string) => {
    try {
      const { error } = await supabase
        .from("despesas_fixas")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);
      
      if (error) throw error;

      toast({
        title: "Despesa removida!",
        description: "A despesa foi removida com sucesso.",
      });

      setDespesas(despesas.filter(d => d.id !== id));
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a despesa.",
        variant: "destructive",
      });
    }
  };

  // Cálculos
  const totalDespesasAtivas = despesas
    .filter(d => d.ativo)
    .reduce((sum, d) => sum + Number(d.valor_mensal), 0);
  
  const custoDespesaPorHora = horasMes > 0 ? totalDespesasAtivas / horasMes : 0;
  const custoTotalPorHora = custoHora + custoDespesaPorHora;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary shadow-glow">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Configuração de Custos
              </h2>
              <p className="mt-1 text-muted-foreground">
                Configure seu custo hora e despesas fixas para precificação.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Custo Hora */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Custo por Hora</CardTitle>
              <CardDescription>
                Defina quanto você cobra por hora de trabalho e suas horas mensais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custo_hora">Seu Custo/Hora (R$)</Label>
                  <Input
                    id="custo_hora"
                    type="number"
                    step="0.01"
                    min="0"
                    value={custoHora}
                    onChange={(e) => setCustoHora(Number(e.target.value))}
                    placeholder="50,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horas_mes">Horas Trabalhadas/Mês</Label>
                  <Input
                    id="horas_mes"
                    type="number"
                    min="1"
                    value={horasMes}
                    onChange={(e) => setHorasMes(Number(e.target.value))}
                    placeholder="176"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo hora trabalho:</span>
                  <span className="font-medium">{formatCurrency(custoHora)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo despesas/hora:</span>
                  <span className="font-medium">{formatCurrency(custoDespesaPorHora)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="font-medium text-foreground">Custo Total/Hora:</span>
                  <span className="font-bold text-primary">{formatCurrency(custoTotalPorHora)}</span>
                </div>
              </div>

              <Button 
                onClick={handleSaveConfig} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* Despesas Fixas */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Despesas Fixas Mensais</CardTitle>
              <CardDescription>
                Adicione suas despesas fixas para rateio no custo hora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário para nova despesa */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Input
                    placeholder="Nome da despesa"
                    value={novaDespesa.nome}
                    onChange={(e) => setNovaDespesa({ ...novaDespesa, nome: e.target.value })}
                  />
                </div>
                <div className="col-span-3">
                  <Select 
                    value={novaDespesa.tipo} 
                    onValueChange={(v) => setNovaDespesa({ ...novaDespesa, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DESPESA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Valor"
                    value={novaDespesa.valor_mensal || ""}
                    onChange={(e) => setNovaDespesa({ ...novaDespesa, valor_mensal: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    onClick={handleAddDespesa} 
                    disabled={isSaving || !novaDespesa.nome.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Lista de despesas */}
              {despesas.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Ativo</TableHead>
                        <TableHead>Despesa</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {despesas.map((despesa) => (
                        <TableRow key={despesa.id} className={!despesa.ativo ? "opacity-50" : ""}>
                          <TableCell>
                            <Switch
                              checked={despesa.ativo}
                              onCheckedChange={() => handleToggleDespesa(despesa)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{despesa.nome}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {TIPOS_DESPESA.find(t => t.value === despesa.tipo)?.label || despesa.tipo}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(despesa.valor_mensal))}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteDespesa(despesa.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma despesa cadastrada ainda.
                </div>
              )}

              {/* Total */}
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Total Despesas Ativas:</span>
                  <span className="font-bold text-primary">{formatCurrency(totalDespesasAtivas)}/mês</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ConfiguracaoCustos;