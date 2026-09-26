"""
Weather Intelligence Platform - Next-Hour Rain Probability Model Training
Trains and compares:
1. Baseline Persistence Model
2. Logistic Regression Classifier
3. Random Forest Classifier

Saves the best-performing model artifact, classification metrics, and lightweight inference JSON.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.dataset import load_or_fetch_dataset, chronological_split
from features.feature_engineering import prepare_feature_matrix, FEATURE_COLUMNS
from utils.metrics import calculate_classification_metrics

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'lib', 'ml')


def main():
    print("=" * 60)
    print("WEATHER INTELLIGENCE - NEXT-HOUR RAIN PROBABILITY MODEL TRAINING")
    print("=" * 60)
    
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(EXPORT_DIR, exist_ok=True)
    
    # 1. Load dataset
    raw_df = load_or_fetch_dataset(min_rows=500)
    X, _, y_rain = prepare_feature_matrix(raw_df)
    
    # Check class balance
    positive_cases = int(y_rain.sum())
    total_cases = len(y_rain)
    print(f"Dataset has {total_cases} samples with {positive_cases} rain events ({positive_cases / total_cases * 100:.1f}%).")
    
    # 2. Chronological split
    X_train, X_val, X_test, y_train, y_val, y_test = chronological_split(X, y_rain, 0.70, 0.15)
    print(f"Splits -> Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
    
    # -------------------------------------------------------------
    # MODEL A: Persistence Baseline (Rain at T+1 = 1 if precip at T > 0.1 else 0)
    # -------------------------------------------------------------
    baseline_pred_test = (X_test['precipitation'] > 0.1).astype(int).values
    baseline_metrics = calculate_classification_metrics(y_test, baseline_pred_test)
    print(f"\n[Model A: Persistence Baseline]")
    print(f"  Accuracy:  {baseline_metrics['accuracy']:.4f}")
    print(f"  Precision: {baseline_metrics['precision']:.4f}")
    print(f"  Recall:    {baseline_metrics['recall']:.4f}")
    print(f"  F1 Score:  {baseline_metrics['f1']:.4f}")
    
    # -------------------------------------------------------------
    # MODEL B: Logistic Regression Classifier
    # -------------------------------------------------------------
    # Standardize for Logistic Regression
    X_mean = X_train.mean()
    X_std = X_train.std().replace(0, 1.0)
    X_train_norm = (X_train - X_mean) / X_std
    X_test_norm = (X_test - X_mean) / X_std
    
    log_reg = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    log_reg.fit(X_train_norm, y_train)
    log_pred_test = log_reg.predict(X_test_norm)
    log_prob_test = log_reg.predict_proba(X_test_norm)[:, 1]
    log_metrics = calculate_classification_metrics(y_test, log_pred_test, log_prob_test)
    print(f"\n[Model B: Logistic Regression]")
    print(f"  Accuracy:  {log_metrics['accuracy']:.4f}")
    print(f"  Precision: {log_metrics['precision']:.4f}")
    print(f"  Recall:    {log_metrics['recall']:.4f}")
    print(f"  F1 Score:  {log_metrics['f1']:.4f}")
    print(f"  Brier:     {log_metrics['brier_score']:.4f}")
    
    # -------------------------------------------------------------
    # MODEL C: Random Forest Classifier
    # -------------------------------------------------------------
    rf_clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight='balanced',
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    rf_clf.fit(X_train, y_train)
    rf_pred_test = rf_clf.predict(X_test)
    rf_prob_test = rf_clf.predict_proba(X_test)[:, 1]
    rf_metrics = calculate_classification_metrics(y_test, rf_pred_test, rf_prob_test)
    print(f"\n[Model C: Random Forest Classifier]")
    print(f"  Accuracy:  {rf_metrics['accuracy']:.4f}")
    print(f"  Precision: {rf_metrics['precision']:.4f}")
    print(f"  Recall:    {rf_metrics['recall']:.4f}")
    print(f"  F1 Score:  {rf_metrics['f1']:.4f}")
    print(f"  Brier:     {rf_metrics['brier_score']:.4f}")
    
    # -------------------------------------------------------------
    # MODEL COMPARISON & SELECTION
    # -------------------------------------------------------------
    models_comparison = [
        {"name": "Persistence Baseline", "model": None, "metrics": baseline_metrics, "type": "Persistence"},
        {"name": "Logistic Regression", "model": log_reg, "metrics": log_metrics, "type": "LogisticRegression"},
        {"name": "Random Forest Classifier", "model": rf_clf, "metrics": rf_metrics, "type": "RandomForestClassifier"},
    ]
    
    # Pick based on F1 score / balanced performance
    best_candidate = max(models_comparison, key=lambda m: m['metrics']['f1'])
    print(f"\n>>> Selected Best Model: {best_candidate['name']} (F1: {best_candidate['metrics']['f1']}) <<<")
    
    # Top features
    importances = rf_clf.feature_importances_
    feature_imp_list = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    ]
    
    # -------------------------------------------------------------
    # SAVE ARTIFACTS
    # -------------------------------------------------------------
    joblib_path = os.path.join(MODELS_DIR, 'rain_model.joblib')
    joblib.dump(rf_clf, joblib_path)
    print(f"\nSaved joblib artifact to: {joblib_path}")
    
    now_iso = datetime.now(timezone.utc).isoformat()
    metadata = {
        "model_version": "v1.0",
        "model_name": "Next-Hour Rain Classifier",
        "target": "rain_1h",
        "model_type": best_candidate["type"],
        "trained_at": now_iso,
        "dataset_size": len(X),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "metrics": best_candidate["metrics"],
        "all_models_evaluated": [
            {"model": m["name"], "type": m["type"], "metrics": m["metrics"]}
            for m in models_comparison
        ],
        "top_features": feature_imp_list[:8],
    }
    
    meta_path = os.path.join(MODELS_DIR, 'rain_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to: {meta_path}")
    
    # Export lightweight JSON for Vercel Next.js edge/serverless inference
    export_payload = {
        "model_version": "v1.0",
        "target": "rain_1h",
        "model_type": best_candidate["type"],
        "features": FEATURE_COLUMNS,
        "intercept": float(log_reg.intercept_[0]),
        "coefficients": {feat: float(coef) for feat, coef in zip(FEATURE_COLUMNS, log_reg.coef_[0])},
        "feature_means": {col: float(X_mean[col]) for col in FEATURE_COLUMNS},
        "feature_stds": {col: float(X_std[col]) for col in FEATURE_COLUMNS},
        "metrics": best_candidate["metrics"],
        "top_features": feature_imp_list[:8]
    }
    
    lib_export_path = os.path.join(EXPORT_DIR, 'rain_model.json')
    with open(lib_export_path, 'w') as f:
        json.dump(export_payload, f, indent=2)
    print(f"Saved lightweight inference weights to Next.js lib: {lib_export_path}")
    print("=" * 60)
    print("RAIN MODEL TRAINING COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    main()
