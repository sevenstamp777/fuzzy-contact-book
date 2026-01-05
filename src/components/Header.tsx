import { useState, useEffect } from "react";
import { Users, Truck, LayoutDashboard, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavLink from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileDialog from "@/components/ProfileDialog";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
}

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

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
            <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </NavLink>
            <NavLink to="/" icon={<Users className="h-4 w-4" />}>
              Clientes
            </NavLink>
            <NavLink to="/fornecedores" icon={<Truck className="h-4 w-4" />}>
              Fornecedores
            </NavLink>
          </nav>
        </div>

        {user && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
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
    </header>
  );
};

export default Header;
