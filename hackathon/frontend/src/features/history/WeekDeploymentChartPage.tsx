import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAppSelector } from "../../app/hooks";
import { useListDeploymentsQuery } from "../../services/deploymentApi";
import { useListStationsQuery } from "../../services/storeApi";
import { useListCrewQuery } from "../../services/crewApi";
import type { AssignedCell, Shift } from "../../services/types";
import {
  formatLocalYMD,
  formatStationFallback,
  getMondayToSundayDates,
  pickLatestDeploymentPerDate,
} from "./weekDeploymentUtils";
import { SHIFTS, SHIFT_LABELS } from "../deployment/shiftConstants";
import WeekDeploymentGrid, { type WeekCellContent, type WeekDayColumn } from "./WeekDeploymentGrid";

function addDays(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + delta);
}

/** One group per `station_id` (first-seen station order); merges all cells for that station in the shift. */
function groupCellsByStation(cells: AssignedCell[]): AssignedCell[][] {
  const byId = new Map<string, AssignedCell[]>();
  const order: string[] = [];
  for (const cell of cells) {
    if (!byId.has(cell.station_id)) {
      order.push(cell.station_id);
      byId.set(cell.station_id, []);
    }
    byId.get(cell.station_id)!.push(cell);
  }
  return order.map((id) => byId.get(id)!);
}

function employeeDisplayName(id: string, employeeNameById: Map<string, string>): string {
  if (!id) return "Unknown";
  return employeeNameById.get(id) ?? "Unknown";
}

export default function WeekDeploymentChartPage() {
  const storeId = useAppSelector((s) => s.storeProfile.selectedStoreId);
  const [anchor, setAnchor] = useState(() => new Date());

  const { data: deployments } = useListDeploymentsQuery(
    { storeId: storeId ?? "" },
    { skip: !storeId }
  );
  const { data: stations } = useListStationsQuery();
  const { data: crew } = useListCrewQuery(storeId ?? "", { skip: !storeId });

  const weekDays = useMemo(() => getMondayToSundayDates(anchor), [anchor]);

  const weekStartLabel = useMemo(() => {
    const [y, m, d] = weekDays[0].split("-").map(Number);
    const [y2, m2, d2] = weekDays[6].split("-").map(Number);
    const a = new Date(y, m - 1, d);
    const b = new Date(y2, m2 - 1, d2);
    const fmt = (dt: Date) =>
      dt.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${fmt(a)} \u2013 ${fmt(b)}`;
  }, [weekDays]);

  const weekSet = useMemo(() => new Set(weekDays), [weekDays]);

  const inWeek = useMemo(() => {
    if (!storeId) return [];
    return (deployments ?? []).filter((d) => d.store_id === storeId && weekSet.has(d.date));
  }, [deployments, storeId, weekSet]);

  const byDate = useMemo(() => pickLatestDeploymentPerDate(inWeek), [inWeek]);

  const stationNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of stations ?? []) {
      m.set(s.station_id, s.station_name);
    }
    return m;
  }, [stations]);

  const employeeNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of crew ?? []) {
      m.set(e.employee_id, e.employee_name);
    }
    return m;
  }, [crew]);

  const columns = useMemo((): WeekDayColumn[] => {
    return weekDays.map((dateKey) => {
      const [y, mo, d] = dateKey.split("-").map(Number);
      const dt = new Date(y, mo - 1, d);
      return {
        dateKey,
        headerPrimary: dt.toLocaleDateString(undefined, { weekday: "short" }),
        headerSecondary: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
    });
  }, [weekDays]);

  const cells = useMemo((): Record<Shift, (WeekCellContent | null)[]> => {
    const matrix = {} as Record<Shift, (WeekCellContent | null)[]>;
    for (const shift of SHIFTS) {
      matrix[shift] = [];
    }

    for (let i = 0; i < 7; i++) {
      const dateKey = weekDays[i];
      const dep = byDate.get(dateKey);

      if (!dep) {
        for (const shift of SHIFTS) {
          matrix[shift].push({ kind: "no_chart" });
        }
        continue;
      }

      for (const shift of SHIFTS) {
        const forShift = dep.cells.filter((c) => c.shift === shift);
        if (forShift.length === 0) {
          matrix[shift].push({ kind: "groups", groups: [] });
          continue;
        }
        const stationGroups = groupCellsByStation(forShift);
        const groups = stationGroups.map((grp) => {
          const sid = grp[0].station_id;
          const stationName = stationNameById.get(sid) ?? formatStationFallback(sid);
          const ids = grp.flatMap((c) => c.assigned_employee_ids);
          const names = ids.map((id) => employeeDisplayName(id, employeeNameById)).join(", ");
          return { stationName, names };
        });
        matrix[shift].push({ kind: "groups", groups });
      }
    }

    return matrix;
  }, [weekDays, byDate, stationNameById, employeeNameById]);

  if (!storeId) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography color="text.secondary">Select a store from the header to view the week deployment chart.</Typography>
      </Box>
    );
  }

  const anchorYmd = formatLocalYMD(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()));

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            Week deployment chart
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {weekStartLabel}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <TextField
            type="date"
            label="Week of"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={anchorYmd}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const [y, mo, day] = v.split("-").map(Number);
              setAnchor(new Date(y, mo - 1, day));
            }}
          />
          <Button variant="outlined" size="small" onClick={() => setAnchor(addDays(anchor, -7))}>
            Previous week
          </Button>
          <Button variant="outlined" size="small" onClick={() => setAnchor(addDays(anchor, 7))}>
            Next week
          </Button>
        </Box>
      </Box>

      <WeekDeploymentGrid
        shiftOrder={SHIFTS}
        shiftLabels={SHIFT_LABELS}
        columns={columns}
        cells={cells}
      />
    </Box>
  );
}
