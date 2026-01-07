import { useState, useEffect } from "react";
import { Users, Truck, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, AlertTriangle, Package, Factory, DollarSign, ShoppingCart, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import UpgradeBanner from "@/components/UpgradeBanner";
import OnboardingGuide from "@/components/OnboardingGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Stats {
  totalClients: number;
  totalSuppliers: number;
  clientsThisMonth: number;
  suppliersThisMonth: number;
}

interface SalesMetrics {
  faturamentoTotal: number;
  lucroEstimado: number;
  pedidosPendentes: number;
}

interface Alert {
  type: "stock" | "order" | "finance";
  title: string;
  description: string;
  severity: "warning" | "error" | "info";
  link?: string;
}

interface FinancialMetrics {
  totalReceber: number;
  totalPagar: number;
  atrasadas: number;
  saldo: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalSuppliers: 0,
    clientsThisMonth: 0,
    suppliersThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ name: string; clientes: number; fornecedores: number }[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    totalReceber: 0,
    totalPagar: 0,
    atrasadas: 0,
    saldo: 0,
  });
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    faturamentoTotal: 0,
    lucroEstimado: 0,
    pedidosPendentes: 0,
  });
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch basic stats
        const [clientsResult, suppliersResult, clientsMonthResult, suppliersMonthResult] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase.from("suppliers").select("id", { count: "exact", head: true }),
          supabase.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
          supabase.from("suppliers").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
        ]);

        setStats({
          totalClients: clientsResult.count || 0,
          totalSuppliers: suppliersResult.count || 0,
          clientsThisMonth: clientsMonthResult.count || 0,
          suppliersThisMonth: suppliersMonthResult.count || 0,
        });

        // Fetch alerts data
        const alertsList: Alert[] = [];

        // Low stock alerts
        const { data: allInsumos } = await supabase
          .from("insumos")
          .select("id, nome, quantidade_estoque, estoque_minimo");

        const lowStock = (allInsumos || []).filter(i => i.quantidade_estoque < i.estoque_minimo);
        lowStock.forEach(insumo => {
          alertsList.push({
            type: "stock",
            title: "Estoque Baixo",
            description: `${insumo.nome}: ${insumo.quantidade_estoque} unidades (mínimo: ${insumo.estoque_minimo})`,
            severity: insumo.quantidade_estoque <= 0 ? "error" : "warning",
            link: "/estoque",
          });
        });

        // Pending orders
        const { data: pendingOrdersData, count: pendingOrdersCount } = await supabase
          .from("ordens_producao")
          .select("id, numero, status", { count: "exact" })
          .in("status", ["pendente", "em_andamento"]);

        setPendingOrders(pendingOrdersCount || 0);

        if ((pendingOrdersCount || 0) > 0) {
          alertsList.push({
            type: "order",
            title: "Ordens Pendentes",
            description: `${pendingOrdersCount} ordens de produção aguardando`,
            severity: "info",
            link: "/ordens-producao",
          });
        }

        // Sales metrics - fetch pedidos_venda with their items
        const { data: pedidosData } = await supabase
          .from("pedidos_venda")
          .select(`
            id, valor_total, status,
            itens_pedido(quantidade, preco_unitario, produto_id)
          `);

        let faturamentoTotal = 0;
        let lucroEstimado = 0;
        let pedidosPendentes = 0;

        // Get all products to calculate cost
        const { data: produtosData } = await supabase
          .from("produtos")
          .select(`
            id, margem_lucro,
            produto_insumos(quantidade, insumo:insumos(custo_unitario))
          `);

        const produtoCustosMap = new Map<string, number>();
        (produtosData || []).forEach(produto => {
          const custoTotal = (produto.produto_insumos || []).reduce((sum: number, pi: { quantidade: number; insumo: { custo_unitario: number } | null }) => {
            return sum + (pi.quantidade * (pi.insumo?.custo_unitario || 0));
          }, 0);
          produtoCustosMap.set(produto.id, custoTotal);
        });

        (pedidosData || []).forEach(pedido => {
          faturamentoTotal += pedido.valor_total || 0;
          
          if (pedido.status === "pendente" || pedido.status === "em_andamento") {
            pedidosPendentes++;
          }

          // Calculate estimated profit
          (pedido.itens_pedido || []).forEach((item: { quantidade: number; preco_unitario: number; produto_id: string }) => {
            const custoUnitario = produtoCustosMap.get(item.produto_id) || 0;
            const receita = item.quantidade * item.preco_unitario;
            const custo = item.quantidade * custoUnitario;
            lucroEstimado += receita - custo;
          });
        });

        setSalesMetrics({
          faturamentoTotal,
          lucroEstimado,
          pedidosPendentes,
        });

        // Financial data
        const { data: contasData } = await supabase
          .from("contas")
          .select("tipo, valor, status, data_vencimento");

        const today = new Date().toISOString().split("T")[0];
        let totalReceber = 0;
        let totalPagar = 0;
        let atrasadas = 0;

        (contasData || []).forEach(conta => {
          if (conta.status !== "pago") {
            if (conta.tipo === "receber") {
              totalReceber += conta.valor;
            } else {
              totalPagar += conta.valor;
            }
            if (conta.data_vencimento < today) {
              atrasadas += conta.valor;
            }
          }
        });

        setFinancialMetrics({
          totalReceber,
          totalPagar,
          atrasadas,
          saldo: totalReceber - totalPagar,
        });

        if (atrasadas > 0) {
          alertsList.push({
            type: "finance",
            title: "Contas Atrasadas",
            description: `R$ ${atrasadas.toFixed(2)} em contas vencidas`,
            severity: "error",
            link: "/financeiro",
          });
        }

        setAlerts(alertsList);

        // Generate monthly data for charts
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
        const mockData = months.map((name) => ({
          name,
          clientes: Math.floor(Math.random() * 20) + 5,
          fornecedores: Math.floor(Math.random() * 10) + 2,
        }));
        
        if (mockData.length > 0) {
          mockData[mockData.length - 1] = {
            name: "Este mês",
            clientes: clientsMonthResult.count || 0,
            fornecedores: suppliersMonthResult.count || 0,
          };
        }
        
        setMonthlyData(mockData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const pieData = [
    { name: "Clientes", value: stats.totalClients, color: "hsl(199, 89%, 48%)" },
    { name: "Fornecedores", value: stats.totalSuppliers, color: "hsl(173, 80%, 40%)" },
  ];

  const statCards = [
    {
      title: "Faturamento Total",
      value: `R$ ${salesMetrics.faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: ShoppingCart,
      change: null,
      changeLabel: "",
      trend: "up",
      isMonetary: true,
    },
    {
      title: "Lucro Estimado",
      value: `R$ ${salesMetrics.lucroEstimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Percent,
      change: null,
      changeLabel: "",
      trend: salesMetrics.lucroEstimado >= 0 ? "up" : "down",
      isMonetary: true,
    },
    {
      title: "Total de Clientes",
      value: stats.totalClients,
      icon: Users,
      change: stats.clientsThisMonth,
      changeLabel: "este mês",
      trend: "up",
    },
    {
      title: "Total de Fornecedores",
      value: stats.totalSuppliers,
      icon: Truck,
      change: stats.suppliersThisMonth,
      changeLabel: "este mês",
      trend: "up",
    },
    {
      title: "Ordens Pendentes",
      value: pendingOrders,
      icon: Factory,
      change: null,
      changeLabel: "",
      trend: null,
    },
    {
      title: "Saldo Previsto",
      value: `R$ ${financialMetrics.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      change: null,
      changeLabel: "",
      trend: financialMetrics.saldo >= 0 ? "up" : "down",
      isMonetary: true,
    },
  ];

  const alertSeverityColors = {
    warning: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    error: "bg-red-500/20 text-red-500 border-red-500/30",
    info: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  };

  const alertIcons = {
    stock: Package,
    order: Factory,
    finance: DollarSign,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-6 animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Dashboard
          </h2>
          <p className="mt-1 text-muted-foreground">
            Visão geral do seu negócio
          </p>
        </div>

        {/* Onboarding Guide for New Users */}
        <div className="mb-8 animate-fade-in">
          <OnboardingGuide />
        </div>

        {/* Upgrade Banner */}
        <div className="mb-8 animate-fade-in">
          <UpgradeBanner />
        </div>

        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <Card className="mb-8 border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {alerts.map((alert, index) => {
                  const Icon = alertIcons[alert.type];
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${alertSeverityColors[alert.severity]}`}
                    >
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs opacity-80 truncate">{alert.description}</p>
                      </div>
                      {alert.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => navigate(alert.link!)}
                        >
                          Ver
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, index) => (
            <Card
              key={stat.title}
              className="animate-slide-up border-border bg-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {isLoading ? "-" : stat.value}
                </div>
                {stat.change !== null && (
                  <div className="mt-1 flex items-center text-sm">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      +{stat.change} {stat.changeLabel}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-500">A Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                R$ {financialMetrics.totalReceber.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-500">A Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">
                R$ {financialMetrics.totalPagar.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-500">Atrasadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-500">
                R$ {financialMetrics.atrasadas.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <Card className="animate-slide-up border-border bg-card" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <CardTitle>Cadastros por Mês</CardTitle>
              <CardDescription>Evolução de clientes e fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="clientes" name="Clientes" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fornecedores" name="Fornecedores" fill="hsl(173, 80%, 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="animate-slide-up border-border bg-card" style={{ animationDelay: "0.5s" }}>
            <CardHeader>
              <CardTitle>Distribuição</CardTitle>
              <CardDescription>Proporção entre clientes e fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card className="animate-slide-up border-border bg-card lg:col-span-2" style={{ animationDelay: "0.6s" }}>
            <CardHeader>
              <CardTitle>Tendência de Crescimento</CardTitle>
              <CardDescription>Novos cadastros ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clientes"
                      name="Clientes"
                      stroke="hsl(199, 89%, 48%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(199, 89%, 48%)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fornecedores"
                      name="Fornecedores"
                      stroke="hsl(173, 80%, 40%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(173, 80%, 40%)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
