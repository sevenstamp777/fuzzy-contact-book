import { Pencil, Trash2, Users, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
}

const ClientsTable = ({ clients, isLoading }: ClientsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
          Nenhum cliente cadastrado
        </h3>
        <p className="text-muted-foreground">
          Clique em "Novo Cliente" para adicionar o primeiro cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-display font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Nome
              </div>
            </TableHead>
            <TableHead className="font-display font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </div>
            </TableHead>
            <TableHead className="font-display font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Telefone
              </div>
            </TableHead>
            <TableHead className="w-[140px] text-right font-display font-semibold text-foreground">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => (
            <TableRow
              key={client.id}
              className="group transition-colors hover:bg-muted/30"
              style={{
                animation: `slide-up 0.3s ease-out ${index * 0.05}s forwards`,
                opacity: 0,
              }}
            >
              <TableCell className="font-medium text-foreground">
                {client.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.phone}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

export default ClientsTable;
