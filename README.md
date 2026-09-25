# Weather Analytics & Intelligence Platform

> Enterprise-grade meteorological intelligence, automated time-series observation tracking, and high-frequency analytical engine built for Vercel and Supabase PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-15%2B%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Dark--First-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e?logo=supabase)](https://supabase.com/)
[![Vercel Cron](https://img.shields.io/badge/Vercel-Cron%20Automated-white?logo=vercel)](https://vercel.com/)
[![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo%20API-orange)](https://open-meteo.com/)

---

## 1. Overview

The **Weather Analytics & Intelligence Platform** is not just a weather dashboard—it is an automated atmospheric monitoring and intelligence system designed specifically for the Vercel serverless platform and Supabase PostgreSQL.

The application combines:
- Real-time live meteorological telemetry normalized across WMO standards.
- High-frequency automated data collection using **Vercel Cron** running every 5 minutes.
- Immutable time-series database tracking in Supabase with duplicate-prevention constraints.
- Aggregated server-side historical analytics over **24-Hour**, **7-Day**, and **30-Day** intervals.
- Interactive data visualizations powered by Recharts (Temperature history, Relative humidity, Precipitation accumulation, Wind dynamics, and Condition frequency distribution).
- Global geocoding search and user-directed browser geolocation.
- Resilient multi-state dashboard with 5-minute non-blocking auto-refresh.

---

## 2. Key Features

- **Current Weather Intelligence**: Temperature, Apparent feel, WMO weather condition, Humidity, Barometric pressure, Wind vector, Visibility, UV Index, Cloud cover, and Today's High/Low bounds.
- **24-Hour Forecast Strip**: Horizontally scrollable next 24-hour hourly outlook with precipitation probabilities and wind speeds.
- **7-Day Atmospheric Outlook**: Min/Max daily temperature range bars, rain probability, sunrise/sunset, and condition icons.
- **Solar Ephemeris**: Dedicated sunrise and sunset tracking with calculated day length in hours and minutes.
- **Automated Historical Ingestion**: Vercel Cron scheduled endpoint (`/api/cron/weather`) collecting observations every 5 minutes for all active locations with idempotent conflict resolution.
- **Deep Historical Analytics**:
  - Average, Maximum, and Minimum Temperature
  - Mean, Peak, and Minimum Humidity
  - Cumulative Precipitation volume (mm)
  - Mean and Peak Wind velocities (km/h)
  - Categorical Weather Condition Distribution breakdown
  - Derived comparative trends against preceding cycles
- **Location Management**:
  - Fast search with Open-Meteo Geocoding API
  - Coordinates-based weather retrieval (Never matches by city name string)
  - Explicit-permission browser geolocation
  - Persistence of monitored locations in Supabase
- **Live Status Telemetry**:
  - `LIVE`: Connected and synced (with green pulse indicator)
  - `UPDATING`: Background delta refresh in progress
  - `STALE`: Data older than 10 minutes flagged
  - `ERROR`: Safe error handling preserving last valid telemetry

---

## 3. System Architecture

```
                          Vercel Edge & Serverless
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
        Next.js App Router (UI)                  Vercel Cron Trigger
                 │                                (Every 5 minutes)
                 │                                       │
                 ↓                                       ↓
        /api/weather                             /api/cron/weather
        /api/history                                     │
        /api/locations                            (Authorized via
                 │                                 CRON_SECRET)
                 │                                       │
                 │                                       ↓
                 │                             Open-Meteo Weather API
                 │                                       │
                 │                                (Normalized via
                 │                                 transform.ts)
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                                     ↓
                          Supabase PostgreSQL (RLS)
                       ┌─────────────────────────────┐
                       │  - locations                │
                       │  - weather_observations     │
                       │  - daily_weather_summary    │
                       └─────────────────────────────┘
```

> **Security Rule**: The browser client **never** writes historical weather observations directly to Supabase. All historical writes execute exclusively via authenticated server-side Route Handlers with administrative Service Role keys.

---

## 4. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15+ (App Router) | High-performance serverless SSR, Route Handlers, Edge optimizations |
| **Language** | TypeScript (Strict) | End-to-end type safety for meteorological data structures |
| **Styling** | Tailwind CSS | Dark-first modern design system |
| **Data Visualization** | Recharts | Composable SVG/Canvas responsive charts |
| **Icons** | Lucide React | Semantic, lightweight iconography |
| **Database** | Supabase PostgreSQL | Relational time-series tables, composite indexes, Row Level Security |
| **Automation** | Vercel Cron | Serverless scheduled cron jobs (`*/5 * * * *`) |
| **Weather Feed** | Open-Meteo API | Standardized WMO meteorological models without client lock-in |

---

## 5. Database Schema

Execute the migration file located at `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

### 5.1 Tables

```sql
-- 1. Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(150) NOT NULL,
  country VARCHAR(100),
  region VARCHAR(150),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone VARCHAR(100) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_location_coordinates UNIQUE (latitude, longitude)
);

-- 2. Weather Observations (Time-series)
CREATE TABLE weather_observations (
  id BIGSERIAL PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL,
  temperature DECIMAL(6,2),
  feels_like DECIMAL(6,2),
  humidity INTEGER,
  pressure DECIMAL(8,2),
  wind_speed DECIMAL(7,2),
  wind_direction INTEGER,
  precipitation DECIMAL(8,2) DEFAULT 0.00,
  precipitation_probability INTEGER,
  cloud_cover INTEGER,
  visibility DECIMAL(8,2),
  uv_index DECIMAL(5,2),
  weather_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_location_recorded_at UNIQUE (location_id, recorded_at)
);

-- 3. Daily Weather Summary
CREATE TABLE daily_weather_summary (
  id BIGSERIAL PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  min_temperature DECIMAL(6,2),
  max_temperature DECIMAL(6,2),
  avg_temperature DECIMAL(6,2),
  avg_humidity DECIMAL(6,2),
  total_precipitation DECIMAL(10,2) DEFAULT 0.00,
  max_wind_speed DECIMAL(7,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_daily_summary_loc_date UNIQUE (location_id, date)
);
```

### 5.2 Duplicate Prevention Strategy
Duplicate records during repeated Cron executions are prevented via:
1. `CONSTRAINT uq_location_recorded_at UNIQUE (location_id, recorded_at)`
2. Route handler idempotency:
   ```ts
   supabase.from('weather_observations').upsert(observation, {
     onConflict: 'location_id,recorded_at',
     ignoreDuplicates: true,
   });
   ```

### 5.3 Row Level Security (RLS)
- Public read access is granted for active locations and observation tables.
- Write access is strictly restricted to trusted server-side execution via `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Environment Variables

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

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser | Supabase project API base URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser | Anon key for client reading |
| `SUPABASE_SERVICE_ROLE_KEY` | **Private / Server-only** | Service role key for Route Handlers and Cron writes |
| `CRON_SECRET` | **Private / Server-only** | Secret token validating Vercel Cron scheduled requests |

---

## 7. Local Development

### 7.1 Installation

```bash
# 1. Install dependencies
npm install

# 2. Run unit and analytics verification tests
npm run test:analytics

# 3. Run Route Handler integration tests
npm run test:routes

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` to interact with the platform.

### 7.2 Testing Vercel Cron Locally

To trigger the automated historical collection endpoint locally without waiting for the 5-minute interval:

```bash
# Using Bearer token authorization
curl -X GET "http://localhost:3000/api/cron/weather" \
  -H "Authorization: Bearer your_32_character_random_cron_secret"
```

Expected JSON response:
```json
{
  "success": true,
  "processed": 6,
  "successful": 6,
  "failed": 0,
  "durationMs": 420,
  "timestamp": "2026-09-25T17:00:00.000Z",
  "results": [
    { "city": "Pune", "locationId": "...", "status": "success" },
    { "city": "Mumbai", "locationId": "...", "status": "success" }
  ]
}
```

---

## 8. API Documentation

### 8.1 GET `/api/weather`
Fetches normalized real-time conditions, hourly forecast, and 7-day outlook.
- **Parameters**:
  - `lat` (number): -90 to 90
  - `lon` (number): -180 to 180
  - `city` (string, optional): Display city name
- **Response**: `200 OK` with `WeatherData` JSON payload.

### 8.2 GET `/api/locations`
Retrieves monitored locations or executes geocoding queries.
- **Parameters**:
  - `search` (string, optional): Search query (e.g. `Pune`, `London`)
- **Response**: `200 OK` with saved locations array or geocoded search results.

### 8.3 POST `/api/locations`
Saves a new location to be monitored by the automated Cron job.
- **Payload**: `{ city, country, region, latitude, longitude, timezone }`
- **Response**: `201 Created` with saved `Location` object.

### 8.4 GET `/api/history`
Queries time-bounded historical observations and computes server-side analytics.
- **Parameters**:
  - `locationId` (UUID): Monitored location ID
  - `range` (string): `24h` | `7d` | `30d`
- **Response**: `200 OK` with `WeatherHistory` JSON payload.

### 8.5 GET `/api/cron/weather`
Endpoint called automatically by Vercel Cron.
- **Headers**: `Authorization: Bearer <CRON_SECRET>`
- **Response**: `200 OK` execution summary or `401 Unauthorized`.

---

## 9. Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete weather analytics and intelligence platform"
   git push origin main
   ```
2. **Import into Vercel**:
   - Link repository in Vercel Dashboard.
   - Configure Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`).
3. **Verify Cron Job**:
   - Vercel automatically detects `vercel.json`:
     ```json
     {
       "crons": [
         {
           "path": "/api/cron/weather",
           "schedule": "*/5 * * * *"
         }
       ]
     }
     ```
   - In your Vercel Project Dashboard, navigate to **Settings** -> **Cron Jobs** to verify active schedule.

---

## 10. License

MIT License. Engineered for enterprise meteorological intelligence and distributed cloud deployment.
