'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WeatherObservation, HourlyWeather } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wind, Navigation, Sparkles, History } from 'lucide-react';
import { formatWindDirection } from '@/lib/utils';
import { useIsMounted } from '@/hooks/useIsMounted';

interface WindAnalyticsProps {
  observations: WeatherObservation[];
  hourlyForecast?: HourlyWeather[];
  avgWindSpeed: number;
  maxWindSpeed: number;
  currentDirection?: number;
  range: '24h' | '7d' | '30d' | 'custom';
  forecastMode?: 'past' | 'forecast';
  onForecastModeChange?: (mode: 'past' | 'forecast') => void;
}

export function WindAnalytics({
  observations,
  hourlyForecast = [],
  avgWindSpeed,
  maxWindSpeed,
  currentDirection = 0,
  range,
  forecastMode,
  onForecastModeChange,
}: WindAnalyticsProps) {
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
          <Wind className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Wind Analytics
          </h2>
        </div>
        <EmptyState
          title="No Wind Velocity Data"
          message="Wind telemetry will populate as weather observations or forecasts are collected."
        />
      </div>
    );
  }

  let chartData: Array<{ label: string; speed: number; direction: number }> = [];
  let displayAvg = avgWindSpeed;
  let displayMax = maxWindSpeed;
  let displayDirection = currentDirection;

  if (effectiveMode === 'forecast' && hasForecast) {
    const next24 = hourlyForecast.slice(0, 24);
    const speeds = next24.map((h) => Number(h.wind_speed) || 0);
    const sumSpeed = speeds.reduce((a, b) => a + b, 0);

    displayAvg = Math.round((sumSpeed / (next24.length || 1)) * 10) / 10;
    displayMax = speeds.length > 0 ? Math.max(...speeds) : 0;
    displayDirection = next24[0]?.wind_direction ?? currentDirection;

    chartData = next24.map((item) => {
      const d = new Date(item.time);
      const label = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      return {
        label,
        speed: Number(item.wind_speed) || 0,
        direction: item.wind_direction,
      };
    });
  } else {
    chartData = observations.map((obs) => {
      const d = new Date(obs.recorded_at);
      const label =
        range === '24h'
          ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });

      return {
        label,
        speed: Number(obs.wind_speed),
        direction: obs.wind_direction,
      };
    });
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
              Wind Dynamics & Velocity
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

        {/* Stats Pills */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3 py-1 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">
              {effectiveMode === 'forecast' ? '24h Avg:' : 'Avg:'}
            </span>
            <span className="text-xs font-bold text-neutral-200">{displayAvg.toFixed(1)} km/h</span>
          </div>
          <div className="px-3 py-1 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">
              {effectiveMode === 'forecast' ? '24h Peak:' : 'Peak:'}
            </span>
            <span className="text-xs font-bold text-cyan-400">{displayMax.toFixed(1)} km/h</span>
          </div>
          <div className="px-3 py-1 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center gap-1.5">
            <Navigation
              className="w-3.5 h-3.5 text-emerald-400 transition-transform"
              style={{ transform: `rotate(${displayDirection}deg)` }}
            />
            <span className="text-xs font-bold text-neutral-200">
              {formatWindDirection(displayDirection)}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val} km/h`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <div className="text-neutral-400 font-mono mb-1">{item.label}</div>
                        <div className="font-semibold text-cyan-300">
                          {effectiveMode === 'forecast' ? 'Forecast Wind: ' : 'Wind Speed: '}
                          {item.speed} km/h
                        </div>
                        <div className="text-neutral-400 flex items-center gap-1">
                          Direction: <span className="text-emerald-400 font-medium">{formatWindDirection(item.direction)} ({item.direction}°)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="speed"
                stroke={effectiveMode === 'forecast' ? '#38bdf8' : '#06b6d4'}
                strokeWidth={2}
                dot={false}
                name="Wind Speed"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-neutral-950/40 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
