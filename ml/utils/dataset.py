"""
Weather Intelligence Platform - Dataset Utility
Handles loading, validation, caching, and chronological splitting of historical weather observations.
"""

import os
import json
import urllib.request
import pandas as pd
import numpy as np
from typing import Tuple, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
CACHE_FILE = os.path.join(DATA_DIR, 'weather_dataset.csv')


def fetch_historical_archive(
    latitude: float = 18.5204,
    longitude: float = 73.8567,
    past_days: int = 90
) -> pd.DataFrame:
    """
    Fetches real historical hourly telemetry from the Open-Meteo archive API.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={latitude}&longitude={longitude}"
        f"&past_days={past_days}&forecast_days=1"
        f"&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,"
        f"weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day"
        f"&timezone=auto"
    )
    
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'WeatherIntelligencePlatform/2.0 (contact: support@weather-intel.app)'}
    )
    
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        
    hourly = data.get('hourly', {})
    if not hourly or 'time' not in hourly:
        raise ValueError("Invalid Open-Meteo payload received.")
        
    df = pd.DataFrame({
        'recorded_at': pd.to_datetime(hourly['time']),
        'temperature': hourly.get('temperature_2m', []),
        'feels_like': hourly.get('apparent_temperature', []),
        'humidity': hourly.get('relative_humidity_2m', []),
        'pressure': hourly.get('surface_pressure', []),
        'wind_speed': hourly.get('wind_speed_10m', []),
        'wind_direction': hourly.get('wind_direction_10m', []),
        'precipitation': hourly.get('precipitation', []),
        'cloud_cover': hourly.get('cloud_cover', []),
        'visibility': [v / 1000.0 if v is not None else 10.0 for v in hourly.get('visibility', [])],
        'uv_index': hourly.get('uv_index', []),
        'weather_code': hourly.get('weather_code', []),
        'is_day': hourly.get('is_day', []),
    })
    
    # Filter to only past and present timestamps
    now = pd.Timestamp.now(tz=None)
    df = df[df['recorded_at'] <= now].copy()
    return df


def load_or_fetch_dataset(force_refresh: bool = False, min_rows: int = 500) -> pd.DataFrame:
    """
    Loads dataset from local cache if present, otherwise downloads real historical telemetry.
    Validates minimum dataset size constraint.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if os.path.exists(CACHE_FILE) and not force_refresh:
        print(f"[Dataset] Loading cached observations from {CACHE_FILE}")
        df = pd.read_csv(CACHE_FILE)
        df['recorded_at'] = pd.to_datetime(df['recorded_at'])
    else:
        print("[Dataset] Fetching genuine historical weather observations from Open-Meteo...")
        df = fetch_historical_archive(latitude=18.5204, longitude=73.8567, past_days=90)
        df.to_csv(CACHE_FILE, index=False)
        print(f"[Dataset] Saved {len(df)} records to {CACHE_FILE}")
        
    # Validation checks
    if len(df) < min_rows:
        raise ValueError(
            f"Insufficient historical data for reliable ML training. Required: >= {min_rows}, Found: {len(df)}"
        )
        
    # Check null values
    null_counts = df.isnull().sum()
    if null_counts.any():
        print(f"[Dataset] Preprocessing: forward-filling minor gaps across columns: {null_counts[null_counts > 0].to_dict()}")
        df = df.ffill().bfill()
        
    df = df.sort_values('recorded_at').reset_index(drop=True)
    return df


def chronological_split(
    X: pd.DataFrame,
    y: pd.Series,
    train_pct: float = 0.70,
    val_pct: float = 0.15
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
    """
    Splits time-series data chronologically (NO random shuffling) to strictly avoid data leakage.
    Default: 70% Train, 15% Validation, 15% Test.
    """
    n = len(X)
    train_end = int(n * train_pct)
    val_end = int(n * (train_pct + val_pct))
    
    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]
    
    return X_train, X_val, X_test, y_train, y_val, y_test
