'use client';

import React from 'react';
import { CurrentWeather as CurrentWeatherType, DailyWeather } from '@/types/weather';
import { WeatherIcon } from './WeatherIcon';
import {
  Droplets,
  Wind,
  Gauge,
  Eye,
  SunMedium,
  Cloud,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatDegree, formatWindDirection } from '@/lib/utils';

interface CurrentWeatherProps {
  current: CurrentWeatherType;
  todayDaily?: DailyWeather;
  cityName?: string;
  countryName?: string;
}

export function CurrentWeather({
  current,
  todayDaily,
  cityName,
  countryName,
}: CurrentWeatherProps) {
  return (
    <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
      {/* Background ambient glow based on condition */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main header & temperature block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">
              Current Conditions
            </span>
            {cityName && (
              <span className="text-xs text-neutral-400">
                • {cityName}{countryName ? `, ${countryName}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-neutral-100">
              {formatDegree(current.temperature)}
            </span>
            <div className="flex flex-col text-sm text-neutral-400">
              <span className="text-base font-semibold text-neutral-200">
                {current.condition}
              </span>
              <span>
                Feels like <strong className="text-neutral-300 font-medium">{formatDegree(current.feels_like)}</strong>
              </span>
            </div>
          </div>

          {/* Today's High / Low Range */}
          {todayDaily && (
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
                <span>High: {formatDegree(todayDaily.max_temperature)}</span>
              </span>
              <span className="flex items-center gap-1">
                <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Low: {formatDegree(todayDaily.min_temperature)}</span>
              </span>
              {todayDaily.precipitation_probability > 0 && (
                <span className="text-cyan-400 font-medium">
                  {todayDaily.precipitation_probability}% precip
                </span>
              )}
            </div>
          )}
        </div>

        {/* Condition Icon badge */}
        <div className="flex flex-col items-center justify-center p-5 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl shadow-inner text-amber-400">
          <WeatherIcon
            name={current.icon}
            isDay={current.is_day}
            className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_15px_rgba(251,191,36,0.25)]"
          />
          <span className="mt-2 text-xs font-medium text-neutral-300 capitalize text-center">
            {current.condition}
          </span>
        </div>
      </div>

      {/* Grid of Key Atmospheric Metrics */}
      <div className="mt-8 pt-6 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative z-10">
        {/* Humidity */}
        <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-neutral-700/60 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100">{current.humidity}%</div>
        </div>

        {/* Wind */}
        <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-neutral-700/60 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Wind</span>
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100">
            {current.wind_speed} <span className="text-xs font-normal text-neutral-400">km/h</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {formatWindDirection(current.wind_direction)} ({current.wind_direction}°)
          </div>
        </div>

        {/* Pressure */}
        <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-neutral-700/60 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Pressure</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100">
            {current.pressure} <span className="text-xs font-normal text-neutral-400">hPa</span>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-neutral-700/60 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Visibility</span>
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100">
            {current.visibility} <span className="text-xs font-normal text-neutral-400">km</span>
          </div>
        </div>

        {/* UV Index */}
        <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-neutral-700/60 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">UV Index</span>
            <SunMedium className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100">
            {current.uv_index}{' '}
            <span className="text-xs font-normal text-neutral-400">
              {current.uv_index <= 2 ? 'Low' : current.uv_index <= 5 ? 'Mod' : current.uv_index <= 7 ? 'High' : 'Very High'}
            </span>
          </div>
        </div>

        {/* Cloud Cover */}
        <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-neutral-700/60 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Cloud Cover</span>
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100">{current.cloud_cover}%</div>
        </div>
      </div>
    </div>
  );
}
