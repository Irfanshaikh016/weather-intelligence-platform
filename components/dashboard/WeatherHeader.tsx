'use client';

import React from 'react';
import { Location, LiveStatus, LocationSearchResult } from '@/types/weather';
import { LocationSelector } from './LocationSelector';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CloudLightning } from 'lucide-react';

interface WeatherHeaderProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
  onSelectSearchResult: (res: LocationSearchResult) => void;
  onSearch: (q: string) => void;
  searchResults: LocationSearchResult[];
  isSearching: boolean;
  onRequestGeolocation: () => void;
  isGeoLoading: boolean;
  geoError: string | null;
  onClearSearch: () => void;
  status: LiveStatus;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function WeatherHeader({
  locations,
  selectedLocation,
  onSelectLocation,
  onSelectSearchResult,
  onSearch,
  searchResults,
  isSearching,
  onRequestGeolocation,
  isGeoLoading,
  geoError,
  onClearSearch,
  status,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: WeatherHeaderProps) {
  return (
    <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight">
                  Weather Intelligence
                </h1>
                <span className="text-[10px] font-mono uppercase bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Atmospheric Monitoring & Predictive Analytics
              </p>
            </div>
          </div>

          {/* Location Selector & Status Controls */}
          <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
            <LocationSelector
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={onSelectLocation}
              onSelectSearchResult={onSelectSearchResult}
              onSearch={onSearch}
              searchResults={searchResults}
              isSearching={isSearching}
              onRequestGeolocation={onRequestGeolocation}
              isGeoLoading={isGeoLoading}
              geoError={geoError}
              onClearSearch={onClearSearch}
            />

            <StatusBadge
              status={status}
              lastUpdated={lastUpdated}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
