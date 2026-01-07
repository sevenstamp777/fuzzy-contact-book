export type PlanType = "explorador" | "impulso" | "crescimento" | "dominio";

export interface PlanInfo {
  id: PlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    produtos: number;
    clientes: number;
    pedidos_mes: number;
    relatorios: boolean;
    suporte: string;
  };
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: PlanInfo[] = [
  {
    id: "explorador",
    name: "Explorador",
    price: 0,
    description: "Comece gratuitamente e descubra o potencial do sistema",
    features: [
      "5 produtos cadastrados",
      "10 clientes",
      "20 pedidos/mês",
      "Gestão de estoque básica",
      "Suporte da comunidade",
    ],
    limits: {
      produtos: 5,
      clientes: 10,
      pedidos_mes: 20,
      relatorios: false,
      suporte: "comunidade",
    },
  },
  {
    id: "impulso",
    name: "Impulso",
    price: 4.99,
    description: "Dê o primeiro passo para profissionalizar seu negócio",
    features: [
      "30 produtos cadastrados",
      "100 clientes",
      "200 pedidos/mês",
      "Relatórios completos",
      "Suporte por email",
      "Exportação CSV",
    ],
    limits: {
      produtos: 30,
      clientes: 100,
      pedidos_mes: 200,
      relatorios: true,
      suporte: "email",
    },
    highlighted: true,
    badge: "Mais Popular",
  },
  {
    id: "crescimento",
    name: "Crescimento",
    price: 19.90,
    description: "Para negócios em expansão que precisam de mais recursos",
    features: [
      "100 produtos cadastrados",
      "500 clientes",
      "1.000 pedidos/mês",
      "Relatórios avançados",
      "Suporte prioritário",
      "Importação em massa",
    ],
    limits: {
      produtos: 100,
      clientes: 500,
      pedidos_mes: 1000,
      relatorios: true,
      suporte: "prioritario",
    },
  },
  {
    id: "dominio",
    name: "Domínio",
    price: 49.90,
    description: "Controle total para quem domina o mercado",
    features: [
      "Produtos ilimitados",
      "Clientes ilimitados",
      "Pedidos ilimitados",
      "Todos os relatórios",
      "Suporte dedicado",
      "API de integração",
    ],
    limits: {
      produtos: -1,
      clientes: -1,
      pedidos_mes: -1,
      relatorios: true,
      suporte: "dedicado",
    },
    badge: "Completo",
  },
];

export const formatPrice = (price: number): string => {
  if (price === 0) return "Grátis";
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatLimit = (limit: number): string => {
  if (limit === -1) return "Ilimitado";
  return limit.toString();
};
