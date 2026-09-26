'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WeatherObservation, HourlyWeather } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloudRain, Sparkles, History } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

interface PrecipitationChartProps {
  observations: WeatherObservation[];
  hourlyForecast?: HourlyWeather[];
  totalPrecipitation: number;
  range: '24h' | '7d' | '30d' | 'custom';
  forecastMode?: 'past' | 'forecast';
  onForecastModeChange?: (mode: 'past' | 'forecast') => void;
}

export function PrecipitationChart({
  observations,
  hourlyForecast = [],
  totalPrecipitation,
  range,
  forecastMode,
  onForecastModeChange,
}: PrecipitationChartProps) {
  const mounted = useIsMounted();
  const [internalMode, setInternalMode] = useState<'past' | 'forecast'>('past');

  const activeMode = forecastMode ?? internalMode;
  const setMode = onForecastModeChange ?? setInternalMode;

  const hasObservations = observations && observations.length > 0;
  const hasForecast = hourlyForecast && hourlyForecast.length > 0;

  // Fallback to forecast if past observations aren't ready yet
  const effectiveMode = !hasObservations && hasForecast ? 'forecast' : activeMode;

  if (!hasObservations && !hasForecast) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Precipitation Volume
          </h2>
        </div>
        <EmptyState
          title="No Rainfall Data"
          message="No precipitation observations or forecast data available for this period."
        />
      </div>
    );
  }

  // Build chart items depending on effective mode
  let chartData: Array<{ label: string; precipitation: number; probability?: number }> = [];
  let displayTotal = totalPrecipitation;

  if (effectiveMode === 'forecast' && hasForecast) {
    const next24 = hourlyForecast.slice(0, 24);
    displayTotal = next24.reduce((acc, curr) => acc + (Number(curr.precipitation) || 0), 0);
    chartData = next24.map((item) => {
      const d = new Date(item.time);
      const label = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      return {
        label,
        precipitation: Number(item.precipitation) || 0,
        probability: item.precipitation_probability,
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
        precipitation: Number(obs.precipitation) || 0,
        probability: obs.precipitation_probability ?? undefined,
      };
    });
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
              Precipitation Volume
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
            {effectiveMode === 'forecast' ? '24h Projected Rain:' : 'Total Accumulation:'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-bold">
            {displayTotal.toFixed(1)} mm
          </span>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                tickFormatter={(val) => `${val} mm`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <div className="text-neutral-400 font-mono mb-1">{item.label}</div>
                        <div className="font-semibold text-cyan-300">
                          {effectiveMode === 'forecast' ? 'Forecast Rain: ' : 'Precipitation: '}
                          {item.precipitation.toFixed(1)} mm
                        </div>
                        {item.probability !== undefined && (
                          <div className="text-neutral-400">
                            Rain Chance: <span className="text-sky-300 font-medium">{item.probability}%</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="precipitation"
                fill={effectiveMode === 'forecast' ? '#0ea5e9' : '#38bdf8'}
                radius={[4, 4, 0, 0]}
                name="Precipitation"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-neutral-950/40 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
