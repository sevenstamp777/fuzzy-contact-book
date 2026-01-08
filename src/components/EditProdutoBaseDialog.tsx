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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProdutoBase, Supplier } from "@/pages/ProdutosBase";

const produtoBaseSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  custo_aquisicao: z.coerce.number().min(0, "Custo deve ser maior ou igual a 0"),
  fornecedor_id: z.string().optional(),
});

type ProdutoBaseFormData = z.infer<typeof produtoBaseSchema>;

interface EditProdutoBaseDialogProps {
  produto: ProdutoBase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    id: string,
    data: {
      nome: string;
      categoria: string | null;
      descricao: string | null;
      custo_aquisicao: number;
      fornecedor_id: string | null;
    }
  ) => Promise<void>;
  isSubmitting: boolean;
  suppliers: Supplier[];
}

const CATEGORIAS = [
  "Canecas",
  "Camisetas",
  "Chaveiros",
  "Chinelos",
  "Placas",
  "Almofadas",
  "Quadros",
  "Outros",
];

const EditProdutoBaseDialog = ({
  produto,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  suppliers,
}: EditProdutoBaseDialogProps) => {
  const form = useForm<ProdutoBaseFormData>({
    resolver: zodResolver(produtoBaseSchema),
    defaultValues: {
      nome: "",
      categoria: undefined,
      descricao: "",
      custo_aquisicao: 0,
      fornecedor_id: undefined,
    },
  });

  useEffect(() => {
    if (produto) {
      form.reset({
        nome: produto.nome,
        categoria: produto.categoria || undefined,
        descricao: produto.descricao || "",
        custo_aquisicao: Number(produto.custo_aquisicao),
        fornecedor_id: produto.fornecedor_id || undefined,
      });
    }
  }, [produto, form]);

  const handleSubmit = async (data: ProdutoBaseFormData) => {
    if (!produto) return;
    await onSubmit(produto.id, {
      nome: data.nome,
      categoria: data.categoria || null,
      descricao: data.descricao || null,
      custo_aquisicao: data.custo_aquisicao,
      fornecedor_id: data.fornecedor_id || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Produto Base</DialogTitle>
          <DialogDescription>
            Atualize os dados do produto base.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Caneca Branca 325ml" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
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

            <FormField
              control={form.control}
              name="custo_aquisicao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo de Aquisição (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Quanto você paga por unidade</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre o produto..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

export default EditProdutoBaseDialog;