import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { initCells, setSavedDeploymentId } from "./deploymentSlice";
import { useListCrewQuery } from "../../services/crewApi";
import { useCreateDeploymentMutation } from "../../services/deploymentApi";
import DeploymentGrid from "./DeploymentGrid";
import CrewPool from "./CrewPool";
import ChatPanel from "../chat/ChatPanel";
import { useFlowNavOverride } from "../../components/FlowNavContext";
import FactorBadge from "../suggestion/FactorBadge";

const SIDEBAR_WIDTH = 380;

export default function DeploymentPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const storeId = useAppSelector((s) => s.storeProfile.selectedStoreId);
  const staffing = useAppSelector((s) => s.suggestion.staffing);
  const cells = useAppSelector((s) => s.deployment.cells);
  const { data: crew } = useListCrewQuery(storeId ?? "", { skip: !storeId });
  const [createDeploy, { isLoading: saving }] = useCreateDeploymentMutation();
  const [toast, setToast] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { setOverride, clearOverride } = useFlowNavOverride();

  useEffect(() => {
    if (staffing && cells.length === 0) {
      dispatch(
        initCells(
          staffing.cells.map((c) => ({
            station_id: c.station_id,
            shift: c.shift,
            ai_recommended: c.ai_recommended,
            assigned_employee_ids: [],
          }))
        )
      );
    }
  }, [staffing, cells.length, dispatch]);

  const handleSave = useCallback(async () => {
    if (!storeId || !staffing) return;
    try {
      const result = await createDeploy({
        store_id: storeId,
        date: staffing.date,
        cells,
        source_staffing_model: staffing.model_used,
      }).unwrap();
      dispatch(setSavedDeploymentId(result.deployment_id));
      setToast(true);
      setTimeout(() => navigate("/history"), 800);
    } catch {
      /* handled by RTK Query error */
    }
  }, [storeId, staffing, cells, createDeploy, dispatch, navigate]);

  useEffect(() => {
    setOverride({
      nextLabel: "Save deployment chart",
      nextVariant: "success",
      nextDisabled: saving,
      onNext: handleSave,
    });
    return () => clearOverride();
  }, [saving, handleSave, setOverride, clearOverride]);

  if (!staffing) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography color="text.secondary">No AI suggestion generated yet. Go back to generate one.</Typography>
      </Box>
    );
  }

  const totalRec = cells.reduce((s, c) => s + c.ai_recommended, 0);
  const totalAssigned = cells.reduce((s, c) => s + c.assigned_employee_ids.length, 0);
  const uniqueCrew = new Set(cells.flatMap((c) => c.assigned_employee_ids)).size;
  const gaps = totalRec - totalAssigned;

  return (
    <Box sx={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
      {/* ─── Main area ─── */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              Deployment chart
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {staffing.day_of_week} {staffing.date}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <StatPill label="Assigned" value={`${totalAssigned}/${totalRec}`} color="primary.main" />
            <StatPill label="Crew" value={uniqueCrew} color="text.primary" />
            {gaps > 0 && <StatPill label="Gaps" value={gaps} color="warning.main" />}
            {!sidebarOpen && (
              <Tooltip title="Open sidebar" arrow>
                <IconButton
                  size="small"
                  onClick={() => setSidebarOpen(true)}
                  sx={(t) => ({
                    width: 36,
                    height: 36,
                    borderRadius: "12px",
                    bgcolor: t.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                  })}
                >
                  <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Context factors — compact pills */}
        <Box sx={{ display: "flex", gap: 0.75, mb: 1.5, flexWrap: "wrap" }}>
          {staffing.context.factors.map((f, i) => (
            <FactorBadge key={i} factor={f} compact />
          ))}
        </Box>

        {/* Deployment grid */}
        <Box sx={{ pb: 2 }}>
          <DeploymentGrid cells={cells} staffingCells={staffing.cells} crew={crew ?? []} />
        </Box>
      </Box>

      {/* ─── Sidebar ─── */}
      <Box
        sx={{
          width: sidebarOpen ? SIDEBAR_WIDTH : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 80,
          alignSelf: "flex-start",
        }}
      >
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            height: "calc(100vh - 80px)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pl: 2,
          }}
        >
          {/* Sidebar header with collapse */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ color: "primary.main" }}>◆</Box> AI + Crew
            </Typography>
            <Tooltip title="Collapse sidebar" arrow>
              <IconButton size="small" onClick={() => setSidebarOpen(false)} sx={{ width: 28, height: 28 }}>
                <KeyboardDoubleArrowRightIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Crew pool */}
          <Box sx={{ flexShrink: 0 }}>
            <CrewPool crew={crew ?? []} cells={cells} />
          </Box>

          {/* AI Chat — fills remaining space */}
          <Box sx={{ flex: 1, minHeight: 300, overflow: "hidden" }}>
            <ChatPanel fill />
          </Box>
        </Box>
      </Box>

      <Snackbar open={toast} autoHideDuration={3000} onClose={() => setToast(false)}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: "20px" }}>Deployment chart saved!</Alert>
      </Snackbar>
    </Box>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Box
      sx={(t) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: "12px",
        bgcolor: t.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        border: 1,
        borderColor: "divider",
      })}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: 11 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color, fontSize: 13 }}>
        {value}
      </Typography>
    </Box>
  );
}

