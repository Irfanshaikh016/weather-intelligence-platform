import { MLFeatureVector } from './types';
import tempModelJson from './temperature_model.json';
import rainModelJson from './rain_model.json';

export interface PredictionResult {
  predicted_temperature: number;
  predicted_rain_probability: number;
  prediction_time: string;
  target_time: string;
  model_version: string;
  model_type: string;
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
}

export function predictNextHourWeather(
  features: MLFeatureVector,
  currentTime: Date = new Date()
): PredictionResult {
  const predictionTime = currentTime.toISOString();
  // Target time: exactly 1 hour into the future
  const targetTime = new Date(currentTime.getTime() + 60 * 60 * 1000).toISOString();

  // 1. Predict Next-Hour Temperature
  // Regression model: y = intercept + sum(coef_i * feature_i)
  let predictedTemp = tempModelJson.intercept;
  const tempCoeffs = tempModelJson.coefficients as Record<string, number>;

  for (const [feat, coef] of Object.entries(tempCoeffs)) {
    const val = features[feat as keyof MLFeatureVector] ?? 0;
    predictedTemp += coef * val;
  }

  // Safety physical sanity bounds: clamp within reasonable deviation from current temp (+/- 10°C)
  const clampedTemp = Math.max(
    features.temperature - 8,
    Math.min(features.temperature + 8, Math.round(predictedTemp * 10) / 10)
  );

  // 2. Predict Next-Hour Rain Probability
  // Logistic Regression / Sigmoid on standardized features: z = intercept + sum(coef_i * (x_i - mean_i) / std_i)
  let z = rainModelJson.intercept;
  const rainCoeffs = rainModelJson.coefficients as Record<string, number>;
  const rainMeans = rainModelJson.feature_means as Record<string, number>;
  const rainStds = rainModelJson.feature_stds as Record<string, number>;

  for (const [feat, coef] of Object.entries(rainCoeffs)) {
    const val = features[feat as keyof MLFeatureVector] ?? 0;
    const mean = rainMeans[feat] ?? 0;
    const std = rainStds[feat] && rainStds[feat] > 0 ? rainStds[feat] : 1;
    const normalized = (val - mean) / std;
    z += coef * normalized;
  }

  // Sigmoid probability between 0 and 100%
  const sigmoid = 1 / (1 + Math.exp(-z));
  let rainProb = Math.round(sigmoid * 100);

  // If current precipitation is high or cloud cover is 100%, ensure calibrated minimum
  if (features.precipitation > 0.5) {
    rainProb = Math.max(rainProb, 65);
  } else if (features.humidity < 30 && features.cloud_cover < 10) {
    rainProb = Math.min(rainProb, 10);
  }
  rainProb = Math.max(0, Math.min(100, rainProb));

  return {
    predicted_temperature: clampedTemp,
    predicted_rain_probability: rainProb,
    prediction_time: predictionTime,
    target_time: targetTime,
    model_version: tempModelJson.model_version,
    model_type: tempModelJson.model_type,
    metrics: {
      mae: tempModelJson.metrics.mae,
      rmse: tempModelJson.metrics.rmse,
      r2: tempModelJson.metrics.r2,
      accuracy: rainModelJson.metrics.accuracy,
      f1: rainModelJson.metrics.f1,
    },
    top_features: tempModelJson.top_features,
  };
}
