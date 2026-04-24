# Assign Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the auto-assign button in DeploymentGrid with a two-section popover picker (My Staff + Area Staff with borrowed-staff styling).

**Architecture:** New `AreaEmployee` type + mock data constant, a new `AssignPopover` component using MUI Popover/List, and modifications to `DeploymentGrid` to open the popover and style borrowed-staff chips differently. No backend or Redux slice changes.

**Tech Stack:** React, TypeScript, MUI (Popover, List, ListItemButton, Divider, Chip, Tooltip), Redux Toolkit (existing `assignEmployee` action)

**Note:** This project has no test infrastructure. Steps focus on implementation and manual verification.

---

### Task 1: Add `AreaEmployee` type

**Files:**
- Modify: `hackathon/frontend/src/services/types.ts` (append after `EmployeePatch` interface, ~line 79)

- [ ] **Step 1: Add the AreaEmployee interface**

Open `hackathon/frontend/src/services/types.ts` and add after the `EmployeePatch` interface (after line 79):

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

- [ ] **Step 2: Verify no type errors**

Run: `cd hackathon/frontend && npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add hackathon/frontend/src/services/types.ts
git commit -m "feat: add AreaEmployee type for borrowed staff"
```

---

### Task 2: Create mock area staff data

**Files:**
- Create: `hackathon/frontend/src/features/deployment/areaStaffData.ts`

- [ ] **Step 1: Create the mock data file**

Create `hackathon/frontend/src/features/deployment/areaStaffData.ts` with:

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

- [ ] **Step 2: Verify no type errors**

Run: `cd hackathon/frontend && npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add hackathon/frontend/src/features/deployment/areaStaffData.ts
git commit -m "feat: add mock area staff data (3 employees from nearby stores)"
```

---

### Task 3: Build `AssignPopover` component

**Files:**
- Create: `hackathon/frontend/src/features/deployment/AssignPopover.tsx`

- [ ] **Step 1: Create the AssignPopover component**

Create `hackathon/frontend/src/features/deployment/AssignPopover.tsx` with the full component:

```tsx
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { Employee, AreaEmployee, Shift } from "../../services/types";

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

export default function AssignPopover({
  anchorEl,
  open,
  onClose,
  myStaff,
  areaStaff,
  onAssign,
}: AssignPopoverProps) {
  const handleAssign = (employeeId: string) => {
    onAssign(employeeId);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "12px",
            minWidth: 220,
            maxHeight: 280,
            overflow: "auto",
            mt: 0.5,
          },
        },
      }}
    >
      <List dense disablePadding>
        {myStaff.length > 0 ? (
          myStaff.map((emp) => (
            <ListItemButton
              key={emp.employee_id}
              onClick={() => handleAssign(emp.employee_id)}
              sx={{ py: 0.75, px: 2 }}
            >
              <ListItemText
                primary={emp.employee_name}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
              />
            </ListItemButton>
          ))
        ) : (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              No staff available
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 0.5 }} />

        <Box sx={{ px: 2, pt: 0.75, pb: 0.25 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Area Staff
          </Typography>
        </Box>

        {areaStaff.length > 0 ? (
          areaStaff.map((emp) => (
            <ListItemButton
              key={emp.employee_id}
              onClick={() => handleAssign(emp.employee_id)}
              sx={{ py: 0.75, px: 2 }}
            >
              <ListItemText
                primary={
                  <>
                    {emp.employee_name}
                    <Typography
                      component="span"
                      sx={{ color: "text.secondary", fontSize: 12, ml: 0.5 }}
                    >
                      — {emp.store_name}
                    </Typography>
                  </>
                }
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
              />
            </ListItemButton>
          ))
        ) : (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              No staff available
            </Typography>
          </Box>
        )}
      </List>
    </Popover>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd hackathon/frontend && npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add hackathon/frontend/src/features/deployment/AssignPopover.tsx
git commit -m "feat: add AssignPopover component with My Staff + Area Staff sections"
```

---

### Task 4: Wire popover into DeploymentGrid + borrowed chip styling

**Files:**
- Modify: `hackathon/frontend/src/features/deployment/DeploymentGrid.tsx`

This is the main integration task. The current file is 255 lines. Changes are:

1. Add imports
2. Add popover state
3. Add area staff availability helper
4. Change "+ assign" button to open popover
5. Style borrowed-staff chips differently
6. Render AssignPopover at bottom of component

- [ ] **Step 1: Add imports**

At the top of `DeploymentGrid.tsx`, add these imports after the existing ones:

```typescript
import { useState } from "react";
import AssignPopover from "./AssignPopover";
import { AREA_STAFF } from "./areaStaffData";
import type { AreaEmployee } from "../../services/types";
```

- [ ] **Step 2: Add popover state and area staff helpers inside the component**

Inside the `DeploymentGrid` component function, after the existing `empMap`, `stationIds`, `cellMap`, `staffMap` declarations (around line 39-40), add:

```typescript
const [popover, setPopover] = useState<{
  anchorEl: HTMLElement;
  stationId: string;
  shift: Shift;
} | null>(null);

const areaEmpMap = new Map<string, AreaEmployee>(
  AREA_STAFF.map((e) => [e.employee_id, e])
);

const getAvailableArea = (shift: Shift): AreaEmployee[] => {
  const assigned = new Set(
    cells.flatMap((c) => (c.shift === shift ? c.assigned_employee_ids : []))
  );
  return AREA_STAFF.filter(
    (e) => !assigned.has(e.employee_id) && e.available_shifts.includes(shift)
  );
};
```

- [ ] **Step 3: Change the "+ assign" button onClick**

Find the current "+ assign" button (around line 223-242). Replace the `onClick` handler:

**Current code:**
```typescript
onClick={() => {
  const next = available[0];
  if (next) dispatch(assignEmployee({ stationId: sid, shift: sh, employeeId: next.employee_id }));
}}
```

**Replace with:**
```typescript
onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
  setPopover({ anchorEl: e.currentTarget, stationId: sid, shift: sh });
}}
```

Also update the button's visibility condition. Currently:
```typescript
{!readOnly && available.length > 0 && (
```

Change to show the button whenever there's any available staff (my staff OR area staff):
```typescript
{!readOnly && (available.length > 0 || getAvailableArea(sh).length > 0) && (
```

- [ ] **Step 4: Style borrowed-staff chips**

Find the chip rendering block (around line 209-222) where `cell.assigned_employee_ids.map(...)` renders chips. Replace the entire `.map(...)` callback:

**Current code:**
```tsx
{cell.assigned_employee_ids.map((eid) => {
  const emp = empMap.get(eid);
  return (
    <Chip
      key={eid}
      label={emp ? emp.employee_name.split(" ").map((w: string) => w[0]).join("") : eid.slice(0, 4)}
      size="small"
      {...(!readOnly && {
        onDelete: () => dispatch(unassignEmployee({ stationId: sid, shift: sh, employeeId: eid })),
      })}
      sx={{ fontSize: 10, fontWeight: 600, height: 22 }}
    />
  );
})}
```

**Replace with:**
```tsx
{cell.assigned_employee_ids.map((eid) => {
  const emp = empMap.get(eid);
  const areaEmp = areaEmpMap.get(eid);
  const isArea = !!areaEmp;
  const displayName = emp
    ? emp.employee_name.split(" ").map((w: string) => w[0]).join("")
    : areaEmp
      ? areaEmp.employee_name.split(" ").map((w: string) => w[0]).join("")
      : eid.slice(0, 4);

  const chip = (
    <Chip
      key={eid}
      label={displayName}
      size="small"
      {...(!readOnly && {
        onDelete: () => dispatch(unassignEmployee({ stationId: sid, shift: sh, employeeId: eid })),
      })}
      sx={(t) => ({
        fontSize: 10,
        fontWeight: 600,
        height: 22,
        ...(isArea && {
          bgcolor: t.palette.mode === "dark" ? "rgba(255,149,0,0.15)" : "#FFF7ED",
          color: t.palette.mode === "dark" ? "#FFB340" : "#EA580C",
          border: `1px dashed ${t.palette.mode === "dark" ? "rgba(255,149,0,0.3)" : "#FDBA74"}`,
          "& .MuiChip-deleteIcon": {
            color: t.palette.mode === "dark" ? "#FFB340" : "#EA580C",
            "&:hover": {
              color: t.palette.mode === "dark" ? "#FF9500" : "#C2410C",
            },
          },
        }),
      })}
    />
  );

  return isArea ? (
    <Tooltip key={eid} title={`Borrowed from ${areaEmp!.store_name}`} arrow>
      {chip}
    </Tooltip>
  ) : chip;
})}
```

- [ ] **Step 5: Render AssignPopover at bottom of component**

Just before the closing `</TableContainer>` tag (line 253), add:

```tsx
<AssignPopover
  anchorEl={popover?.anchorEl ?? null}
  open={!!popover}
  onClose={() => setPopover(null)}
  stationId={popover?.stationId ?? ""}
  shift={popover?.shift ?? "Morning"}
  myStaff={popover ? getAvailable(popover.stationId, popover.shift) : []}
  areaStaff={popover ? getAvailableArea(popover.shift) : []}
  onAssign={(employeeId) => {
    if (popover) {
      dispatch(assignEmployee({
        stationId: popover.stationId,
        shift: popover.shift,
        employeeId,
      }));
    }
    setPopover(null);
  }}
/>
```

- [ ] **Step 6: Verify no type errors**

Run: `cd hackathon/frontend && npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 7: Manual verification**

Run: `cd hackathon/frontend && npm run dev`

Test in browser at `/deploy`:
1. Click "+ assign" on any cell → popover appears with My Staff names (no header) and Area Staff section (with header, `Name — Store Name` format)
2. Click a My Staff name → chip appears with initials, default styling, popover closes
3. Click "+ assign" again → click an Area Staff name → chip appears with initials, dashed border, warm orange color
4. Hover the area chip → tooltip shows "Borrowed from {store name}"
5. Delete an area chip → employee reappears in the popover
6. Verify readOnly mode (via `/history/:id`) still works — no "+ assign" buttons visible

- [ ] **Step 8: Commit**

```bash
git add hackathon/frontend/src/features/deployment/DeploymentGrid.tsx
git commit -m "feat: wire AssignPopover into grid with borrowed-staff chip styling"
```
