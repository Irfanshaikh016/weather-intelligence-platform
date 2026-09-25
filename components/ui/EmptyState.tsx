'use client';

import React from 'react';
import { Database, CalendarClock } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: 'database' | 'calendar';
}

export function EmptyState({
  title = 'No Data Available',
  message = 'No historical records found for this period. Historical collection runs automatically via Vercel Cron every 5 minutes.',
  actionText,
  onAction,
  icon = 'database',
}: EmptyStateProps) {
  const IconComponent = icon === 'calendar' ? CalendarClock : Database;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-neutral-900/30 border border-neutral-800/80 rounded-2xl">
      <div className="w-12 h-12 rounded-full bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center mb-4 text-neutral-400">
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-medium text-neutral-300 mb-1">{title}</h3>
      <p className="text-xs text-neutral-500 max-w-sm leading-relaxed mb-4">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
