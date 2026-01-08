import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { fetchCnpj, fetchCep, formatCep, formatEndereco } from "@/lib/api";
import { maskPhone, maskCpfCnpj } from "@/lib/masks";
import { toast } from "sonner";

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
  cnpj: z.string().trim().optional().or(z.literal("")),
  telefone: z.string().trim().optional().or(z.literal("")),
  endereco: z.string().trim().optional().or(z.literal("")),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  nome_fornecedor: string;
  nome_contato: string;
  email: string;
  cnpj?: string | null;
  telefone?: string | null;
  endereco?: string | null;
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
  const [cepInput, setCepInput] = useState("");
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      nome_fornecedor: "",
      nome_contato: "",
      email: "",
      cnpj: "",
      telefone: "",
      endereco: "",
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        nome_fornecedor: supplier.nome_fornecedor,
        nome_contato: supplier.nome_contato,
        email: supplier.email,
        cnpj: supplier.cnpj || "",
        telefone: supplier.telefone || "",
        endereco: supplier.endereco || "",
      });
      setCepInput("");
    }
  }, [supplier, form]);

  const handleCnpjSearch = async () => {
    const cnpj = form.getValues("cnpj")?.replace(/\D/g, "") || "";
    if (cnpj.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    setIsLoadingCnpj(true);
    const data = await fetchCnpj(cnpj);
    setIsLoadingCnpj(false);
    if (data) {
      form.setValue("nome_fornecedor", data.razao_social || data.nome_fantasia);
      if (data.email) form.setValue("email", data.email);
      if (data.telefone) form.setValue("telefone", maskPhone(data.telefone));
      const endereco = [
        data.logradouro,
        data.numero,
        data.bairro,
        `${data.municipio} - ${data.uf}`,
        data.cep,
      ].filter(Boolean).join(", ");
      if (endereco) form.setValue("endereco", endereco);
      toast.success("Dados do CNPJ preenchidos!");
    } else {
      toast.error("CNPJ não encontrado");
    }
  };

  const handleCepSearch = async () => {
    if (cepInput.replace(/\D/g, "").length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }
    setIsLoadingCep(true);
    const data = await fetchCep(cepInput);
    setIsLoadingCep(false);
    if (data) {
      form.setValue("endereco", formatEndereco(data));
      toast.success("Endereço preenchido!");
    } else {
      toast.error("CEP não encontrado");
    }
  };

  const handleSubmit = async (data: SupplierFormData) => {
    if (supplier) {
      await onSubmit(supplier.id, data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-scale-in border-border bg-card sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Editar Fornecedor
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Atualize os dados do fornecedor. Digite o CNPJ para buscar automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">CNPJ</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="00.000.000/0000-00"
                        className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                        value={field.value}
                        onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCnpjSearch}
                        disabled={isLoadingCnpj || (field.value?.replace(/\D/g, "").length || 0) !== 14}
                        title="Buscar CNPJ"
                      >
                        {isLoadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome_fornecedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nome do Fornecedor *</FormLabel>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome_contato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Nome do Contato *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome"
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
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Telefone</FormLabel>
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
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Email *</FormLabel>
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
            <div className="space-y-2">
              <FormLabel className="text-foreground">Buscar por CEP</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="00000-000"
                  value={cepInput}
                  onChange={(e) => setCepInput(formatCep(e.target.value))}
                  className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCepSearch}
                  disabled={isLoadingCep}
                >
                  {isLoadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Endereço</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Rua, número, bairro, cidade, estado, CEP"
                      className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                      rows={2}
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