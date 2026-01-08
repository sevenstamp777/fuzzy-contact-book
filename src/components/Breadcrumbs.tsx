import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "": "Clientes",
  "dashboard": "Dashboard",
  "fornecedores": "Fornecedores",
  "insumos": "Insumos",
  "estoque": "Estoque",
  "produtos-base": "Produtos Base",
  "produtos": "Produtos",
  "custos": "Configuração de Custos",
  "ordens-producao": "Ordens de Produção",
  "pedidos": "Pedidos de Venda",
  "financeiro": "Financeiro",
  "relatorios": "Relatórios",
  "planos": "Planos",
};

const routeGroups: Record<string, string> = {
  "": "Cadastros",
  "fornecedores": "Cadastros",
  "insumos": "Cadastros",
  "produtos-base": "Produtos",
  "produtos": "Produtos",
  "custos": "Produtos",
  "estoque": "Operações",
  "ordens-producao": "Operações",
  "pedidos": "Operações",
  "financeiro": "Gestão",
  "relatorios": "Gestão",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Don't show breadcrumbs on certain pages
  if (["/auth", "/landing", "/termos"].includes(location.pathname)) {
    return null;
  }

  const currentRoute = pathSegments[0] || "";
  const currentLabel = routeLabels[currentRoute];
  const currentGroup = routeGroups[currentRoute];

  if (!currentLabel) return null;

  return (
    <div className="border-b border-border/50 bg-muted/30">
      <div className="container flex h-10 items-center">
        <nav className="flex items-center gap-1 text-sm">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Início</span>
          </Link>
          
          {currentGroup && currentRoute !== "dashboard" && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-muted-foreground">
                {currentGroup}
              </span>
            </>
          )}
          
          {currentRoute !== "dashboard" && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-medium text-foreground">
                {currentLabel}
              </span>
            </>
          )}
          
          {currentRoute === "dashboard" && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-medium text-foreground">
                Dashboard
              </span>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumbs;
