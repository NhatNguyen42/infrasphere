# InfraSphere

A full-stack infrastructure investment analytics platform built as a portfolio project. InfraSphere provides real-time risk analytics, yield forecasting, scenario modelling, and securities screening across a global infrastructure asset portfolio — all visualised through an interactive 3D globe and rich data dashboards.

**Live demo:** [infrasphere-one.vercel.app](https://infrasphere-one.vercel.app)

---

## Features

### Dashboard
- Interactive 3D globe (React Three Fiber + Three.js) with NASA Blue Marble texture
- Asset markers clustered by region, filterable by sector and risk tier
- Live portfolio KPIs: AUM, weighted yield, avg ESG score, active positions
- Animated bento-grid layout with glassmorphism cards

### Securities
- Full securities table with sortable columns and search
- Per-security sparklines for 12-month yield history (Recharts)
- Risk rating badges, sector tags, and geographic exposure

### Forecasts
- 24-month yield forecast with confidence-interval bands
- Volatility, Sharpe ratio, and drawdown analytics
- Sector comparison chart and correlation heatmap
- Powered by SciPy curve fitting on the backend

### Scenarios
- What-if scenario builder with four adjustable macro parameters:
  - Interest Rate Delta, Inflation Rate, GDP Growth, Risk Premium
- Real-time portfolio impact simulation via FastAPI
- Animated results showing yield delta, risk score, and affected positions
- PDF report export (fpdf2)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4.1, Framer Motion 12 |
| 3D / visualisation | React Three Fiber 9, Three.js, Recharts 2 |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| Analytics | Pandas 2, NumPy, SciPy |
| Report generation | fpdf2 |
| Frontend deployment | Vercel |
| Backend deployment | Railway |

---

## Project Structure

```
infrasphere/
├── frontend/                  # Next.js application
│   └── src/app/
│       ├── page.tsx           # Dashboard + 3D globe
│       ├── securities/        # Securities browser
│       ├── forecasts/         # Yield forecasting
│       └── scenarios/         # Scenario modelling
└── backend/                   # FastAPI application
    └── app/
        ├── main.py
        ├── routes/            # API route handlers
        │   ├── infrastructure.py
        │   ├── securities.py
        │   ├── forecasts.py
        │   └── scenarios.py
        └── services/          # Business logic
            ├── analytics.py
            ├── forecast.py
            ├── scenario.py
            ├── insights.py
            └── report.py
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- Python ≥ 3.11

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/infrastructure` | Full asset list with metadata |
| GET | `/api/securities` | Securities with yield history |
| GET | `/api/forecasts` | 24-month forecast + confidence bands |
| POST | `/api/scenarios/run` | Run a what-if scenario |
| POST | `/api/scenarios/report` | Generate PDF report |

---

## Screenshots

| Dashboard | Scenarios |
|---|---|
| 3D globe with asset markers | Macro parameter sliders with live results |
