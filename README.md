# NPD Quality Dashboard — Mosaic Wellness

A production-ready quality metrics dashboard for Food & Nutraceuticals · FY 2024–25.

## Data Sources

| KPI | Source | Sheet |
|-----|--------|-------|
| GMP Compliance Score | `CM_Site_Scorecard.xlsx` | Master → Summary |
| Legal & Regulatory Compliance | `FSSAI_3PL_Manufacture.xlsx` | Summary |

### Scoring Rules (from Summary tab)

**GMP (CM Sites) — % scale:**
| Range | Color | Status |
|-------|-------|--------|
| ≥75% | Dark Green | On track |
| 60–74% | Light Green | Good |
| 50–59% | Amber | Near target |
| <50% | Red | Critical |

**Legal & Regulatory:**
| Range | Status |
|-------|--------|
| ≥98% | On track |
| 90–97% | Near target |
| <90% | Critical |

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:3000
```

## Project Structure

```
quality-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Main dashboard
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Design tokens + animations
│   │   └── api/
│   │       ├── kpis/route.ts   # GET/PATCH KPI values
│   │       ├── cm-sites/route.ts
│   │       └── fssai/route.ts
│   ├── components/
│   │   ├── KPICard.tsx         # KPI card with 3D hover
│   │   ├── CMSiteTable.tsx     # CM site breakdown table
│   │   ├── FSSAIPanel.tsx      # FSSAI regulatory panel
│   │   └── EditModal.tsx       # KPI edit modal
│   └── data/
│       ├── kpis.ts             # KPI definitions + scoring rules
│       ├── cmSites.ts          # CM site data from Master sheet
│       └── fssaiData.ts        # FSSAI Summary tab data
```

## Adding New KPIs (Phase 2: Complaints PPM)

In `src/data/kpis.ts`, uncomment the PPM block and fill in values.
The dashboard auto-renders any KPI added to `DEFAULT_KPIS`.

## Deploy to Vercel

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_ORG/quality-dashboard.git
git push -u origin main

# 2. On Vercel dashboard:
#    - Import GitHub repo
#    - Framework: Next.js (auto-detected)
#    - No env vars needed
#    - Deploy
```

> **Note on persistence:** The in-memory API store resets on Vercel cold starts.
> For persistent edits, replace the in-memory store in each `route.ts` with a
> database (Supabase/PlanetScale) or a JSON file in `/tmp`.
