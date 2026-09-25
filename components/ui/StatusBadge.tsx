'use client';

import React, { useState, useEffect } from 'react';
import { LiveStatus } from '@/types/weather';
import { RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: LiveStatus;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function StatusBadge({ status, lastUpdated, onRefresh, isRefreshing }: StatusBadgeProps) {
  const [timeAgo, setTimeAgo] = useState<string>('Syncing...');

  useEffect(() => {
    if (!lastUpdated) {
      return;
    }

    const updateLabel = () => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (seconds < 10) setTimeAgo('Just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`);
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getStatusConfig = () => {
    switch (status) {
      case 'LIVE':
        return {
          label: 'LIVE',
          dotClass: 'bg-emerald-500 animate-pulse',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'UPDATING':
        return {
          label: 'UPDATING',
          dotClass: 'bg-cyan-500',
          badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        };
      case 'STALE':
        return {
          label: 'STALE',
          dotClass: 'bg-amber-500',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'ERROR':
        return {
          label: 'ERROR',
          dotClass: 'bg-rose-500',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border transition-all duration-300 ${config.badgeClass}`}
        role="status"
        aria-label={`System status: ${config.label}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
        <span>{config.label}</span>
      </div>

      <div className="text-xs text-neutral-400 flex items-center gap-1.5">
        <span>Updated {timeAgo}</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
            title="Refresh now"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
