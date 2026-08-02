export function stringField(body: unknown, field: string): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

export function numberField(body: unknown, field: string): number | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'number' ? value : undefined;
}

export function booleanField(body: unknown, field: string): boolean {
  if (typeof body !== 'object' || body === null) return false;
  return (body as Record<string, unknown>)[field] === true;
}
