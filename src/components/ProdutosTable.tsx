import { Pencil, Trash2 } from "lucide-react";
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
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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
            <TableRow
              key={produto.id}
              className="transition-colors hover:bg-muted/30"
            >
              <TableCell className="font-medium text-foreground">
                {produto.nome}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {produto.categoria || "-"}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="font-medium">
                  {produto.produto_insumos?.length || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(calcularCustoTotal(produto))}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProdutosTable;
