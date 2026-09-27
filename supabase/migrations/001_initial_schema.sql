-- Weather Analytics & Intelligence Platform - Initial Database Schema
-- Version: 001
-- Tables: locations, weather_observations, daily_weather_summary

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
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

-- Indexes for locations
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

-- ============================================================
-- 2. WEATHER OBSERVATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_observations (
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
  -- Unique constraint ensures idempotency during automated cron collection
  CONSTRAINT uq_location_recorded_at UNIQUE (location_id, recorded_at)
);

-- Performance index for time-series range queries & aggregation
CREATE INDEX IF NOT EXISTS idx_weather_observations_loc_rec_desc 
  ON weather_observations(location_id, recorded_at DESC);

-- ============================================================
-- 3. DAILY WEATHER SUMMARY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_weather_summary (
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

-- Performance index for daily summaries
CREATE INDEX IF NOT EXISTS idx_daily_summary_loc_date_desc 
  ON daily_weather_summary(location_id, date DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_weather_summary ENABLE ROW LEVEL SECURITY;

-- Allow public read access (dashboard & client visualization)
CREATE POLICY "Allow public read access to locations" 
  ON locations FOR SELECT USING (true);

CREATE POLICY "Allow public read access to weather observations" 
  ON weather_observations FOR SELECT USING (true);

CREATE POLICY "Allow public read access to daily weather summary" 
  ON daily_weather_summary FOR SELECT USING (true);

-- Allow server service-role full write access (service role automatically bypasses RLS in Supabase)
-- In addition, explicit authenticated insert policy:
CREATE POLICY "Allow service role insert on locations" 
  ON locations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert on weather_observations" 
  ON weather_observations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert on daily_weather_summary" 
  ON daily_weather_summary FOR INSERT WITH CHECK (true);

-- ============================================================
-- 5. SEED INITIAL ACTIVE LOCATIONS
-- ============================================================
INSERT INTO locations (city, country, region, latitude, longitude, timezone, is_active)
VALUES
  ('Pune', 'India', 'Maharashtra', 18.5204, 73.8567, 'Asia/Kolkata', true),
  ('Mumbai', 'India', 'Maharashtra', 19.0760, 72.8777, 'Asia/Kolkata', true),
  ('Delhi', 'India', 'Delhi', 28.6139, 77.2090, 'Asia/Kolkata', true),
  ('Bengaluru', 'India', 'Karnataka', 12.9716, 77.5946, 'Asia/Kolkata', true),
  ('London', 'United Kingdom', 'Greater London', 51.5074, -0.1278, 'Europe/London', true),
  ('New York', 'United States', 'New York', 40.7128, -74.0060, 'America/New_York', true),
  ('Tokyo', 'Japan', 'Kanto', 35.6762, 139.6503, 'Asia/Tokyo', true),
  ('Paris', 'France', 'Île-de-France', 48.8566, 2.3522, 'Europe/Paris', true),
  ('Dubai', 'United Arab Emirates', 'Dubai', 25.2048, 55.2708, 'Asia/Dubai', true),
  ('Singapore', 'Singapore', 'Central', 1.3521, 103.8198, 'Asia/Singapore', true),
  ('Sydney', 'Australia', 'New South Wales', -33.8688, 151.2093, 'Australia/Sydney', true),
  ('San Francisco', 'United States', 'California', 37.7749, -122.4194, 'America/Los_Angeles', true)
ON CONFLICT (latitude, longitude) DO NOTHING;
