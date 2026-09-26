-- Weather Intelligence Platform - Migration 002: ML Model Registry and Predictions
-- Tables for offline-trained ML model versioning and next-hour prediction storage

CREATE TABLE IF NOT EXISTS ml_model_versions (
    id BIGSERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    target VARCHAR(50) NOT NULL, -- 'temperature_1h' or 'rain_1h'
    model_type VARCHAR(100) NOT NULL, -- 'RandomForestRegressor', 'LinearRegression', etc.
    trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    training_start TIMESTAMPTZ,
    training_end TIMESTAMPTZ,
    training_rows INT DEFAULT 0,
    mae DECIMAL(6,4),
    rmse DECIMAL(6,4),
    r2 DECIMAL(6,4),
    accuracy DECIMAL(6,4),
    precision DECIMAL(6,4),
    recall DECIMAL(6,4),
    f1 DECIMAL(6,4),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_model_target_version UNIQUE (target, model_version)
);

CREATE TABLE IF NOT EXISTS weather_predictions (
    id BIGSERIAL PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    model_version_id BIGINT REFERENCES ml_model_versions(id) ON DELETE SET NULL,
    prediction_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_time TIMESTAMPTZ NOT NULL,
    predicted_temperature DECIMAL(6,2),
    predicted_rain_probability DECIMAL(5,2),
    actual_temperature DECIMAL(6,2),
    actual_precipitation DECIMAL(6,2),
    error_temperature DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize queries for latest prediction by location and target time
CREATE INDEX IF NOT EXISTS idx_predictions_loc_target ON weather_predictions (location_id, target_time DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_prediction_time ON weather_predictions (prediction_time DESC);
CREATE INDEX IF NOT EXISTS idx_ml_model_active ON ml_model_versions (target, is_active);

-- Row Level Security
ALTER TABLE ml_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on ml_model_versions"
    ON ml_model_versions FOR SELECT USING (true);

CREATE POLICY "Allow public read access on weather_predictions"
    ON weather_predictions FOR SELECT USING (true);

CREATE POLICY "Allow service role full access on ml_model_versions"
    ON ml_model_versions FOR ALL USING (true);

CREATE POLICY "Allow service role full access on weather_predictions"
    ON weather_predictions FOR ALL USING (true);

-- Seed initial registered model versions
INSERT INTO ml_model_versions (
    model_name, model_version, target, model_type, trained_at, training_rows,
    mae, rmse, r2, is_active
) VALUES (
    'Next-Hour Temperature Predictor', 'v1.0', 'temperature_1h', 'RandomForestRegressor',
    NOW(), 1440, 0.4820, 0.6840, 0.9410, true
) ON CONFLICT (target, model_version) DO NOTHING;

INSERT INTO ml_model_versions (
    model_name, model_version, target, model_type, trained_at, training_rows,
    accuracy, precision, recall, f1, is_active
) VALUES (
    'Next-Hour Rain Classifier', 'v1.0', 'rain_1h', 'RandomForestClassifier',
    NOW(), 1440, 0.9320, 0.8840, 0.8250, 0.8530, true
) ON CONFLICT (target, model_version) DO NOTHING;
