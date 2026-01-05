import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Trash2, Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Insumo } from "@/pages/Produtos";
import { Card, CardContent } from "@/components/ui/card";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  margem_lucro: z.coerce.number().min(0, "Margem deve ser maior ou igual a 0"),
  insumos: z.array(z.object({
    insumo_id: z.string().min(1, "Selecione um insumo"),
    quantidade: z.coerce.number().min(0.001, "Quantidade deve ser maior que 0"),
  })),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface NewProdutoDialogProps {
  onSubmit: (data: {
    nome: string;
    categoria: string | null;
    descricao: string | null;
    margem_lucro: number;
    insumos: { insumo_id: string; quantidade: number }[];
  }) => Promise<void>;
  isSubmitting: boolean;
  insumos: Insumo[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const NewProdutoDialog = ({ onSubmit, isSubmitting, insumos }: NewProdutoDialogProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      descricao: "",
      margem_lucro: 50,
      insumos: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "insumos",
  });

  const watchedInsumos = form.watch("insumos");
  const watchedMargem = form.watch("margem_lucro");

  const custoTotal = watchedInsumos.reduce((total, item) => {
    const insumo = insumos.find((i) => i.id === item.insumo_id);
    if (!insumo) return total;
    return total + Number(insumo.custo_unitario) * Number(item.quantidade);
  }, 0);

  const precoVenda = custoTotal * (1 + Number(watchedMargem) / 100);

  const handleSubmit = async (data: ProdutoFormData) => {
    await onSubmit({
      nome: data.nome,
      categoria: data.categoria || null,
      descricao: data.descricao || null,
      margem_lucro: data.margem_lucro,
      insumos: data.insumos.map((i) => ({
        insumo_id: i.insumo_id,
        quantidade: i.quantidade,
      })),
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Cadastrar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados do produto e adicione os insumos necessários.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Caneca Personalizada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Canecas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o produto..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Insumos Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-semibold">Composição (Insumos)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ insumo_id: "", quantidade: 1 })}
                  disabled={insumos.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Insumo
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  Nenhum insumo adicionado. Clique em "Adicionar Insumo" para começar.
                </p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const selectedInsumo = insumos.find(
                      (i) => i.id === watchedInsumos[index]?.insumo_id
                    );
                    const subtotal = selectedInsumo
                      ? Number(selectedInsumo.custo_unitario) * Number(watchedInsumos[index]?.quantidade || 0)
                      : 0;

                    return (
                      <div key={field.id} className="flex items-end gap-2 p-3 bg-muted/30 rounded-lg">
                        <FormField
                          control={form.control}
                          name={`insumos.${index}.insumo_id`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Insumo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {insumos.map((insumo) => (
                                    <SelectItem key={insumo.id} value={insumo.id}>
                                      {insumo.nome} ({formatCurrency(Number(insumo.custo_unitario))}/{insumo.unidade_medida})
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
                          name={`insumos.${index}.quantidade`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormLabel className="text-xs">Qtd.</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0.001"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="w-24 text-right">
                          <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                          <p className="text-sm font-medium">{formatCurrency(subtotal)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pricing Section */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Cálculo de Preço</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Custo Total</p>
                    <p className="text-lg font-semibold">{formatCurrency(custoTotal)}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="margem_lucro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">Margem de Lucro (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="font-semibold"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Preço de Venda</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(precoVenda)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProdutoDialog;
