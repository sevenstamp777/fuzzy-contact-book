import { Pencil, Trash2, Truck, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SortableTableHead, { SortDirection } from "@/components/SortableTableHead";

interface Supplier {
  id: string;
  nome_fornecedor: string;
  nome_contato: string;
  email: string;
}

interface SuppliersTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
}

const SuppliersTable = ({ 
  suppliers, 
  isLoading, 
  onEdit, 
  onDelete,
  sortKey,
  sortDirection,
  onSort,
}: SuppliersTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Truck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
          Nenhum fornecedor cadastrado
        </h3>
        <p className="text-muted-foreground">
          Clique em "Novo Fornecedor" para adicionar o primeiro fornecedor.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <SortableTableHead
              sortKey="nome_fornecedor"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              icon={<Truck className="h-4 w-4" />}
            >
              Nome do Fornecedor
            </SortableTableHead>
            <SortableTableHead
              sortKey="nome_contato"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              icon={<User className="h-4 w-4" />}
            >
              Nome do Contato
            </SortableTableHead>
            <SortableTableHead
              sortKey="email"
              currentSortKey={sortKey}
              currentSortDirection={sortDirection}
              onSort={onSort}
              icon={<Mail className="h-4 w-4" />}
            >
              Email
            </SortableTableHead>
            <TableCell className="w-[140px] text-right font-display font-semibold text-foreground">
              Ações
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier, index) => (
            <TableRow
              key={supplier.id}
              className="group transition-colors hover:bg-muted/30"
              style={{
                animation: `slide-up 0.3s ease-out ${index * 0.05}s forwards`,
                opacity: 0,
              }}
            >
              <TableCell className="font-medium text-foreground">
                {supplier.nome_fornecedor}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {supplier.nome_contato}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {supplier.email}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    onClick={() => onEdit(supplier)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(supplier)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remover</span>
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

export default SuppliersTable;
