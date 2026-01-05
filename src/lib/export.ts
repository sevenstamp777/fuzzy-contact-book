export const exportToCSV = <T extends object>(
  data: T[],
  filename: string,
  headers: { key: keyof T; label: string }[]
): void => {
  if (data.length === 0) return;

  const csvHeaders = headers.map((h) => h.label).join(";");
  const csvRows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h.key];
        const strValue = value === null || value === undefined ? "" : String(value);
        // Escape quotes and wrap in quotes if contains separator or quotes
        if (strValue.includes(";") || strValue.includes('"') || strValue.includes("\n")) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      })
      .join(";")
  );

  const csvContent = "\uFEFF" + [csvHeaders, ...csvRows].join("\n"); // BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
