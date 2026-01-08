import { useState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SortableTableHead, { SortDirection } from "@/components/SortableTableHead";
import { Produto } from "@/pages/Produtos";

interface ProdutosTableProps {
  produtos: Produto[];
  isLoading: boolean;
  onEdit: (produto: Produto) => void;
  onDelete: (produto: Produto) => void;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  calcularCustoTotal: (produto: Produto) => number;
  calcularPrecoVenda: (produto: Produto) => number;
  custoHoraTotal?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface CustoBreakdown {
  custoBase: number;
  custoInsumos: number;
  custoMaoDeObra: number;
  total: number;
}

const calcularBreakdown = (produto: Produto, custoHoraTotal: number): CustoBreakdown => {
  const custoBase = produto.produto_base 
    ? Number(produto.produto_base.custo_aquisicao) 
    : 0;

  const custoInsumos = (produto.produto_insumos || []).reduce((total, pi) => {
    if (!pi.insumo) return total;
    const custoUnitario = Number(pi.insumo.custo_unitario || 0);
    const usosPorUnidade = Number(pi.insumo.usos_por_unidade || 1);
    const custoPorUso = usosPorUnidade > 0 ? custoUnitario / usosPorUnidade : custoUnitario;
    return total + custoPorUso * Number(pi.quantidade);
  }, 0);

  const tempoHoras = Number(produto.tempo_producao_minutos || 0) / 60;
  const custoMaoDeObra = tempoHoras * custoHoraTotal;

  return {
    custoBase,
    custoInsumos,
    custoMaoDeObra,
    total: custoBase + custoInsumos + custoMaoDeObra,
  };
};

const ProdutoRow = ({
  produto,
  onEdit,
  onDelete,
  calcularCustoTotal,
  calcularPrecoVenda,
  custoHoraTotal,
}: {
  produto: Produto;
  onEdit: (produto: Produto) => void;
  onDelete: (produto: Produto) => void;
  calcularCustoTotal: (produto: Produto) => number;
  calcularPrecoVenda: (produto: Produto) => number;
  custoHoraTotal: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const breakdown = calcularBreakdown(produto, custoHoraTotal);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="transition-colors hover:bg-muted/30">
        <TableCell className="font-medium text-foreground">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <div>
              <span>{produto.nome}</span>
              {produto.produto_base && (
                <p className="text-xs text-muted-foreground">
                  Base: {produto.produto_base.nome}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {produto.categoria || "-"}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant="secondary" className="font-medium">
            {produto.produto_insumos?.length || 0}
          </Badge>
        </TableCell>
        <TableCell className="text-center text-muted-foreground">
          {produto.tempo_producao_minutos || 0} min
        </TableCell>
        <TableCell className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-end gap-1 cursor-help">
                  <span className="text-muted-foreground">
                    {formatCurrency(breakdown.total)}
                  </span>
                  <Info className="h-3 w-3 text-muted-foreground/50" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-64">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Produto Base:</span>
                    <span>{formatCurrency(breakdown.custoBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insumos:</span>
                    <span>{formatCurrency(breakdown.custoInsumos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mão de Obra:</span>
                    <span>{formatCurrency(breakdown.custoMaoDeObra)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(breakdown.total)}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {Number(produto.margem_lucro).toFixed(0)}%
        </TableCell>
        <TableCell className="text-right font-bold text-primary">
          {formatCurrency(calcularPrecoVenda(produto))}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(produto)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(produto)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow className="bg-muted/20 hover:bg-muted/30">
          <TableCell colSpan={8} className="py-4">
            <div className="grid gap-4 md:grid-cols-3 px-8">
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  📦 Produto Base
                </h4>
                {produto.produto_base ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{produto.produto_base.nome}</span>
                    <span className="font-medium">{formatCurrency(breakdown.custoBase)}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum produto base</p>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  🧪 Insumos ({produto.produto_insumos?.length || 0})
                </h4>
                {produto.produto_insumos && produto.produto_insumos.length > 0 ? (
                  <div className="space-y-1">
                    {produto.produto_insumos.map((pi) => {
                      if (!pi.insumo) return null;
                      const custoUnitario = Number(pi.insumo.custo_unitario || 0);
                      const usosPorUnidade = Number(pi.insumo.usos_por_unidade || 1);
                      const custoPorUso = usosPorUnidade > 0 ? custoUnitario / usosPorUnidade : custoUnitario;
                      const custoLinha = custoPorUso * Number(pi.quantidade);
                      return (
                        <div key={pi.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {pi.insumo.nome} × {pi.quantidade}
                          </span>
                          <span className="font-medium">{formatCurrency(custoLinha)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-2">
                      <span>Subtotal Insumos</span>
                      <span>{formatCurrency(breakdown.custoInsumos)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum insumo</p>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  🛠️ Mão de Obra
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo</span>
                    <span>{produto.tempo_producao_minutos} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo/hora</span>
                    <span>{formatCurrency(custoHoraTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-2">
                    <span>Total MO</span>
                    <span>{formatCurrency(breakdown.custoMaoDeObra)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 px-8 flex justify-end">
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 min-w-[280px]">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Custo Total:</span>
                    <span className="font-medium">{formatCurrency(breakdown.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margem de Lucro:</span>
                    <span className="font-medium">{produto.margem_lucro}%</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary border-t pt-2 mt-2">
                    <span>Preço de Venda:</span>
                    <span>{formatCurrency(calcularPrecoVenda(produto))}</span>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
};

const ProdutosTable = ({
  produtos,
  isLoading,
  onEdit,
  onDelete,
  sortKey,
  sortDirection,
  onSort,
  calcularCustoTotal,
  calcularPrecoVenda,
  custoHoraTotal = 0,
}: ProdutosTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">Categoria</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Insumos</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Tempo</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Custo Total</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Margem</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Preço Venda</TableHead>
              <TableHead className="w-24 text-center font-semibold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center shadow-elegant">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <span className="text-3xl">🛍️</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Nenhum produto encontrado
        </h3>
        <p className="text-muted-foreground">
          Comece cadastrando seu primeiro produto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <SortableTableHead
              sortKey="nome"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
            >
              Nome
            </SortableTableHead>
            <SortableTableHead
              sortKey="categoria"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
            >
              Categoria
            </SortableTableHead>
            <TableHead className="text-center font-semibold text-foreground">
              Insumos
            </TableHead>
            <SortableTableHead
              sortKey="tempo_producao_minutos"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-center"
            >
              Tempo
            </SortableTableHead>
            <SortableTableHead
              sortKey="custo_total"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            >
              Custo Total
            </SortableTableHead>
            <SortableTableHead
              sortKey="margem_lucro"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            >
              Margem
            </SortableTableHead>
            <SortableTableHead
              sortKey="preco_venda"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            >
              Preço Venda
            </SortableTableHead>
            <TableHead className="w-24 text-center font-semibold text-foreground">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <ProdutoRow
              key={produto.id}
              produto={produto}
              onEdit={onEdit}
              onDelete={onDelete}
              calcularCustoTotal={calcularCustoTotal}
              calcularPrecoVenda={calcularPrecoVenda}
              custoHoraTotal={custoHoraTotal}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProdutosTable;