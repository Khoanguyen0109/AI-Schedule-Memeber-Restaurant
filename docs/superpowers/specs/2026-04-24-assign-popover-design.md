# Assign Popover — My Staff + Area Staff

**Date:** 2026-04-24
**Feature:** Two-section staff picker in the deployment grid

## Summary

Replace the current auto-assign behavior of the "+ assign" button in `DeploymentGrid` with a popover that shows two sections: the current store's available crew (My Staff) and mock employees from nearby stores (Area Staff). Area staff assigned to the grid are visually distinguished as "borrowed."

## Requirements

1. Clicking "+ assign" on any grid cell opens a **Popover** anchored to the button.
2. The popover has **two sections**:
   - **My Staff** (no header) — available crew from the current store for that shift.
   - **Area Staff** (with "Area Staff" header + divider) — 3 hardcoded employees from other stores, filtered by shift availability and not already assigned in that shift.
3. **My Staff rows:** employee name only (e.g., `Alex Kim`).
4. **Area Staff rows:** single line, `Name — Store Name` with the store name in muted/secondary text (e.g., `Sophia Martinez — Westside Plaza`).
5. Clicking a row dispatches `assignEmployee` and closes the popover.
6. If either section has no available staff, show a muted "No staff available" line.
7. Assigned area staff chips in the grid have a **dashed border** and a **warm accent color** to indicate they are borrowed.
8. A **Tooltip** on area staff chips shows `"Borrowed from {store_name}"`.
9. No changes to `deploymentSlice` — the reducer works with `employee_id` strings regardless of source.
10. No changes to `CrewPool` sidebar — it continues to show the current store's crew only.

## Data Model

### New type in `services/types.ts`

```typescript
export interface AreaEmployee {
  employee_id: string;
  employee_name: string;
  store_id: string;
  store_name: string;
  role: string;
  available_shifts: Shift[];
  skills: string[];
}
```

### Mock data constant — `features/deployment/areaStaffData.ts`

```typescript
import type { AreaEmployee } from "../../services/types";

export const AREA_STAFF: AreaEmployee[] = [
  {
    employee_id: "area-001",
    employee_name: "Sophia Martinez",
    store_id: "store-westside",
    store_name: "Westside Plaza",
    role: "Crew",
    available_shifts: ["Morning", "Afternoon", "Evening"],
    skills: ["makeline", "oven", "cut_table"],
  },
  {
    employee_id: "area-002",
    employee_name: "James Lee",
    store_id: "store-downtown",
    store_name: "Downtown Station",
    role: "Crew",
    available_shifts: ["Morning", "Afternoon"],
    skills: ["front_counter", "drive_through"],
  },
  {
    employee_id: "area-003",
    employee_name: "Priya Patel",
    store_id: "store-northgate",
    store_name: "Northgate Mall",
    role: "Shift Lead",
    available_shifts: ["Afternoon", "Evening"],
    skills: ["makeline", "front_counter", "oven"],
  },
];
```

The `employee_id` prefix `area-` is used at render time to detect borrowed staff for chip styling. No ID collision with real employees (which use UUID-style IDs).

## Components

### New: `AssignPopover` (`features/deployment/AssignPopover.tsx`)

**Props:**

```typescript
interface AssignPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  stationId: string;
  shift: Shift;
  myStaff: Employee[];
  areaStaff: AreaEmployee[];
  onAssign: (employeeId: string) => void;
}
```

**Layout:**

```
┌───────────────────────────────────────┐
│  ○ Alex Kim                           │
│  ○ Mia Chen                           │
│  ○ Jordan Park                        │
│                                       │
│  Area Staff                           │
│  ─────────────────────────────────    │
│  ○ Sophia Martinez — Westside Plaza   │
│  ○ James Lee — Downtown Station       │
│  ○ Priya Patel — Northgate Mall       │
└───────────────────────────────────────┘
```

- MUI `Popover` with `anchorOrigin: { vertical: "bottom", horizontal: "left" }`.
- MUI `List` / `ListItemButton` for rows.
- Max height ~250px with overflow scroll.
- Each row click → `onAssign(employeeId)` → popover closes.
- Empty section → muted "No staff available" text.

### Modified: `DeploymentGrid` (`features/deployment/DeploymentGrid.tsx`)

Changes:

1. **Import** `AssignPopover`, `AREA_STAFF`, and `AreaEmployee` type.
2. **New state:** `popover: { anchorEl: HTMLElement; stationId: string; shift: Shift } | null`.
3. **"+ assign" button onClick** → opens popover with `setPopover(...)` instead of auto-assigning.
4. **New helper** `getAvailableArea(shift)` — filters `AREA_STAFF` by `available_shifts` includes shift, and `employee_id` not already assigned in that shift across all cells.
5. **Render `<AssignPopover>`** once at the bottom, driven by `popover` state. `onAssign` dispatches `assignEmployee` and sets `popover` to `null`.
6. **Chip rendering** — detect `employee_id.startsWith("area-")`:
   - If area: dashed border, warm accent color (`#FFF7ED` bg / `#EA580C` text light; `rgba(255,149,0,0.15)` bg / `#FFB340` text dark), Tooltip with `"Borrowed from {store_name}"`.
   - If local: unchanged (current default chip style).
7. **empMap lookup** — when rendering chips, if `empMap.get(eid)` returns undefined, fall back to `AREA_STAFF.find(a => a.employee_id === eid)` for initials and tooltip.

### Unchanged

- `deploymentSlice.ts` — no changes needed.
- `CrewPool.tsx` — continues to show current store crew only.
- `DeploymentPage.tsx` — no layout changes.
- `services/` API files — no backend changes.

## Styling

| Element | Light mode | Dark mode |
|---------|-----------|-----------|
| Area chip bg | `#FFF7ED` | `rgba(255,149,0,0.15)` |
| Area chip text | `#EA580C` | `#FFB340` |
| Area chip border | `1px dashed #FDBA74` | `1px dashed rgba(255,149,0,0.3)` |
| Area chip tooltip | `"Borrowed from {store_name}"` | same |
| Local chip | unchanged | unchanged |

## Files Changed

| File | Action |
|------|--------|
| `services/types.ts` | Add `AreaEmployee` interface |
| `features/deployment/areaStaffData.ts` | New — mock data constant |
| `features/deployment/AssignPopover.tsx` | New — popover component |
| `features/deployment/DeploymentGrid.tsx` | Modified — popover trigger + borrowed chip styling |

## Out of Scope

- Backend API for area staff (this is frontend mock data only).
- Changes to chat-driven assign/unassign actions (they continue to work with employee IDs).
- Changes to `CrewPool` sidebar.
- Search/filter within the popover (list is small enough).
