"""
Weather Intelligence Platform - Feature Engineering Pipeline
Constructs time-series features, cyclical time encodings, lag variables,
and rolling statistical aggregates while strictly preventing future data leakage.
"""

import numpy as np
import pandas as pd
from typing import List, Tuple

# Ordered master feature list
FEATURE_COLUMNS = [
    # Atmospheric baseline features (at time T)
    'temperature',
    'feels_like',
    'humidity',
    'pressure',
    'wind_speed',
    'wind_direction',
    'precipitation',
    'cloud_cover',
    'visibility',
    'uv_index',
    'weather_code',
    # Temporal & cyclical features
    'hour',
    'day_of_week',
    'day_of_year',
    'month',
    'is_day',
    'hour_sin',
    'hour_cos',
    # Historical lag features (strictly T-1, T-2, T-3, T-6)
    'temperature_lag_1',
    'temperature_lag_2',
    'temperature_lag_3',
    'temperature_lag_6',
    'humidity_lag_1',
    'humidity_lag_3',
    'wind_speed_lag_1',
    'precipitation_lag_1',
    # Rolling historical aggregates (prior windows ending at T)
    'temperature_rolling_mean_3',
    'temperature_rolling_mean_6',
    'temperature_rolling_mean_12',
    'humidity_rolling_mean_3',
    'wind_rolling_mean_3',
    'precipitation_rolling_sum_3',
]


def extract_time_features(df: pd.DataFrame, timestamp_col: str = 'recorded_at') -> pd.DataFrame:
    """
    Extracts calendar and cyclical time features from datetime index/column.
    """
    dt = pd.to_datetime(df[timestamp_col])
    res = df.copy()
    
    res['hour'] = dt.dt.hour
    res['day_of_week'] = dt.dt.dayofweek
    res['day_of_year'] = dt.dt.dayofyear
    res['month'] = dt.dt.month
    
    # Check is_day if present, or approximate by solar elevation (6 to 18)
    if 'is_day' not in res.columns:
        res['is_day'] = ((res['hour'] >= 6) & (res['hour'] < 19)).astype(int)
    else:
        res['is_day'] = res['is_day'].astype(int)
        
    # Cyclical hour encoding
    res['hour_sin'] = np.sin(2 * np.pi * res['hour'] / 24.0)
    res['hour_cos'] = np.cos(2 * np.pi * res['hour'] / 24.0)
    
    return res


def build_lag_and_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes lag and rolling window features over chronologically sorted observations.
    WARNING: Assumes df is sorted chronologically by timestamp!
    Only past rows are used to guarantee no data leakage.
    """
    res = df.copy()
    
    # Lag features
    res['temperature_lag_1'] = res['temperature'].shift(1)
    res['temperature_lag_2'] = res['temperature'].shift(2)
    res['temperature_lag_3'] = res['temperature'].shift(3)
    res['temperature_lag_6'] = res['temperature'].shift(6)
    
    res['humidity_lag_1'] = res['humidity'].shift(1)
    res['humidity_lag_3'] = res['humidity'].shift(3)
    res['wind_speed_lag_1'] = res['wind_speed'].shift(1)
    res['precipitation_lag_1'] = res['precipitation'].shift(1)
    
    # Rolling features over past observations (closed='left' or shift(1) to avoid current observation in rolling if strict,
    # or including current observation at T as the end of the window: [T-w+1, T]).
    # Including current T in the rolling mean is standard since T is known at prediction time.
    res['temperature_rolling_mean_3'] = res['temperature'].rolling(window=3, min_periods=1).mean()
    res['temperature_rolling_mean_6'] = res['temperature'].rolling(window=6, min_periods=1).mean()
    res['temperature_rolling_mean_12'] = res['temperature'].rolling(window=12, min_periods=1).mean()
    
    res['humidity_rolling_mean_3'] = res['humidity'].rolling(window=3, min_periods=1).mean()
    res['wind_rolling_mean_3'] = res['wind_speed'].rolling(window=3, min_periods=1).mean()
    res['precipitation_rolling_sum_3'] = res['precipitation'].rolling(window=3, min_periods=1).sum()
    
    return res


def create_targets(df: pd.DataFrame, timestamp_col: str = 'recorded_at', lead_hours: int = 1) -> pd.DataFrame:
    """
    Creates target variables for lead_hours ahead (default: 1 hour).
    Matches future observation using timestamp matching with a tolerance of 15 minutes.
    """
    res = df.copy()
    timestamps = pd.to_datetime(res[timestamp_col])
    
    target_temps = []
    target_rains = []
    target_times = []
    
    # Fast matching using binary search / merge_asof
    temp_df = pd.DataFrame({
        'recorded_at': timestamps,
        'future_target_time': timestamps + pd.Timedelta(hours=lead_hours),
        'temp': res['temperature'].values,
        'precip': res['precipitation'].values
    }).sort_values('recorded_at')
    
    # Left join asof with tolerance of 20 minutes
    matched = pd.merge_asof(
        temp_df[['recorded_at', 'future_target_time']],
        temp_df[['recorded_at', 'temp', 'precip']].rename(columns={
            'recorded_at': 'actual_future_time',
            'temp': 'target_temperature_1h',
            'precip': 'future_precipitation'
        }),
        left_on='future_target_time',
        right_on='actual_future_time',
        direction='nearest',
        tolerance=pd.Timedelta(minutes=20)
    )
    
    res['target_time'] = matched['future_target_time']
    res['target_temperature_1h'] = matched['target_temperature_1h']
    res['target_rain_1h'] = (matched['future_precipitation'] > 0.1).astype(float)
    # If target is missing (at end of dataset), keep NaN
    res.loc[matched['target_temperature_1h'].isna(), 'target_rain_1h'] = np.nan
    
    return res


def prepare_feature_matrix(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Runs full feature engineering pipeline and returns (X, y_temp, y_rain) cleaned of NaNs.
    """
    df_sorted = df.sort_values('recorded_at').reset_index(drop=True)
    df_timed = extract_time_features(df_sorted)
    df_features = build_lag_and_rolling_features(df_timed)
    df_full = create_targets(df_features)
    
    # Drop rows where target is NaN (e.g. latest hours with no future target yet)
    # Also drop rows where lag_6 is NaN (first 6 warmup rows)
    clean_df = df_full.dropna(subset=['target_temperature_1h', 'temperature_lag_6']).copy()
    
    X = clean_df[FEATURE_COLUMNS]
    y_temp = clean_df['target_temperature_1h']
    y_rain = clean_df['target_rain_1h'].astype(int)
    
    return X, y_temp, y_rain
