'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Location, LocationSearchResult } from '@/types/weather';
import { Search, MapPin, Navigation, Check, Loader2, X } from 'lucide-react';

interface LocationSelectorProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
  onSelectSearchResult: (result: LocationSearchResult) => void;
  onSearch: (query: string) => void;
  searchResults: LocationSearchResult[];
  isSearching: boolean;
  onRequestGeolocation: () => void;
  isGeoLoading: boolean;
  geoError: string | null;
  onClearSearch: () => void;
}

export function LocationSelector({
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
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        onSearch(query);
      } else {
        onClearSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch, onClearSearch]);

  const handleSelectLocation = (loc: Location) => {
    onSelectLocation(loc);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectSearchResult = (res: LocationSearchResult) => {
    onSelectSearchResult(res);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected location button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-200 transition-all text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="font-semibold text-neutral-100">
          {selectedLocation ? selectedLocation.city : 'Select Location'}
        </span>
        {selectedLocation?.country && (
          <span className="text-neutral-400 text-xs hidden sm:inline">
            , {selectedLocation.country}
          </span>
        )}
      </button>

      {/* Dropdown / Modal */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in-0 zoom-in-95 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search city (e.g. Pune, London)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  onClearSearch();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Browser Geolocation Button */}
          <button
            type="button"
            onClick={onRequestGeolocation}
            disabled={isGeoLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isGeoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>Use my current location</span>
          </button>

          {geoError && (
            <div className="mb-3 p-2 bg-rose-950/30 border border-rose-800/30 rounded-lg text-rose-300 text-xs">
              {geoError}
            </div>
          )}

          {/* Search Results */}
          {query.trim().length >= 2 ? (
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                Search Results
              </div>
              {isSearching ? (
                <div className="flex items-center justify-center py-6 text-neutral-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching locations...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((res) => (
                    <button
                      key={`${res.id}-${res.latitude}-${res.longitude}`}
                      type="button"
                      onClick={() => handleSelectSearchResult(res)}
                      className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-neutral-800/70 text-neutral-200 text-xs transition-colors"
                    >
                      <div>
                        <div className="font-medium text-neutral-100">{res.name}</div>
                        <div className="text-neutral-400 text-[11px]">
                          {[res.admin1, res.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500 py-4 text-center">
                  No matching cities found for &quot;{query}&quot;
                </div>
              )}
            </div>
          ) : (
            /* Curated / Saved Locations */
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                Saved & Monitored Locations
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {locations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/50 text-cyan-200 border border-cyan-800/40'
                          : 'hover:bg-neutral-800/70 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-neutral-500'}`} />
                        <span className="font-medium">{loc.city}</span>
                        {loc.country && (
                          <span className="text-neutral-400 text-[11px]">({loc.country})</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
