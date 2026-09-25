'use client';

import React from 'react';
import { CurrentWeather as CurrentWeatherType } from '@/types/weather';
import {
  CloudRain,
  Compass,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';
import { formatDegree, formatWindDirection } from '@/lib/utils';

interface WeatherMetricsProps {
  current: CurrentWeatherType;
}

export function WeatherMetrics({ current }: WeatherMetricsProps) {
  const tempDiff = Math.round((current.feels_like - current.temperature) * 10) / 10;
  const tempDiffLabel =
    tempDiff > 0.5
      ? `${tempDiff}° warmer due to humidity`
      : tempDiff < -0.5
      ? `${Math.abs(tempDiff)}° cooler due to wind`
      : 'Similar to actual temperature';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Precipitation Metric */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 hover:border-neutral-700/60 transition-all">
        <div className="flex items-center justify-between mb-3 text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Precipitation</span>
          <CloudRain className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-100">
          {current.precipitation} <span className="text-xs font-normal text-neutral-400">mm/h</span>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {current.precipitation > 0 ? 'Active precipitation observed' : 'No liquid precipitation in past hour'}
        </p>
      </div>

      {/* Feels Like Analysis */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 hover:border-neutral-700/60 transition-all">
        <div className="flex items-center justify-between mb-3 text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Apparent Feel</span>
          <Thermometer className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-100">
          {formatDegree(current.feels_like)}
        </div>
        <p className="text-xs text-neutral-500 mt-2">{tempDiffLabel}</p>
      </div>

      {/* Wind Dynamics */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 hover:border-neutral-700/60 transition-all">
        <div className="flex items-center justify-between mb-3 text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Wind Vector</span>
          <Compass className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
          <span>{current.wind_speed} <span className="text-xs font-normal text-neutral-400">km/h</span></span>
          <span className="text-sm font-semibold text-neutral-400">
            {formatWindDirection(current.wind_direction)}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Blowing from {current.wind_direction}° azimuth
        </p>
      </div>

      {/* UV Exposure */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 hover:border-neutral-700/60 transition-all">
        <div className="flex items-center justify-between mb-3 text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider">UV Exposure</span>
          <ShieldAlert className="w-4 h-4 text-violet-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-100">
          Index {current.uv_index}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {current.uv_index <= 2
            ? 'Safe exposure without protection'
            : current.uv_index <= 5
            ? 'Moderate risk, seek shade midday'
            : 'High risk, sunscreen and protection advised'}
        </p>
      </div>
    </div>
  );
}
