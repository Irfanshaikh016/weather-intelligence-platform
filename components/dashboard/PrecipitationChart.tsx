'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { WeatherObservation, HourlyWeather } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloudRain, Sparkles, History, Droplets } from 'lucide-react';
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
  observations = [],
  hourlyForecast = [],
  totalPrecipitation = 0,
  range = '24h',
  forecastMode,
  onForecastModeChange,
}: PrecipitationChartProps) {
  const mounted = useIsMounted();
  const [internalMode, setInternalMode] = useState<'past' | 'forecast'>('forecast');

  const activeMode = forecastMode ?? internalMode;
  const setMode = onForecastModeChange ?? setInternalMode;

  const hasObservations = observations && observations.length > 0;
  const hasForecast = hourlyForecast && hourlyForecast.length > 0;

  // If past observations are empty but forecast is available, default to forecast
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
          message="No precipitation observations or forecast data available for this location."
        />
      </div>
    );
  }

  // Build chart items depending on effective mode
  let chartData: Array<{
    label: string;
    precipitation: number;
    probability: number;
  }> = [];

  let displayTotal = totalPrecipitation;
  let maxRainProb = 0;

  if (effectiveMode === 'forecast' && hasForecast) {
    const next24 = hourlyForecast.slice(0, 24);
    displayTotal = next24.reduce((acc, curr) => acc + (Number(curr.precipitation) || 0), 0);
    maxRainProb = Math.max(...next24.map((h) => Number(h.precipitation_probability) || 0));

    chartData = next24.map((item) => {
      const d = new Date(item.time);
      const label = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      return {
        label,
        precipitation: Math.round((Number(item.precipitation) || 0) * 10) / 10,
        probability: Math.round(Number(item.precipitation_probability) || 0),
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
        precipitation: Math.round((Number(obs.precipitation) || 0) * 10) / 10,
        probability: Math.round(Number(obs.precipitation_probability) || 0),
      };
    });
  }

  const maxPrecipVal = chartData.length > 0 ? Math.max(...chartData.map((d) => d.precipitation)) : 0;
  const precipYMax = Math.max(2, Math.ceil(maxPrecipVal + 0.5));

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

        <div className="flex items-center gap-2 flex-wrap">
          {effectiveMode === 'forecast' && (
            <span className="text-xs text-neutral-400">
              Peak Rain Chance: <strong className="text-cyan-300 font-mono">{maxRainProb}%</strong> •
            </span>
          )}
          <span className="text-xs text-neutral-400">
            {effectiveMode === 'forecast' ? '24h Expected Accumulation:' : 'Total Accumulation:'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-bold font-mono">
            {displayTotal.toFixed(1)} mm
          </span>
        </div>
      </div>

      {/* Subtitle status banner when rainfall is minimal */}
      {effectiveMode === 'forecast' && displayTotal === 0 && (
        <div className="mb-4 px-3 py-1.5 rounded-xl bg-cyan-950/30 border border-cyan-800/30 text-xs text-cyan-300 flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dry conditions expected: No significant precipitation projected for the next 24 hours.</span>
        </div>
      )}

      <div className="w-full h-64 sm:h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={25}
              />
              {/* Left YAxis: Precipitation Volume (mm) */}
              <YAxis
                yAxisId="left"
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, precipYMax]}
                tickFormatter={(val) => `${val} mm`}
              />
              {/* Right YAxis: Precipitation Probability (%) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#06b6d4"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
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
                          {effectiveMode === 'forecast' ? 'Projected Rain: ' : 'Rainfall: '}
                          {item.precipitation.toFixed(1)} mm
                        </div>
                        <div className="text-sky-300">
                          Rain Probability: <span className="font-bold">{item.probability}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />
              <Bar
                yAxisId="left"
                dataKey="precipitation"
                name="Rain Volume (mm)"
                fill={effectiveMode === 'forecast' ? '#0ea5e9' : '#38bdf8'}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="probability"
                name="Rain Chance (%)"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 2, fill: '#22d3ee' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-neutral-950/40 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
