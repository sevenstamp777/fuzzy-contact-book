import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { maskPhone, maskCpfCnpj } from "@/lib/masks";

const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  phone: z
    .string()
    .trim()
    .min(1, "Telefone é obrigatório")
    .max(20, "Telefone deve ter no máximo 20 caracteres"),
  rg: z
    .string()
    .trim()
    .min(1, "RG é obrigatório")
    .max(20, "RG deve ter no máximo 20 caracteres"),
  cpf_cnpj: z
    .string()
    .trim()
    .min(1, "CPF/CNPJ é obrigatório")
    .max(20, "CPF/CNPJ deve ter no máximo 20 caracteres"),
  inscricao_estadual: z
    .string()
    .trim()
    .max(20, "IE deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  endereco: z
    .string()
    .trim()
    .min(1, "Endereço é obrigatório")
    .max(500, "Endereço deve ter no máximo 500 caracteres"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface NewClientDialogProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  isSubmitting: boolean;
}

const NewClientDialog = ({ onSubmit, isSubmitting }: NewClientDialogProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      rg: "",
      cpf_cnpj: "",
      inscricao_estadual: "",
      endereco: "",
    },
  });

  const handleSubmit = async (data: ClientFormData) => {
    await onSubmit(data);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary shadow-glow transition-all hover:shadow-lg">
          <UserPlus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="animate-scale-in border-border bg-card sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Cadastrar Novo Cliente
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preencha os dados do cliente abaixo. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-foreground">Nome *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome do cliente"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Telefone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                        value={field.value}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">RG *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o RG"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">CPF/CNPJ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                        value={field.value}
                        onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inscricao_estadual"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-foreground">Inscrição Estadual (IE)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite a IE (opcional)"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-foreground">Endereço Completo *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Rua, número, bairro, cidade, estado, CEP"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-border"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 gradient-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewClientDialog;
