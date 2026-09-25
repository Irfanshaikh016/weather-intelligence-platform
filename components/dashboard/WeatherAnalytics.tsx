'use client';

import React from 'react';
import { WeatherAnalytics as WeatherAnalyticsType } from '@/types/weather';
import { formatDegree } from '@/lib/utils';
import {
  Thermometer,
  ArrowUp,
  ArrowDown,
  Droplets,
  CloudRain,
  Wind,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

interface WeatherAnalyticsProps {
  analytics: WeatherAnalyticsType;
  range: '24h' | '7d' | '30d';
  onRangeChange: (range: '24h' | '7d' | '30d') => void;
  isLoading?: boolean;
}

export function WeatherAnalytics({
  analytics,
  range,
  onRangeChange,
  isLoading,
}: WeatherAnalyticsProps) {
  const rangeLabels: Record<string, string> = {
    '24h': '24-HOUR ANALYTICS',
    '7d': '7-DAY ANALYTICS',
    '30d': '30-DAY ANALYTICS',
  };

  const hasData = analytics.observation_count > 0;

  return (
    <div className="space-y-6">
      {/* Analytics Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
              {rangeLabels[range]}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Aggregated metrics calculated from stored historical observations
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              disabled={isLoading}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === r
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Key Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Average Temperature */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Average</span>
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-neutral-100">
            {hasData ? formatDegree(analytics.average_temperature) : '--'}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1">Mean temperature</span>
        </div>

        {/* Maximum Temperature */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Maximum</span>
            <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-300">
            {hasData ? formatDegree(analytics.max_temperature) : '--'}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1">Peak recorded</span>
        </div>

        {/* Minimum Temperature */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Minimum</span>
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300">
            {hasData ? formatDegree(analytics.min_temperature) : '--'}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1">Lowest recorded</span>
        </div>

        {/* Average Humidity */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-neutral-100">
            {hasData ? `${Math.round(analytics.average_humidity)}%` : '--'}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1">Average saturation</span>
        </div>

        {/* Total Rainfall */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Rainfall</span>
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-neutral-100">
            {hasData ? `${analytics.total_precipitation.toFixed(1)} mm` : '--'}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1">Cumulative rain</span>
        </div>

        {/* Maximum Wind */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Max Wind</span>
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-neutral-100">
            {hasData ? `${analytics.max_wind_speed.toFixed(1)} km/h` : '--'}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1">Maximum gust</span>
        </div>
      </div>

      {/* Weather Intelligence Derived Insights */}
      {hasData && (
        <div className="bg-gradient-to-r from-neutral-900/80 via-neutral-900/50 to-neutral-900/80 border border-neutral-800/90 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Atmospheric Synthesis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60 space-y-1.5">
              <span className="text-neutral-400 font-medium block">Selected Period Overview:</span>
              <p className="leading-relaxed">
                Average temperature during the selected period: <strong className="text-neutral-100 font-semibold">{formatDegree(analytics.average_temperature)}</strong>.
                Recorded thermal range spanned from <strong className="text-cyan-300">{formatDegree(analytics.min_temperature)}</strong> to <strong className="text-rose-300">{formatDegree(analytics.max_temperature)}</strong> with cumulative precipitation of <strong className="text-cyan-300">{analytics.total_precipitation.toFixed(1)} mm</strong>.
              </p>
            </div>

            {analytics.comparison ? (
              <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60 space-y-1.5">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Comparison with {analytics.comparison.previous_period_label}:</span>
                </span>
                <p className="leading-relaxed">
                  Average temperature was{' '}
                  <strong className={analytics.comparison.avg_temp_diff >= 0 ? 'text-rose-300' : 'text-cyan-300'}>
                    {analytics.comparison.avg_temp_diff >= 0 ? '+' : ''}
                    {analytics.comparison.avg_temp_diff}°C
                  </strong>{' '}
                  relative to the preceding cycle. Cumulative rainfall shifted by{' '}
                  <strong className="text-neutral-200">
                    {analytics.comparison.total_precip_diff >= 0 ? '+' : ''}
                    {analytics.comparison.total_precip_diff} mm
                  </strong>.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60 flex items-center text-neutral-400">
                <span>Comparative period baseline will emerge as ongoing observations accumulate.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
