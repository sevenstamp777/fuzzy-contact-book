import { Users, Truck } from "lucide-react";
import NavLink from "@/components/NavLink";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">
                ClientFlow
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestão Empresarial
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" icon={<Users className="h-4 w-4" />}>
              Clientes
            </NavLink>
            <NavLink to="/fornecedores" icon={<Truck className="h-4 w-4" />}>
              Fornecedores
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
