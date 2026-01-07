import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  Factory, 
  ShoppingCart, 
  BarChart3, 
  DollarSign, 
  Truck, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";
import { PLANS, formatPrice } from "@/lib/subscription";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastre e gerencie todos os seus clientes em um só lugar.",
    },
    {
      icon: Package,
      title: "Controle de Produtos",
      description: "Cadastre produtos com composição de insumos e cálculo automático de preços.",
    },
    {
      icon: Factory,
      title: "Ordens de Produção",
      description: "Acompanhe o ciclo de produção do início ao fim.",
    },
    {
      icon: ShoppingCart,
      title: "Pedidos de Venda",
      description: "Gerencie pedidos e acompanhe entregas facilmente.",
    },
    {
      icon: BarChart3,
      title: "Relatórios",
      description: "Visualize métricas e insights do seu negócio.",
    },
    {
      icon: DollarSign,
      title: "Financeiro",
      description: "Controle contas a pagar e receber de forma simples.",
    },
    {
      icon: Truck,
      title: "Fornecedores",
      description: "Mantenha seu cadastro de fornecedores organizado.",
    },
    {
      icon: Package,
      title: "Estoque",
      description: "Controle de insumos com alertas de estoque baixo.",
    },
  ];

  const benefits = [
    { icon: Zap, text: "Cálculo automático de custos e preços" },
    { icon: Shield, text: "Dados seguros e acessíveis de qualquer lugar" },
    { icon: Sparkles, text: "Interface intuitiva e fácil de usar" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">ClientFlow</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button className="gradient-primary shadow-glow" onClick={() => navigate("/dashboard")}>
                Ir para Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
                <Button className="gradient-primary shadow-glow" onClick={() => navigate("/auth")}>
                  Começar Grátis
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Plano gratuito disponível
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Gestão empresarial{" "}
              <span className="text-primary">simplificada</span> para seu negócio
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Controle clientes, produtos, estoque, produção e financeiro em uma única plataforma. 
              Comece gratuitamente e escale conforme seu negócio cresce.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="gradient-primary shadow-glow text-lg px-8 gap-2"
                onClick={() => navigate("/auth")}
              >
                Criar Conta Grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Strip */}
      <section className="py-8 bg-muted/50 border-y border-border">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-muted-foreground">
                <benefit.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Uma solução completa para gerenciar todos os aspectos do seu negócio
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-border bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos para cada fase do seu negócio
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comece gratuitamente e evolua conforme suas necessidades
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {PLANS.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative border-border bg-card ${
                  plan.highlighted ? "ring-2 ring-primary shadow-lg" : ""
                }`}
              >
                {plan.badge && (
                  <Badge 
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                      plan.highlighted ? "gradient-primary" : "bg-muted"
                    }`}
                  >
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/mês</span>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full mt-6 ${plan.highlighted ? "gradient-primary shadow-glow" : ""}`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.price === 0 ? "Começar Grátis" : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 max-w-4xl mx-auto">
            <CardContent className="py-12 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pronto para transformar seu negócio?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Comece agora mesmo com o plano gratuito. Sem cartão de crédito, sem compromisso.
              </p>
              <Button 
                size="lg" 
                className="gradient-primary shadow-glow text-lg px-8 gap-2"
                onClick={() => navigate("/auth")}
              >
                Criar Minha Conta
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">ClientFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ClientFlow. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
