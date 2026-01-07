import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanType = "explorador" | "impulso" | "crescimento" | "dominio";

interface PlanLimits {
  produtos: number;
  clientes: number;
  pedidos_mes: number;
  relatorios: boolean;
  suporte: string;
}

interface SubscriptionContextType {
  plan: PlanType;
  limits: PlanLimits;
  subscriptionEnd: string | null;
  isSubscribed: boolean;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  canCreateProduto: (currentCount: number) => boolean;
  canCreateCliente: (currentCount: number) => boolean;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  explorador: { produtos: 5, clientes: 10, pedidos_mes: 20, relatorios: false, suporte: "comunidade" },
  impulso: { produtos: 30, clientes: 100, pedidos_mes: 200, relatorios: true, suporte: "email" },
  crescimento: { produtos: 100, clientes: 500, pedidos_mes: 1000, relatorios: true, suporte: "prioritario" },
  dominio: { produtos: -1, clientes: -1, pedidos_mes: -1, relatorios: true, suporte: "dedicado" },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const [plan, setPlan] = useState<PlanType>("explorador");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setPlan("explorador");
      setSubscriptionEnd(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setPlan((data.plan as PlanType) || "explorador");
      setSubscriptionEnd(data.subscription_end || null);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setPlan("explorador");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const limits = PLAN_LIMITS[plan];
  const isSubscribed = plan !== "explorador";

  const canCreateProduto = (currentCount: number) => {
    if (limits.produtos === -1) return true;
    return currentCount < limits.produtos;
  };

  const canCreateCliente = (currentCount: number) => {
    if (limits.clientes === -1) return true;
    return currentCount < limits.clientes;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        limits,
        subscriptionEnd,
        isSubscribed,
        isLoading,
        checkSubscription,
        canCreateProduto,
        canCreateCliente,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    return {
      plan: "explorador" as PlanType,
      limits: PLAN_LIMITS.explorador,
      subscriptionEnd: null,
      isSubscribed: false,
      isLoading: true,
      checkSubscription: async () => {},
      canCreateProduto: () => true,
      canCreateCliente: () => true,
    };
  }
  
  return context;
};
