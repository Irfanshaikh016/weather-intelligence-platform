'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WeatherObservation } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloudRain } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

interface PrecipitationChartProps {
  observations: WeatherObservation[];
  totalPrecipitation: number;
  range: '24h' | '7d' | '30d' | 'custom';
}

export function PrecipitationChart({
  observations,
  totalPrecipitation,
  range,
}: PrecipitationChartProps) {
  const mounted = useIsMounted();

  if (!observations || observations.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Precipitation History
          </h2>
        </div>
        <EmptyState
          title="No Rainfall Data"
          message="No precipitation observations recorded for this period yet."
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
      precipitation: Number(obs.precipitation) || 0,
    };
  });

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Precipitation Volume
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Total Accumulation:</span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-bold">
            {totalPrecipitation.toFixed(1)} mm
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
                minTickGap={30}
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
                          Precipitation: {item.precipitation.toFixed(1)} mm
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="precipitation"
                fill="#38bdf8"
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
