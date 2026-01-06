import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImportCSVDialogProps {
  onImport: (data: Record<string, string>[]) => Promise<{ success: number; errors: string[] }>;
  columns: { key: string; label: string; required?: boolean }[];
  entityName: string;
  templateData?: Record<string, string>;
}

const ImportCSVDialog = ({ onImport, columns, entityName, templateData }: ImportCSVDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(";").map(h => h.trim().toLowerCase());
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(";").map(v => v.trim());
      if (values.length !== headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        // Map common header variations to expected keys
        const mappedKey = mapHeaderToKey(header, columns);
        if (mappedKey) {
          row[mappedKey] = values[index];
        }
      });

      // Only add if we have at least one valid field
      if (Object.keys(row).length > 0) {
        data.push(row);
      }
    }

    return data;
  };

  const mapHeaderToKey = (header: string, cols: { key: string; label: string }[]): string | null => {
    const normalizedHeader = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    for (const col of cols) {
      const normalizedLabel = col.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedKey = col.key.toLowerCase().replace(/_/g, " ");
      
      if (normalizedHeader === normalizedLabel || 
          normalizedHeader === col.key.toLowerCase() ||
          normalizedHeader === normalizedKey ||
          normalizedHeader.includes(normalizedLabel) ||
          normalizedLabel.includes(normalizedHeader)) {
        return col.key;
      }
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setResult({ success: 0, errors: ["Por favor, selecione um arquivo CSV válido."] });
      return;
    }

    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
    };
    reader.readAsText(selectedFile, "UTF-8");
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(0);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const data = parseCSV(text);

      if (data.length === 0) {
        setResult({ success: 0, errors: ["Nenhum dado válido encontrado no arquivo."] });
        setIsImporting(false);
        return;
      }

      // Validate required fields
      const requiredCols = columns.filter(c => c.required);
      const validData: Record<string, string>[] = [];
      const errors: string[] = [];

      data.forEach((row, index) => {
        const missingFields = requiredCols.filter(col => !row[col.key]?.trim());
        if (missingFields.length > 0) {
          errors.push(`Linha ${index + 2}: Campos obrigatórios vazios (${missingFields.map(f => f.label).join(", ")})`);
        } else {
          validData.push(row);
        }
      });

      if (validData.length === 0) {
        setResult({ success: 0, errors: errors.length > 0 ? errors : ["Nenhum dado válido para importar."] });
        setIsImporting(false);
        return;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      try {
        const importResult = await onImport(validData);
        clearInterval(progressInterval);
        setProgress(100);
        setResult({
          success: importResult.success,
          errors: [...errors, ...importResult.errors],
        });
      } catch (error) {
        clearInterval(progressInterval);
        setResult({ success: 0, errors: ["Erro ao importar dados. Tente novamente."] });
      }

      setIsImporting(false);
    };
    reader.readAsText(file, "UTF-8");
  };

  const downloadTemplate = () => {
    const headers = columns.map(c => c.label).join(";");
    const sampleRow = templateData 
      ? columns.map(c => templateData[c.key] || "").join(";")
      : columns.map(c => `Exemplo ${c.label}`).join(";");
    
    const content = `${headers}\n${sampleRow}`;
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `modelo_${entityName.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar {entityName}</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV para importar múltiplos registros de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Modelo CSV</p>
                <p className="text-xs text-muted-foreground">
                  Baixe o modelo com as colunas corretas
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={downloadTemplate}>
              Baixar Modelo
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Arquivo CSV</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Use ponto e vírgula (;) como separador. Codificação UTF-8.
            </p>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Prévia ({preview.length} de {file ? "..." : 0} registros)
              </p>
              <div className="max-h-40 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {columns.slice(0, 4).map(col => (
                        <th key={col.key} className="p-2 text-left font-medium">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        {columns.slice(0, 4).map(col => (
                          <td key={col.key} className="p-2 truncate max-w-[100px]">
                            {row[col.key] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Importando... {progress}%
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <Alert variant={result.success > 0 ? "default" : "destructive"}>
              {result.success > 0 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success > 0 && (
                  <p className="font-medium text-green-600">
                    {result.success} registro(s) importado(s) com sucesso!
                  </p>
                )}
                {result.errors.length > 0 && (
                  <div className="mt-2 max-h-20 overflow-auto">
                    {result.errors.slice(0, 5).map((error, i) => (
                      <p key={i} className="text-xs text-destructive">{error}</p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... e mais {result.errors.length - 5} erro(s)
                      </p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isImporting}
            >
              {isImporting ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVDialog;
