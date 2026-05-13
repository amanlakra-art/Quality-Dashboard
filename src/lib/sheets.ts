const API_URL = process.env.SHEETS_API_URL!;
const TOKEN = process.env.SHEETS_API_TOKEN!;

if (!API_URL || !TOKEN) {
  console.warn('[sheets] SHEETS_API_URL or SHEETS_API_TOKEN not set');
}

export async function sheetGet<T>(entity: string): Promise<T> {
  const url = `${API_URL}?entity=${encodeURIComponent(entity)}&token=${encodeURIComponent(TOKEN)}`;
  const r = await fetch(url, { cache: 'no-store', redirect: 'follow' });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json as T;
}

export async function sheetPatch<T>(entity: string, payload: unknown): Promise<T> {
  const r = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight on Apps Script
    body: JSON.stringify({ token: TOKEN, entity, payload }),
  });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json as T;
}
