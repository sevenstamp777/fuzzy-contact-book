-- Enum para os planos
CREATE TYPE public.subscription_plan AS ENUM ('explorador', 'impulso', 'crescimento', 'dominio');

-- Tabela de assinaturas do usuário
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'explorador',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
ON public.subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter limites do plano
CREATE OR REPLACE FUNCTION public.get_plan_limits(p_plan subscription_plan)
RETURNS JSON
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE p_plan
    WHEN 'explorador' THEN '{"produtos": 5, "clientes": 10, "pedidos_mes": 20, "relatorios": false, "suporte": "comunidade"}'::json
    WHEN 'impulso' THEN '{"produtos": 30, "clientes": 100, "pedidos_mes": 200, "relatorios": true, "suporte": "email"}'::json
    WHEN 'crescimento' THEN '{"produtos": 100, "clientes": 500, "pedidos_mes": 1000, "relatorios": true, "suporte": "prioritario"}'::json
    WHEN 'dominio' THEN '{"produtos": -1, "clientes": -1, "pedidos_mes": -1, "relatorios": true, "suporte": "dedicado"}'::json
  END
$$;

-- Função para verificar se usuário pode criar produto
CREATE OR REPLACE FUNCTION public.can_create_produto()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan subscription_plan;
  v_limit INT;
  v_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Obter plano do usuário (default: explorador)
  SELECT COALESCE(plan, 'explorador') INTO v_plan
  FROM public.subscriptions
  WHERE user_id = v_user_id;
  
  IF v_plan IS NULL THEN
    v_plan := 'explorador';
  END IF;
  
  -- Obter limite de produtos
  SELECT (get_plan_limits(v_plan)->>'produtos')::INT INTO v_limit;
  
  -- -1 significa ilimitado
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Contar produtos atuais
  SELECT COUNT(*) INTO v_count
  FROM public.produtos
  WHERE user_id = v_user_id;
  
  RETURN v_count < v_limit;
END;
$$;

-- Função para obter assinatura do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_subscription()
RETURNS TABLE(
  plan subscription_plan,
  status TEXT,
  limits JSON,
  current_period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.plan, 'explorador'::subscription_plan) as plan,
    COALESCE(s.status, 'active') as status,
    get_plan_limits(COALESCE(s.plan, 'explorador'::subscription_plan)) as limits,
    s.current_period_end
  FROM (SELECT 1) AS dummy
  LEFT JOIN public.subscriptions s ON s.user_id = v_user_id;
END;
$$;

-- Criar assinatura automática para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'explorador', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger para criar assinatura ao criar profile
CREATE TRIGGER on_profile_created_create_subscription
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_subscription();