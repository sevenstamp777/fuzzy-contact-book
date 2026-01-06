import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Insumo, Supplier } from "@/pages/Insumos";

const insumoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  unidade_medida: z.enum(["un", "kg", "ml", "m"], { required_error: "Selecione a unidade de medida" }),
  fornecedor_id: z.string().optional(),
  preco_compra: z.coerce.number().min(0, "Preço deve ser maior ou igual a 0"),
  quantidade_embalagem: z.coerce.number().min(0.001, "Quantidade deve ser maior que 0"),
  estoque_minimo: z.coerce.number().min(0, "Estoque mínimo deve ser maior ou igual a 0"),
});

type InsumoFormData = z.infer<typeof insumoSchema>;

interface EditInsumoDialogProps {
  insumo: Insumo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    id: string,
    data: {
      nome: string;
      unidade_medida: "un" | "kg" | "ml" | "m";
      fornecedor_id: string | null;
      preco_compra: number;
      quantidade_embalagem: number;
      estoque_minimo: number;
    }
  ) => Promise<void>;
  isSubmitting: boolean;
  suppliers: Supplier[];
}

const EditInsumoDialog = ({
  insumo,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  suppliers,
}: EditInsumoDialogProps) => {
  const form = useForm<InsumoFormData>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: "",
      unidade_medida: "un",
      fornecedor_id: undefined,
      preco_compra: 0,
      quantidade_embalagem: 1,
      estoque_minimo: 0,
    },
  });

  useEffect(() => {
    if (insumo) {
      form.reset({
        nome: insumo.nome,
        unidade_medida: insumo.unidade_medida,
        fornecedor_id: insumo.fornecedor_id || undefined,
        preco_compra: Number(insumo.preco_compra),
        quantidade_embalagem: Number(insumo.quantidade_embalagem),
        estoque_minimo: Number(insumo.estoque_minimo || 0),
      });
    }
  }, [insumo, form]);

  const handleSubmit = async (data: InsumoFormData) => {
    if (!insumo) return;
    await onSubmit(insumo.id, {
      nome: data.nome,
      unidade_medida: data.unidade_medida,
      fornecedor_id: data.fornecedor_id || null,
      preco_compra: data.preco_compra,
      quantidade_embalagem: data.quantidade_embalagem,
      estoque_minimo: data.estoque_minimo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Insumo</DialogTitle>
          <DialogDescription>
            Atualize os dados do insumo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Insumo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Caneca Branca 300ml" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unidade_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="un">Unidade (un)</SelectItem>
                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                        <SelectItem value="ml">Mililitro (ml)</SelectItem>
                        <SelectItem value="m">Metro (m)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nome_fornecedor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="preco_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Compra (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade_embalagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Embalagem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mín.</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInsumoDialog;
