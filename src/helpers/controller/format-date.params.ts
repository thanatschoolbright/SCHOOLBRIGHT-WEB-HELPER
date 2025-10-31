export function formatDate(date: any): string | null {
  return date ? new Date(date).toISOString() : null;
}
