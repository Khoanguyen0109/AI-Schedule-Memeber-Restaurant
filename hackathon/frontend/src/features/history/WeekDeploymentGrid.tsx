import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Shift } from "../../services/types";

export interface WeekDayColumn {
  dateKey: string;
  headerPrimary: string;
  headerSecondary: string;
}

export type WeekCellContent =
  | { kind: "no_chart" }
  | { kind: "groups"; groups: { stationName: string; names: string }[] };

export interface WeekDeploymentGridProps {
  shiftOrder: Shift[];
  shiftLabels: Record<Shift, string>;
  columns: WeekDayColumn[];
  /** cells[shift][dayIndex] — aligns with `columns` order. */
  cells: Record<Shift, (WeekCellContent | null)[]>;
}

function renderCell(content: WeekCellContent | null | undefined) {
  if (content === null || content === undefined || content.kind === "no_chart") {
    return (
      <Typography variant="body2" color="text.secondary">
        No chart
      </Typography>
    );
  }
  if (content.groups.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No assignments
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      {content.groups.map((g, i) => (
        <Box key={`${g.stationName}-${i}`}>
          <Typography component="div" variant="body2" sx={{ fontWeight: 600 }}>
            {g.stationName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {g.names}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function WeekDeploymentGrid({
  shiftOrder,
  shiftLabels,
  columns,
  cells,
}: WeekDeploymentGridProps) {
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
            <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "text.secondary", minWidth: 120 }}>
              Shift
            </TableCell>
            {columns.map((col) => (
              <TableCell
                key={col.dateKey}
                sx={{ fontWeight: 600, fontSize: 11, color: "text.secondary", verticalAlign: "bottom" }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.25 }}>
                  <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
                    {col.headerPrimary}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {col.headerSecondary}
                  </Typography>
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {shiftOrder.map((shift) => (
            <TableRow key={shift} hover>
              <TableCell sx={{ verticalAlign: "top" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {shiftLabels[shift]}
                </Typography>
              </TableCell>
              {columns.map((col, dayIndex) => (
                <TableCell key={col.dateKey} sx={{ verticalAlign: "top" }}>
                  {renderCell(cells[shift]?.[dayIndex])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
