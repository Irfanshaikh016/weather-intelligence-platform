'use client';

import React from 'react';
import { WeatherConditionCount } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { PieChart as PieChartIcon } from 'lucide-react';

interface WeatherConditionChartProps {
  distribution: WeatherConditionCount[];
  totalObservations: number;
}

export function WeatherConditionChart({
  distribution,
  totalObservations,
}: WeatherConditionChartProps) {
  if (!distribution || distribution.length === 0 || totalObservations === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Condition Frequency
          </h2>
        </div>
        <EmptyState
          title="No Condition Distribution"
          message="Condition frequency will be synthesized from recorded weather observations."
        />
      </div>
    );
  }

  const getConditionColor = (category: string) => {
    switch (category) {
      case 'Clear':
        return 'bg-amber-400';
      case 'Partly Cloudy':
        return 'bg-sky-400';
      case 'Cloudy':
        return 'bg-neutral-400';
      case 'Rain':
        return 'bg-blue-400';
      case 'Heavy Rain':
        return 'bg-indigo-500';
      case 'Snow':
        return 'bg-cyan-200';
      case 'Thunderstorm':
        return 'bg-purple-400';
      case 'Fog':
        return 'bg-zinc-400';
      default:
        return 'bg-cyan-400';
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Weather Condition Distribution
          </h2>
        </div>
        <span className="text-xs text-neutral-500">
          {totalObservations} recorded {totalObservations === 1 ? 'observation' : 'observations'}
        </span>
      </div>

      {/* Stacked visual representation bar */}
      <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden flex mb-6 border border-neutral-800">
        {distribution.map((item) => (
          <div
            key={item.condition}
            className={`${getConditionColor(item.condition)} transition-all duration-500`}
            style={{ width: `${item.percentage}%` }}
            title={`${item.condition}: ${item.percentage}% (${item.count})`}
          />
        ))}
      </div>

      {/* Breakdown list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {distribution.map((item) => (
          <div
            key={item.condition}
            className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60"
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${getConditionColor(item.condition)}`} />
              <span className="text-xs font-medium text-neutral-200">{item.condition}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">({item.count} hrs)</span>
              <span className="font-bold text-neutral-100">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
