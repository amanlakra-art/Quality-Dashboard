/**
 * Quality Dashboard — shared Apps Script API
 * ============================================================
 * Standalone Apps Script project (NOT bound to either sheet).
 * Exposes a single read-only endpoint that returns parsed JSON
 * for the CM Sites scorecard and the FSSAI relabeller compliance sheet.
 *
 * Why standalone: it's the cleanest way to read multiple sheets from
 * one place. Bound scripts run in the context of one specific sheet,
 * which is wrong here.
 *
 * Routing:
 *   GET ?token=<TOKEN>&dataset=cm-sites   → CM site scorecard JSON
 *   GET ?token=<TOKEN>&dataset=fssai      → FSSAI summary JSON
 *
 * Token check:
 *   The token lives in Script Properties (File → Project settings →
 *   Script properties), NOT in this code. That way you can rotate
 *   the token without touching/redeploying the script.
 *
 * Deploy as Web app:
 *   Execute as: Me
 *   Who has access: Anyone   (the token gates access; no Google login required)
 *
 * No write methods. If you ever want to add edit-from-webpage later,
 * add a doPost handler — none here on purpose.
 */

// ---- CONFIG: edit these two IDs only --------------------------------------

// CM Site Scorecard — from your URL: docs.google.com/.../d/<ID>/edit
const CM_SITES_SHEET_ID = '1iZ4uIJxigkM1OEwc2gOHCVWZAT2pYXIu1630LSukJiY';
const CM_SITES_TAB      = 'Summary';

// FSSAI 3PL Manufacture
const FSSAI_SHEET_ID = '1NUmzhCL-aL46pzljwFABYi7Zv2k_Ea9t-xKuljUFzXM';
const FSSAI_TAB      = 'Summary';

// ---- Entry point ----------------------------------------------------------

function doGet(e) {
  try {
    const token = e && e.parameter && e.parameter.token;
    const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (!expected) {
      return _json({ error: 'Server misconfigured: API_TOKEN script property not set.' }, 500);
    }
    if (token !== expected) {
      return _json({ error: 'Unauthorized' }, 401);
    }

    const dataset = (e.parameter.dataset || '').toLowerCase();

    if (dataset === 'cm-sites') {
      return _json(getCmSites_());
    }
    if (dataset === 'fssai') {
      return _json(getFssai_());
    }
    return _json({
      error: 'Unknown dataset. Use ?dataset=cm-sites or ?dataset=fssai',
      available: ['cm-sites', 'fssai']
    }, 400);

  } catch (err) {
    return _json({ error: String(err && err.message || err) }, 500);
  }
}

// ---- CM Sites parser ------------------------------------------------------

/**
 * Returns:
 * {
 *   rows: [{ site, siteReadiness, gmpCompliance, qmsCompliance,
 *            infraResources, avg, scorePct }],
 *   columnAverages: { siteReadiness, gmpCompliance, qmsCompliance,
 *                     infraResources, avg, scorePct },
 *   mosaicOverall:  { siteReadiness, gmpCompliance, qmsCompliance,
 *                     infraResources, scorePct },
 *   fetchedAt: ISO string
 * }
 *
 * Sheet layout (from the actual sheet — column B is the first data column):
 *   Row 2: header   B=CM site, C=Site Readiness, D=GMP, E=QMS,
 *                   F=Infrastructure & Resources, G=AVG, H=score%
 *   Row 3..N: per-site rows
 *   Then a column-averages row (no site name, has AVG number)
 *   Then a "Mosaic Overall CM site Score" row
 */
function getCmSites_() {
  const sheet = SpreadsheetApp.openById(CM_SITES_SHEET_ID).getSheetByName(CM_SITES_TAB);
  if (!sheet) throw new Error('CM Sites tab not found: ' + CM_SITES_TAB);

  const grid = sheet.getDataRange().getValues();
  // Find the header row: scan the first 20 rows for a cell containing "CM site".
  let headerIdx = -1;
  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    const row = grid[i] || [];
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').trim().toLowerCase();
      if (cell === 'cm site') { headerIdx = i; break; }
    }
    if (headerIdx !== -1) break;
  }
  if (headerIdx === -1) throw new Error('Could not find "CM site" header row');

  const header = grid[headerIdx].map(c => String(c || '').trim().toLowerCase());
  const findCol = function() {
    const needles = Array.prototype.slice.call(arguments);
    for (let i = 0; i < header.length; i++) {
      for (let n = 0; n < needles.length; n++) {
        if (header[i].indexOf(needles[n].toLowerCase()) !== -1) return i;
      }
    }
    return -1;
  };

  const colSite = findCol('cm site');
  const colReadiness = findCol('site readiness', 'readiness');
  const colGmp = findCol('gmp');
  const colQms = findCol('qms');
  const colInfra = findCol('infrastructure', 'infra');
  const colAvg = findCol('avg');
  const colScore = colAvg >= 0 ? colAvg + 1 : -1; // score % column has no header

  const rows = [];
  let columnAverages = {
    siteReadiness: null, gmpCompliance: null, qmsCompliance: null,
    infraResources: null, avg: null, scorePct: null
  };
  let mosaicOverall = {
    siteReadiness: null, gmpCompliance: null, qmsCompliance: null,
    infraResources: null, scorePct: null
  };

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const row = grid[i] || [];
    const siteName = String(row[colSite] || '').trim();
    const firstCell = String(row[0] || '').trim().toLowerCase();
    const blob = (firstCell + ' ' + siteName).toLowerCase();

    // Mosaic Overall row — values may be in different columns; the screenshot
    // shows them at C/D/E/F (same as scorecard) plus the % at H.
    if (blob.indexOf('mosaic overall') !== -1) {
      mosaicOverall = {
        siteReadiness: _pct(row[colReadiness]),
        gmpCompliance: _pct(row[colGmp]),
        qmsCompliance: _pct(row[colQms]),
        infraResources: _pct(row[colInfra]),
        scorePct: _pct(row[colScore])
      };
      continue;
    }

    // Skip color-coding legend block at the bottom.
    if (blob.indexOf('color coding') !== -1) continue;
    if (firstCell.indexOf('above') !== -1) continue;
    if (siteName === '60% above' || siteName === '75% above' ||
        siteName === '50-59%' || siteName === '<50%') continue;
    if (['light green', 'dark green', 'amber', 'red'].indexOf(siteName.toLowerCase()) !== -1) continue;

    // Column-averages row: empty site name, but numeric AVG.
    const avgCell = _num(row[colAvg]);
    if (!siteName && avgCell !== null) {
      columnAverages = {
        siteReadiness: _num(row[colReadiness]),
        gmpCompliance: _num(row[colGmp]),
        qmsCompliance: _num(row[colQms]),
        infraResources: _num(row[colInfra]),
        avg: avgCell,
        scorePct: _pct(row[colScore])
      };
      continue;
    }

    if (!siteName) continue;

    rows.push({
      site: siteName,
      siteReadiness: _num(row[colReadiness]),
      gmpCompliance: _num(row[colGmp]),
      qmsCompliance: _num(row[colQms]),
      infraResources: _num(row[colInfra]),
      avg: _num(row[colAvg]),
      scorePct: _pct(row[colScore])
    });
  }

  return {
    rows: rows,
    columnAverages: columnAverages,
    mosaicOverall: mosaicOverall,
    fetchedAt: new Date().toISOString()
  };
}

// ---- FSSAI parser ---------------------------------------------------------

/**
 * Returns:
 * {
 *   summary: {
 *     totalMfgSite, relablerInCurrentLicence, relablerCompliancePct,
 *     totalProduct, totalProductInCurrentLicence, pending,
 *     productCompliancePct
 *   },
 *   bySoi: [{ soi, totalProducts, awaitedReview, received,
 *             licencePending, pendingPct }],
 *   totals: { soi: 'Total', ...same shape... } | null,
 *   fetchedAt: ISO string
 * }
 *
 * Sheet layout (from the actual sheet, column-A driven):
 *   A2: "Total mfg site"               B2: 14    D2: 78.57%   E2: "Relabller Lic compliance"
 *   A3: "Relabler name in current lice" B3: 11
 *   A5: "Total product"                B5: 110   D5: 29.09%   E5: "Product Compliance in Relabeller"
 *   A6: "Total product in current licncen" B6: 32
 *   A7: "Pending"                      B7: 78
 *   A9 (header): SOI | Total Product no. | Awaited for review consultant |
 *                Received | mosaic licence endorsement pending | % pending
 *   A10..14: per-SOI rows
 *   A15: "Total" yellow row
 */
function getFssai_() {
  const sheet = SpreadsheetApp.openById(FSSAI_SHEET_ID).getSheetByName(FSSAI_TAB);
  if (!sheet) throw new Error('FSSAI tab not found: ' + FSSAI_TAB);

  const grid = sheet.getDataRange().getValues();

  // ---- Top metadata block: scan column A for known labels ----
  const summary = {
    totalMfgSite: null,
    relablerInCurrentLicence: null,
    relablerCompliancePct: null,
    totalProduct: null,
    totalProductInCurrentLicence: null,
    pending: null,
    productCompliancePct: null
  };

  for (let i = 0; i < grid.length; i++) {
    const row = grid[i] || [];
    const label = String(row[0] || '').trim().toLowerCase();
    const valB = _num(row[1]);
    const valD = _pct(row[3]);

    if (label.indexOf('total mfg site') === 0) {
      summary.totalMfgSite = valB;
      if (valD !== null) summary.relablerCompliancePct = valD;
    } else if (label.indexOf('relabler') === 0 && label.indexOf('current') !== -1) {
      summary.relablerInCurrentLicence = valB;
    } else if (label.indexOf('total product') === 0 && label.indexOf('current') === -1) {
      summary.totalProduct = valB;
      if (valD !== null) summary.productCompliancePct = valD;
    } else if (label.indexOf('total product') === 0 && label.indexOf('current') !== -1) {
      summary.totalProductInCurrentLicence = valB;
    } else if (label.indexOf('pending') === 0) {
      summary.pending = valB;
    }
  }

  // ---- Per-SOI block: find header row by "SOI" in column A ----
  let soiHeaderIdx = -1;
  for (let i = 0; i < grid.length; i++) {
    const cellA = String((grid[i] || [])[0] || '').trim().toLowerCase();
    if (cellA === 'soi') { soiHeaderIdx = i; break; }
  }

  const bySoi = [];
  let totals = null;

  if (soiHeaderIdx !== -1) {
    for (let i = soiHeaderIdx + 1; i < grid.length; i++) {
      const row = grid[i] || [];
      const soi = String(row[0] || '').trim();
      if (!soi) continue;

      const parsed = {
        soi: soi,
        totalProducts: _num(row[1]),
        awaitedReview: _num(row[2]),
        received: _num(row[3]),
        licencePending: _num(row[4]),
        pendingPct: _pct(row[5])
      };

      if (soi.toLowerCase() === 'total') {
        totals = parsed;
      } else {
        bySoi.push(parsed);
      }
    }
  }

  return {
    summary: summary,
    bySoi: bySoi,
    totals: totals,
    fetchedAt: new Date().toISOString()
  };
}

// ---- helpers --------------------------------------------------------------

function _json(obj, status) {
  // Apps Script web apps can't set HTTP status codes on ContentService output,
  // so we encode status into the body. The Next.js proxy can choose to honor it.
  const body = (typeof obj === 'object' && obj !== null) ? obj : { value: obj };
  if (status && status !== 200) body._status = status;
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Parse a numeric cell. Returns null for blank, "NA", "-".
 * Handles strings like "4.5", numbers, and stringified percents (which we
 * shouldn't see for plain numbers but are tolerated).
 */
function _num(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === 'na' || s === '-') return null;
  const cleaned = s.replace(/[,%\s$₹]/g, '');
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
}

/**
 * Parse a percent cell. Always returns 0..100.
 *   "80.00%" → 80
 *   0.8      → 80   (Sheets stores percents as fractions in raw form)
 *   80       → 80
 */
function _pct(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') {
    if (!isFinite(raw)) return null;
    // Sheets percent cells come through as a fraction. Anything ≤ 1.5 we
    // treat as a fraction; anything larger is already on a 0-100 scale.
    return raw <= 1.5 ? raw * 100 : raw;
  }
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === 'na') return null;
  const hasPercent = s.indexOf('%') !== -1;
  const n = _num(s);
  if (n === null) return null;
  if (hasPercent) return n;
  return n <= 1.5 ? n * 100 : n;
}

// ---- One-time setup helper (run from the editor) --------------------------

/**
 * Convenience: run this once from the Apps Script editor to set the token.
 * Replace 'CHANGE_ME' first. After it runs, delete the call or change the
 * value back so the literal token doesn't sit in the source.
 */
function _setupToken() {
  // PropertiesService.getScriptProperties().setProperty('API_TOKEN', 'CHANGE_ME');
  Logger.log('Edit _setupToken to install your token, then delete this line.');
}
