import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Users, Package, Factory, ShoppingCart, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  href: string;
  checkFn: () => Promise<boolean>;
}

const OnboardingGuide = () => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("onboarding-dismissed") === "true";
  });

  const steps: OnboardingStep[] = [
    {
      id: "clientes",
      title: "Cadastre seu primeiro cliente",
      description: "Adicione informações de contato dos seus clientes",
      icon: Users,
      href: "/",
      checkFn: async () => {
        const { count } = await supabase.from("clients").select("id", { count: "exact", head: true });
        return (count || 0) > 0;
      },
    },
    {
      id: "insumos",
      title: "Cadastre seus insumos",
      description: "Registre os materiais que você usa na produção",
      icon: Package,
      href: "/insumos",
      checkFn: async () => {
        const { count } = await supabase.from("insumos").select("id", { count: "exact", head: true });
        return (count || 0) > 0;
      },
    },
    {
      id: "produtos",
      title: "Crie um produto",
      description: "Monte seus produtos com os insumos cadastrados",
      icon: Factory,
      href: "/produtos",
      checkFn: async () => {
        const { count } = await supabase.from("produtos").select("id", { count: "exact", head: true });
        return (count || 0) > 0;
      },
    },
    {
      id: "pedidos",
      title: "Faça seu primeiro pedido",
      description: "Registre uma venda para um cliente",
      icon: ShoppingCart,
      href: "/pedidos-venda",
      checkFn: async () => {
        const { count } = await supabase.from("pedidos_venda").select("id", { count: "exact", head: true });
        return (count || 0) > 0;
      },
    },
  ];

  useEffect(() => {
    const checkSteps = async () => {
      setIsLoading(true);
      const completed: string[] = [];
      
      for (const step of steps) {
        try {
          const isComplete = await step.checkFn();
          if (isComplete) {
            completed.push(step.id);
          }
        } catch (error) {
          console.error(`Error checking step ${step.id}:`, error);
        }
      }
      
      setCompletedSteps(completed);
      setIsLoading(false);
    };

    if (!isDismissed) {
      checkSteps();
    }
  }, [isDismissed]);

  const handleDismiss = () => {
    localStorage.setItem("onboarding-dismissed", "true");
    setIsDismissed(true);
  };

  const progress = (completedSteps.length / steps.length) * 100;
  const allComplete = completedSteps.length === steps.length;

  if (isDismissed || isLoading) return null;
  if (allComplete) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Bem-vindo ao ClientFlow!</CardTitle>
            <CardDescription>
              Complete os passos abaixo para começar a usar o sistema
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{completedSteps.length}/{steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map((step) => {
            const isComplete = completedSteps.includes(step.id);
            const Icon = step.icon;
            
            return (
              <button
                key={step.id}
                onClick={() => navigate(step.href)}
                disabled={isComplete}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors
                  ${isComplete 
                    ? "border-green-500/30 bg-green-500/10 cursor-default" 
                    : "border-border hover:border-primary/50 hover:bg-accent cursor-pointer"
                  }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0
                  ${isComplete ? "bg-green-500 text-white" : "bg-primary/10 text-primary"}`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isComplete ? "text-green-600 line-through" : ""}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingGuide;
