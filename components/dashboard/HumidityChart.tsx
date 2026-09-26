'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WeatherObservation, HourlyWeather } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { Droplets, Sparkles, History } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

interface HumidityChartProps {
  observations: WeatherObservation[];
  hourlyForecast?: HourlyWeather[];
  range: '24h' | '7d' | '30d' | 'custom';
  forecastMode?: 'past' | 'forecast';
  onForecastModeChange?: (mode: 'past' | 'forecast') => void;
}

export function HumidityChart({
  observations,
  hourlyForecast = [],
  range,
  forecastMode,
  onForecastModeChange,
}: HumidityChartProps) {
  const mounted = useIsMounted();
  const [internalMode, setInternalMode] = useState<'past' | 'forecast'>('past');

  const activeMode = forecastMode ?? internalMode;
  const setMode = onForecastModeChange ?? setInternalMode;

  const hasObservations = observations && observations.length > 0;
  const hasForecast = hourlyForecast && hourlyForecast.length > 0;

  const effectiveMode = !hasObservations && hasForecast ? 'forecast' : activeMode;

  if (!hasObservations && !hasForecast) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Relative Humidity
          </h2>
        </div>
        <EmptyState
          title="No Humidity Data"
          message="Humidity measurements will display here once interval records or forecast feeds are available."
        />
      </div>
    );
  }

  let chartData: Array<{ label: string; humidity: number }> = [];
  let avgDisplayHumidity = 0;

  if (effectiveMode === 'forecast' && hasForecast) {
    const next24 = hourlyForecast.slice(0, 24);
    avgDisplayHumidity = Math.round(
      next24.reduce((acc, curr) => acc + (Number(curr.humidity) || 0), 0) / (next24.length || 1)
    );
    chartData = next24.map((item) => {
      const d = new Date(item.time);
      const label = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      return {
        label,
        humidity: Number(item.humidity) || 0,
      };
    });
  } else {
    avgDisplayHumidity = Math.round(
      observations.reduce((acc, curr) => acc + (Number(curr.humidity) || 0), 0) / (observations.length || 1)
    );
    chartData = observations.map((obs) => {
      const d = new Date(obs.recorded_at);
      const label =
        range === '24h'
          ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });

      return {
        label,
        humidity: Number(obs.humidity) || 0,
      };
    });
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
              Relative Humidity Trend
            </h2>
          </div>

          {/* Past / Future Day Mode Switcher */}
          {hasForecast && hasObservations && (
            <div className="inline-flex items-center p-0.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setMode('past')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  effectiveMode === 'past'
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <History className="w-3 h-3 text-neutral-400" />
                Past
              </button>
              <button
                type="button"
                onClick={() => setMode('forecast')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  effectiveMode === 'forecast'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Next 24h
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {effectiveMode === 'forecast' ? '24h Expected Avg:' : 'Average Saturation:'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-bold">
            {avgDisplayHumidity}%
          </span>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={25}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <div className="text-neutral-400 font-mono mb-1">{item.label}</div>
                        <div className="font-semibold text-cyan-300">
                          {effectiveMode === 'forecast' ? 'Forecast Humidity: ' : 'Humidity: '}
                          {item.humidity}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="humidity"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#humidityGradient)"
                name="Humidity"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-neutral-950/40 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
