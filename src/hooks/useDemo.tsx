import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// Demo data templates
const DEMO_CLIENTS = [
  { name: "Maria Silva", email: "maria.silva@email.com", phone: "(11) 98765-4321", cpf_cnpj: "123.456.789-00", endereco: "Rua das Flores, 123 - São Paulo/SP", is_demo: true },
  { name: "João Pereira", email: "joao.pereira@empresa.com", phone: "(21) 99876-5432", cpf_cnpj: "987.654.321-00", endereco: "Av. Brasil, 456 - Rio de Janeiro/RJ", is_demo: true },
  { name: "Ana Costa", email: "ana.costa@gmail.com", phone: "(31) 97654-3210", cpf_cnpj: "456.789.123-00", endereco: "Rua Minas, 789 - Belo Horizonte/MG", is_demo: true },
];

const DEMO_SUPPLIERS = [
  { nome_fornecedor: "Distribuidora ABC", nome_contato: "Carlos Santos", email: "vendas@abc.com.br", is_demo: true },
  { nome_fornecedor: "Ingredientes Premium", nome_contato: "Fernanda Lima", email: "contato@premium.com.br", is_demo: true },
];

const DEMO_INSUMOS = [
  { nome: "Farinha de Trigo", unidade_medida: "kg" as const, quantidade_estoque: 50, estoque_minimo: 10, preco_compra: 5.50, quantidade_embalagem: 1, is_demo: true },
  { nome: "Açúcar Refinado", unidade_medida: "kg" as const, quantidade_estoque: 30, estoque_minimo: 5, preco_compra: 4.20, quantidade_embalagem: 1, is_demo: true },
  { nome: "Leite Integral", unidade_medida: "ml" as const, quantidade_estoque: 20000, estoque_minimo: 5000, preco_compra: 6.00, quantidade_embalagem: 1000, is_demo: true },
  { nome: "Ovos", unidade_medida: "un" as const, quantidade_estoque: 120, estoque_minimo: 30, preco_compra: 15.00, quantidade_embalagem: 12, is_demo: true },
];

const DEMO_PRODUTOS = [
  { nome: "Bolo de Chocolate", categoria: "Bolos", descricao: "Bolo tradicional de chocolate com cobertura", margem_lucro: 50, is_demo: true },
  { nome: "Torta de Limão", categoria: "Tortas", descricao: "Torta com creme de limão e merengue", margem_lucro: 60, is_demo: true },
  { nome: "Pão de Queijo", categoria: "Salgados", descricao: "Pão de queijo mineiro tradicional", margem_lucro: 80, is_demo: true },
];

interface UseDemoReturn {
  isDemoMode: boolean;
  hasDemoData: boolean;
  isLoadingDemo: boolean;
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  checkDemoStatus: () => Promise<void>;
}

export const useDemo = (): UseDemoReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasDemoData, setHasDemoData] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const checkDemoStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Check if user has demo data in any table
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_demo", true)
        .limit(1);

      const hasDemo = (clients?.length ?? 0) > 0;
      setHasDemoData(hasDemo);
      setIsDemoMode(hasDemo);
    } catch (error) {
      console.error("Error checking demo status:", error);
    }
  }, [user?.id]);

  const loadDemoData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingDemo(true);
    try {
      // Insert demo clients
      await supabase.from("clients").insert(
        DEMO_CLIENTS.map(c => ({ ...c, user_id: user.id }))
      );

      // Insert demo suppliers
      await supabase.from("suppliers").insert(
        DEMO_SUPPLIERS.map(s => ({ ...s, user_id: user.id }))
      );

      // Insert demo insumos
      await supabase.from("insumos").insert(
        DEMO_INSUMOS.map(i => ({ ...i, user_id: user.id }))
      );

      // Insert demo produtos
      await supabase.from("produtos").insert(
        DEMO_PRODUTOS.map(p => ({ ...p, user_id: user.id }))
      );

      // Mark demo as loaded in profile
      await supabase
        .from("profiles")
        .update({ demo_loaded: true })
        .eq("user_id", user.id);

      setHasDemoData(true);
      setIsDemoMode(true);

      toast({
        title: "Dados de demonstração carregados!",
        description: "Explore o sistema com dados fictícios. Você pode removê-los a qualquer momento.",
      });
    } catch (error) {
      console.error("Error loading demo data:", error);
      toast({
        title: "Erro ao carregar dados demo",
        description: "Não foi possível carregar os dados de demonstração.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDemo(false);
    }
  }, [user?.id, toast]);

  const clearDemoData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingDemo(true);
    try {
      // Delete demo data from all tables (order matters due to relationships)
      await supabase.from("produtos").delete().eq("user_id", user.id).eq("is_demo", true);
      await supabase.from("insumos").delete().eq("user_id", user.id).eq("is_demo", true);
      await supabase.from("suppliers").delete().eq("user_id", user.id).eq("is_demo", true);
      await supabase.from("clients").delete().eq("user_id", user.id).eq("is_demo", true);

      setHasDemoData(false);
      setIsDemoMode(false);

      toast({
        title: "Dados demo removidos!",
        description: "Todos os dados de demonstração foram excluídos.",
      });
    } catch (error) {
      console.error("Error clearing demo data:", error);
      toast({
        title: "Erro ao limpar dados demo",
        description: "Não foi possível remover os dados de demonstração.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDemo(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    checkDemoStatus();
  }, [checkDemoStatus]);

  return {
    isDemoMode,
    hasDemoData,
    isLoadingDemo,
    loadDemoData,
    clearDemoData,
    checkDemoStatus,
  };
};
