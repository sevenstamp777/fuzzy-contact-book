import { Sparkles, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DemoBannerProps {
  onClearDemo: () => void;
  isClearing: boolean;
}

const DemoBanner = ({ onClearDemo, isClearing }: DemoBannerProps) => {
  return (
    <Alert className="mb-4 border-primary/50 bg-primary/10">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm">
          <strong>Modo Demonstração:</strong> Você está visualizando dados fictícios para explorar o sistema.
        </span>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onClearDemo}
          disabled={isClearing}
          className="gap-1 shrink-0"
        >
          {isClearing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Limpar Dados Demo
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default DemoBanner;
