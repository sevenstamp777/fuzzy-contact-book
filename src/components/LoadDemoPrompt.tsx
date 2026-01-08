import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadDemoPromptProps {
  onLoadDemo: () => void;
  isLoading: boolean;
  entityName: string;
}

const LoadDemoPrompt = ({ onLoadDemo, isLoading, entityName }: LoadDemoPromptProps) => {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Primeira vez aqui?
        </CardTitle>
        <CardDescription>
          Carregue dados de demonstração para explorar todas as funcionalidades do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          onClick={onLoadDemo} 
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Carregar Dados Demo
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Serão criados {entityName} fictícios que você pode editar ou excluir a qualquer momento.
        </p>
      </CardContent>
    </Card>
  );
};

export default LoadDemoPrompt;
