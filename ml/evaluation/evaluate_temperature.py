"""
Weather Intelligence Platform - Temperature Model Evaluation Script
Loads trained temperature model and runs independent chronological verification.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.dataset import load_or_fetch_dataset, chronological_split
from features.feature_engineering import prepare_feature_matrix, FEATURE_COLUMNS
from utils.metrics import calculate_regression_metrics

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')


def main():
    print("--- EVALUATING TEMPERATURE MODEL ARTIFACT ---")
    meta_path = os.path.join(MODELS_DIR, 'temperature_metadata.json')
    joblib_path = os.path.join(MODELS_DIR, 'temperature_model.joblib')
    
    if not os.path.exists(meta_path) or not os.path.exists(joblib_path):
        print("Model artifacts not found. Please run ml/training/train_temperature.py first.")
        return
        
    with open(meta_path, 'r') as f:
        meta = json.load(f)
        
    print(f"Model Version: {meta.get('model_version')}")
    print(f"Model Type:    {meta.get('model_type')}")
    print(f"Trained At:    {meta.get('trained_at')}")
    print(f"Recorded MAE:  {meta.get('metrics', {}).get('mae')}°C")
    print(f"Recorded RMSE: {meta.get('metrics', {}).get('rmse')}°C")
    print(f"Recorded R²:   {meta.get('metrics', {}).get('r2')}")
    
    # Reload and test model on latest data
    df = load_or_fetch_dataset()
    X, y, _ = prepare_feature_matrix(df)
    _, _, X_test, _, _, y_test = chronological_split(X, y)
    
    model = joblib.load(joblib_path)
    preds = model.predict(X_test)
    metrics = calculate_regression_metrics(y_test, preds)
    
    print("\nVerified Test Set Metrics:")
    print(f"  MAE:  {metrics['mae']}°C")
    print(f"  RMSE: {metrics['rmse']}°C")
    print("[SUCCESS] Model verification complete.")


if __name__ == '__main__':
    main()
