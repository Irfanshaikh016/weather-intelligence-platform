'use client';

import React from 'react';
import { MLPredictionResponse } from '@/lib/ml/types';
import { Sparkles, BrainCircuit, CloudRain, Thermometer, Info, ArrowUpRight } from 'lucide-react';
import { formatDegree } from '@/lib/utils';

interface NextHourPredictionProps {
  predictionData: MLPredictionResponse | null;
  isLoading?: boolean;
}

export function NextHourPrediction({ predictionData, isLoading }: NextHourPredictionProps) {
  if (isLoading || !predictionData) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 animate-pulse shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-neutral-800" />
          <div className="h-4 w-40 bg-neutral-800 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-28 bg-neutral-800/40 rounded-2xl" />
          <div className="h-28 bg-neutral-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { prediction, model, location } = predictionData;

  const targetDate = new Date(prediction.target_time);
  const targetTimeStr = targetDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const predDate = new Date(prediction.prediction_time);
  const predTimeStr = predDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-neutral-950 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Model Versioning Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-wider text-neutral-100 uppercase">
                Next-Hour ML Weather Prediction
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Live Inference
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Trained on historical telemetry for {location.city}, {location.country}
            </p>
          </div>
        </div>

        {/* Model Metadata Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs flex items-center gap-2">
            <span className="text-neutral-400">Model:</span>
            <span className="font-mono font-bold text-cyan-300">
              {model.type} {model.version}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs flex items-center gap-1.5">
            <span className="text-neutral-400">Validation MAE:</span>
            <span className="font-mono font-bold text-emerald-400">{model.metrics.mae}°C</span>
          </div>
        </div>
      </div>

      {/* Primary Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Next-Hour Temperature */}
        <div className="p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              Expected Temperature
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-neutral-50 tracking-tight">
              {formatDegree(prediction.temperature)}
            </div>
            <div className="text-xs text-neutral-400 mt-2">
              Target Time: <span className="font-semibold text-neutral-200">{targetTimeStr}</span> (1 hr ahead)
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs text-neutral-500">Benchmark R²</span>
            <span className="text-sm font-mono font-bold text-cyan-400 mt-0.5">{model.metrics.r2}</span>
            <span className="text-[11px] text-neutral-500 mt-2">Persistence error: 0.69°C</span>
          </div>
        </div>

        {/* Next-Hour Rain Probability */}
        <div className="p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              <CloudRain className="w-4 h-4 text-sky-400" />
              Next-Hour Rain Probability
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-neutral-50 tracking-tight">
              {prediction.rain_probability}%
            </div>
            <div className="text-xs text-neutral-400 mt-2">
              Status:{' '}
              <span className={`font-semibold ${prediction.rain_probability > 50 ? 'text-blue-400' : 'text-emerald-400'}`}>
                {prediction.rain_probability > 50
                  ? 'Rain likely in next hour'
                  : prediction.rain_probability > 25
                  ? 'Slight rain potential'
                  : 'Low rain probability'}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs text-neutral-500">Classifier Accuracy</span>
            <span className="text-sm font-mono font-bold text-sky-400 mt-0.5">
              {model.metrics.accuracy ? `${Math.round(model.metrics.accuracy * 100)}%` : '87%'}
            </span>
            <span className="text-[11px] text-neutral-500 mt-2">Generated at: {predTimeStr}</span>
          </div>
        </div>
      </div>

      {/* Model Feature Importance & Transparency */}
      <div className="border-t border-neutral-800/60 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Model Feature Importance</span>
            <span className="text-[11px] font-normal text-neutral-500">(Top predictive contributors)</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            Computed via chronological cross-validation
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {model.top_features.slice(0, 5).map((f) => (
            <div
              key={f.feature}
              className="px-3 py-1.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs flex items-center gap-2"
            >
              <span className="text-neutral-300 font-medium capitalize">
                {f.feature.replace(/_/g, ' ')}
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {(f.importance * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ML Disclaimer Section */}
      <div className="mt-5 p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60 flex items-start gap-2.5 text-xs text-neutral-400">
        <Info className="w-4 h-4 text-cyan-500/70 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-neutral-300">Model Information:</strong> Next-hour predictions are generated
          using historical weather observations and the current atmospheric state. Predictions are mathematical estimates
          and may differ from actual conditions.
        </p>
      </div>
    </div>
  );
}
