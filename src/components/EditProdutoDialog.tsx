import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Trash2, Calculator, Clock } from "lucide-react";
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
import { Produto, Insumo, ProdutoBase } from "@/pages/Produtos";
import { Card, CardContent } from "@/components/ui/card";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  margem_lucro: z.coerce.number().min(0, "Margem deve ser maior ou igual a 0"),
  produto_base_id: z.string().optional(),
  tempo_producao_minutos: z.coerce.number().min(0, "Tempo deve ser maior ou igual a 0"),
  insumos: z.array(z.object({
    insumo_id: z.string().min(1, "Selecione um insumo"),
    quantidade: z.coerce.number().min(0.001, "Quantidade deve ser maior que 0"),
  })),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface EditProdutoDialogProps {
  produto: Produto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    id: string,
    data: {
      nome: string;
      categoria: string | null;
      descricao: string | null;
      margem_lucro: number;
      produto_base_id: string | null;
      tempo_producao_minutos: number;
      insumos: { insumo_id: string; quantidade: number }[];
    }
  ) => Promise<void>;
  isSubmitting: boolean;
  insumos: Insumo[];
  produtosBase: ProdutoBase[];
  custoHoraTotal: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const EditProdutoDialog = ({
  produto,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  insumos,
  produtosBase,
  custoHoraTotal,
}: EditProdutoDialogProps) => {
  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      descricao: "",
      margem_lucro: 50,
      produto_base_id: undefined,
      tempo_producao_minutos: 0,
      insumos: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "insumos",
  });

  const watchedInsumos = form.watch("insumos");
  const watchedMargem = form.watch("margem_lucro");
  const watchedProdutoBaseId = form.watch("produto_base_id");
  const watchedTempo = form.watch("tempo_producao_minutos");

  // Custo do produto base
  const produtoBaseSelecionado = produtosBase.find(p => p.id === watchedProdutoBaseId);
  const custoProdutoBase = produtoBaseSelecionado ? Number(produtoBaseSelecionado.custo_aquisicao) : 0;

  // Custo dos insumos (usando custo por uso)
  const custoInsumos = watchedInsumos.reduce((total, item) => {
    const insumo = insumos.find((i) => i.id === item.insumo_id);
    if (!insumo) return total;
    const custoUnitario = Number(insumo.custo_unitario);
    const usosPorUnidade = Number(insumo.usos_por_unidade || 1);
    const custoPorUso = usosPorUnidade > 0 ? custoUnitario / usosPorUnidade : custoUnitario;
    return total + custoPorUso * Number(item.quantidade);
  }, 0);

  // Custo de mão de obra
  const tempoHoras = Number(watchedTempo || 0) / 60;
  const custoMaoDeObra = tempoHoras * custoHoraTotal;

  // Custo total
  const custoTotal = custoProdutoBase + custoInsumos + custoMaoDeObra;
  const precoVenda = custoTotal * (1 + Number(watchedMargem) / 100);

  useEffect(() => {
    if (produto) {
      form.reset({
        nome: produto.nome,
        categoria: produto.categoria || "",
        descricao: produto.descricao || "",
        margem_lucro: Number(produto.margem_lucro),
        produto_base_id: produto.produto_base_id || undefined,
        tempo_producao_minutos: Number(produto.tempo_producao_minutos || 0),
        insumos: [],
      });
      
      if (produto.produto_insumos) {
        replace(
          produto.produto_insumos.map((pi) => ({
            insumo_id: pi.insumo_id,
            quantidade: Number(pi.quantidade),
          }))
        );
      }
    }
  }, [produto, form, replace]);

  const handleSubmit = async (data: ProdutoFormData) => {
    if (!produto) return;
    await onSubmit(produto.id, {
      nome: data.nome,
      categoria: data.categoria || null,
      descricao: data.descricao || null,
      margem_lucro: data.margem_lucro,
      produto_base_id: data.produto_base_id || null,
      tempo_producao_minutos: data.tempo_producao_minutos,
      insumos: data.insumos.map((i) => ({
        insumo_id: i.insumo_id,
        quantidade: i.quantidade,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize os dados do produto e sua composição.
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

            {/* Produto Base + Tempo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="produto_base_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto Base</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {produtosBase.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} ({formatCurrency(Number(p.custo_aquisicao))})
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
                name="tempo_producao_minutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Tempo de Produção (min)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    {custoHoraTotal > 0 && watchedTempo > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Custo M.O.: {formatCurrency(custoMaoDeObra)}
                      </p>
                    )}
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
                      rows={2}
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
                <FormLabel className="text-base font-semibold">Insumos de Personalização</FormLabel>
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
                    const custoUnitario = selectedInsumo ? Number(selectedInsumo.custo_unitario) : 0;
                    const usosPorUnidade = selectedInsumo ? Number(selectedInsumo.usos_por_unidade || 1) : 1;
                    const custoPorUso = usosPorUnidade > 0 ? custoUnitario / usosPorUnidade : custoUnitario;
                    const subtotal = custoPorUso * Number(watchedInsumos[index]?.quantidade || 0);

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
                                  {insumos.map((insumo) => {
                                    const custoU = Number(insumo.custo_unitario);
                                    const usos = Number(insumo.usos_por_unidade || 1);
                                    const custoUso = usos > 0 ? custoU / usos : custoU;
                                    return (
                                      <SelectItem key={insumo.id} value={insumo.id}>
                                        {insumo.nome} ({formatCurrency(custoUso)}/uso)
                                      </SelectItem>
                                    );
                                  })}
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
                              <FormLabel className="text-xs">Qtd. Usos</FormLabel>
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
                
                {/* Detalhamento dos custos */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
                  <div className="p-2 bg-background/50 rounded">
                    <p className="text-xs text-muted-foreground">Prod. Base</p>
                    <p className="font-medium">{formatCurrency(custoProdutoBase)}</p>
                  </div>
                  <div className="p-2 bg-background/50 rounded">
                    <p className="text-xs text-muted-foreground">Insumos</p>
                    <p className="font-medium">{formatCurrency(custoInsumos)}</p>
                  </div>
                  <div className="p-2 bg-background/50 rounded">
                    <p className="text-xs text-muted-foreground">Mão de Obra</p>
                    <p className="font-medium">{formatCurrency(custoMaoDeObra)}</p>
                  </div>
                  <div className="p-2 bg-background/50 rounded">
                    <p className="text-xs text-muted-foreground">Custo Total</p>
                    <p className="font-semibold">{formatCurrency(custoTotal)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-sm text-muted-foreground mb-2">Preço de Venda</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(precoVenda)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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

export default EditProdutoDialog;