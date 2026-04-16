// ============================================================
//  ppmData.ts — From Nutrimix_PPM_Analysis_Jul_to_Mar.xlsx
//  PPM = (Complaints / Sales) * 1,000,000
// ============================================================

export interface MonthlyPPM {
  month: string;
  sales: number;
  complaints: number;
  ppm: number;
}

export interface IssueTypePPM {
  type: string;
  complaints: number;
  ppm: number;
  weight: number; // configurable severity weight
}

export interface PackagingPPM {
  type: string;
  sales: number;
  complaints: number;
  ppm: number;
}

export interface PPMData {
  totalSales: number;
  totalComplaints: number;
  overallPPM: number;
  period: string;
  monthly: MonthlyPPM[];
  byIssueType: IssueTypePPM[];
  byPackaging: PackagingPPM[];
}

// PPM Logic Settings — configurable by user
export interface PPMSettings {
  target: number;               // PPM target (default: 250)
  warningThreshold: number;     // above this = near_target (default: 200)
  criticalIssuesOnly: boolean;  // only count Infestation + Product Quality
  excludeDelivery: boolean;     // exclude delivery-related complaints
  issueWeights: {               // severity multiplier per issue type
    'Primary Packaging Issue': number;
    'Secondary Packaging Issue': number;
    'Product Quality Issue': number;
    'Infestation': number;
    'Product Performance Issue': number;
    'Delivery Issue': number;
    'Other': number;
  };
}

export const DEFAULT_PPM_SETTINGS: PPMSettings = {
  target: 250,
  warningThreshold: 200,
  criticalIssuesOnly: false,
  excludeDelivery: false,
  issueWeights: {
    'Primary Packaging Issue': 1.0,
    'Secondary Packaging Issue': 1.0,
    'Product Quality Issue': 1.5,
    'Infestation': 2.0,
    'Product Performance Issue': 1.5,
    'Delivery Issue': 0.5,
    'Other': 1.0,
  },
};

// Raw data from Packaging Type PPM → GRAND TOTAL row
// Jul-25 to Mar-26 monthly
export const PPM_DATA: PPMData = {
  totalSales: 2018101,
  totalComplaints: 535,
  overallPPM: 265.1,
  period: 'Jul 2025 – Mar 2026',
  monthly: [
    { month: 'Jul-25', sales: 266363, complaints: 54,  ppm: 202.7 },
    { month: 'Aug-25', sales: 255969, complaints: 71,  ppm: 277.4 },
    { month: 'Sep-25', sales: 254514, complaints: 61,  ppm: 239.7 },
    { month: 'Oct-25', sales: 211666, complaints: 54,  ppm: 255.1 },
    { month: 'Nov-25', sales: 252932, complaints: 53,  ppm: 209.5 },
    { month: 'Dec-25', sales: 244020, complaints: 52,  ppm: 213.1 },
    { month: 'Jan-26', sales: 279481, complaints: 70,  ppm: 250.5 },
    { month: 'Feb-26', sales: 129258, complaints: 51,  ppm: 394.6 },
    { month: 'Mar-26', sales: 123898, complaints: 69,  ppm: 556.9 },
  ],
  byIssueType: [
    { type: 'Primary Packaging Issue',   complaints: 333, ppm: 165.0,  weight: 1.0 },
    { type: 'Product Quality Issue',     complaints: 93,  ppm: 46.1,   weight: 1.5 },
    { type: 'Secondary Packaging Issue', complaints: 32,  ppm: 15.9,   weight: 1.0 },
    { type: 'Infestation',               complaints: 21,  ppm: 10.4,   weight: 2.0 },
    { type: 'Other',                     complaints: 21,  ppm: 10.4,   weight: 1.0 },
    { type: 'Delivery Issue',            complaints: 33,  ppm: 16.4,   weight: 0.5 },
    { type: 'Product Performance Issue', complaints: 2,   ppm: 1.0,    weight: 1.5 },
  ],
  byPackaging: [
    { type: '350g Jar',   sales: 1423939, complaints: 354, ppm: 248.6 },
    { type: '350g Pouch', sales: 161994,  complaints: 51,  ppm: 314.8 },
    { type: '700g Pouch', sales: 119687,  complaints: 63,  ppm: 526.4 },
    { type: '1kg Pouch',  sales: 135950,  complaints: 42,  ppm: 308.9 },
    { type: '400g Pouch', sales: 20237,   complaints: 17,  ppm: 840.0 },
    { type: 'Mini',       sales: 101433,  complaints: 4,   ppm: 39.4  },
    { type: 'Pack',       sales: 39205,   complaints: 4,   ppm: 102.0 },
  ],
};

export function computeWeightedPPM(data: PPMData, settings: PPMSettings): number {
  // Standard PPM formula: (total complaints / total sales) * 1,000,000
  // Filters (exclude delivery / critical only) reduce the complaint count
  // but weights are NOT applied — 1 complaint = 1 complaint regardless of type
  let filteredIssues = [...data.byIssueType];

  if (settings.excludeDelivery) {
    filteredIssues = filteredIssues.filter(i => i.type !== 'Delivery Issue');
  }
  if (settings.criticalIssuesOnly) {
    filteredIssues = filteredIssues.filter(i =>
      i.type === 'Infestation' || i.type === 'Product Quality Issue' || i.type === 'Product Performance Issue'
    );
  }

  const totalComplaints = filteredIssues.reduce((sum, issue) => sum + issue.complaints, 0);
  return Math.round((totalComplaints / data.totalSales) * 1_000_000 * 10) / 10;
}

export function derivePPMStatus(ppm: number, settings: PPMSettings): { status: string; color: 'green' | 'light_green' | 'amber' | 'red' } {
  if (ppm <= settings.warningThreshold) return { status: 'on_track', color: 'green' };
  if (ppm <= settings.target) return { status: 'near_target', color: 'amber' };
  return { status: 'critical', color: 'red' };
}
