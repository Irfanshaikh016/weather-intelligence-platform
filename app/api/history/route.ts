import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isValidUUID, isValidHistoryRange, isValidIsoDate, isValidLatitude, isValidLongitude } from '@/lib/validation';
import { computeWeatherAnalytics } from '@/lib/analytics/weather';
import { fetchHistoricalFromOpenMeteo } from '@/lib/weather/client';
import { WeatherHistory, WeatherObservation } from '@/types/weather';

export const dynamic = 'force-dynamic';

const KNOWN_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'b1b51075-8025-4202-b054-e0eb29241511': { lat: 18.5204, lon: 73.8567 }, // Pune
  'b1b51075-8025-4202-b054-e0eb29241512': { lat: 19.0760, lon: 72.8777 }, // Mumbai
  'b1b51075-8025-4202-b054-e0eb29241513': { lat: 28.6139, lon: 77.2090 }, // Delhi
  'b1b51075-8025-4202-b054-e0eb29241514': { lat: 12.9716, lon: 77.5946 }, // Bengaluru
  'b1b51075-8025-4202-b054-e0eb29241515': { lat: 51.5074, lon: -0.1278 }, // London
  'b1b51075-8025-4202-b054-e0eb29241516': { lat: 40.7128, lon: -74.0060 }, // New York
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    if (!isValidUUID(locationId)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'A valid location UUID is required.',
        },
        { status: 400 }
      );
    }
    const range = searchParams.get('range') || '24h';
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    // Determine query time bounds
    const now = new Date();
    let startDate: Date;
    const endDate = endParam && isValidIsoDate(endParam) ? new Date(endParam) : now;
    let queryRange: '24h' | '7d' | '30d' | 'custom' = '24h';

    if (startParam && isValidIsoDate(startParam)) {
      startDate = new Date(startParam);
      queryRange = 'custom';
    } else if (isValidHistoryRange(range)) {
      queryRange = range;
      if (range === '24h') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (range === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Range must be one of: 24h, 7d, 30d, or valid ISO start/end parameters.',
        },
        { status: 400 }
      );
    }

    // Resolve coordinates reliably
    let latitude: number = isValidLatitude(latParam) ? parseFloat(latParam!) : 18.5204;
    let longitude: number = isValidLongitude(lonParam) ? parseFloat(lonParam!) : 73.8567;

    if (!isValidLatitude(latParam) && KNOWN_COORDINATES[locationId]) {
      latitude = KNOWN_COORDINATES[locationId].lat;
      longitude = KNOWN_COORDINATES[locationId].lon;
    }

    const supabase = createServerSupabaseClient();
    let observations: WeatherObservation[] = [];
    let locationData: { id: string; latitude: number; longitude: number } | null = null;

    if (supabase && isValidUUID(locationId)) {
      try {
        const { data: loc } = await supabase
          .from('locations')
          .select('id, latitude, longitude')
          .eq('id', locationId)
          .maybeSingle();

        if (loc) {
          locationData = loc;
          latitude = loc.latitude;
          longitude = loc.longitude;
        }

        const { data: rawObservations } = await supabase
          .from('weather_observations')
          .select('*')
          .eq('location_id', locationId)
          .gte('recorded_at', startDate.toISOString())
          .lte('recorded_at', endDate.toISOString())
          .order('recorded_at', { ascending: true })
          .limit(1000);

        if (rawObservations && rawObservations.length > 0) {
          observations = rawObservations.map((row) => ({
            id: Number(row.id),
            location_id: row.location_id,
            recorded_at: row.recorded_at,
            temperature: Number(row.temperature),
            feels_like: Number(row.feels_like),
            humidity: Number(row.humidity),
            pressure: Number(row.pressure),
            wind_speed: Number(row.wind_speed),
            wind_direction: Number(row.wind_direction),
            precipitation: Number(row.precipitation),
            precipitation_probability: row.precipitation_probability !== null ? Number(row.precipitation_probability) : null,
            cloud_cover: Number(row.cloud_cover),
            visibility: Number(row.visibility),
            uv_index: Number(row.uv_index),
            weather_code: Number(row.weather_code),
            created_at: row.created_at,
          }));
        }
      } catch (dbErr) {
        console.warn('[API /api/history] Database read notice (will use real provider telemetry):', dbErr);
      }
    }

    // If database has 0 historical observations yet (e.g. freshly deployed or new location),
    // fetch real recorded past hourly observations from Open-Meteo so charts populate immediately!
    if (observations.length === 0) {
      try {
        const liveHistory = await fetchHistoricalFromOpenMeteo({
          latitude,
          longitude,
          locationId,
          range: queryRange,
        });

        if (liveHistory.length > 0) {
          observations = liveHistory;

          // Background persistence into Supabase if connected
          if (supabase && locationData) {
            const toInsert = liveHistory.map((obs) => ({
              location_id: locationId,
              recorded_at: obs.recorded_at,
              temperature: obs.temperature,
              feels_like: obs.feels_like,
              humidity: obs.humidity,
              pressure: obs.pressure,
              wind_speed: obs.wind_speed,
              wind_direction: obs.wind_direction,
              precipitation: obs.precipitation,
              precipitation_probability: obs.precipitation_probability,
              cloud_cover: obs.cloud_cover,
              visibility: obs.visibility,
              uv_index: obs.uv_index,
              weather_code: obs.weather_code,
            }));

            try {
              await supabase
                .from('weather_observations')
                .upsert(toInsert, { onConflict: 'location_id,recorded_at', ignoreDuplicates: true });
            } catch {
              // Non-blocking background caching
            }
          }
        }
      } catch (providerErr) {
        console.error('[API /api/history] Provider historical fetch notice:', providerErr);
      }
    }

    const analytics = computeWeatherAnalytics(observations, queryRange);

    const response: WeatherHistory = {
      location_id: locationId,
      range: queryRange,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      observations,
      analytics,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve historical weather';
    console.error('[API /api/history] Unexpected error:', message);

    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}
