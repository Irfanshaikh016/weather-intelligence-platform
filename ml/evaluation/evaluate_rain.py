"""
Weather Intelligence Platform - Rain Model Evaluation Script
Loads trained rain model and runs verification of classification metrics.
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
from utils.metrics import calculate_classification_metrics

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')


def main():
    print("--- EVALUATING RAIN MODEL ARTIFACT ---")
    meta_path = os.path.join(MODELS_DIR, 'rain_metadata.json')
    joblib_path = os.path.join(MODELS_DIR, 'rain_model.joblib')
    
    if not os.path.exists(meta_path) or not os.path.exists(joblib_path):
        print("Model artifacts not found. Please run ml/training/train_rain.py first.")
        return
        
    with open(meta_path, 'r') as f:
        meta = json.load(f)
        
    print(f"Model Version:  {meta.get('model_version')}")
    print(f"Model Type:     {meta.get('model_type')}")
    print(f"Trained At:     {meta.get('trained_at')}")
    print(f"Recorded Acc:   {meta.get('metrics', {}).get('accuracy')}")
    print(f"Recorded Prec:  {meta.get('metrics', {}).get('precision')}")
    print(f"Recorded Rec:   {meta.get('metrics', {}).get('recall')}")
    print(f"Recorded F1:    {meta.get('metrics', {}).get('f1')}")
    
    df = load_or_fetch_dataset()
    X, _, y_rain = prepare_feature_matrix(df)
    _, _, X_test, _, _, y_test = chronological_split(X, y_rain)
    
    model = joblib.load(joblib_path)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
    metrics = calculate_classification_metrics(y_test, preds, probs)
    
    print("\nVerified Test Set Metrics:")
    print(f"  Accuracy:  {metrics['accuracy']}")
    print(f"  Precision: {metrics['precision']}")
    print(f"  Recall:    {metrics['recall']}")
    print(f"  F1 Score:  {metrics['f1']}")
    print("[SUCCESS] Model verification complete.")


if __name__ == '__main__':
    main()
