import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown } from "lucide-react";
import { formatLimit } from "@/lib/subscription";

interface PlanLimitAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "produtos" | "clientes" | "pedidos";
  currentCount: number;
}

const resourceLabels = {
  produtos: { singular: "produto", plural: "produtos" },
  clientes: { singular: "cliente", plural: "clientes" },
  pedidos: { singular: "pedido", plural: "pedidos" },
};

const PlanLimitAlert = ({ open, onOpenChange, resourceType, currentCount }: PlanLimitAlertProps) => {
  const navigate = useNavigate();
  const { plan, limits } = useSubscription();

  const label = resourceLabels[resourceType];
  const limit = resourceType === "pedidos" ? limits.pedidos_mes : limits[resourceType];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
          <AlertDialogTitle className="text-center">
            Limite de {label.plural} atingido
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Você atingiu o limite de <strong>{formatLimit(limit)} {label.plural}</strong> do plano{" "}
            <strong className="capitalize">{plan}</strong>. 
            <br />
            <span className="text-muted-foreground">
              Atualmente você possui {currentCount} {currentCount === 1 ? label.singular : label.plural}.
            </span>
            <br /><br />
            Faça upgrade do seu plano para continuar cadastrando novos {label.plural}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction 
            className="gradient-primary shadow-glow"
            onClick={() => navigate("/planos")}
          >
            Ver Planos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PlanLimitAlert;
