import { useState, useEffect, useMemo } from "react";
import { BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProdutoInsumo {
  quantidade: number;
  insumo: {
    custo_unitario: number;
    usos_por_unidade: number;
  };
}

interface ProdutoBase {
  custo_aquisicao: number;
}

interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  margem_lucro: number;
  tempo_producao_minutos: number;
  produto_base?: ProdutoBase | null;
  produto_insumos: ProdutoInsumo[];
}

interface OrdemProducao {
  id: string;
  produto_id: string;
  quantidade: number;
  status: string;
  custo_total: number;
  created_at: string;
  data_conclusao: string | null;
  produto?: { nome: string; categoria: string | null };
}

const COLORS = [
  "hsl(199, 89%, 48%)",
  "hsl(173, 80%, 40%)",
  "hsl(280, 65%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(340, 75%, 55%)",
  "hsl(120, 60%, 45%)",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

interface ConfigCusto {
  custo_hora_trabalho: number;
  horas_trabalho_mes: number;
}

interface DespesaFixa {
  valor_mensal: number;
  ativo: boolean;
}

const Relatorios = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [configCusto, setConfigCusto] = useState<ConfigCusto | null>(null);
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodoMeses, setPeriodoMeses] = useState("6");
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [produtosResult, ordensResult, configResult, despesasResult] = await Promise.all([
        supabase
          .from("produtos")
          .select(`
            id, nome, categoria, margem_lucro, tempo_producao_minutos,
            produto_base:produtos_base(custo_aquisicao),
            produto_insumos(quantidade, insumo:insumos(custo_unitario, usos_por_unidade))
          `)
          .order("nome"),
        supabase
          .from("ordens_producao")
          .select(`
            id, produto_id, quantidade, status, custo_total, created_at, data_conclusao,
            produto:produtos(nome, categoria)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("configuracao_custos")
          .select("custo_hora_trabalho, horas_trabalho_mes")
          .maybeSingle(),
        supabase
          .from("despesas_fixas")
          .select("valor_mensal, ativo"),
      ]);

      if (!produtosResult.error) setProdutos(produtosResult.data || []);
      if (!ordensResult.error) setOrdens(ordensResult.data || []);
      if (!configResult.error) setConfigCusto(configResult.data);
      if (!despesasResult.error) setDespesasFixas(despesasResult.data || []);
    } catch (error) {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Calcular custo e preço de venda para cada produto
  const produtosComCalculos = useMemo(() => {
    return produtos.map((produto) => {
      // 1. Custo do produto base
      const custoBase = produto.produto_base 
        ? Number(produto.produto_base.custo_aquisicao) 
        : 0;

      // 2. Custo dos insumos (usando custo por uso)
      const custoInsumos = produto.produto_insumos.reduce((total, pi) => {
        if (!pi.insumo) return total;
        const custoUnitario = Number(pi.insumo.custo_unitario || 0);
        const usosPorUnidade = Number(pi.insumo.usos_por_unidade || 1);
        const custoPorUso = usosPorUnidade > 0 ? custoUnitario / usosPorUnidade : custoUnitario;
        return total + custoPorUso * Number(pi.quantidade);
      }, 0);

      // 3. Custo de mão de obra
      const tempoHoras = Number(produto.tempo_producao_minutos || 0) / 60;
      const custoMaoDeObra = tempoHoras * custoHoraTotal;

      const custoTotal = custoBase + custoInsumos + custoMaoDeObra;
      const precoVenda = custoTotal * (1 + produto.margem_lucro / 100);
      const lucroUnitario = precoVenda - custoTotal;
      
      return {
        ...produto,
        custoBase,
        custoInsumos,
        custoMaoDeObra,
        custoTotal,
        precoVenda,
        lucroUnitario,
        margemReal: custoTotal > 0 ? ((precoVenda - custoTotal) / precoVenda) * 100 : 0,
      };
    });
  }, [produtos, custoHoraTotal]);


  // Filtrar ordens pelo período selecionado
  const ordensNoPeriodo = useMemo(() => {
    const meses = parseInt(periodoMeses);
    const dataInicio = startOfMonth(subMonths(new Date(), meses - 1));
    
    return ordens.filter((ordem) => {
      const dataOrdem = new Date(ordem.created_at);
      return dataOrdem >= dataInicio && ordem.status === "concluida";
    });
  }, [ordens, periodoMeses]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const totalOrdens = ordensNoPeriodo.length;
    const totalCusto = ordensNoPeriodo.reduce((sum, o) => sum + o.custo_total, 0);
    const totalUnidades = ordensNoPeriodo.reduce((sum, o) => sum + o.quantidade, 0);
    
    // Calcular receita estimada
    const receitaEstimada = ordensNoPeriodo.reduce((sum, ordem) => {
      const produto = produtosComCalculos.find((p) => p.id === ordem.produto_id);
      return sum + (produto?.precoVenda || 0) * ordem.quantidade;
    }, 0);
    
    const lucroEstimado = receitaEstimada - totalCusto;
    const margemMedia = receitaEstimada > 0 ? ((receitaEstimada - totalCusto) / receitaEstimada) * 100 : 0;

    return {
      totalOrdens,
      totalCusto,
      totalUnidades,
      receitaEstimada,
      lucroEstimado,
      margemMedia,
    };
  }, [ordensNoPeriodo, produtosComCalculos]);

  // Dados para gráfico de barras - Produção por produto
  const producaoPorProduto = useMemo(() => {
    const agrupado: Record<string, { nome: string; quantidade: number; custo: number; receita: number }> = {};
    
    ordensNoPeriodo.forEach((ordem) => {
      const produto = produtosComCalculos.find((p) => p.id === ordem.produto_id);
      const nome = ordem.produto?.nome || "Desconhecido";
      
      if (!agrupado[ordem.produto_id]) {
        agrupado[ordem.produto_id] = { nome, quantidade: 0, custo: 0, receita: 0 };
      }
      
      agrupado[ordem.produto_id].quantidade += ordem.quantidade;
      agrupado[ordem.produto_id].custo += ordem.custo_total;
      agrupado[ordem.produto_id].receita += (produto?.precoVenda || 0) * ordem.quantidade;
    });
    
    return Object.values(agrupado)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [ordensNoPeriodo, produtosComCalculos]);

  // Dados para gráfico de pizza - Distribuição por categoria
  const distribuicaoCategoria = useMemo(() => {
    const agrupado: Record<string, number> = {};
    
    ordensNoPeriodo.forEach((ordem) => {
      const categoria = ordem.produto?.categoria || "Sem categoria";
      agrupado[categoria] = (agrupado[categoria] || 0) + ordem.quantidade;
    });
    
    return Object.entries(agrupado).map(([name, value]) => ({ name, value }));
  }, [ordensNoPeriodo]);

  // Dados para gráfico de linha - Evolução mensal
  const evolucaoMensal = useMemo(() => {
    const meses = parseInt(periodoMeses);
    const dados: { mes: string; custo: number; receita: number; lucro: number }[] = [];
    
    for (let i = meses - 1; i >= 0; i--) {
      const data = subMonths(new Date(), i);
      const inicio = startOfMonth(data);
      const fim = endOfMonth(data);
      
      const ordensDoMes = ordensNoPeriodo.filter((ordem) => {
        const dataOrdem = new Date(ordem.created_at);
        return dataOrdem >= inicio && dataOrdem <= fim;
      });
      
      const custo = ordensDoMes.reduce((sum, o) => sum + o.custo_total, 0);
      const receita = ordensDoMes.reduce((sum, ordem) => {
        const produto = produtosComCalculos.find((p) => p.id === ordem.produto_id);
        return sum + (produto?.precoVenda || 0) * ordem.quantidade;
      }, 0);
      
      dados.push({
        mes: format(data, "MMM/yy", { locale: ptBR }),
        custo,
        receita,
        lucro: receita - custo,
      });
    }
    
    return dados;
  }, [ordensNoPeriodo, produtosComCalculos, periodoMeses]);

  // Ranking de margem de lucro por produto
  const rankingMargem = useMemo(() => {
    return [...produtosComCalculos]
      .filter((p) => p.custoTotal > 0)
      .sort((a, b) => b.margemReal - a.margemReal)
      .slice(0, 10);
  }, [produtosComCalculos]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Relatórios Financeiros
              </h2>
              <p className="mt-1 text-muted-foreground">
                Análise de produção, custos e margem de lucro.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <Select value={periodoMeses} onValueChange={setPeriodoMeses}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ordens Concluídas
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.totalOrdens}</div>
                  <p className="text-xs text-muted-foreground">
                    {estatisticas.totalUnidades} unidades produzidas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Custo Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(estatisticas.totalCusto)}</div>
                  <p className="text-xs text-muted-foreground">em insumos utilizados</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Receita Estimada
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(estatisticas.receitaEstimada)}</div>
                  <p className="text-xs text-muted-foreground">
                    Lucro: {formatCurrency(estatisticas.lucroEstimado)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Margem Média
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.margemMedia.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">sobre receita estimada</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="evolucao" className="animate-slide-up">
              <TabsList className="mb-4">
                <TabsTrigger value="evolucao">Evolução</TabsTrigger>
                <TabsTrigger value="produtos">Por Produto</TabsTrigger>
                <TabsTrigger value="margem">Margem de Lucro</TabsTrigger>
              </TabsList>

              <TabsContent value="evolucao" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Gráfico de Linha - Evolução */}
                  <Card className="border-border lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Evolução Mensal</CardTitle>
                      <CardDescription>Custo, receita e lucro ao longo do tempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={evolucaoMensal}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="mes" className="text-xs fill-muted-foreground" />
                            <YAxis className="text-xs fill-muted-foreground" />
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="custo"
                              name="Custo"
                              stroke="hsl(340, 75%, 55%)"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="receita"
                              name="Receita"
                              stroke="hsl(173, 80%, 40%)"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="lucro"
                              name="Lucro"
                              stroke="hsl(199, 89%, 48%)"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Pizza - Distribuição por Categoria */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle>Distribuição por Categoria</CardTitle>
                      <CardDescription>Quantidade produzida por categoria</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {distribuicaoCategoria.length === 0 ? (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            Nenhum dado disponível
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={distribuicaoCategoria}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {distribuicaoCategoria.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Barras - Top Produtos */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle>Top Produtos</CardTitle>
                      <CardDescription>Mais produzidos no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {producaoPorProduto.length === 0 ? (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            Nenhum dado disponível
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={producaoPorProduto} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis type="number" className="text-xs fill-muted-foreground" />
                              <YAxis
                                type="category"
                                dataKey="nome"
                                width={100}
                                className="text-xs fill-muted-foreground"
                              />
                              <Tooltip />
                              <Bar dataKey="quantidade" name="Quantidade" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="produtos">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Análise por Produto</CardTitle>
                    <CardDescription>Quantidade produzida, custo e receita por produto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Qtd Produzida</TableHead>
                          <TableHead className="text-right">Custo Total</TableHead>
                          <TableHead className="text-right">Receita Estimada</TableHead>
                          <TableHead className="text-right">Lucro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {producaoPorProduto.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                              Nenhum dado disponível para o período selecionado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          producaoPorProduto.map((item, idx) => (
                            <TableRow key={idx} className="border-border">
                              <TableCell className="font-medium">{item.nome}</TableCell>
                              <TableCell className="text-right">{item.quantidade}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.custo)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.receita)}</TableCell>
                              <TableCell className="text-right text-green-600">
                                {formatCurrency(item.receita - item.custo)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="margem" className="space-y-6">
                {/* Gráfico de composição de custos agregado */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Composição Média de Custos</CardTitle>
                    <CardDescription>Distribuição entre produto base, insumos e mão de obra</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {(() => {
                        const totais = produtosComCalculos.reduce(
                          (acc, p) => ({
                            base: acc.base + p.custoBase,
                            insumos: acc.insumos + p.custoInsumos,
                            maoDeObra: acc.maoDeObra + p.custoMaoDeObra,
                          }),
                          { base: 0, insumos: 0, maoDeObra: 0 }
                        );
                        const composicaoData = [
                          { name: "Produto Base", value: totais.base, color: "hsl(199, 89%, 48%)" },
                          { name: "Insumos", value: totais.insumos, color: "hsl(173, 80%, 40%)" },
                          { name: "Mão de Obra", value: totais.maoDeObra, color: "hsl(280, 65%, 60%)" },
                        ].filter(d => d.value > 0);

                        if (composicaoData.length === 0) {
                          return (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              Nenhum dado de custo disponível
                            </div>
                          );
                        }

                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={composicaoData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Ranking de Margem de Lucro</CardTitle>
                    <CardDescription>Comparativo custo × preço de venda por produto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Base</TableHead>
                          <TableHead className="text-right">Insumos</TableHead>
                          <TableHead className="text-right">Mão de Obra</TableHead>
                          <TableHead className="text-right">Custo Total</TableHead>
                          <TableHead className="text-right">Preço Venda</TableHead>
                          <TableHead className="text-right">Lucro</TableHead>
                          <TableHead className="text-right">Margem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankingMargem.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                              Nenhum produto cadastrado com custo definido.
                            </TableCell>
                          </TableRow>
                        ) : (
                          rankingMargem.map((produto) => (
                            <TableRow key={produto.id} className="border-border">
                              <TableCell className="font-medium">
                                <div>
                                  <span>{produto.nome}</span>
                                  {produto.categoria && (
                                    <p className="text-xs text-muted-foreground">{produto.categoria}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(produto.custoBase)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(produto.custoInsumos)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(produto.custoMaoDeObra)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(produto.custoTotal)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-primary">
                                {formatCurrency(produto.precoVenda)}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {formatCurrency(produto.lucroUnitario)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`font-bold ${
                                    produto.margemReal >= 30
                                      ? "text-green-600"
                                      : produto.margemReal >= 15
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {produto.margemReal.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default Relatorios;
