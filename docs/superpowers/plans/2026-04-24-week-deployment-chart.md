# Week deployment chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a read-only **Monday–Sunday** deployment overview at `/history/week` that loads saved `Deployment` rows for the selected store, dedupes by `date` using latest `updated_at`, and renders a **shift × day** grid with **station name + comma-separated staff names** per group.

**Architecture:** One RTK Query list fetch (`useListDeploymentsQuery`) plus existing `useListStationsQuery` and `useListCrewQuery` for labels. Pure helpers in `weekDeploymentUtils.ts` handle local week boundaries and dedupe (unit-tested with Vitest). Presentational `WeekDeploymentGrid` receives a precomputed matrix from `WeekDeploymentChartPage`. Shared `shiftConstants.ts` holds `SHIFTS` and `SHIFT_LABELS` so `DeploymentGrid` and the week grid stay aligned.

**Tech stack:** React 19, MUI 9, RTK Query, React Router 7, Vite 8, TypeScript 6, Vitest (added as devDependency for utils only).

---

## File map

| File | Responsibility |
|------|------------------|
| `hackathon/frontend/src/features/history/weekDeploymentUtils.ts` | Local Mon–Sun `YYYY-MM-DD` list, dedupe by `updated_at`, station id fallback formatting. |
| `hackathon/frontend/src/features/history/weekDeploymentUtils.test.ts` | Vitest tests for the above. |
| `hackathon/frontend/src/features/deployment/shiftConstants.ts` | `SHIFTS`, `SHIFT_LABELS` (moved from `DeploymentGrid`). |
| `hackathon/frontend/src/features/deployment/DeploymentGrid.tsx` | Import shifts from `shiftConstants.ts` (remove local consts). |
| `hackathon/frontend/src/features/history/WeekDeploymentGrid.tsx` | Read-only MUI table: shift rows, day columns, grouped station text. |
| `hackathon/frontend/src/features/history/WeekDeploymentChartPage.tsx` | Anchor date state, week nav, hooks, `useMemo` to build matrix, renders grid. |
| `hackathon/frontend/src/App.tsx` | Route `/history/week` → `WeekDeploymentChartPage`. |
| `hackathon/frontend/src/features/history/HistoryPage.tsx` | "Week overview" button → `navigate("/history/week")`. |
| `hackathon/frontend/src/components/StepperNav.tsx` | `STEP_NAV["/history/week"]` → `{ backPath: "/history" }` so FlowNav back is sensible. |
| `hackathon/frontend/package.json` | `test` script + `vitest` devDependency. |
| `hackathon/frontend/vite.config.ts` | `/// <reference types="vitest/config" />` and `test: { environment: "node", globals: true }`. |

---

### Task 1: Vitest setup and `weekDeploymentUtils`

**Files:**

- Modify: `hackathon/frontend/package.json`
- Modify: `hackathon/frontend/vite.config.ts`
- Create: `hackathon/frontend/src/features/history/weekDeploymentUtils.ts`
- Create: `hackathon/frontend/src/features/history/weekDeploymentUtils.test.ts`

- [ ] **Step 1: Add Vitest**

Run:

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm install -D vitest@^3.2.0
```

Add to `package.json` `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Wire Vite + Vitest**

Replace `hackathon/frontend/vite.config.ts` with:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Write failing tests**

Create `hackathon/frontend/src/features/history/weekDeploymentUtils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { Deployment } from "../../services/types";
import {
  getMondayToSundayDates,
  pickLatestDeploymentPerDate,
  formatStationFallback,
} from "./weekDeploymentUtils";

describe("getMondayToSundayDates", () => {
  it("returns Mon–Sun local YYYY-MM-DD for a Wednesday in April 2026", () => {
    const anchor = new Date(2026, 3, 22, 15, 0, 0);
    expect(getMondayToSundayDates(anchor)).toEqual([
      "2026-04-20",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
      "2026-04-26",
    ]);
  });
});

describe("pickLatestDeploymentPerDate", () => {
  it("keeps deployment with greater updated_at for same date", () => {
    const older: Deployment = {
      deployment_id: "a",
      store_id: "s1",
      date: "2026-04-20",
      created_at: "2026-04-19T10:00:00Z",
      updated_at: "2026-04-19T10:00:00Z",
      cells: [],
    };
    const newer: Deployment = {
      deployment_id: "b",
      store_id: "s1",
      date: "2026-04-20",
      created_at: "2026-04-19T11:00:00Z",
      updated_at: "2026-04-20T08:00:00Z",
      cells: [],
    };
    const m = pickLatestDeploymentPerDate([older, newer, older]);
    expect(m.get("2026-04-20")?.deployment_id).toBe("b");
  });
});

describe("formatStationFallback", () => {
  it("title-cases snake_case station ids", () => {
    expect(formatStationFallback("makeline_front")).toBe("Makeline Front");
  });
});
```

- [ ] **Step 4: Run tests — expect FAIL**

Run:

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm run test
```

Expected: module not found or exports missing.

- [ ] **Step 5: Implement `weekDeploymentUtils.ts`**

Create `hackathon/frontend/src/features/history/weekDeploymentUtils.ts`:

```typescript
import type { Deployment } from "../../services/types";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatLocalYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfLocalDay(anchor: Date): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
}

/** Seven strings Mon..Sun in local timezone, each `YYYY-MM-DD`. */
export function getMondayToSundayDates(anchor: Date): string[] {
  const day = startOfLocalDay(anchor);
  const dow = day.getDay();
  const monday = new Date(day);
  monday.setDate(day.getDate() - ((dow + 6) % 7));
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    days.push(formatLocalYMD(x));
  }
  return days;
}

/** For each `date`, keep the deployment with the latest `updated_at` (ISO parse). */
export function pickLatestDeploymentPerDate(deployments: Deployment[]): Map<string, Deployment> {
  const m = new Map<string, Deployment>();
  for (const d of deployments) {
    const prev = m.get(d.date);
    if (!prev) {
      m.set(d.date, d);
      continue;
    }
    const nextT = new Date(d.updated_at).getTime();
    const prevT = new Date(prev.updated_at).getTime();
    if (nextT >= prevT) m.set(d.date, d);
  }
  return m;
}

export function formatStationFallback(stationId: string): string {
  return stationId
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
```

- [ ] **Step 6: Run tests — expect PASS**

Run:

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm run test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/khn6352/pizza/hackathon && git add hackathon/frontend/package.json hackathon/frontend/package-lock.json hackathon/frontend/vite.config.ts hackathon/frontend/src/features/history/weekDeploymentUtils.ts hackathon/frontend/src/features/history/weekDeploymentUtils.test.ts && git commit -m "test(frontend): add week deployment date helpers and Vitest."
```

---

### Task 2: Extract `shiftConstants`

**Files:**

- Create: `hackathon/frontend/src/features/deployment/shiftConstants.ts`
- Modify: `hackathon/frontend/src/features/deployment/DeploymentGrid.tsx`

- [ ] **Step 1: Create shared constants**

Create `hackathon/frontend/src/features/deployment/shiftConstants.ts`:

```typescript
import type { Shift } from "../../services/types";

export const SHIFTS: Shift[] = ["Morning", "Afternoon", "Evening"];

export const SHIFT_LABELS: Record<Shift, string> = {
  Morning: "Morning (6\u201312)",
  Afternoon: "Afternoon (12\u201318)",
  Evening: "Evening (18\u201323)",
};
```

- [ ] **Step 2: Update `DeploymentGrid.tsx`**

Remove local `SHIFTS` / `SHIFT_LABELS` definitions. Add:

```typescript
import { SHIFTS, SHIFT_LABELS } from "./shiftConstants";
```

Ensure all references still use `SHIFTS` and `SHIFT_LABELS`.

- [ ] **Step 3: Verify build**

Run:

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm run build
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/khn6352/pizza/hackathon && git add hackathon/frontend/src/features/deployment/shiftConstants.ts hackathon/frontend/src/features/deployment/DeploymentGrid.tsx && git commit -m "refactor(frontend): share shift labels for deployment grids."
```

---

### Task 3: `WeekDeploymentGrid` (presentational)

**Files:**

- Create: `hackathon/frontend/src/features/history/WeekDeploymentGrid.tsx`

- [ ] **Step 1: Add types and component**

Use MUI `Table`, `TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `Typography`, `Box` — mirror padding and border radius patterns from `DeploymentGrid` (`borderRadius: "16px"`, `border: 1`, `borderColor: "divider"`).

Props interface:

```typescript
import type { Shift } from "../../services/types";

export interface WeekDayColumn {
  dateKey: string;
  headerPrimary: string;
  headerSecondary: string;
}

export interface WeekDeploymentGridProps {
  shiftOrder: Shift[];
  shiftLabels: Record<Shift, string>;
  columns: WeekDayColumn[];
  /** cells[shift][dayIndex] — null means no chart that day (all shifts show same empty state per column is handled by page: either whole column empty or show groups). */
  cells: Record<Shift, (WeekCellContent | null)[]>;
}

export type WeekCellContent =
  | { kind: "no_chart" }
  | { kind: "groups"; groups: { stationName: string; names: string }[] };
```

Rendering rules:

- First column header: empty or `"Shift"`.
- Header row: `headerPrimary` bold (e.g. `Mon`), `headerSecondary` caption (`Apr 20`).
- Body: for each `shift` in `shiftOrder`, one row. For each day, if `content?.kind === "no_chart"` or `content === null` (page passes `no_chart` for every shift when that day has no deployment), show muted `Typography` **"No chart"**.
- For `kind: "groups"`, for each group render station line `fontWeight: 600`, then names line `variant="caption"` color `text.secondary`, comma-separated text already built by parent.

- [ ] **Step 2: Lint**

Run:

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm run lint
```

Fix any new issues in this file only.

- [ ] **Step 3: Commit**

```bash
cd /Users/khn6352/pizza/hackathon && git add hackathon/frontend/src/features/history/WeekDeploymentGrid.tsx && git commit -m "feat(frontend): add read-only week deployment grid component."
```

---

### Task 4: `WeekDeploymentChartPage` (data + layout)

**Files:**

- Create: `hackathon/frontend/src/features/history/WeekDeploymentChartPage.tsx`

- [ ] **Step 1: State and queries**

- `const [anchor, setAnchor] = useState(() => new Date())` — or initialize from `new Date()` local.
- `useAppSelector` → `storeId`.
- `useListDeploymentsQuery({ storeId: storeId ?? "" }, { skip: !storeId })`
- `useListStationsQuery()` — no args (same as `CrewPool.tsx` / `storeApi`: global `/api/v1/stations` list); build `Map(station_id → station_name)` from the full list (stations are not scoped per store in the current API).
- `useListCrewQuery(storeId ?? "", { skip: !storeId })`

- [ ] **Step 2: Derive week and winning deployments**

```typescript
const weekDays = useMemo(() => getMondayToSundayDates(anchor), [anchor]);
const weekStartLabel = useMemo(() => {
  const [y, m, d] = weekDays[0].split("-").map(Number);
  const [y2, m2, d2] = weekDays[6].split("-").map(Number);
  const a = new Date(y, m - 1, d);
  const b = new Date(y2, m2 - 1, d2);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return `${fmt(a)} \u2013 ${fmt(b)}`;
}, [weekDays]);
```

Filter deployments:

```typescript
const weekSet = new Set(weekDays);
const inWeek = (deployments ?? []).filter(
  (d) => d.store_id === storeId && weekSet.has(d.date)
);
const byDate = pickLatestDeploymentPerDate(inWeek);
```

- [ ] **Step 3: Build `stationNameById` and `employeeNameById` maps**

From stations list and crew list.

- [ ] **Step 4: Build `cells` matrix**

For each `shift` in `SHIFTS`, array length 7:

For day index `i`, `dateKey = weekDays[i]`, `dep = byDate.get(dateKey)`.

If no `dep`, set every shift row to `{ kind: "no_chart" }` for that column (same for all three rows for that column).

If `dep` exists, for each `shift`:

1. Filter `dep.cells` where `cell.shift === shift`.
2. Group by `station_id` (preserve iteration order: first occurrence order of station_id in filtered list).
3. For each group, `stationName = stationNameById.get(id) ?? formatStationFallback(id)`.
4. `names = assigned_employee_ids.map(id => employeeNameById.get(id) ?? (id.length > 8 ? id.slice(0,8)+"\u2026" : id))` — spec allowed first 8 chars or "Unknown"; use **"Unknown"** if empty string id edge case.
5. Join names with `", "`.

If no cells for that shift on that day, use `{ kind: "groups", groups: [] }` (empty list shows blank body, still not "No chart" because chart exists — acceptable) **or** treat as `{ kind: "groups", groups: [] }` with a single muted line **"No assignments"**. Pick **"No assignments"** as one group line with station omitted: actually simpler: if `groups.length === 0`, render one Typography caption "No assignments" inside cell (grid component: if groups empty, show muted "No assignments").

Update `WeekDeploymentGrid` / types in Task 3 if needed: allow `groups: []` to show **"No assignments"** in `WeekDeploymentGrid` when `kind === "groups"` and `groups.length === 0`.

- [ ] **Step 5: Header UI**

- `Typography` h6: **Week deployment chart**
- Subtitle: `{weekStartLabel}`
- `TextField` `type="date"` `value={formatLocalYMD(startOfLocalDay(anchor))}` `onChange` → parse to `Date` and `setAnchor`
- `Button` "Previous week" → `setAnchor` subtract 7 days from current anchor (same local time-of-day or noon-safe: use date-only add).
- `Button` "Next week" → add 7 days.

Implement small helper `addDays(anchor: Date, delta: number): Date` inline in file or in utils.

- [ ] **Step 6: Empty store**

If `!storeId`, center `Typography` "Select a store from the header" (or match app pattern).

- [ ] **Step 7: Build column headers**

`columns`: for each `dateKey`, `headerPrimary` = short weekday from `new Date(y,m-1,d).toLocaleDateString(..., { weekday: "short" })`, `headerSecondary` = `Apr 20` style.

- [ ] **Step 8: Run build**

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm run build
```

- [ ] **Step 9: Commit**

```bash
cd /Users/khn6352/pizza/hackathon && git add hackathon/frontend/src/features/history/WeekDeploymentChartPage.tsx hackathon/frontend/src/features/history/WeekDeploymentGrid.tsx && git commit -m "feat(frontend): wire week deployment chart page and cell grouping."
```

(If `WeekDeploymentGrid` was updated for empty groups, include it in the same commit.)

---

### Task 5: Routes and navigation

**Files:**

- Modify: `hackathon/frontend/src/App.tsx`
- Modify: `hackathon/frontend/src/features/history/HistoryPage.tsx`
- Modify: `hackathon/frontend/src/components/StepperNav.tsx`

- [ ] **Step 1: Register route**

In `App.tsx`, lazy or static import `WeekDeploymentChartPage` and add:

```tsx
<Route path="/history/week" element={<WeekDeploymentChartPage />} />
```

Place it **before** `/history/:id` so `week` is not captured as an id.

- [ ] **Step 2: History entry button**

In `HistoryPage.tsx` header row (next to **+ New chart**), add `Button` variant `outlined` size `small`: **Week overview** → `navigate("/history/week")`.

- [ ] **Step 3: StepperNav back link**

In `STEP_NAV` add:

```typescript
"/history/week": { backPath: "/history" },
```

- [ ] **Step 4: Build + manual smoke**

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm run build
```

Manually: open `/history/week`, change date, prev/next, confirm Saved charts tab stays selected.

- [ ] **Step 5: Commit**

```bash
cd /Users/khn6352/pizza/hackathon && git add hackathon/frontend/src/App.tsx hackathon/frontend/src/features/history/HistoryPage.tsx hackathon/frontend/src/components/StepperNav.tsx && git commit -m "feat(frontend): add week overview route and history entry."
```

---

### Task 6: Verification against spec

- [ ] **Run unit tests**

```bash
cd /Users/khn6352/pizza/hackathon/hackathon/frontend && npm run test
```

Expected: PASS.

- [ ] **Manual checklist** (from design spec)

1. Two saved charts on different days same week → correct columns.
2. Two deployments **same** `date`, different `updated_at` → newer wins everywhere for that date.
3. Week with zero deployments → every cell **No chart**.
4. Unknown `station_id` in cells → fallback title case string.

- [ ] **Final commit** (only if fixes applied)

Document fixes; otherwise no extra commit.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Route `/history/week` | Task 5 |
| History entry button | Task 5 |
| Anchor date + Mon–Sun local | Task 1 + 4 |
| Prev/next week | Task 4 |
| `listDeployments` + filter store + week | Task 4 |
| Dedupe `updated_at` | Task 1 + 4 |
| Empty day "No chart" | Task 3 + 4 |
| Shift rows + day columns + `SHIFT_LABELS` | Task 2 + 3 + 4 |
| Group by station, comma names, stations API, crew API | Task 4 |
| No assign / no AI rec | Task 3 (no controls) |
| Optional detail link | Omitted in v1 (spec optional) |
| MUI styling like deployment | Task 3 |
| Stepper tab for `/history/week` | Already works via `startsWith("/history/")`; Task 5 adds back nav |

**Placeholder scan:** None.

**Type consistency:** `Shift` from `services/types`; `SHIFTS` in `shiftConstants`; matrices keyed by `Shift` aligned with `SHIFTS` order.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-week-deployment-chart.md`. Two execution options:

**1. Subagent-driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline execution** — Run tasks in this session using executing-plans, batch execution with checkpoints.

Which approach do you want?
