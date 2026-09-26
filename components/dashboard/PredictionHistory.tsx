'use client';

import React, { useState } from 'react';
import { MLPredictionResponse } from '@/lib/ml/types';
import { History, Calendar } from 'lucide-react';
import { formatDegree } from '@/lib/utils';

interface PredictionHistoryProps {
  predictionData: MLPredictionResponse | null;
  isLoading?: boolean;
}

export function PredictionHistory({ predictionData, isLoading }: PredictionHistoryProps) {
  const [filter, setFilter] = useState<'24h' | '7d' | '30d'>('24h');

  if (isLoading || !predictionData) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 animate-pulse shadow-xl">
        <div className="h-6 w-48 bg-neutral-800 rounded mb-6" />
        <div className="h-48 bg-neutral-800/40 rounded-xl" />
      </div>
    );
  }

  const { history } = predictionData;

  const filteredHistory = history.slice(filter === '24h' ? -8 : filter === '7d' ? -16 : -24);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold tracking-wider text-neutral-100 uppercase">
              Prediction Verification Audit
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Historical log of past predictions evaluated against actual recorded outcomes
          </p>
        </div>

        {/* Time filters */}
        <div className="inline-flex items-center p-1 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs self-start sm:self-auto">
          {(['24h', '7d', '30d'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg font-medium transition-all uppercase ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
              <th className="pb-3 px-3">Prediction Time</th>
              <th className="pb-3 px-3">Target Time</th>
              <th className="pb-3 px-3">Predicted</th>
              <th className="pb-3 px-3">Actual</th>
              <th className="pb-3 px-3">Error</th>
              <th className="pb-3 px-3">Rain Prob</th>
              <th className="pb-3 px-3 text-right">Model</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredHistory.map((item, idx) => {
              const predD = new Date(item.prediction_time);
              const targetD = new Date(item.target_time);

              const predStr = predD.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              const targetStr = targetD.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <tr key={idx} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="py-3 px-3 font-mono text-neutral-400">{predStr}</td>
                  <td className="py-3 px-3 font-mono text-neutral-200 font-medium">{targetStr}</td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                    {formatDegree(item.predicted_temperature)}
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    {item.actual_temperature !== null ? formatDegree(item.actual_temperature) : 'Pending'}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {item.error !== null ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.error <= 0.6
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : item.error <= 1.2
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                            : 'bg-red-950 text-red-300 border border-red-800/40'
                        }`}
                      >
                        ±{item.error}°C
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td className="py-3 px-3 text-sky-300 font-mono">
                    {item.predicted_rain_probability}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-neutral-400 text-[11px]">
                    {item.model_version}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
