import { Users } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">
              ClientFlow
            </h1>
            <p className="text-xs text-muted-foreground">
              Gestão de Clientes
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
