'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WeatherObservation } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wind, Navigation } from 'lucide-react';
import { formatWindDirection } from '@/lib/utils';
import { useIsMounted } from '@/hooks/useIsMounted';

interface WindAnalyticsProps {
  observations: WeatherObservation[];
  avgWindSpeed: number;
  maxWindSpeed: number;
  currentDirection?: number;
  range: '24h' | '7d' | '30d' | 'custom';
}

export function WindAnalytics({
  observations,
  avgWindSpeed,
  maxWindSpeed,
  currentDirection = 0,
  range,
}: WindAnalyticsProps) {
  const mounted = useIsMounted();

  if (!observations || observations.length === 0) {
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
          message="Wind telemetry will populate as weather observations are collected."
        />
      </div>
    );
  }

  const chartData = observations.map((obs) => {
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

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Wind Dynamics & Velocity
          </h2>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">Avg:</span>
            <span className="text-xs font-bold text-neutral-200">{avgWindSpeed.toFixed(1)} km/h</span>
          </div>
          <div className="px-3 py-1 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">Peak:</span>
            <span className="text-xs font-bold text-cyan-400">{maxWindSpeed.toFixed(1)} km/h</span>
          </div>
          <div className="px-3 py-1 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center gap-1.5">
            <Navigation
              className="w-3.5 h-3.5 text-emerald-400 transition-transform"
              style={{ transform: `rotate(${currentDirection}deg)` }}
            />
            <span className="text-xs font-bold text-neutral-200">
              {formatWindDirection(currentDirection)}
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
                minTickGap={30}
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
                          Speed: {item.speed} km/h
                        </div>
                        <div className="text-neutral-400">
                          Direction: {formatWindDirection(item.direction)} ({item.direction}°)
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
                stroke="#34d399"
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
