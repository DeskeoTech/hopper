interface CsvColumn<T> {
  key: keyof T | string
  header: string
  getValue?: (item: T) => string | number | null | undefined
}

/**
 * Convert an array of objects to CSV string.
 * Includes BOM for Excel UTF-8 compatibility (French characters).
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[]
): string {
  const BOM = "\uFEFF"

  const headers = columns.map((col) => escapeCSVField(col.header)).join(",")

  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = col.getValue
          ? col.getValue(item)
          : item[col.key as keyof T]
        return escapeCSVField(String(value ?? ""))
      })
      .join(",")
  )

  return BOM + [headers, ...rows].join("\n")
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
