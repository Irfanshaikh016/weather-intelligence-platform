# Weather Analytics & Intelligence Platform

> Enterprise-grade meteorological intelligence, automated time-series observation tracking, machine learning next-hour predictive engine, and high-frequency analytical engine built for Vercel, Supabase PostgreSQL, and Next.js.

[![Next.js](https://img.shields.io/badge/Next.js-15%2B%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Dark--First-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e?logo=supabase)](https://supabase.com/)
[![Vercel Cron](https://img.shields.io/badge/Vercel-Cron%20Automated-white?logo=vercel)](https://vercel.com/)
[![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo%20API-orange)](https://open-meteo.com/)
[![Machine Learning](https://img.shields.io/badge/ML-scikit--learn-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Overview

The **Weather Analytics & Intelligence Platform** is a full-stack meteorological intelligence system combining real-time atmospheric observation, automated cron-driven data collection, deep historical analytics, and an integrated **Machine Learning next-hour predictive pipeline**.

The platform is designed exclusively for the **Vercel serverless ecosystem and Supabase PostgreSQL**, eliminating the need for standalone backend servers or containerized inference clusters while maintaining sub-millisecond prediction latency.

### Core Capabilities:
- **Live Meteorological Telemetry**: Real-time atmospheric conditions mapped to international WMO standards.
- **Next-Hour ML Predictions**: Empirical machine learning models forecasting temperature ($T+1\text{h}$) and precipitation probability without future data leakage.
- **Empirical Model Performance Tracking**: Real-time ground truth verification comparing predictions against actual recorded outcomes over time (MAE, RMSE, $R^2$).
- **Dual-Mode Atmospheric Dynamics**: Toggle between historical observations and **Next 24-Hour Forecasts** across Precipitation, Humidity, Conditions, and Wind.
- **Automated Observation Ingestion**: Serverless scheduled collection via Vercel Cron with idempotent conflict resolution.
- **Immutable Time-Series Storage**: Relational tables in Supabase with composite indexes and Row Level Security (RLS).
- **Interactive Visualizations**: High-density responsive charts powered by Recharts with custom tooltips, gradients, and dark-mode styling.

---

## 2. System Architecture

```
                          VERCEL SERVERLESS PLATFORM
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   Next.js App Router (UI)     /api/predictions          Vercel Cron
   - Current Weather           (Sub-ms Serverless        (Scheduled Telemetry)
   - Next-Hour ML Card          ML Inference Engine)            │
   - Predicted vs Actual Chart        │                         │
   - Atmospheric Dynamics             │                         ▼
   - 24H / 7D / 30D History           │                 /api/cron/weather
            │                         │                         │
            ▼                         │                         ▼
   /api/weather & /api/history        │                Open-Meteo API
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                           SUPABASE POSTGRESQL (RLS)
                  ┌────────────────────────────────────────┐
                  │ - locations                            │
                  │ - weather_observations (Time-series)   │
                  │ - ml_model_versions (Model Registry)   │
                  │ - weather_predictions (Prediction Log) │
                  │ - daily_weather_summary                │
                  └────────────────────────────────────────┘
                                      ▲
                                      │  (Offline Training & Calibration)
                         ┌────────────┴────────────┐
                         │  Python ML Pipeline     │
                         │  - feature_engineering  │
                         │  - train_temperature.py │
                         │  - train_rain.py        │
                         │  - model evaluation     │
                         └─────────────────────────┘
```

> **Architectural Constraint & Security**: The browser never writes directly to Supabase. Observation collection and model version registration execute exclusively via authenticated server-side Route Handlers. Training is decoupled from inference: models are trained offline using Python, then exported to optimized mathematical parameters for zero-latency serverless execution on Vercel .

---

## 3. Machine Learning Prediction Module

### 3.1 Objectives
- **Primary Target**: Next-hour temperature ($T + 1\text{ hour}$).
- **Secondary Target**: Next-hour rain probability ($T + 1\text{ hour}$).

### 3.2 Training Data & Testing Data Specifications

The machine learning models are trained and evaluated using genuine, high-resolution hourly meteorological telemetry:

| Dataset Partition | Proportion | Observations | Temporal Order | Primary Purpose |
| :--- | :---: | :---: | :--- | :--- |
| **Training Data (`X_train`, `y_train`)** | **70%** | **1,521** | Earliest 70% of chronological intervals | Fitting model coefficients, decision trees, feature scalers (mean, std), and baseline weights |
| **Validation Data (`X_val`, `y_val`)** | **15%** | **326** | Intermediate 15% interval block | Hyperparameter tuning (tree depth, regularization), threshold calibration, and lag order verification |
| **Testing Data (`X_test`, `y_test`)** | **15%** | **326** | Most recent 15% hold-out intervals | Strict, unbiased out-of-sample evaluation against ground truth; benchmark reporting (MAE, RMSE, $R^2$, F1) |
| **Total Ingested Telemetry** | **100%** | **2,173** | Continuous 1-Hour Resolution | Cached at `ml/data/weather_dataset.csv` |

#### Data Provenance & Integrity Guidelines:
- **Telemetry Source**: Open-Meteo High-Resolution Historical Archive & Reanalysis API (`past_days=90`).
- **Observed Meteorological Variables**: 2m Temperature (°C), Apparent Feels-Like Temperature (°C), Relative Humidity (%), Surface Atmospheric Pressure (hPa), 10m Wind Speed (km/h), Wind Direction (°), Precipitation Volume (mm), Cloud Cover (%), Visibility (km), Solar UV Index, WMO Weather Code, Day/Night Indicator.
- **Zero Future-Data Leakage**: Standard random train/test splits severely contaminate time-series weather models by interpolating between known future points. Our pipeline employs **strict chronological splitting** (`chronological_split()`), ensuring the testing dataset occurs strictly after the training and validation horizons.
- **Quality Control**: Sensor gap detection with forward-fill (`ffill`) and backward-fill (`bfill`) imputation, validating a minimum dataset threshold of $\ge 500$ verified records (enforcing 2,173 real observations).

### 3.3 Feature Engineering (32 Time-Series Features)
Features are constructed strictly using observations up to time $T$ (zero data leakage):
- **Atmospheric State (11 features)**: Temperature, feels like, relative humidity, pressure, wind velocity, wind direction, precipitation, cloud cover, visibility, UV index, weather code.
- **Time & Cyclical Encodings (7 features)**: Hour of day, day of week, day of year, month, is_day, `hour_sin`, `hour_cos`.
- **Historical Lags (8 features)**: $T-1\text{h}$, $T-2\text{h}$, $T-3\text{h}$, $T-6\text{h}$ for temperature, humidity, wind, and precipitation.
- **Rolling Windows (6 features)**: 3-hour, 6-hour, and 12-hour rolling averages and cumulative precipitation sums.

### 3.4 Model Benchmarking on Unseen Testing Data (326 Hold-out Samples)

#### Next-Hour Temperature Regressors ($T + 1\text{h}$)
Evaluated on the 326 hold-out testing observations:
| Model Candidate | Test MAE | Test RMSE | Test $R^2$ | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Persistence Baseline** ($y_{T+1} = y_T$) | 0.6917°C | 0.9692°C | 0.8482 | Benchmark Baseline |
| **Linear Regression** | **0.5696°C** | **0.7804°C** | **0.9016** | **Selected Best Model (17.6% error reduction)** |
| **Random Forest Regressor** | 0.6071°C | 0.9884°C | 0.8422 | Evaluated Candidate |

#### Next-Hour Rain Probability Classifiers ($T + 1\text{h}$)
Evaluated on the 326 hold-out testing observations:
| Model Candidate | Test Accuracy | Precision | Recall | Test F1 Score |
| :--- | :---: | :---: | :---: | :---: |
| **Persistence Baseline** | 0.8708 | 0.7375 | 0.7375 | **0.7375** |
| **Logistic Regression** | 0.7262 | 0.4710 | 0.9125 | 0.6213 |
| **Random Forest Classifier** | 0.8000 | 0.6744 | 0.3625 | 0.4715 |

### 3.5 Top Predictive Contributors
Feature importance calculated on training data and verified on testing telemetry:
1. Baseline Temperature (67.6%)
2. Solar UV Index (17.2%)
3. Apparent Temperature (2.9%)
4. 6-Hour Temperature Lag (2.2%)
5. Cyclical Solar Hour Vector (1.9%)

---

## 4. Interactive Atmospheric Dynamics (Next 24H Mode)

Each atmospheric chart supports instant toggling between **Recorded Telemetry** and **Next 24-Hour Forecasts**:

| Dynamic Chart | Past Observation View | Next 24-Hour Forecast View |
|---|---|---|
| **Precipitation Volume** | Cumulative rainfall history across 24h / 7d / 30d | Hourly projected rainfall volume (mm) + rain probability (%) |
| **Relative Humidity Trend** | Recorded humidity levels & saturation statistics | Continuous 24h forecast humidity curve & average saturation |
| **Weather Condition Distribution** | Historical frequency breakdown of recorded conditions | Synthesized 24-hour condition breakdown (e.g. 14h Clear, 10h Clouds) |
| **Wind Dynamics & Velocity** | Historical wind speed & recorded cardinal vectors | Projected 24h velocity curve, peak gust, and wind directions |
| **Temperature Trends** | Recorded temperatures vs feels-like history | Next 24-hour hourly temperature curve with feels-like projections |

---

## 5. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15+ (App Router) | Serverless SSR, Route Handlers, Turbopack bundling |
| **Language** | TypeScript (Strict) | End-to-end type safety for meteorological & ML data structures |
| **Styling** | Tailwind CSS | Dark-first responsive design system |
| **Data Visualization** | Recharts | Responsive SVG charts with custom tooltips and gradients |
| **Icons** | Lucide React | Semantic, lightweight iconography |
| **Database** | Supabase PostgreSQL | Time-series tables, composite indexes, Row Level Security |
| **Automation** | Vercel Cron | Serverless scheduled telemetry collection |
| **Machine Learning** | Python 3 + scikit-learn | Time-series feature engineering, model training, cross-validation |
| **Weather Feed** | Open-Meteo API | Standardized WMO meteorological models without client lock-in |

---

## 6. Database Schema & Migrations

Execute the migrations in order in your Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql` (Locations, Observations, Summaries)
2. `supabase/migrations/002_ml_predictions_schema.sql` (Model Registry, Predictions)

### Core Tables:
- `locations`: Monitored geographic stations (Pune, Mumbai, Delhi, Bengaluru, London, New York, Tokyo, Paris, Dubai, Singapore, Sydney, San Francisco).
- `weather_observations`: Immutable time-series weather records with unique constraint on `(location_id, recorded_at)`.
- `ml_model_versions`: Registry tracking versioned ML models, active flags, and test metrics (MAE, RMSE, $R^2$, F1).
- `weather_predictions`: Historical predictions with target timestamps, predictions, and ground-truth verification errors.

---

## 7. Environment Variables

Create `.env.local` using `.env.example` as a template:

```ini
# Supabase Public Configuration (Accessible in browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Private Configuration (SERVER-SIDE ONLY - Never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vercel Cron Authentication Secret
CRON_SECRET=your_32_character_random_cron_secret
```

---

## 8. Local Development & ML Workflow

### 8.1 Web Platform Installation

```bash
# 1. Install dependencies
npm install

# 2. Run unit and analytics verification tests
npm run test:analytics

# 3. Run Route Handler integration tests (Weather, History, Cron, Predictions)
npm run test:routes

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` to interact with the platform.

### 8.2 Machine Learning Pipeline (Python)

```bash
# 1. Fetch & inspect the continuous hourly dataset (2,173 observations)
python -c "from ml.utils.dataset import load_or_fetch_dataset; df = load_or_fetch_dataset(); print('Ingested observations:', len(df))"

# 2. Train Next-Hour Temperature Model on Training Data (70%) & evaluate on Testing Data (15%)
python ml/training/train_temperature.py

# 3. Train Next-Hour Rain Probability Model on Training Data (70%) & evaluate on Testing Data (15%)
python ml/training/train_rain.py

# 4. Run Independent Evaluation & Residual Verification on Hold-Out Testing Data
python ml/evaluation/evaluate_temperature.py
python ml/evaluation/evaluate_rain.py
```

---

## 9. API Reference

| Endpoint | Method | Parameters | Description |
|---|---|---|---|
| `/api/weather` | `GET` | `lat`, `lon` | Returns normalized current conditions, hourly strip, and 7-day outlook |
| `/api/history` | `GET` | `locationId`, `range` (`24h`\|`7d`\|`30d`) | Historical observations with computed analytics & trends |
| `/api/predictions` | `GET` | `locationId`, `lat`, `lon` | Live ML next-hour prediction, active model metadata, and verification audit |
| `/api/locations` | `GET` | `search` | Curated monitored stations or live geocoding search |
| `/api/cron/weather` | `GET` | `Authorization: Bearer <CRON_SECRET>` | Authenticated cron ingestion endpoint collecting weather for active locations |

---

## 10. Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete weather intelligence platform"
   git push origin main
   ```
2. **Deploy on Vercel**:
   - Import repository in Vercel.
   - Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`).
3. **Cron Jobs**:
   - `vercel.json` is preconfigured for automatic collection:
     ```json
     {
       "crons": [
         {
           "path": "/api/cron/weather",
           "schedule": "0 0 * * *"
         }
       ]
     }
     ```
     *(Adjust schedule to `*/5 * * * *` if using Vercel Pro)*.

---

## 11. License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 **Irfan Shaikh**.
