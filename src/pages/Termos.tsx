import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Termos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold">Termos de Uso</span>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8">
        <div className="mb-8">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Ambiente Beta:</strong> Este sistema está em fase de testes. 
                Os dados podem ser apagados a qualquer momento durante esta fase.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <section>
            <h1 className="text-2xl font-bold mb-4">Termos de Uso do ClientFlow</h1>
            <p className="text-muted-foreground text-sm">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">1</span>
              Aceitação dos Termos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar o ClientFlow, você concorda com estes termos de uso. 
              Se não concordar com qualquer parte destes termos, por favor, não use nosso serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">2</span>
              Descrição do Serviço
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O ClientFlow é um sistema de gestão de clientes e produção, oferecendo ferramentas para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Gerenciamento de clientes e fornecedores</li>
              <li>Controle de insumos e estoque</li>
              <li>Cadastro de produtos e fichas técnicas</li>
              <li>Gestão de pedidos e ordens de produção</li>
              <li>Controle financeiro básico</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">3</span>
              Fase Beta
            </h2>
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-muted-foreground leading-relaxed">
                  Durante a fase beta, você reconhece e aceita que:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                  <li>O sistema pode conter bugs ou erros</li>
                  <li>Funcionalidades podem mudar sem aviso prévio</li>
                  <li>Os dados podem ser resetados durante atualizações</li>
                  <li>O suporte é limitado e não garantido</li>
                  <li>Não há garantia de disponibilidade 24/7</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">4</span>
              Responsabilidades do Usuário
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Como usuário, você é responsável por:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Usar o sistema de forma legal e ética</li>
              <li>Não compartilhar sua conta com terceiros</li>
              <li>Manter backups dos seus dados importantes</li>
              <li>Relatar bugs ou problemas encontrados</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Política de Privacidade
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Respeitamos sua privacidade e protegemos seus dados. Coletamos apenas as informações 
              necessárias para o funcionamento do serviço.
            </p>
            
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Dados que coletamos:</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                  <li>Email e senha para autenticação</li>
                  <li>Dados de clientes, produtos e pedidos que você cadastra</li>
                  <li>Logs de uso para melhorar o sistema</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Como usamos seus dados:</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                  <li>Para fornecer e melhorar nossos serviços</li>
                  <li>Para comunicações sobre o produto</li>
                  <li>Para suporte técnico quando solicitado</li>
                </ul>
              </CardContent>
            </Card>

            <p className="text-muted-foreground leading-relaxed">
              <strong>Importante:</strong> Não vendemos nem compartilhamos seus dados com terceiros 
              para fins de marketing.
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dúvidas sobre estes termos? Entre em contato conosco:
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:suporte@clientflow.app">suporte@clientflow.app</a>
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Termos;
