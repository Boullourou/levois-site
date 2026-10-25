/** UX continuity only: these markers contain no coordinates and grant no server access. */
export const DELIVERY_KEY = 'levois:diagnostic-delivery:v1';
export function deliveryIds(storage?: Pick<Storage, 'getItem'>): string[] {
  try {
    const values: unknown = JSON.parse((storage ?? sessionStorage).getItem(DELIVERY_KEY) || '[]');
    return Array.isArray(values) ? values.filter((v): v is string => typeof v === 'string' && /^[a-zA-Z0-9-]{8,160}$/.test(v)).slice(-40) : [];
  } catch { return []; }
}
export function rememberDelivery(id: string, storage?: Pick<Storage, 'getItem'|'setItem'>): boolean {
  try {
    const target = storage ?? sessionStorage;
    target.setItem(DELIVERY_KEY, JSON.stringify([...new Set([...deliveryIds(target), id])].slice(-40)));
    return true;
  } catch { return false; }
}
