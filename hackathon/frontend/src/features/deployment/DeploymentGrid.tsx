import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { useAppDispatch } from "../../app/hooks";
import { assignEmployee, unassignEmployee } from "./deploymentSlice";
import AssignPopover from "./AssignPopover";
import { AREA_STAFF } from "./areaStaffData";
import { SHIFTS, SHIFT_LABELS } from "./shiftConstants";
import type { AssignedCell, StaffingCell, Employee, AreaEmployee, Shift } from "../../services/types";

function rushForShift(staffingCells: StaffingCell[], shift: Shift) {
  const sample = staffingCells.find((c) => c.shift === shift && c.rush_hour?.is_rush);
  return sample?.rush_hour;
}

interface DeploymentGridProps {
  cells: AssignedCell[];
  staffingCells: StaffingCell[];
  crew: Employee[];
  readOnly?: boolean;
}

export default function DeploymentGrid({ cells, staffingCells, crew, readOnly }: DeploymentGridProps) {
  const dispatch = useAppDispatch();
  const empMap = new Map(crew.map((e) => [e.employee_id, e]));
  const stationIds = [...new Set(cells.map((c) => c.station_id))];
  const cellMap = new Map(cells.map((c) => [`${c.station_id}-${c.shift}`, c]));
  const staffMap = new Map(staffingCells.map((c) => [`${c.station_id}-${c.shift}`, c]));

  const [popover, setPopover] = useState<{
    anchorEl: HTMLElement;
    stationId: string;
    shift: Shift;
  } | null>(null);

  const areaEmpMap = new Map<string, AreaEmployee>(
    AREA_STAFF.map((e) => [e.employee_id, e])
  );

  const getAvailable = (_stationId: string, shift: Shift): Employee[] => {
    const assigned = new Set(cells.flatMap((c) => c.shift === shift ? c.assigned_employee_ids : []));
    return crew.filter(
      (e) => !assigned.has(e.employee_id) && e.available_shifts.includes(shift)
    );
  };

  const getAvailableArea = (shift: Shift): AreaEmployee[] => {
    const assigned = new Set(
      cells.flatMap((c) => (c.shift === shift ? c.assigned_employee_ids : []))
    );
    return AREA_STAFF.filter(
      (e) => !assigned.has(e.employee_id) && e.available_shifts.includes(shift)
    );
  };

  return (
    <TableContainer
      sx={(t) => ({
        borderRadius: "16px",
        border: 1,
        borderColor: "divider",
        bgcolor: t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#fff",
      })}
    >
      <Table size="small" sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "text.secondary", minWidth: 120 }}>Station</TableCell>
                {SHIFTS.map((sh) => {
                  const rush = rushForShift(staffingCells, sh);
                  return (
                    <TableCell
                      key={sh}
                      sx={(t) => ({
                        fontWeight: 600,
                        fontSize: 11,
                        color: "text.secondary",
                        ...(rush && {
                          background: t.palette.mode === "dark"
                            ? "rgba(255,149,0,0.06)"
                            : "linear-gradient(180deg, #FFF7ED 0%, transparent 100%)",
                          borderTop: `2px solid ${t.palette.mode === "dark" ? "#FFB340" : "#FB923C"}`,
                        }),
                      })}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {SHIFT_LABELS[sh]}
                        {rush && (
                          <Tooltip title={`${rush.label} (${rush.window})`} arrow>
                            <Chip
                              label={`🔥 ${rush.label}`}
                              size="small"
                              sx={(t) => ({
                                ml: 0.75,
                                height: 20,
                                fontSize: 9,
                                fontWeight: 700,
                                color: t.palette.mode === "dark" ? "#FFB340" : "#C2410C",
                                bgcolor: t.palette.mode === "dark" ? "rgba(255,149,0,0.1)" : "#FFF7ED",
                                border: `1px solid ${t.palette.mode === "dark" ? "rgba(255,149,0,0.2)" : "#FDBA74"}`,
                                borderRadius: "10px",
                              })}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {stationIds.map((sid) => {
                const stName = staffingCells.find((c) => c.station_id === sid)?.station_name ?? sid;
                return (
                  <TableRow key={sid} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{stName}</Typography>
                    </TableCell>
                    {SHIFTS.map((sh) => {
                      const cell = cellMap.get(`${sid}-${sh}`);
                      if (!cell) return <TableCell key={sh} />;
                      const diff = cell.assigned_employee_ids.length - cell.ai_recommended;
                      const available = getAvailable(sid, sh);
                      const scell = staffMap.get(`${sid}-${sh}`);
                      const isRush = scell?.rush_hour?.is_rush ?? false;

                      return (
                        <TableCell
                          key={sh}
                          sx={{ verticalAlign: "top" }}
                        >
                          <Box
                            sx={(t) => {
                              const isDark = t.palette.mode === "dark";
                              return {
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                p: "4px 8px",
                                borderRadius: "8px",
                                bgcolor: isRush
                                  ? (isDark ? "rgba(255,149,0,0.1)" : "#FFF7ED")
                                  : (isDark ? "rgba(62,145,255,0.1)" : "#EDF4FF"),
                                border: `1px solid ${
                                  isRush
                                    ? (isDark ? "rgba(255,149,0,0.2)" : "#FDBA74")
                                    : (isDark ? "rgba(62,145,255,0.2)" : "#B8D4F8")
                                }`,
                              };
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={(t) => ({
                                fontWeight: 700,
                                fontSize: 13,
                                minWidth: 14,
                                color: isRush
                                  ? (t.palette.mode === "dark" ? "#FFB340" : "#C2410C")
                                  : "primary.main",
                              })}
                            >
                              {cell.ai_recommended}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={(t) => ({
                                color: isRush
                                  ? (t.palette.mode === "dark" ? "#E89440" : "#EA580C")
                                  : "primary.main",
                                fontWeight: 500,
                                fontSize: 10,
                              })}
                            >
                              AI rec
                            </Typography>
                            {isRush && scell?.rush_hour && (
                              <Chip
                                label={`+${scell.rush_hour.staff_uplift} staff`}
                                size="small"
                                sx={(t) => ({
                                  height: 16,
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: t.palette.mode === "dark" ? "#FFB340" : "#C2410C",
                                  bgcolor: t.palette.mode === "dark" ? "rgba(255,149,0,0.12)" : "#FFEDD5",
                                  border: `1px solid ${t.palette.mode === "dark" ? "rgba(255,149,0,0.2)" : "#FDBA74"}`,
                                  ml: "auto",
                                  borderRadius: "6px",
                                  "& .MuiChip-label": { px: 0.5 },
                                })}
                              />
                            )}
                            {diff === 0 && cell.assigned_employee_ids.length > 0 && (
                              <Tooltip title="Staffing met" arrow>
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main", ml: "auto", flexShrink: 0 }} />
                              </Tooltip>
                            )}
                            {diff < 0 && (
                              <Tooltip title={`${Math.abs(diff)} short`} arrow>
                                <Typography sx={{ ml: "auto", fontSize: 9, fontWeight: 700, color: "warning.main", flexShrink: 0 }}>
                                  {Math.abs(diff)} short
                                </Typography>
                              </Tooltip>
                            )}
                            {diff > 0 && (
                              <Tooltip title={`${diff} over`} arrow>
                                <Typography sx={{ ml: "auto", fontSize: 9, fontWeight: 700, color: "warning.main", flexShrink: 0 }}>
                                  +{diff}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
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
                            {!readOnly && (available.length > 0 || getAvailableArea(sh).length > 0) && (
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                  minWidth: 0,
                                  px: 1,
                                  py: 0.125,
                                  fontSize: 10,
                                  borderStyle: "dashed",
                                  borderRadius: "8px",
                                  lineHeight: 1.2,
                                }}
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  setPopover({ anchorEl: e.currentTarget, stationId: sid, shift: sh });
                                }}
                              >
                                + assign
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
    </TableContainer>
  );
}
