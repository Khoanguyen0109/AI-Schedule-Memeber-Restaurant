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
                primary={
                  <Typography component="span" sx={{ fontSize: 13, fontWeight: 500 }}>
                    {emp.employee_name}
                  </Typography>
                }
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
                  <Typography component="span" sx={{ fontSize: 13, fontWeight: 500 }}>
                    {emp.employee_name}
                    <Typography
                      component="span"
                      sx={{ color: "text.secondary", fontSize: 12, ml: 0.5, fontWeight: 500 }}
                    >
                      — {emp.store_name}
                    </Typography>
                  </Typography>
                }
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
