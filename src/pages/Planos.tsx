import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Sparkles, Crown, Rocket, Compass, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, formatPrice, PlanType } from "@/lib/subscription";

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  explorador: <Compass className="h-6 w-6" />,
  impulso: <Rocket className="h-6 w-6" />,
  crescimento: <Sparkles className="h-6 w-6" />,
  dominio: <Crown className="h-6 w-6" />,
};

const Planos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { session } = useAuth();
  const { plan: currentPlan, isSubscribed, checkSubscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  // Check for checkout result
  if (searchParams.get("checkout") === "canceled") {
    toast({
      title: "Checkout cancelado",
      description: "Você pode tentar novamente quando quiser.",
    });
  }

  const handleSelectPlan = async (planId: PlanType) => {
    if (planId === "explorador") {
      toast({
        title: "Plano Explorador",
        description: "Você já está no plano gratuito.",
      });
      return;
    }

    if (planId === currentPlan) {
      // Open customer portal to manage subscription
      await handleManageSubscription();
      return;
    }

    setLoadingPlan(planId);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: planId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        title: "Erro ao iniciar checkout",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
      toast({
        title: "Erro ao abrir portal",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const getButtonText = (planId: PlanType) => {
    if (planId === currentPlan) return "Plano Atual";
    if (planId === "explorador") return "Plano Gratuito";
    return "Assinar Agora";
  };

  const getButtonVariant = (planId: PlanType, highlighted?: boolean) => {
    if (planId === currentPlan) return "outline" as const;
    if (highlighted) return "default" as const;
    return "outline" as const;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Escolha o Plano Ideal
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece gratuitamente e escale conforme seu negócio cresce. 
            Sem surpresas, cancele quando quiser.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                plan.highlighted 
                  ? "border-primary shadow-md ring-2 ring-primary/20" 
                  : plan.id === currentPlan 
                    ? "border-accent ring-2 ring-accent/20" 
                    : ""
              }`}
            >
              {plan.badge && (
                <Badge 
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                    plan.highlighted ? "bg-primary" : "bg-accent"
                  }`}
                >
                  {plan.badge}
                </Badge>
              )}
              
              {plan.id === currentPlan && (
                <Badge 
                  className="absolute -top-3 right-4 bg-success"
                >
                  Seu Plano
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-3 p-3 rounded-full ${
                  plan.highlighted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {PLAN_ICONS[plan.id]}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/mês</span>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-success shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full ${plan.highlighted && plan.id !== currentPlan ? "gradient-primary" : ""}`}
                  variant={getButtonVariant(plan.id, plan.highlighted)}
                  disabled={loadingPlan !== null || plan.id === currentPlan}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    getButtonText(plan.id)
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {isSubscribed && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={handleManageSubscription}>
              Gerenciar Assinatura
            </Button>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Pagamentos processados de forma segura via Stripe.</p>
          <p className="mt-1">Cancele a qualquer momento sem taxas adicionais.</p>
        </div>
      </main>
    </div>
  );
};

export default Planos;
