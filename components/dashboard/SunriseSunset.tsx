'use client';

import React from 'react';
import { Sunrise, Sunset, Clock, Sun } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface SunriseSunsetProps {
  sunrise?: string;
  sunset?: string;
  dayLengthSeconds?: number;
}

export function SunriseSunset({ sunrise, sunset, dayLengthSeconds }: SunriseSunsetProps) {
  if (!sunrise || !sunset) {
    return null;
  }

  const hours = dayLengthSeconds ? Math.floor(dayLengthSeconds / 3600) : 0;
  const minutes = dayLengthSeconds ? Math.floor((dayLengthSeconds % 3600) / 60) : 0;

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            Solar Ephemeris
          </h2>
        </div>
        {dayLengthSeconds ? (
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>
              Day length: <strong className="text-neutral-200">{hours}h {minutes}m</strong>
            </span>
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sunrise */}
        <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sunrise className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Sunrise
            </span>
            <div className="text-xl font-bold text-neutral-100 mt-0.5">
              {formatTime(sunrise)}
            </div>
            <span className="text-[11px] text-neutral-500">Dawn illumination</span>
          </div>
        </div>

        {/* Sunset */}
        <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Sunset className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Sunset
            </span>
            <div className="text-xl font-bold text-neutral-100 mt-0.5">
              {formatTime(sunset)}
            </div>
            <span className="text-[11px] text-neutral-500">Dusk twilight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
