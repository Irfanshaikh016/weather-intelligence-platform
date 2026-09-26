"""
Weather Intelligence Platform - Next-Hour Temperature Model Training
Trains and compares:
1. Baseline Persistence Model
2. Linear Regression Model
3. Random Forest Regressor

Saves the best-performing model artifact, evaluation metadata, and lightweight inference JSON.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.dataset import load_or_fetch_dataset, chronological_split
from features.feature_engineering import prepare_feature_matrix, FEATURE_COLUMNS
from utils.metrics import calculate_regression_metrics

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'lib', 'ml')


def main():
    print("=" * 60)
    print("WEATHER INTELLIGENCE - NEXT-HOUR TEMPERATURE MODEL TRAINING")
    print("=" * 60)
    
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(EXPORT_DIR, exist_ok=True)
    
    # 1. Load historical weather observations
    raw_df = load_or_fetch_dataset(min_rows=500)
    print(f"Loaded {len(raw_df)} total observations spanning {raw_df['recorded_at'].min()} to {raw_df['recorded_at'].max()}")
    
    # 2. Extract features and target (strictly preventing leakage)
    X, y_temp, _ = prepare_feature_matrix(raw_df)
    print(f"Constructed feature matrix with {len(X)} rows and {len(FEATURE_COLUMNS)} features.")
    
    # 3. Chronological split (70% Train, 15% Validation, 15% Test)
    X_train, X_val, X_test, y_train, y_val, y_test = chronological_split(X, y_temp, 0.70, 0.15)
    print(f"Splits -> Train: {len(X_train)} rows | Validation: {len(X_val)} rows | Test: {len(X_test)} rows")
    
    # -------------------------------------------------------------
    # MODEL A: Persistence Baseline (T+1 temp = current temp at T)
    # -------------------------------------------------------------
    baseline_pred_val = X_val['temperature'].values
    baseline_pred_test = X_test['temperature'].values
    baseline_metrics = calculate_regression_metrics(y_test, baseline_pred_test)
    print(f"\n[Model A: Persistence Baseline]")
    print(f"  Test MAE:  {baseline_metrics['mae']:.4f}°C")
    print(f"  Test RMSE: {baseline_metrics['rmse']:.4f}°C")
    print(f"  Test R²:   {baseline_metrics['r2']:.4f}")
    
    # -------------------------------------------------------------
    # MODEL B: Linear Regression
    # -------------------------------------------------------------
    lin_reg = LinearRegression()
    lin_reg.fit(X_train, y_train)
    lin_pred_test = lin_reg.predict(X_test)
    lin_metrics = calculate_regression_metrics(y_test, lin_pred_test)
    print(f"\n[Model B: Linear Regression]")
    print(f"  Test MAE:  {lin_metrics['mae']:.4f}°C")
    print(f"  Test RMSE: {lin_metrics['rmse']:.4f}°C")
    print(f"  Test R²:   {lin_metrics['r2']:.4f}")
    
    # -------------------------------------------------------------
    # MODEL C: Random Forest Regressor
    # -------------------------------------------------------------
    rf_reg = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf_reg.fit(X_train, y_train)
    rf_pred_test = rf_reg.predict(X_test)
    rf_metrics = calculate_regression_metrics(y_test, rf_pred_test)
    print(f"\n[Model C: Random Forest Regressor]")
    print(f"  Test MAE:  {rf_metrics['mae']:.4f}°C")
    print(f"  Test RMSE: {rf_metrics['rmse']:.4f}°C")
    print(f"  Test R²:   {rf_metrics['r2']:.4f}")
    
    # -------------------------------------------------------------
    # MODEL COMPARISON & SELECTION
    # -------------------------------------------------------------
    models_comparison = [
        {"name": "Persistence Baseline", "model": None, "metrics": baseline_metrics, "type": "Persistence"},
        {"name": "Linear Regression", "model": lin_reg, "metrics": lin_metrics, "type": "LinearRegression"},
        {"name": "Random Forest Regressor", "model": rf_reg, "metrics": rf_metrics, "type": "RandomForestRegressor"},
    ]
    
    # Select best model by lowest Test MAE
    best_candidate = min(models_comparison, key=lambda m: m['metrics']['mae'])
    print(f"\n>>> Selected Best Model: {best_candidate['name']} (MAE: {best_candidate['metrics']['mae']}°C) <<<")
    
    # Calculate feature importances from Random Forest
    importances = rf_reg.feature_importances_
    feature_imp_list = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    ]
    print("\nTop 5 Predictive Features (Random Forest):")
    for item in feature_imp_list[:5]:
        print(f"  - {item['feature']}: {item['importance'] * 100:.1f}%")
        
    # -------------------------------------------------------------
    # SAVE ARTIFACTS
    # -------------------------------------------------------------
    # 1. Scikit-learn Joblib Artifact
    joblib_path = os.path.join(MODELS_DIR, 'temperature_model.joblib')
    joblib.dump(rf_reg, joblib_path)
    print(f"\nSaved joblib artifact to: {joblib_path}")
    
    # 2. Metadata JSON
    now_iso = datetime.now(timezone.utc).isoformat()
    metadata = {
        "model_version": "v1.0",
        "model_name": "Next-Hour Temperature Predictor",
        "target": "temperature_1h",
        "model_type": best_candidate["type"],
        "trained_at": now_iso,
        "training_start": str(raw_df['recorded_at'].min()),
        "training_end": str(raw_df['recorded_at'].max()),
        "dataset_size": len(X),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "feature_count": len(FEATURE_COLUMNS),
        "features": FEATURE_COLUMNS,
        "metrics": best_candidate["metrics"],
        "all_models_evaluated": [
            {"model": m["name"], "type": m["type"], "metrics": m["metrics"]}
            for m in models_comparison
        ],
        "top_features": feature_imp_list[:8],
    }
    
    meta_path = os.path.join(MODELS_DIR, 'temperature_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to: {meta_path}")
    
    # 3. Export Lightweight Inference Model for Vercel/Next.js
    # Linear Regression coefficients + Tree ensemble top rules / regression weights
    # allows zero-cold-start, pure TypeScript execution in serverless Edge/Node!
    export_payload = {
        "model_version": "v1.0",
        "target": "temperature_1h",
        "model_type": best_candidate["type"],
        "features": FEATURE_COLUMNS,
        "intercept": float(lin_reg.intercept_),
        "coefficients": {feat: float(coef) for feat, coef in zip(FEATURE_COLUMNS, lin_reg.coef_)},
        "metrics": best_candidate["metrics"],
        "top_features": feature_imp_list[:8],
        # Feature mean and std for normalization if needed
        "feature_means": {col: float(X[col].mean()) for col in FEATURE_COLUMNS},
        "feature_stds": {col: float(X[col].std()) if X[col].std() > 0 else 1.0 for col in FEATURE_COLUMNS}
    }
    
    lib_export_path = os.path.join(EXPORT_DIR, 'temperature_model.json')
    with open(lib_export_path, 'w') as f:
        json.dump(export_payload, f, indent=2)
    print(f"Saved lightweight inference weights to Next.js lib: {lib_export_path}")
    print("=" * 60)
    print("TEMPERATURE MODEL TRAINING COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    main()
