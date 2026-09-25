'use client';

import React from 'react';

export function CurrentWeatherSkeleton() {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
          <div className="h-6 w-36 bg-neutral-800 rounded-md" />
          <div className="h-16 w-32 bg-neutral-800 rounded-lg" />
          <div className="h-4 w-48 bg-neutral-800 rounded-md" />
        </div>
        <div className="w-24 h-24 bg-neutral-800 rounded-full" />
      </div>
      <div className="mt-8 pt-6 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-neutral-800/60 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="h-4 w-16 bg-neutral-800 rounded" />
          <div className="h-7 w-24 bg-neutral-800 rounded" />
        </div>
      ))}
    </div>
  );
}

export function HourlyForecastSkeleton() {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-44 bg-neutral-800 rounded mb-5" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="min-w-[90px] h-28 bg-neutral-800/50 rounded-xl flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function DailyForecastSkeleton() {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-40 bg-neutral-800 rounded mb-5" />
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-14 bg-neutral-800/40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-48 bg-neutral-800 rounded" />
        <div className="h-8 w-28 bg-neutral-800 rounded" />
      </div>
      <div className="bg-neutral-800/30 rounded-xl w-full" style={{ height: `${height}px` }} />
    </div>
  );
}

export function AnalyticsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="h-3 w-20 bg-neutral-800 rounded" />
          <div className="h-6 w-16 bg-neutral-800 rounded" />
          <div className="h-2 w-12 bg-neutral-800/60 rounded" />
        </div>
      ))}
    </div>
  );
}
