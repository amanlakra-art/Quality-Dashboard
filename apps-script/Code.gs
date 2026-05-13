/**
 * Quality Dashboard — shared Apps Script API
 * ============================================================
 * Standalone Apps Script project (NOT bound to either sheet).
 * Exposes a single read-only endpoint that returns parsed JSON
 * for the CM Sites scorecard and the FSSAI relabeller compliance sheet.
 *
 * Routing:
 *   GET ?token=<TOKEN>&dataset=cm-sites   → CM site scorecard JSON
 *   GET ?token=<TOKEN>&dataset=fssai      → FSSAI summary JSON
 *   GET ?token=<TOKEN>&dataset=highlights → Weekly highlights JSON
 *   POST { token, dataset: 'highlights', payload: { op, highlight|id } }
 *
 * Token: stored in Script Properties (File → Project settings → Script properties)
 *   as API_TOKEN. Set it once with _setupToken() below.
 *
 * Deploy as Web app:
 *   Execute as: Me
 *   Who has access: Anyone  (the token gates access; no Google login required)
 */

// ---- CONFIG: edit these two IDs only --------------------------------------

const CM_SITES_SHEET_ID = '1iZ4uIJxigkM1OEwc2gOHCVWZAT2pYXIu1630LSukJiY';
const CM_SITES_TAB      = 'Summary';

const FSSAI_SHEET_ID = '1NUmzhCL-aL46pzIjwFAByi7Zv2k_Ea9t-xKuIjUFzXM';
const FSSAI_TAB      = 'Summary';

// Highlights are stored in the CM Sites spreadsheet for convenience
const HIGHLIGHTS_SHEET_ID = CM_SITES_SHEET_ID;

// ---- Entry point ----------------------------------------------------------

function doGet(e) {
  try {
    const token = e && e.parameter && e.parameter.token;
    const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (!expected) {
      return _json({ error: 'Server misconfigured: API_TOKEN script property not set.' });
    }
    if (token !== expected) {
      return _json({ error: 'Unauthorized' });
    }

    const dataset = (e.parameter.dataset || '').toLowerCase();

    if (dataset === 'cm-sites') return _json(getCmSites_());
    if (dataset === 'fssai')    return _json(getFssai_());
    if (dataset === 'highlights') return _json(getHighlights_());

    return _json({
      error: 'Unknown dataset. Use ?dataset=cm-sites or ?dataset=fssai or ?dataset=highlights',
      available: ['cm-sites', 'fssai', 'highlights']
    });
  } catch (err) {
    return _json({ error: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (!expected || body.token !== expected) {
      return _json({ error: 'Unauthorized' });
    }
    if (body.dataset === 'highlights') return _json(patchHighlights_(body.payload));
    return _json({ error: 'Unknown dataset for POST: ' + body.dataset });
  } catch (err) {
    return _json({ error: String(err && err.message || err) });
  }
}

// ---- CM Sites parser ------------------------------------------------------

function getCmSites_() {
  const ss = SpreadsheetApp.openById(CM_SITES_SHEET_ID);
  const wanted = CM_SITES_TAB.trim().toLowerCase();
  const sheet = ss.getSheets().find(function(s) {
    return s.getName().trim().toLowerCase() === wanted;
  });
  if (!sheet) {
    const available = ss.getSheets().map(function(s) { return s.getName(); }).join(', ');
    throw new Error('CM Sites tab not found: ' + CM_SITES_TAB + '. Available tabs: ' + available);
  }

  const grid = sheet.getDataRange().getValues();
  let headerIdx = -1;
  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    const row = grid[i] || [];
    for (let j = 0; j < row.length; j++) {
      if (String(row[j] || '').trim().toLowerCase() === 'cm site') { headerIdx = i; break; }
    }
    if (headerIdx !== -1) break;
  }
  if (headerIdx === -1) throw new Error('Could not find "CM site" header row');

  const header = grid[headerIdx].map(function(c) { return String(c || '').trim().toLowerCase(); });
  const findCol = function() {
    const needles = Array.prototype.slice.call(arguments);
    for (let i = 0; i < header.length; i++) {
      for (let n = 0; n < needles.length; n++) {
        if (header[i].indexOf(needles[n].toLowerCase()) !== -1) return i;
      }
    }
    return -1;
  };

  const colSite     = findCol('cm site');
  const colReadiness = findCol('site readiness', 'readiness');
  const colGmp      = findCol('gmp');
  const colQms      = findCol('qms');
  const colInfra    = findCol('infrastructure', 'infra');
  const colAvg      = findCol('avg');
  const colScore    = colAvg >= 0 ? colAvg + 1 : -1;

  const rows = [];
  let columnAverages = { siteReadiness: null, gmpCompliance: null, qmsCompliance: null, infraResources: null, avg: null, scorePct: null };
  let mosaicOverall  = { siteReadiness: null, gmpCompliance: null, qmsCompliance: null, infraResources: null, scorePct: null };

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const row = grid[i] || [];
    const siteName = String(row[colSite] || '').trim();
    const firstCell = String(row[0] || '').trim().toLowerCase();
    const blob = (firstCell + ' ' + siteName).toLowerCase();

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
    if (blob.indexOf('color coding') !== -1) continue;
    if (firstCell.indexOf('above') !== -1) continue;
    if (['light green','dark green','amber','red','60% above','75% above','50-59%','<50%'].indexOf(siteName.toLowerCase()) !== -1) continue;

    const avgCell = _num(row[colAvg]);
    if (!siteName && avgCell !== null) {
      columnAverages = {
        siteReadiness: _num(row[colReadiness]), gmpCompliance: _num(row[colGmp]),
        qmsCompliance: _num(row[colQms]), infraResources: _num(row[colInfra]),
        avg: avgCell, scorePct: _pct(row[colScore])
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

  return { rows: rows, columnAverages: columnAverages, mosaicOverall: mosaicOverall, fetchedAt: new Date().toISOString() };
}

// ---- FSSAI parser ---------------------------------------------------------

function getFssai_() {
  const ss = SpreadsheetApp.openById(FSSAI_SHEET_ID);
  const wanted = FSSAI_TAB.trim().toLowerCase();
  const sheet = ss.getSheets().find(function(s) {
    return s.getName().trim().toLowerCase() === wanted;
  });
  if (!sheet) {
    const available = ss.getSheets().map(function(s) { return s.getName(); }).join(', ');
    throw new Error('FSSAI tab not found: ' + FSSAI_TAB + '. Available tabs: ' + available);
  }

  const grid = sheet.getDataRange().getValues();
  const summary = {
    totalMfgSite: null, relablerInCurrentLicence: null, relablerCompliancePct: null,
    totalProduct: null, totalProductInCurrentLicence: null, pending: null, productCompliancePct: null
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

  let soiHeaderIdx = -1;
  for (let i = 0; i < grid.length; i++) {
    if (String((grid[i] || [])[0] || '').trim().toLowerCase() === 'soi') { soiHeaderIdx = i; break; }
  }

  const bySoi = [];
  let totals = null;
  if (soiHeaderIdx !== -1) {
    for (let i = soiHeaderIdx + 1; i < grid.length; i++) {
      const row = grid[i] || [];
      const soi = String(row[0] || '').trim();
      if (!soi) continue;
      const parsed = {
        soi: soi, totalProducts: _num(row[1]), awaitedReview: _num(row[2]),
        received: _num(row[3]), licencePending: _num(row[4]), pendingPct: _pct(row[5])
      };
      if (soi.toLowerCase() === 'total') { totals = parsed; } else { bySoi.push(parsed); }
    }
  }

  return { summary: summary, bySoi: bySoi, totals: totals, fetchedAt: new Date().toISOString() };
}

// ── Highlights ────────────────────────────────────────────────────────────────
// Tab: "Highlights"  Columns: A=id  B=text  C=weekStart  D=createdAt

function _highlightsSheet() {
  const ss = SpreadsheetApp.openById(HIGHLIGHTS_SHEET_ID);
  let sh = ss.getSheetByName('Highlights');
  if (!sh) {
    sh = ss.insertSheet('Highlights');
    sh.appendRow(['id', 'text', 'weekStart', 'createdAt']);
  }
  return sh;
}

function getHighlights_() {
  const sh = _highlightsSheet();
  const last = sh.getLastRow();
  if (last < 2) return { highlights: [] };
  const rows = sh.getRange(2, 1, last - 1, 4).getValues();
  const highlights = rows
    .filter(function(r) { return r[0]; })
    .map(function(r) {
      return { id: String(r[0]), text: String(r[1]), weekStart: _dateStr(r[2]), createdAt: _dateStr(r[3]) };
    });
  return { highlights: highlights };
}

function patchHighlights_(payload) {
  const sh = _highlightsSheet();
  if (payload.op === 'add') {
    const h = payload.highlight;
    sh.appendRow([h.id, h.text, h.weekStart, h.createdAt]);
  } else if (payload.op === 'delete') {
    const last = sh.getLastRow();
    if (last >= 2) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === payload.id) { sh.deleteRow(i + 2); break; }
      }
    }
  }
  return getHighlights_();
}

// ---- helpers --------------------------------------------------------------

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Sheets auto-converts ISO date strings to Date objects; format them back to YYYY-MM-DD
function _dateStr(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'UTC', 'yyyy-MM-dd');
  return String(v);
}

function _num(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === 'na' || s === '-') return null;
  const n = Number(s.replace(/[,%\s$₹]/g, ''));
  return isFinite(n) ? n : null;
}

function _pct(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') {
    if (!isFinite(raw)) return null;
    return raw <= 1.5 ? raw * 100 : raw;
  }
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === 'na') return null;
  const hasPercent = s.indexOf('%') !== -1;
  const n = _num(s);
  if (n === null) return null;
  return hasPercent ? n : (n <= 1.5 ? n * 100 : n);
}

// ---- One-time setup (run once from the Apps Script editor) ---------------

function _setupToken() {
  // PropertiesService.getScriptProperties().setProperty('API_TOKEN', 'CHANGE_ME');
  Logger.log('Edit _setupToken to install your token, then delete this line.');
}
