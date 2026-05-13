/**
 * Quality Dashboard — Google Sheets backend
 *
 * Deploy: Extensions → Apps Script → paste this → Deploy → New deployment
 *   → Type: Web app → Execute as: Me → Who has access: Anyone
 *   → Copy the /exec URL into Vercel env var SHEETS_API_URL.
 *
 * To update later: Manage deployments → Edit → New version (keeps same URL).
 */

const SHEET_ID = '1vfT3B9qPE4-NL11uo7VmzgHanNzGAWLf'; // from your sheet URL
const TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';   // must match SHEETS_API_TOKEN in Vercel

// Column layout for the Summary tab (1-indexed, matches your screenshot)
const CM_COLS = { name: 2, siteReadiness: 3, gmp: 4, qms: 5, infra: 6, avg: 7, pct: 8 };
const CM_FIRST_ROW = 3; // first data row ("NG Electro Baddi")
const CM_LAST_ROW = 13; // last data row ("Percos") — adjust if you add sites

function doGet(e) {
  return _handle(e, function (params) {
    if (params.dataset === 'cm-sites') return _getCmSites();
    if (params.dataset === 'highlights') return _getHighlights();
    // 'fssai' is handled by a separate deployed version — add _getFssai() when updating
    throw new Error('Unknown dataset. Use ?dataset=cm-sites or ?dataset=fssai or ?dataset=highlights');
  });
}

function doPost(e) {
  return _handle(e, function (params) {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) throw new Error('unauthorized');
    if (body.dataset === 'cm-sites') return _patchCmSite(body.payload);
    if (body.dataset === 'highlights') return _patchHighlights(body.payload);
    throw new Error('Unknown dataset: ' + body.dataset);
  });
}

function _handle(e, fn) {
  try {
    const params = e.parameter || {};
    if ((e.postData ? JSON.parse(e.postData.contents).token : params.token) !== TOKEN) {
      return _json({ error: 'unauthorized' });
    }
    return _json(fn(params));
  } catch (err) {
    return _json({ error: String(err && err.message || err) });
  }
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _sheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName('Summary');
}

function _getCmSites() {
  const sheet = _sheet();
  const range = sheet.getRange(CM_FIRST_ROW, CM_COLS.name, CM_LAST_ROW - CM_FIRST_ROW + 1, 6);
  const rows = range.getValues();
  const sites = rows.map(function (r) {
    return {
      name: r[0],
      siteReadiness: _num(r[1]),
      gmpCompliance: _num(r[2]),
      qmsCompliance: _num(r[3]),
      infrastructure: _num(r[4]),
      avg: _num(r[5]),
    };
  }).filter(function (s) { return s.name; });
  sites.forEach(function (s) {
    s.pct = s.avg !== null ? (s.avg / 5) * 100 : null;
  });
  const valid = sites.filter(function (s) { return s.gmpCompliance !== null; });
  const avgGMP = valid.reduce(function (a, s) { return a + s.gmpCompliance; }, 0) / valid.length;
  return { sites: sites, overallGMPPct: (avgGMP / 5) * 100 };
}

function _patchCmSite(payload) {
  const sheet = _sheet();
  const names = sheet.getRange(CM_FIRST_ROW, CM_COLS.name, CM_LAST_ROW - CM_FIRST_ROW + 1, 1).getValues();
  let rowIdx = -1;
  for (let i = 0; i < names.length; i++) {
    if (names[i][0] === payload.name) { rowIdx = CM_FIRST_ROW + i; break; }
  }
  if (rowIdx === -1) throw new Error('Site not found: ' + payload.name);

  const field = { siteReadiness: CM_COLS.siteReadiness, gmpCompliance: CM_COLS.gmp,
                  qmsCompliance: CM_COLS.qms, infrastructure: CM_COLS.infra };
  Object.keys(field).forEach(function (k) {
    if (payload[k] !== undefined) sheet.getRange(rowIdx, field[k]).setValue(payload[k]);
  });

  // Recompute avg & pct for this row
  const r = sheet.getRange(rowIdx, CM_COLS.siteReadiness, 1, 4).getValues()[0];
  const vals = r.filter(function (v) { return typeof v === 'number'; });
  if (vals.length) {
    const avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    sheet.getRange(rowIdx, CM_COLS.avg).setValue(avg);
    sheet.getRange(rowIdx, CM_COLS.pct).setValue(avg / 5);
  }
  return _getCmSites();
}

function _num(v) { return (v === '' || v === null || v === 'NA') ? null : Number(v); }

// ── Highlights ────────────────────────────────────────────────────────────────
// Sheet tab: "Highlights"  Columns: A=id  B=text  C=weekStart  D=createdAt

function _highlightsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName('Highlights');
  if (!sh) {
    sh = ss.insertSheet('Highlights');
    sh.appendRow(['id', 'text', 'weekStart', 'createdAt']);
  }
  return sh;
}

function _getHighlights() {
  const sh = _highlightsSheet();
  const last = sh.getLastRow();
  if (last < 2) return { highlights: [] };
  const rows = sh.getRange(2, 1, last - 1, 4).getValues();
  const highlights = rows
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      return { id: String(r[0]), text: String(r[1]), weekStart: String(r[2]), createdAt: String(r[3]) };
    });
  return { highlights: highlights };
}

function _patchHighlights(payload) {
  const sh = _highlightsSheet();
  if (payload.op === 'add') {
    const h = payload.highlight;
    sh.appendRow([h.id, h.text, h.weekStart, h.createdAt]);
  } else if (payload.op === 'delete') {
    const last = sh.getLastRow();
    if (last >= 2) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === payload.id) {
          sh.deleteRow(i + 2);
          break;
        }
      }
    }
  }
  return _getHighlights();
}
