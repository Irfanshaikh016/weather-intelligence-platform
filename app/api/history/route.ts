import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isValidUUID, isValidHistoryRange, isValidIsoDate, isValidLatitude, isValidLongitude } from '@/lib/validation';
import { computeWeatherAnalytics } from '@/lib/analytics/weather';
import { fetchHistoricalFromOpenMeteo } from '@/lib/weather/client';
import { WeatherHistory, WeatherObservation } from '@/types/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const range = searchParams.get('range') || '24h';
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    // Validate Location ID according to Section 18
    if (!isValidUUID(locationId)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'A valid location UUID is required.',
        },
        { status: 400 }
      );
    }

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

    const supabase = createServerSupabaseClient();
    let latitude = isValidLatitude(latParam) ? parseFloat(latParam!) : null;
    let longitude = isValidLongitude(lonParam) ? parseFloat(lonParam!) : null;

    if (!supabase) {
      // Supabase not configured: retrieve real meteorological past observations directly
      let fallbackObservations: WeatherObservation[] = [];
      if (latitude !== null && longitude !== null) {
        fallbackObservations = await fetchHistoricalFromOpenMeteo({
          latitude,
          longitude,
          locationId: locationId!,
          range: queryRange,
        });
      }

      const analytics = computeWeatherAnalytics(fallbackObservations, queryRange);
      const response: WeatherHistory = {
        location_id: locationId!,
        range: queryRange,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        observations: fallbackObservations,
        analytics,
      };
      return NextResponse.json(response);
    }

    // Check location existence in database
    const { data: locationData, error: locError } = await supabase
      .from('locations')
      .select('id, latitude, longitude')
      .eq('id', locationId)
      .maybeSingle();

    if (locError) {
      console.warn('[API /api/history] Location lookup warning:', locError.message);
    }

    if (!locationData && !locError) {
      // If coordinates provided, allow fallback instead of 404
      if (latitude !== null && longitude !== null) {
        const fallbackObservations = await fetchHistoricalFromOpenMeteo({
          latitude,
          longitude,
          locationId: locationId!,
          range: queryRange,
        });
        const analytics = computeWeatherAnalytics(fallbackObservations, queryRange);
        return NextResponse.json({
          location_id: locationId!,
          range: queryRange,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          observations: fallbackObservations,
          analytics,
        });
      }

      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Location with ID ${locationId} does not exist.`,
        },
        { status: 404 }
      );
    }

    if (locationData) {
      latitude = locationData.latitude;
      longitude = locationData.longitude;
    }

    // Query observations strictly within the bounded range from Supabase
    const { data: rawObservations, error: obsError } = await supabase
      .from('weather_observations')
      .select('*')
      .eq('location_id', locationId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true })
      .limit(1000);

    if (obsError) {
      console.error('[API /api/history] Database query error:', obsError.message);
      return NextResponse.json(
        { error: 'Database Error', message: obsError.message },
        { status: 500 }
      );
    }

    let observations: WeatherObservation[] = (rawObservations || []).map((row) => ({
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

    // If database has 0 historical observations yet (e.g. freshly deployed app),
    // fetch real meteorological hourly observations from Open-Meteo so charts populate immediately!
    if (observations.length === 0 && latitude !== null && longitude !== null) {
      const liveHistory = await fetchHistoricalFromOpenMeteo({
        latitude,
        longitude,
        locationId: locationId!,
        range: queryRange,
      });

      if (liveHistory.length > 0) {
        observations = liveHistory;

        // Optionally seed observations into Supabase in background
        if (locationData) {
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
    }

    // Calculate previous period for comparison (if applicable)
    let previousObservations: WeatherObservation[] | undefined;
    const periodDurationMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDurationMs);

    const { data: rawPrev } = await supabase
      .from('weather_observations')
      .select('*')
      .eq('location_id', locationId)
      .gte('recorded_at', prevStartDate.toISOString())
      .lt('recorded_at', startDate.toISOString())
      .limit(1000);

    if (rawPrev && rawPrev.length > 0) {
      previousObservations = rawPrev.map((row) => ({
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

    const analytics = computeWeatherAnalytics(observations, queryRange, previousObservations);

    const response: WeatherHistory = {
      location_id: locationId!,
      range: queryRange,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      observations,
      analytics,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
