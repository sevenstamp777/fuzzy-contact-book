-- Remover política permissiva e criar política mais segura
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscriptions;

-- Permitir insert apenas via trigger (usuário não pode inserir diretamente)
-- O trigger handle_new_user_subscription faz o insert com SECURITY DEFINER