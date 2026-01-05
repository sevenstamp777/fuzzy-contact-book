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
import { Insumo } from "@/pages/Insumos";

interface InsumosTableProps {
  insumos: Insumo[];
  isLoading: boolean;
  onEdit: (insumo: Insumo) => void;
  onDelete: (insumo: Insumo) => void;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
}

const UNIDADE_LABELS: Record<string, string> = {
  un: "un",
  kg: "kg",
  ml: "ml",
  m: "m",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const InsumosTable = ({
  insumos,
  isLoading,
  onEdit,
  onDelete,
  sortKey,
  sortDirection,
  onSort,
}: InsumosTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">Unidade</TableHead>
              <TableHead className="font-semibold text-foreground">Fornecedor</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Preço Compra</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Qtd. Embalagem</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Custo Unitário</TableHead>
              <TableHead className="w-24 text-center font-semibold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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

  if (insumos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center shadow-elegant">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <span className="text-3xl">📦</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Nenhum insumo encontrado
        </h3>
        <p className="text-muted-foreground">
          Comece cadastrando seu primeiro insumo.
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
              sortKey="unidade_medida"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
            >
              Unidade
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
              sortKey="preco_compra"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            >
              Preço Compra
            </SortableTableHead>
            <SortableTableHead
              sortKey="quantidade_embalagem"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            >
              Qtd. Embalagem
            </SortableTableHead>
            <SortableTableHead
              sortKey="custo_unitario"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            >
              Custo Unitário
            </SortableTableHead>
            <TableHead className="w-24 text-center font-semibold text-foreground">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {insumos.map((insumo) => (
            <TableRow
              key={insumo.id}
              className="transition-colors hover:bg-muted/30"
            >
              <TableCell className="font-medium text-foreground">
                {insumo.nome}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {UNIDADE_LABELS[insumo.unidade_medida]}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {insumo.fornecedor?.nome_fornecedor || "-"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(Number(insumo.preco_compra))}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {Number(insumo.quantidade_embalagem).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="text-right font-medium text-primary">
                {formatCurrency(Number(insumo.custo_unitario))}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(insumo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(insumo)}
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

export default InsumosTable;
