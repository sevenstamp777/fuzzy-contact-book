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
import SortableTableHead, { SortDirection } from "@/components/SortableTableHead";
import { ProdutoBase } from "@/pages/ProdutosBase";

interface ProdutosBaseTableProps {
  produtos: ProdutoBase[];
  isLoading: boolean;
  onEdit: (produto: ProdutoBase) => void;
  onDelete: (produto: ProdutoBase) => void;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const ProdutosBaseTable = ({
  produtos,
  isLoading,
  onEdit,
  onDelete,
  sortKey,
  sortDirection,
  onSort,
}: ProdutosBaseTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">Categoria</TableHead>
              <TableHead className="font-semibold text-foreground">Fornecedor</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Custo Aquisição</TableHead>
              <TableHead className="w-24 text-center font-semibold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
          <span className="text-3xl">📦</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Nenhum produto base encontrado
        </h3>
        <p className="text-muted-foreground">
          Comece cadastrando canecas, camisetas, chaveiros, etc.
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
            <SortableTableHead
              sortKey="fornecedor"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
            >
              Fornecedor
            </SortableTableHead>
            <SortableTableHead
              sortKey="custo_aquisicao"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            >
              Custo Aquisição
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
              <TableCell className="text-muted-foreground">
                {produto.fornecedor?.nome_fornecedor || "-"}
              </TableCell>
              <TableCell className="text-right font-medium text-primary">
                {formatCurrency(Number(produto.custo_aquisicao))}
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

export default ProdutosBaseTable;