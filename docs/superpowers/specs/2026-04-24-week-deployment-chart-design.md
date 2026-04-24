# Week deployment chart (read-only)

**Date:** 2026-04-24  
**Feature:** Read-only weekly overview of saved deployment charts, shift × day grid, station grouped with staff names.

## Summary

Add a dedicated page that shows **Monday through Sunday** for the current store. Each cell is **(calendar day × shift)**. Content is built from **real** `Deployment` records returned by `listDeployments`, with **one chart per calendar day** when duplicates exist (highest `updated_at` wins). Assignments are shown **grouped by station**: station label once, then assigned staff names (comma-separated on one line; wrap within the cell as needed). **No editing** on this page.

## Requirements

1. **Route:** `GET` in-app path `/history/week` (new `WeekDeploymentChartPage` or equivalent under `features/history/`).
2. **Entry:** On `HistoryPage`, add a control (e.g. **“Week overview”** button) beside the existing **“+ New chart”** action that navigates to `/history/week`.
3. **Week selection:** User sets an **anchor date** (MUI `TextField` `type="date"` or equivalent). The visible week is the **ISO-style Monday–Sunday** interval that contains the anchor date, computed in the **browser local timezone**. Display a clear range in the header (e.g. `Mon Apr 20 – Sun Apr 26, 2026`).
4. **Week navigation:** **Previous week** and **Next week** controls adjust the anchor by ±7 days (or move the displayed window; behavior: shifting anchor preserves “pick a week” mental model—implement as subtract/add 7 days to current anchor).
5. **Data loading:**
   - `useListDeploymentsQuery({ storeId })` when `storeId` is set (same as history list). **Skip** when no store.
   - Filter deployments to `deployment.store_id === selectedStoreId` and `deployment.date` in the seven `YYYY-MM-DD` strings for the current week.
   - **Duplicate dates:** If multiple deployments share the same `date`, keep the one with the **lexicographically greatest `updated_at`** (or parse as ISO instant and compare; document: “latest `updated_at` wins”).
6. **Empty days:** If no deployment exists for a date, show that column/cells with a muted **“No chart”** (or “—”) state; no API error.
7. **Grid layout:**
   - **Columns:** seven days (Mon → Sun), header shows short weekday + date (match existing typography density).
   - **Rows:** three shifts — `Morning`, `Afternoon`, `Evening` — reuse the same human-readable time bands as `DeploymentGrid` (`SHIFT_LABELS` or shared constant extracted if duplicated).
8. **Cell content (read-only):** For each `(day, shift)`:
   - Collect all `AssignedCell` entries from that day’s winning deployment where `cell.shift === shift`.
   - **Group by `station_id`:** For each station, resolve **display name** via `useListStationsQuery` → map `station_id` → `station_name`; if missing, fallback to a readable form of `station_id` (e.g. replace `_` with space, title case).
   - Under each station line, show **assigned staff names** in display order: join with **comma + space** (e.g. `Alex, Jordan`). Resolve names with `useListCrewQuery` → `employee_id` → `employee_name`. If an id is not in crew (rare), show first 8 chars of id or **“Unknown”**.
   - Do **not** show AI recommended counts or assign controls on this page (optional footnote in spec: link to detail is allowed below).
9. **Optional enhancement:** Make the **date** in the column header (or a small link in the cell) navigate to `/history/:deployment_id` for that day’s winning deployment when it exists. If omitted in v1, state “out of scope.”
10. **Styling:** Follow existing MUI + `DeploymentGrid`-adjacent patterns (table or CSS grid, rounded container, divider borders). Read-only: no `Chip` delete, no `+ assign`.

## Data model and types

- No backend schema changes.
- Reuse `Deployment`, `AssignedCell`, `Shift` from `services/types.ts`.
- Consider a small **pure helper module** (e.g. `weekDeploymentUtils.ts`) exporting:
  - `getMondaySundayStrings(anchor: Date): { monday: string; sunday: string; days: string[] }` — each entry is `YYYY-MM-DD` local.
  - `pickLatestDeploymentPerDate(deployments: Deployment[]): Map<string, Deployment>` — key = `date`, value = single winning deployment.

## Components and files

| File | Action |
|------|--------|
| `App.tsx` | Register route `/history/week` → new page component. |
| `features/history/HistoryPage.tsx` | Add navigation control to `/history/week`. |
| `features/history/WeekDeploymentChartPage.tsx` | **New** — anchor state, week nav, data hooks, layout. |
| `features/history/WeekDeploymentGrid.tsx` (optional) | **New** — presentational grid if page grows large. |
| `features/history/weekDeploymentUtils.ts` (optional) | **New** — date math + dedupe helpers + unit-testable. |
| `features/deployment/DeploymentGrid.tsx` | **Optional** — extract `SHIFT_LABELS` / shift order to a shared `shiftConstants.ts` to avoid drift; only if duplication is otherwise unavoidable. |

## FlowNav / stepper

- No change required unless product wants the third tab to highlight for `/history/week`; if `StepperNav` matches path prefix `/history`, week route should already highlight **Saved charts**.

## Testing and verification

- Manual: save charts for two different days in the same week; confirm both appear under correct columns.
- Manual: two deployments same `date` — confirm the one with later `updated_at` drives the grid.
- Manual: week with zero deployments — all cells “No chart” or equivalent.
- Manual: station not in `listStations` — fallback label appears.

## Out of scope (v1)

- “By Member” pivot tab from the reference mockup.
- Editing assignments or creating deployments from this screen.
- PDF / print stylesheet.
- New REST endpoint for aggregated week data.
- Locale-specific “start week on Sunday” option (fixed to Monday per product decision).

## Spec self-review

- **Placeholders:** None.
- **Consistency:** Duplicate resolution uses `updated_at` as agreed; week is Mon–Sun local; grouping is by station with names joined by commas.
- **Scope:** Single read-only feature; optional detail link called out explicitly as optional.
- **Ambiguity:** “Latest `updated_at`” implemented as string ISO compare or `Date` parse — implementation should use `Date` parse for correctness across formats.
