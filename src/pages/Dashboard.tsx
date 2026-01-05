import { useState, useEffect } from "react";
import { Users, Truck, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface Stats {
  totalClients: number;
  totalSuppliers: number;
  clientsThisMonth: number;
  suppliersThisMonth: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalSuppliers: 0,
    clientsThisMonth: 0,
    suppliersThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ name: string; clientes: number; fornecedores: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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

        // Generate mock monthly data for the chart
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
        const mockData = months.map((name) => ({
          name,
          clientes: Math.floor(Math.random() * 20) + 5,
          fornecedores: Math.floor(Math.random() * 10) + 2,
        }));
        
        // Set last month to actual data
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

    fetchStats();
  }, []);

  const pieData = [
    { name: "Clientes", value: stats.totalClients, color: "hsl(199, 89%, 48%)" },
    { name: "Fornecedores", value: stats.totalSuppliers, color: "hsl(173, 80%, 40%)" },
  ];

  const statCards = [
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
      title: "Novos Clientes",
      value: stats.clientsThisMonth,
      icon: TrendingUp,
      change: null,
      changeLabel: "este mês",
      trend: null,
    },
    {
      title: "Novos Fornecedores",
      value: stats.suppliersThisMonth,
      icon: Calendar,
      change: null,
      changeLabel: "este mês",
      trend: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Dashboard
          </h2>
          <p className="mt-1 text-muted-foreground">
            Visão geral do seu negócio
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
