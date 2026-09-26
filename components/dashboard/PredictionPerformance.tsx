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
  Legend,
} from 'recharts';
import { MLPredictionResponse } from '@/lib/ml/types';
import { CheckCircle2, TrendingUp, Target, BarChart2 } from 'lucide-react';
import { formatDegree } from '@/lib/utils';
import { useIsMounted } from '@/hooks/useIsMounted';

interface PredictionPerformanceProps {
  predictionData: MLPredictionResponse | null;
  isLoading?: boolean;
}

export function PredictionPerformance({ predictionData, isLoading }: PredictionPerformanceProps) {
  const mounted = useIsMounted();

  if (isLoading || !predictionData) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 animate-pulse shadow-xl">
        <div className="h-6 w-48 bg-neutral-800 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="h-20 bg-neutral-800/40 rounded-xl" />
          <div className="h-20 bg-neutral-800/40 rounded-xl" />
          <div className="h-20 bg-neutral-800/40 rounded-xl" />
          <div className="h-20 bg-neutral-800/40 rounded-xl" />
        </div>
        <div className="h-64 bg-neutral-800/30 rounded-xl" />
      </div>
    );
  }

  const { performance, history, model } = predictionData;

  const chartData = history
    .filter((h) => h.actual_temperature !== null)
    .map((item) => {
      const d = new Date(item.target_time);
      const label = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return {
        label,
        predicted: item.predicted_temperature,
        actual: item.actual_temperature,
        error: item.error,
      };
    });

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold tracking-wider text-neutral-100 uppercase">
              ML Prediction Performance
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Empirical validation of next-hour predictions compared with ground-truth recorded telemetry
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400">
          Model: <span className="font-semibold text-neutral-200">{model.version}</span> ({model.type})
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            Mean Absolute Error
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-300">
            {performance.mae.toFixed(2)}°C
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Ground-truth test MAE</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            Root Mean Sq Error
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-blue-300">
            {performance.rmse.toFixed(2)}°C
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Outlier penalization</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Evaluated Windows
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-300">
            {performance.total_evaluated}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Verified target intervals</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Variance Explained
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-300">
            {(model.metrics.r2 * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">R² coefficient of determination</div>
        </div>
      </div>

      {/* Predicted vs Actual Chart */}
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-4">
          Predicted vs Actual Temperature (Telemetry Over Time)
        </h3>
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
                  tickFormatter={(val) => `${val}°`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <div className="text-neutral-400 font-mono mb-1">{item.label}</div>
                          <div className="font-semibold text-cyan-300">
                            Predicted: {formatDegree(item.predicted)}
                          </div>
                          <div className="font-semibold text-emerald-400">
                            Actual: {formatDegree(item.actual)}
                          </div>
                          <div className="text-neutral-400">
                            Error: <span className="font-mono text-amber-300">±{item.error}°C</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted Temperature"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#22d3ee' }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Recorded Temperature"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-neutral-950/40 rounded-xl animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
