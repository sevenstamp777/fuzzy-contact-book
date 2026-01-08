import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { maskPhone, maskCpfCnpj } from "@/lib/masks";
import { fetchCep, fetchCnpj, formatCep, formatEndereco } from "@/lib/api";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

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

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  rg: string | null;
  cpf_cnpj: string | null;
  inscricao_estadual: string | null;
  endereco: string | null;
}

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: ClientFormData) => Promise<void>;
  isSubmitting: boolean;
}

const EditClientDialog = ({
  client,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: EditClientDialogProps) => {
  const [cepInput, setCepInput] = useState("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

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

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        email: client.email,
        phone: client.phone,
        rg: client.rg || "",
        cpf_cnpj: client.cpf_cnpj || "",
        inscricao_estadual: client.inscricao_estadual || "",
        endereco: client.endereco || "",
      });
      setCepInput("");
    }
  }, [client, form]);

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

  const handleCnpjSearch = async () => {
    const cnpj = form.getValues("cpf_cnpj").replace(/\D/g, "");
    if (cnpj.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    setIsLoadingCnpj(true);
    const data = await fetchCnpj(cnpj);
    setIsLoadingCnpj(false);
    if (data) {
      form.setValue("name", data.razao_social || data.nome_fantasia);
      if (data.email) form.setValue("email", data.email);
      if (data.telefone) form.setValue("phone", maskPhone(data.telefone));
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

  const handleSubmit = async (data: ClientFormData) => {
    if (client) {
      await onSubmit(client.id, data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-scale-in border-border bg-card sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Editar Cliente
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Atualize os dados do cliente. Campos marcados com * são obrigatórios.
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="000.000.000-00"
                          className="border-input bg-background transition-all focus:ring-2 focus:ring-primary/20"
                          value={field.value}
                          onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCnpjSearch}
                          disabled={isLoadingCnpj || field.value.replace(/\D/g, "").length !== 14}
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
              <div className="sm:col-span-2 space-y-2">
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

export default EditClientDialog;
