export interface MLFeatureVector {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  cloud_cover: number;
  visibility: number;
  uv_index: number;
  weather_code: number;
  hour: number;
  day_of_week: number;
  day_of_year: number;
  month: number;
  is_day: number;
  hour_sin: number;
  hour_cos: number;
  temperature_lag_1: number;
  temperature_lag_2: number;
  temperature_lag_3: number;
  temperature_lag_6: number;
  humidity_lag_1: number;
  humidity_lag_3: number;
  wind_speed_lag_1: number;
  precipitation_lag_1: number;
  temperature_rolling_mean_3: number;
  temperature_rolling_mean_6: number;
  temperature_rolling_mean_12: number;
  humidity_rolling_mean_3: number;
  wind_rolling_mean_3: number;
  precipitation_rolling_sum_3: number;
}

export interface MLModelMetadata {
  model_version: string;
  model_name: string;
  target: string;
  model_type: string;
  trained_at: string;
  metrics: {
    mae?: number;
    rmse?: number;
    r2?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
  };
  top_features: Array<{
    feature: string;
    importance: number;
  }>;
}

export interface MLPrediction {
  id?: number;
  location_id: string;
  prediction_time: string;
  target_time: string;
  predicted_temperature: number;
  predicted_rain_probability: number;
  actual_temperature?: number | null;
  actual_precipitation?: number | null;
  error_temperature?: number | null;
  model_version: string;
}

export interface MLPredictionResponse {
  location: {
    id: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  prediction: {
    temperature: number;
    rain_probability: number;
    prediction_time: string;
    target_time: string;
  };
  model: {
    version: string;
    type: string;
    trained_at: string;
    metrics: {
      mae: number;
      rmse: number;
      r2: number;
      accuracy?: number;
      f1?: number;
    };
    top_features: Array<{
      feature: string;
      importance: number;
    }>;
  };
  performance: {
    mae: number;
    rmse: number;
    total_evaluated: number;
    avg_error: number;
  };
  history: Array<{
    id?: number;
    prediction_time: string;
    target_time: string;
    predicted_temperature: number;
    actual_temperature: number | null;
    error: number | null;
    predicted_rain_probability: number;
    model_version: string;
  }>;
}
