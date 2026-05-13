import { NextRequest, NextResponse } from 'next/server';
import { sheetGet, sheetPatch } from '@/lib/sheets';
import type { Highlight } from '@/data/highlights';
import { getWeekStart } from '@/data/highlights';

export const dynamic = 'force-dynamic';

type HighlightsResponse = { highlights: Highlight[] };

const sheetsConfigured = !!(process.env.SHEETS_API_URL && process.env.SHEETS_API_TOKEN);

let highlightsStore: Highlight[] = [];

async function getAll(): Promise<Highlight[]> {
  if (sheetsConfigured) {
    try {
      const data = await sheetGet<HighlightsResponse>('highlights');
      return data.highlights;
    } catch {
      // Sheet doesn't support highlights entity yet — fall through to in-memory
    }
  }
  return highlightsStore;
}

export async function GET() {
  try {
    const highlights = await getAll();
    return NextResponse.json({ highlights });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text: string };
    if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const highlight: Highlight = {
      id: crypto.randomUUID(),
      text: text.trim(),
      weekStart: getWeekStart(),
      createdAt: new Date().toISOString(),
    };

    if (sheetsConfigured) {
      try {
        const data = await sheetPatch<HighlightsResponse>('highlights', { op: 'add', highlight });
        return NextResponse.json({ highlights: data.highlights });
      } catch {
        // Sheet doesn't support highlights entity yet — fall through to in-memory
      }
    }

    highlightsStore = [...highlightsStore, highlight];
    return NextResponse.json({ highlights: highlightsStore });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id: string };
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (sheetsConfigured) {
      try {
        const data = await sheetPatch<HighlightsResponse>('highlights', { op: 'delete', id });
        return NextResponse.json({ highlights: data.highlights });
      } catch {
        // Sheet doesn't support highlights entity yet — fall through to in-memory
      }
    }

    highlightsStore = highlightsStore.filter(h => h.id !== id);
    return NextResponse.json({ highlights: highlightsStore });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
