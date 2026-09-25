'use client';

import React from 'react';
import { DailyWeather } from '@/types/weather';
import { WeatherIcon } from './WeatherIcon';
import { Calendar, Droplets, Sunrise, Sunset } from 'lucide-react';
import { formatDegree, formatTime } from '@/lib/utils';

interface DailyForecastProps {
  daily: DailyWeather[];
}

export function DailyForecast({ daily }: DailyForecastProps) {
  if (!daily || daily.length === 0) {
    return null;
  }

  // Calculate overall range for mini temperature bar visualization
  const allMax = Math.max(...daily.map((d) => d.max_temperature));
  const allMin = Math.min(...daily.map((d) => d.min_temperature));
  const tempRange = Math.max(1, allMax - allMin);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">
            7-Day Outlook
          </h2>
        </div>
        <span className="text-xs text-neutral-500">
          Weekly atmospheric trend
        </span>
      </div>

      <div className="space-y-3">
        {daily.map((day, idx) => {
          const dateObj = new Date(day.date);
          const isToday = idx === 0;
          const dayName = isToday
            ? 'Today'
            : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dateFormatted = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          // Bar calculations
          const leftPercent = Math.max(0, ((day.min_temperature - allMin) / tempRange) * 100);
          const widthPercent = Math.max(8, ((day.max_temperature - day.min_temperature) / tempRange) * 100);

          return (
            <div
              key={day.date}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all border ${
                isToday
                  ? 'bg-neutral-800/60 border-cyan-500/20'
                  : 'bg-neutral-950/40 border-neutral-800/60 hover:bg-neutral-800/30 hover:border-neutral-700/60'
              } gap-3 sm:gap-4`}
            >
              {/* Day & Date */}
              <div className="flex items-center gap-3 min-w-[120px]">
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${isToday ? 'text-cyan-400' : 'text-neutral-200'}`}>
                    {dayName}
                  </span>
                  <span className="text-xs text-neutral-500">{dateFormatted}</span>
                </div>
              </div>

              {/* Icon & Condition */}
              <div className="flex items-center gap-3 sm:min-w-[170px]">
                <div className="text-amber-400 flex-shrink-0">
                  <WeatherIcon name={day.icon} className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-neutral-300">
                    {day.condition}
                  </span>
                  {day.precipitation_probability > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                      <Droplets className="w-3 h-3" />
                      <span>{day.precipitation_probability}% precip</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Sun Times */}
              <div className="hidden md:flex items-center gap-4 text-xs text-neutral-400 min-w-[150px]">
                {day.sunrise && (
                  <span className="flex items-center gap-1">
                    <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                    <span>{formatTime(day.sunrise)}</span>
                  </span>
                )}
                {day.sunset && (
                  <span className="flex items-center gap-1">
                    <Sunset className="w-3.5 h-3.5 text-orange-400" />
                    <span>{formatTime(day.sunset)}</span>
                  </span>
                )}
              </div>

              {/* Min/Max Temperature with Visual Range Bar */}
              <div className="flex items-center gap-3 sm:min-w-[180px] justify-between sm:justify-end">
                <span className="text-xs font-medium text-neutral-400 w-10 text-right">
                  {formatDegree(day.min_temperature)}
                </span>
                
                {/* Visual temperature bar */}
                <div className="hidden sm:block w-24 h-1.5 bg-neutral-800 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-400 to-rose-400"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-neutral-100 w-10 text-left">
                  {formatDegree(day.max_temperature)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
