import { useState } from "react";
import { AlertTriangle, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const BetaBanner = () => {
  const [isVisible, setIsVisible] = useState(() => {
    const dismissed = sessionStorage.getItem("beta-banner-dismissed");
    return dismissed !== "true";
  });

  if (!isVisible) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("beta-banner-dismissed", "true");
    setIsVisible(false);
  };

  const handleFeedback = () => {
    window.open("mailto:suporte@clientflow.app?subject=Feedback%20Beta", "_blank");
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white">
      <div className="container flex items-center justify-between gap-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            🚧 Ambiente Beta — Este sistema está em fase de testes. Alguns recursos podem não funcionar corretamente.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-white hover:bg-white/20 hover:text-white"
            onClick={handleFeedback}
          >
            <MessageSquare className="h-3 w-3" />
            Feedback
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BetaBanner;
