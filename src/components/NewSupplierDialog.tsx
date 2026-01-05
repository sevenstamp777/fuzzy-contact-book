import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck } from "lucide-react";
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

const supplierSchema = z.object({
  nome_fornecedor: z
    .string()
    .trim()
    .min(1, "Nome do fornecedor é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  nome_contato: z
    .string()
    .trim()
    .min(1, "Nome do contato é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface NewSupplierDialogProps {
  onSubmit: (data: SupplierFormData) => Promise<void>;
  isSubmitting: boolean;
}

const NewSupplierDialog = ({ onSubmit, isSubmitting }: NewSupplierDialogProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      nome_fornecedor: "",
      nome_contato: "",
      email: "",
    },
  });

  const handleSubmit = async (data: SupplierFormData) => {
    await onSubmit(data);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary shadow-glow transition-all hover:shadow-lg">
          <Truck className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </DialogTrigger>
      <DialogContent className="animate-scale-in border-border bg-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Cadastrar Novo Fornecedor
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preencha os dados do fornecedor abaixo. Todos os campos são
            obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="nome_fornecedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nome do Fornecedor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o nome do fornecedor"
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
              name="nome_contato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nome do Contato</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o nome do contato"
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
                  <FormLabel className="text-foreground">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Digite o email do fornecedor"
                      className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  "Salvar Fornecedor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewSupplierDialog;
