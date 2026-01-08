import { useState, useEffect } from "react";
import { Users, Truck, LayoutDashboard, LogOut, User, Package, ShoppingBag, Warehouse, Factory, BarChart3, ShoppingCart, DollarSign, CreditCard, Box, Settings, ChevronDown, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import NavLink from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileDialog from "@/components/ProfileDialog";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavItem = ({ to, icon, children, onClick }: NavItemProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;
  
  return (
    <button
      onClick={() => {
        navigate(to);
        onClick?.();
      }}
      className={cn(
        "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
};

const menuGroups = [
  {
    label: "Cadastros",
    items: [
      { to: "/", icon: <Users className="h-4 w-4" />, label: "Clientes" },
      { to: "/fornecedores", icon: <Truck className="h-4 w-4" />, label: "Fornecedores" },
      { to: "/insumos", icon: <Package className="h-4 w-4" />, label: "Insumos" },
    ],
  },
  {
    label: "Produtos",
    items: [
      { to: "/produtos-base", icon: <Box className="h-4 w-4" />, label: "Produtos Base" },
      { to: "/produtos", icon: <ShoppingBag className="h-4 w-4" />, label: "Produtos Finais" },
      { to: "/custos", icon: <Settings className="h-4 w-4" />, label: "Config. Custos" },
    ],
  },
  {
    label: "Operações",
    items: [
      { to: "/estoque", icon: <Warehouse className="h-4 w-4" />, label: "Estoque" },
      { to: "/ordens-producao", icon: <Factory className="h-4 w-4" />, label: "Produção" },
      { to: "/pedidos", icon: <ShoppingCart className="h-4 w-4" />, label: "Pedidos" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/financeiro", icon: <DollarSign className="h-4 w-4" />, label: "Financeiro" },
      { to: "/relatorios", icon: <BarChart3 className="h-4 w-4" />, label: "Relatórios" },
    ],
  },
];

const Header = () => {
  const { user, signOut } = useAuth();
  const { plan } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const planLabels: Record<string, string> = {
    explorador: "Explorador",
    impulso: "Impulso",
    crescimento: "Crescimento",
    dominio: "Domínio",
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.name || user?.email || "Usuário";
  const userInitial = profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  const isGroupActive = (items: typeof menuGroups[0]["items"]) => {
    return items.some(item => location.pathname === item.to);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
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

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 xl:flex">
            <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </NavLink>
            
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {menuGroups.map((group) => (
                  <NavigationMenuItem key={group.label}>
                    <NavigationMenuTrigger 
                      className={cn(
                        "h-9 px-3 text-sm font-medium bg-transparent",
                        isGroupActive(group.items) && "text-primary"
                      )}
                    >
                      {group.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-48 gap-1 p-2">
                        {group.items.map((item) => (
                          <li key={item.to}>
                            <NavigationMenuLink asChild>
                              <button
                                onClick={() => navigate(item.to)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                  location.pathname === item.to
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                {item.icon}
                                {item.label}
                              </button>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Tablet Navigation (simplified) */}
          <nav className="hidden items-center gap-1 lg:flex xl:hidden">
            <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </NavLink>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Menu
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {menuGroups.map((group, groupIndex) => (
                  <div key={group.label}>
                    {groupIndex > 0 && <DropdownMenuSeparator />}
                    <div className="px-2 py-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((item) => (
                      <DropdownMenuItem
                        key={item.to}
                        onClick={() => navigate(item.to)}
                        className={cn(
                          "cursor-pointer gap-2",
                          location.pathname === item.to && "bg-primary/10 text-primary"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-16 items-center gap-3 border-b px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                  <Users className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold">ClientFlow</span>
              </div>
              <div className="flex flex-col gap-1 p-4">
                <NavItem 
                  to="/dashboard" 
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </NavItem>
                
                {menuGroups.map((group) => (
                  <div key={group.label} className="mt-4 first:mt-0">
                    <span className="mb-2 block px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </span>
                    {group.items.map((item) => (
                      <NavItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </NavItem>
                    ))}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          {user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 ring-2 ring-border">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      {profile?.name && (
                        <p className="text-sm font-medium text-foreground">
                          {profile.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsProfileDialogOpen(true)} 
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/planos")} 
                    className="cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="flex-1">Planos</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {planLabels[plan]}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ProfileDialog
                open={isProfileDialogOpen}
                onOpenChange={setIsProfileDialogOpen}
                profile={profile}
                onProfileUpdate={fetchProfile}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
