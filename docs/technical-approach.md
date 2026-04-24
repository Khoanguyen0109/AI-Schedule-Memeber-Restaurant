# Technical Approach

Architecture, AI usage, key technology decisions, and feasibility for the AI forecaster / deployment chart project.

## Overview

An **AI-assisted staffing and deployment forecasting** tool for store operations. Managers work with Excel-backed reference data, receive demand forecasts, and can follow an optimized shift scheduling workflow through a multi-screen UI (store profile, crew, AI suggestions, deployment grid, history, summary).

The live application code lives under `hackathon/` (Python package `ai-forecaster` and the React frontend).

---

## Architecture

### Backend

| Area | Choice |
|------|--------|
| Runtime | Python 3.11 |
| HTTP | FastAPI + Uvicorn |
| Schemas | Pydantic v2 |
| CLI | Typer + Rich (`ai-forecast`, `ai-shifts`) |
| Data at startup | Excel bundle from `examples/` (path configurable, e.g. `AI_FORECASTER_EXAMPLES_DIR` in Docker) |
| Mutable state | In-memory deployment store (no SQL in repo; documented swap path for Postgres/Redis) |
| CORS | Open for development |

Routers cover health/info, stations/tasks/stores, crew CRUD, context, staffing forecast, crew assignment, chat, and deployments (including summary and comparison).

### Frontend

| Area | Choice |
|------|--------|
| Build | Vite 8, TypeScript, ES modules |
| UI | MUI 9 + Emotion, theme + light/dark |
| Routing | react-router-dom 7 |
| Global state | Redux Toolkit |
| Server state | RTK Query (`createApi`, feature-injected endpoints) |
| Interaction | @dnd-kit for sortable / grid drag-and-drop |
| Dates | dayjs |
| Dev proxy | `/api` and `/health` → backend (e.g. `localhost:8000`) |

### Infrastructure

- **Dockerfile** (`hackathon/Dockerfile`): slim Python image, installs `requirements.txt` and editable package, exposes port 8000, `ai-forecast serve` with `PORT` for PaaS.
- **docker-compose** (`hackathon/docker-compose.yml`): API service + optional dev shell, Hugging Face cache volume.
- **No database or CI** in-repo for the hackathon scope.

---

## AI and ML Usage

| Layer | Technology | Role |
|-------|------------|------|
| Demand forecasting | **Amazon Chronos** (`chronos-forecasting`, default `amazon/chronos-t5-small`) | Zero-shot probabilistic time-series from Excel and derived series |
| Event pipeline | Custom Python (`event_pipeline.py`) | Event logs + rules → per-(store, channel) **demand index** series for forecasting |
| Shift optimization | **Google OR-Tools CP-SAT** (`scheduler.py`, `scheduling_pipeline.py`) | Constraint-based rostering from demand signals |
| API staffing grid | **`reasoning.py`** | Rule-based / mock grid; optional blend with Chronos when not in `demo_mode` |
| Chat & crew assignment | **Ollama** (HTTP, `httpx`) | Optional LLM narrative and assignment suggestions; heuristics fallback if unavailable |

**Separation:** Chronos + OR-Tools handle numeric forecasting and optimization. Ollama is optional and orthogonal for natural-language and assignment UX.

---

## Key Technology Decisions

1. **Zero-shot Chronos** — No custom training; works from tabular/historical inputs suitable for varied store data and hackathon timelines.
2. **OR-Tools for scheduling** — Hard constraints and objectives fit CP-SAT better than an LLM for roster quality and determinism.
3. **Optional Ollama** — Chat and crew assignment can run without GPU or large downloads; core flows remain usable.
4. **`demo_mode`** — API and reasoning can serve deterministic/mock behavior so demos and tests do not require model weights.
5. **In-memory deployments** — Fast iteration; production path is documented as external persistence.
6. **Excel as primary data shape** — Matches common ops workflows and the existing `data_loader` / forecaster pipeline.

---

## Feasibility

| Concern | Mitigation |
|---------|------------|
| Hardware | Chronos small + OR-Tools run on CPU; code paths prefer CUDA → MPS → CPU where applicable. |
| Cold start / weights | Tests use mock models; `demo_mode` avoids downloads for API demos. |
| Deployment | Single container for API + bundled examples; frontend is Vite dev or static build behind same origin or proxy. |
| Reliability of “AI” UX | LLM features have non-LLM fallbacks; forecasting path is testable without Ollama. |

---

## Entry Points

| Role | Location |
|------|----------|
| Python package | `hackathon/src/ai_forecaster/` |
| CLI | `ai_forecaster/cli.py` |
| FastAPI app | `ai_forecaster/api/app.py` → `create_app()` |
| Frontend | `hackathon/frontend/src/main.tsx` → `App.tsx` |
| Authoritative setup / API map | `hackathon/README.md` |

---

*Document generated to capture architecture and feasibility for stakeholders and onboarding. Adjust paths if the repo layout changes.*
