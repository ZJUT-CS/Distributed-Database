export function formatDateTimeZhCN(input?: string | number | Date | null): string {
  if (input == null || input === '') return '-';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('zh-CN');
}
