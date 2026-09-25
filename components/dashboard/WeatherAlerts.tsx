'use client';

import React from 'react';
import { WeatherAlert } from '@/types/weather';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface WeatherAlertsProps {
  alerts?: WeatherAlert[];
}

export function WeatherAlerts({ alerts }: WeatherAlertsProps) {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        {hasAlerts ? (
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        )}
        <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
          Weather Advisories & Alerts
        </h2>
      </div>

      {hasAlerts ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{alert.headline || alert.event}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60 text-amber-300">
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-amber-300/80 leading-relaxed mt-2">
                {alert.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800/80 text-neutral-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400/80 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-neutral-300 font-medium">No active weather alerts available.</span>
            <span className="text-neutral-500 block mt-0.5">
              Normal atmospheric patterns observed across monitoring stations.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
