import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { ReactNode } from "react";

export type SortDirection = "asc" | "desc" | null;

interface SortableTableHeadProps {
  children: ReactNode;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDirection: SortDirection;
  onSort: (key: string) => void;
  icon?: ReactNode;
  className?: string;
}

const SortableTableHead = ({
  children,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  icon,
  className = "",
}: SortableTableHeadProps) => {
  const isActive = currentSortKey === sortKey;

  return (
    <TableHead
      className={`cursor-pointer select-none font-display font-semibold text-foreground transition-colors hover:bg-muted/70 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <span>{children}</span>
        <span className="ml-auto">
          {isActive ? (
            currentSortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4 text-primary" />
            ) : (
              <ArrowDown className="h-4 w-4 text-primary" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
          )}
        </span>
      </div>
    </TableHead>
  );
};

export default SortableTableHead;
