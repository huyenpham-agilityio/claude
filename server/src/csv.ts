// Spreadsheet apps run cells starting with these as formulas, so a note like
// "=HYPERLINK(...)" could execute when the file is opened. Prefixing a quote
// makes it plain text.
const FORMULA_START = /^[=+\-@\t\r]/

function cell(value: string | number | null): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value)
  const text = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n'
}
