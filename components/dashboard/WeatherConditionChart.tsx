'use client';

import React, { useState } from 'react';
import { WeatherConditionCount, HourlyWeather } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { PieChart as PieChartIcon, Sparkles, History } from 'lucide-react';
import { calculateForecastConditionDistribution } from '@/lib/analytics/weather';

interface WeatherConditionChartProps {
  distribution: WeatherConditionCount[];
  totalObservations: number;
  hourlyForecast?: HourlyWeather[];
  forecastMode?: 'past' | 'forecast';
  onForecastModeChange?: (mode: 'past' | 'forecast') => void;
}

export function WeatherConditionChart({
  distribution,
  totalObservations,
  hourlyForecast = [],
  forecastMode,
  onForecastModeChange,
}: WeatherConditionChartProps) {
  const [internalMode, setInternalMode] = useState<'past' | 'forecast'>('past');

  const activeMode = forecastMode ?? internalMode;
  const setMode = onForecastModeChange ?? setInternalMode;

  const hasHistorical = distribution && distribution.length > 0 && totalObservations > 0;
  const hasForecast = hourlyForecast && hourlyForecast.length > 0;

  const effectiveMode = !hasHistorical && hasForecast ? 'forecast' : activeMode;

  const forecastDistribution = React.useMemo(() => {
    if (!hasForecast) return [];
    return calculateForecastConditionDistribution(hourlyForecast.slice(0, 24));
  }, [hourlyForecast, hasForecast]);

  const activeDistribution = effectiveMode === 'forecast' ? forecastDistribution : distribution;
  const activeCount = effectiveMode === 'forecast' ? Math.min(24, hourlyForecast.length) : totalObservations;

  if (activeDistribution.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Weather Condition Distribution
          </h2>
        </div>
        <EmptyState
          title="No Condition Distribution"
          message="Condition frequency will be synthesized from recorded weather observations or forecasts."
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
              Weather Condition Distribution
            </h2>
          </div>

          {/* Past / Future Day Mode Switcher */}
          {hasForecast && hasHistorical && (
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

        <span className="text-xs text-neutral-400">
          {effectiveMode === 'forecast'
            ? 'Next 24 Hours Projections'
            : `${activeCount} recorded ${activeCount === 1 ? 'observation' : 'observations'}`}
        </span>
      </div>

      {/* Stacked visual representation bar */}
      <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden flex mb-6 border border-neutral-800">
        {activeDistribution.map((item) => (
          <div
            key={item.condition}
            className={`${getConditionColor(item.condition)} transition-all duration-500`}
            style={{ width: `${item.percentage}%` }}
            title={`${item.condition}: ${item.percentage}% (${item.count} hrs)`}
          />
        ))}
      </div>

      {/* Breakdown list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeDistribution.map((item) => (
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
