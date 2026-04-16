// ============================================================
//  fssaiData.ts — From FSSAI_3PL_Manufacture.xlsx -> Summary tab
// ============================================================

export interface SOIRow {
  category: string;
  total: number;
  awaitedForReview: number;
  received: number;
}

export interface FSSAISummary {
  totalMfgSites: number;
  relabellerInCurrentLic: number;
  relabellerLicCompliance: number;  // 0.785714
  totalProducts: number;
  totalProductInCurrentLic: number;
  pending: number;
  productCompliance: number;        // 0.290909
  soiBreakdown: SOIRow[];
}

export const FSSAI_SUMMARY: FSSAISummary = {
  totalMfgSites: 14,
  relabellerInCurrentLic: 11,
  relabellerLicCompliance: 0.785714,
  totalProducts: 110,
  totalProductInCurrentLic: 32,
  pending: 78,
  productCompliance: 0.290909,
  soiBreakdown: [
    { category: 'Gummies',           total: 33, awaitedForReview: 20, received: 13 },
    { category: 'Nutrimix (Sapian)', total: 65, awaitedForReview: 43, received: 22 },
    { category: 'Nutricore',         total: 8,  awaitedForReview: 8,  received: 0  },
    { category: 'H&H',               total: 3,  awaitedForReview: 3,  received: 0  },
    { category: 'Gangawal',          total: 1,  awaitedForReview: 1,  received: 1  },
  ],
};
