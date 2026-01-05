import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface Supplier {
  id: string;
  nome_fornecedor: string;
  nome_contato: string;
  email: string;
}

interface EditSupplierDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: SupplierFormData) => Promise<void>;
  isSubmitting: boolean;
}

const EditSupplierDialog = ({
  supplier,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: EditSupplierDialogProps) => {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      nome_fornecedor: "",
      nome_contato: "",
      email: "",
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        nome_fornecedor: supplier.nome_fornecedor,
        nome_contato: supplier.nome_contato,
        email: supplier.email,
      });
    }
  }, [supplier, form]);

  const handleSubmit = async (data: SupplierFormData) => {
    if (supplier) {
      await onSubmit(supplier.id, data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-scale-in border-border bg-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Editar Fornecedor
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Atualize os dados do fornecedor. Todos os campos são obrigatórios.
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
                onClick={() => onOpenChange(false)}
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
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSupplierDialog;
