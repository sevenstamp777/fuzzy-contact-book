import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, ArrowUpRight, Package, Users, ShoppingCart } from "lucide-react";
import { formatLimit } from "@/lib/subscription";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsageData {
  produtos: number;
  clientes: number;
  pedidosMes: number;
}

const UpgradeBanner = () => {
  const navigate = useNavigate();
  const { plan, limits, isLoading } = useSubscription();
  const [usage, setUsage] = useState<UsageData>({ produtos: 0, clientes: 0, pedidosMes: 0 });
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [produtosRes, clientesRes, pedidosRes] = await Promise.all([
          supabase.from("produtos").select("id", { count: "exact", head: true }),
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase.from("pedidos_venda")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startOfMonth),
        ]);

        setUsage({
          produtos: produtosRes.count || 0,
          clientes: clientesRes.count || 0,
          pedidosMes: pedidosRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsage();
  }, []);

  // Don't show for premium plans
  if (isLoading || plan === "dominio") return null;

  const getProgress = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (current: number, limit: number) => {
    if (limit === -1) return "text-muted-foreground";
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const isNearLimit = () => {
    const produtosNear = limits.produtos !== -1 && usage.produtos >= limits.produtos * 0.8;
    const clientesNear = limits.clientes !== -1 && usage.clientes >= limits.clientes * 0.8;
    const pedidosNear = limits.pedidos_mes !== -1 && usage.pedidosMes >= limits.pedidos_mes * 0.8;
    return produtosNear || clientesNear || pedidosNear;
  };

  const usageItems = [
    {
      icon: Package,
      label: "Produtos",
      current: usage.produtos,
      limit: limits.produtos,
    },
    {
      icon: Users,
      label: "Clientes",
      current: usage.clientes,
      limit: limits.clientes,
    },
    {
      icon: ShoppingCart,
      label: "Pedidos/mês",
      current: usage.pedidosMes,
      limit: limits.pedidos_mes,
    },
  ];

  return (
    <Card className={`border-border ${isNearLimit() ? "bg-yellow-500/5 border-yellow-500/30" : "bg-muted/30"}`}>
      <CardContent className="py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isNearLimit() ? "bg-yellow-500/20" : "bg-primary/10"}`}>
              <Crown className={`h-5 w-5 ${isNearLimit() ? "text-yellow-500" : "text-primary"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Plano {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isNearLimit() 
                  ? "Você está chegando ao limite do seu plano" 
                  : "Acompanhe seu uso e faça upgrade quando precisar"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 lg:gap-6">
            {usageItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className={`text-sm font-semibold ${getUsageColor(item.current, item.limit)}`}>
                  {loadingUsage ? "..." : item.current} / {formatLimit(item.limit)}
                </p>
                {item.limit !== -1 && (
                  <Progress 
                    value={getProgress(item.current, item.limit)} 
                    className="h-1 mt-1"
                  />
                )}
              </div>
            ))}
          </div>

          <Button 
            size="sm" 
            className={isNearLimit() ? "gradient-primary shadow-glow" : ""}
            variant={isNearLimit() ? "default" : "outline"}
            onClick={() => navigate("/planos")}
          >
            <span>Fazer Upgrade</span>
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradeBanner;
