'use client';

import React from 'react';
import { HourlyWeather } from '@/types/weather';
import { WeatherIcon } from './WeatherIcon';
import { Droplets, Wind, Clock } from 'lucide-react';
import { formatDegree, formatTime } from '@/lib/utils';

interface HourlyForecastProps {
  hourly: HourlyWeather[];
}

export function HourlyForecast({ hourly }: HourlyForecastProps) {
  if (!hourly || hourly.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            24-Hour Forecast
          </h2>
        </div>
        <span className="text-xs text-neutral-500 hidden sm:inline">
          Hourly atmospheric forecast
        </span>
      </div>

      {/* Horizontal scroll strip with smooth scrollbar */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {hourly.map((item, idx) => {
          const dateObj = new Date(item.time);
          const isNow = idx === 0;
          const timeLabel = isNow ? 'Now' : formatTime(dateObj, { hour: 'numeric', hour12: true });

          return (
            <div
              key={`${item.time}-${idx}`}
              className={`flex flex-col items-center justify-between p-3.5 rounded-2xl min-w-[94px] flex-shrink-0 transition-all border ${
                isNow
                  ? 'bg-neutral-800/80 border-cyan-500/30 shadow-lg shadow-cyan-950/20'
                  : 'bg-neutral-950/50 border-neutral-800/70 hover:border-neutral-700 hover:bg-neutral-800/40'
              }`}
            >
              {/* Time */}
              <span className={`text-xs font-medium mb-2 ${isNow ? 'text-cyan-400 font-bold' : 'text-neutral-400'}`}>
                {timeLabel}
              </span>

              {/* Icon */}
              <div className="my-1 text-amber-400">
                <WeatherIcon name={item.icon} className="w-7 h-7" />
              </div>

              {/* Temperature */}
              <span className="text-base font-bold text-neutral-100 mt-1">
                {formatDegree(item.temperature)}
              </span>

              {/* Rain Probability & Wind */}
              <div className="mt-3 pt-2 border-t border-neutral-800/80 w-full flex flex-col items-center gap-1 text-[11px]">
                <div className="flex items-center gap-1 text-cyan-400">
                  <Droplets className="w-3 h-3" />
                  <span>{item.precipitation_probability}%</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400">
                  <Wind className="w-3 h-3 text-neutral-500" />
                  <span>{item.wind_speed} km/h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
