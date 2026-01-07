import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import BetaBanner from "@/components/BetaBanner";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Suppliers from "./pages/Suppliers";
import Insumos from "./pages/Insumos";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import OrdensProducao from "./pages/OrdensProducao";
import PedidosVenda from "./pages/PedidosVenda";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Dashboard from "./pages/Dashboard";
import Planos from "./pages/Planos";
import Auth from "./pages/Auth";
import Termos from "./pages/Termos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BetaBanner />
              <Routes>
                <Route path="/landing" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/termos" element={<Termos />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fornecedores"
                  element={
                    <ProtectedRoute>
                      <Suppliers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insumos"
                  element={
                    <ProtectedRoute>
                      <Insumos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estoque"
                  element={
                    <ProtectedRoute>
                      <Estoque />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/produtos"
                  element={
                    <ProtectedRoute>
                      <Produtos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ordens-producao"
                  element={
                    <ProtectedRoute>
                      <OrdensProducao />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pedidos"
                  element={
                    <ProtectedRoute>
                      <PedidosVenda />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/financeiro"
                  element={
                    <ProtectedRoute>
                      <Financeiro />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/relatorios"
                  element={
                    <ProtectedRoute>
                      <Relatorios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/planos"
                  element={
                    <ProtectedRoute>
                      <Planos />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
