'use client';

import { useState, useEffect, useCallback } from 'react';
import { Location, LocationSearchResult } from '@/types/weather';

function createUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useLocation() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Load initial locations asynchronously without synchronous effect setState
  useEffect(() => {
    let active = true;

    fetch('/api/locations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const locs: Location[] = data.locations || [];
        setLocations(locs);
        if (locs.length > 0) {
          const pune = locs.find((l) => l.city.toLowerCase() === 'pune');
          setSelectedLocation((curr) => curr || pune || locs[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load initial locations:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Search locations by query
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/locations?search=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Select an existing location
  const selectLocation = useCallback((location: Location) => {
    setSelectedLocation(location);
    setSearchResults([]);
  }, []);

  // Select a search result and save it as an active location
  const selectSearchResult = useCallback(async (result: LocationSearchResult) => {
    const existing = locations.find(
      (l) => Math.abs(l.latitude - result.latitude) < 0.05 && Math.abs(l.longitude - result.longitude) < 0.05
    );

    if (existing) {
      setSelectedLocation(existing);
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: result.name,
          country: result.country,
          region: result.admin1,
          latitude: result.latitude,
          longitude: result.longitude,
          timezone: result.timezone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const savedLoc: Location = data.location;
        setLocations((prev) => [savedLoc, ...prev]);
        setSelectedLocation(savedLoc);
      } else {
        const tempLoc: Location = {
          id: createUUID(),
          city: result.name,
          country: result.country,
          region: result.admin1 || null,
          latitude: result.latitude,
          longitude: result.longitude,
          timezone: result.timezone,
          is_active: true,
        };
        setSelectedLocation(tempLoc);
      }
    } catch {
      const tempLoc: Location = {
        id: createUUID(),
        city: result.name,
        country: result.country,
        region: result.admin1 || null,
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone,
        is_active: true,
      };
      setSelectedLocation(tempLoc);
    } finally {
      setSearchResults([]);
    }
  }, [locations]);

  // Request browser geolocation with explicit user action
  const requestCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const roundedLat = Math.round(latitude * 10000) / 10000;
        const roundedLon = Math.round(longitude * 10000) / 10000;

        try {
          const res = await fetch(`/api/locations?search=${roundedLat},${roundedLon}`);
          let cityName = 'Current Location';
          let countryName = '';

          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              cityName = data.results[0].name;
              countryName = data.results[0].country || '';
            }
          }

          const userLoc: Location = {
            id: createUUID(),
            city: cityName,
            country: countryName,
            region: null,
            latitude: roundedLat,
            longitude: roundedLon,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            is_active: true,
          };

          setSelectedLocation(userLoc);
        } catch {
          const userLoc: Location = {
            id: createUUID(),
            city: 'My Location',
            country: '',
            region: null,
            latitude: roundedLat,
            longitude: roundedLon,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            is_active: true,
          };
          setSelectedLocation(userLoc);
        } finally {
          setIsGeoLoading(false);
        }
      },
      (err) => {
        setIsGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. Continuing with selected location.');
        } else {
          setGeoError('Unable to retrieve your current location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return {
    locations,
    selectedLocation,
    searchResults,
    isSearching,
    isGeoLoading,
    geoError,
    searchLocations,
    selectLocation,
    selectSearchResult,
    requestCurrentLocation,
    clearSearchResults: () => setSearchResults([]),
  };
}
