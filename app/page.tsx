'use client';

import React from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useWeather } from '@/hooks/useWeather';
import { useHistory } from '@/hooks/useHistory';
import { WeatherHeader } from '@/components/dashboard/WeatherHeader';
import { CurrentWeather } from '@/components/dashboard/CurrentWeather';
import { WeatherMetrics } from '@/components/dashboard/WeatherMetrics';
import { HourlyForecast } from '@/components/dashboard/HourlyForecast';
import { DailyForecast } from '@/components/dashboard/DailyForecast';
import { TemperatureChart } from '@/components/dashboard/TemperatureChart';
import { HumidityChart } from '@/components/dashboard/HumidityChart';
import { PrecipitationChart } from '@/components/dashboard/PrecipitationChart';
import { WindAnalytics } from '@/components/dashboard/WindAnalytics';
import { WeatherConditionChart } from '@/components/dashboard/WeatherConditionChart';
import { WeatherAnalytics } from '@/components/dashboard/WeatherAnalytics';
import { SunriseSunset } from '@/components/dashboard/SunriseSunset';
import { WeatherAlerts } from '@/components/dashboard/WeatherAlerts';
import { History, Sparkles } from 'lucide-react';
import {
  CurrentWeatherSkeleton,
  MetricsSkeleton,
  HourlyForecastSkeleton,
  DailyForecastSkeleton,
  ChartSkeleton,
  AnalyticsCardsSkeleton,
} from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export default function WeatherDashboardPage() {
  const {
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
    clearSearchResults,
  } = useLocation();

  const {
    weatherData,
    status,
    lastUpdated,
    error: weatherError,
    isLoading: isWeatherLoading,
    isRefreshing,
    refresh: refreshWeather,
  } = useWeather({
    location: selectedLocation,
  });

  const {
    history,
    range,
    setRange,
    isLoading: isHistoryLoading,
    error: historyError,
    refreshHistory,
  } = useHistory({
    locationId: selectedLocation?.id || null,
    latitude: selectedLocation?.latitude,
    longitude: selectedLocation?.longitude,
    initialRange: '24h',
  });

  const [analyticsTimelineMode, setAnalyticsTimelineMode] = React.useState<'past' | 'forecast'>('past');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 1. Dashboard Header with Location & Status */}
      <WeatherHeader
        locations={locations}
        selectedLocation={selectedLocation}
        onSelectLocation={selectLocation}
        onSelectSearchResult={selectSearchResult}
        onSearch={searchLocations}
        searchResults={searchResults}
        isSearching={isSearching}
        onRequestGeolocation={requestCurrentLocation}
        isGeoLoading={isGeoLoading}
        geoError={geoError}
        onClearSearch={clearSearchResults}
        status={status}
        lastUpdated={lastUpdated}
        onRefresh={() => {
          refreshWeather();
          refreshHistory();
        }}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Weather API Error Notification Banner */}
        {weatherError && !weatherData && (
          <ErrorState
            title="Weather Feed Interrupted"
            message={weatherError}
            onRetry={refreshWeather}
          />
        )}

        {/* Historical Service Notice Banner */}
        {historyError && !history && (
          <ErrorState
            compact
            title="Historical Data Status"
            message={historyError}
            onRetry={refreshHistory}
          />
        )}

        {/* 2. Current Weather Card */}
        {isWeatherLoading && !weatherData ? (
          <CurrentWeatherSkeleton />
        ) : weatherData ? (
          <CurrentWeather
            current={weatherData.current}
            todayDaily={weatherData.daily[0]}
            cityName={selectedLocation?.city}
            countryName={selectedLocation?.country || undefined}
          />
        ) : null}

        {/* 3. Secondary Atmospheric Metrics */}
        {isWeatherLoading && !weatherData ? (
          <MetricsSkeleton />
        ) : weatherData ? (
          <WeatherMetrics current={weatherData.current} />
        ) : null}

        {/* 4. Temperature History Chart (Primary Time-Series Visualization) */}
        {isHistoryLoading && !history ? (
          <ChartSkeleton height={320} />
        ) : (
          <TemperatureChart
            observations={history?.observations || []}
            hourlyForecast={weatherData?.hourly}
            range={range}
            forecastMode={analyticsTimelineMode}
            onForecastModeChange={setAnalyticsTimelineMode}
          />
        )}

        {/* 5. Hourly Forecast (Next 24 Hours) */}
        {isWeatherLoading && !weatherData ? (
          <HourlyForecastSkeleton />
        ) : weatherData ? (
          <HourlyForecast hourly={weatherData.hourly} />
        ) : null}

        {/* 6. 7-Day Daily Forecast */}
        {isWeatherLoading && !weatherData ? (
          <DailyForecastSkeleton />
        ) : weatherData ? (
          <DailyForecast daily={weatherData.daily} />
        ) : null}

        {/* 7. Historical Analytics Summary & Trend Cards */}
        {isHistoryLoading && !history ? (
          <AnalyticsCardsSkeleton />
        ) : history ? (
          <WeatherAnalytics
            analytics={history.analytics}
            range={range}
            onRangeChange={setRange}
            isLoading={isHistoryLoading}
          />
        ) : null}

        {/* Section Header with Synchronized Timeline Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              Atmospheric Dynamics & Projections
            </h3>
            <p className="text-xs text-neutral-400">
              Interactive telemetry: inspect historical records or preview next 24-hour forecasts across all dynamics.
            </p>
          </div>
          <div className="inline-flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAnalyticsTimelineMode('past')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                analyticsTimelineMode === 'past'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-neutral-400" />
              Recorded Telemetry
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTimelineMode('forecast')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                analyticsTimelineMode === 'forecast'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Next 24H Forecast
            </button>
          </div>
        </div>

        {/* 8. Deep-Dive Atmospheric Charts (Humidity & Precipitation) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isHistoryLoading && !history ? (
            <>
              <ChartSkeleton height={260} />
              <ChartSkeleton height={260} />
            </>
          ) : (
            <>
              <HumidityChart
                observations={history?.observations || []}
                hourlyForecast={weatherData?.hourly}
                range={range}
                forecastMode={analyticsTimelineMode}
                onForecastModeChange={setAnalyticsTimelineMode}
              />
              <PrecipitationChart
                observations={history?.observations || []}
                hourlyForecast={weatherData?.hourly}
                totalPrecipitation={history?.analytics.total_precipitation || 0}
                range={range}
                forecastMode={analyticsTimelineMode}
                onForecastModeChange={setAnalyticsTimelineMode}
              />
            </>
          )}
        </div>

        {/* 9. Wind Telemetry & Weather Condition Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isHistoryLoading && !history ? (
            <>
              <ChartSkeleton height={260} />
              <ChartSkeleton height={260} />
            </>
          ) : (
            <>
              <WindAnalytics
                observations={history?.observations || []}
                hourlyForecast={weatherData?.hourly}
                avgWindSpeed={history?.analytics.average_wind_speed || 0}
                maxWindSpeed={history?.analytics.max_wind_speed || 0}
                currentDirection={weatherData?.current.wind_direction}
                range={range}
                forecastMode={analyticsTimelineMode}
                onForecastModeChange={setAnalyticsTimelineMode}
              />
              <WeatherConditionChart
                distribution={history?.analytics.condition_distribution || []}
                totalObservations={history?.analytics.observation_count || 0}
                hourlyForecast={weatherData?.hourly}
                forecastMode={analyticsTimelineMode}
                onForecastModeChange={setAnalyticsTimelineMode}
              />
            </>
          )}
        </div>

        {/* 10. Solar Ephemeris & Weather Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SunriseSunset
            sunrise={weatherData?.daily[0]?.sunrise}
            sunset={weatherData?.daily[0]?.sunset}
            dayLengthSeconds={weatherData?.daily[0]?.day_length_seconds}
          />
          <WeatherAlerts alerts={weatherData?.alerts} />
        </div>
      </main>

      {/* Platform Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 mt-12 py-8 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">Weather Intelligence Platform</span>
            <span>•</span>
            <span>Vercel + Next.js App Router + Supabase + Vercel Cron</span>
          </div>
          <div className="text-neutral-500">
            Automated Cron collection every 5 minutes • Normalized WMO telemetry
          </div>
        </div>
      </footer>
    </div>
  );
}
