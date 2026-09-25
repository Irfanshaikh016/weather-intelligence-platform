'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WeatherObservation } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDegree } from '@/lib/utils';
import { Thermometer } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

interface TemperatureChartProps {
  observations: WeatherObservation[];
  range: '24h' | '7d' | '30d' | 'custom';
}

export function TemperatureChart({ observations, range }: TemperatureChartProps) {
  const mounted = useIsMounted();

  if (!observations || observations.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Temperature History
          </h2>
        </div>
        <EmptyState
          title="No Temperature Records"
          message="No historical observations recorded for this period yet. Data is gathered every 5 minutes."
        />
      </div>
    );
  }

  // Format data for chart
  const chartData = observations.map((obs) => {
    const d = new Date(obs.recorded_at);
    let label = '';
    if (range === '24h') {
      label = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
    }

    return {
      timestamp: obs.recorded_at,
      label,
      temperature: Number(obs.temperature),
      feels_like: Number(obs.feels_like),
    };
  });

  const temps = chartData.map((d) => d.temperature);
  const minTemp = Math.floor(Math.min(...temps) - 2);
  const maxTemp = Math.ceil(Math.max(...temps) + 2);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Temperature History
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Actual</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span>Feels Like</span>
          </span>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={[minTemp, maxTemp]}
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}°`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <div className="text-neutral-400 font-mono mb-1">{item.label}</div>
                        <div className="flex items-center gap-2 font-semibold text-cyan-300">
                          <span>Temperature:</span>
                          <span>{formatDegree(item.temperature)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-300">
                          <span>Feels Like:</span>
                          <span>{formatDegree(item.feels_like)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#22d3ee"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tempGradient)"
                name="Temperature"
              />
              <Area
                type="monotone"
                dataKey="feels_like"
                stroke="#fbbf24"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#feelsGradient)"
                name="Feels Like"
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
