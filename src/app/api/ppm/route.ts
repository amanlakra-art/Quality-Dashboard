import { NextRequest, NextResponse } from 'next/server';
import { PPM_DATA, PPMData, DEFAULT_PPM_SETTINGS, PPMSettings, computeWeightedPPM, derivePPMStatus } from '@/data/ppmData';

let ppmStore: PPMData = JSON.parse(JSON.stringify(PPM_DATA));
let settingsStore: PPMSettings = JSON.parse(JSON.stringify(DEFAULT_PPM_SETTINGS));

export async function GET() {
  const weightedPPM = computeWeightedPPM(ppmStore, settingsStore);
  const derived = derivePPMStatus(weightedPPM, settingsStore);
  return NextResponse.json({
    data: ppmStore,
    settings: settingsStore,
    weightedPPM,
    rawPPM: ppmStore.overallPPM,
    ...derived,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload } = body as { type: 'data' | 'settings'; payload: Partial<PPMData> | Partial<PPMSettings> };

    if (type === 'settings') {
      const s = payload as Partial<PPMSettings>;
      settingsStore = { ...settingsStore, ...s };
      if (s.issueWeights) {
        settingsStore.issueWeights = { ...settingsStore.issueWeights, ...s.issueWeights };
      }
    } else if (type === 'data') {
      ppmStore = { ...ppmStore, ...(payload as Partial<PPMData>) };
    }

    const weightedPPM = computeWeightedPPM(ppmStore, settingsStore);
    const derived = derivePPMStatus(weightedPPM, settingsStore);
    return NextResponse.json({ data: ppmStore, settings: settingsStore, weightedPPM, ...derived });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
