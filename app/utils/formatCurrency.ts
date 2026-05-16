export function formatCurrency(cents: number | null): string {
  if (cents === null) return '-'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100)
}
