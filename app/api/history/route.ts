import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isValidUUID, isValidHistoryRange, isValidIsoDate } from '@/lib/validation';
import { computeWeatherAnalytics } from '@/lib/analytics/weather';
import { WeatherHistory, WeatherObservation } from '@/types/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const range = searchParams.get('range') || '24h';
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

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
    if (!supabase) {
      // Graceful fallback when database is not yet wired
      const emptyAnalytics = computeWeatherAnalytics([], queryRange);
      const response: WeatherHistory = {
        location_id: locationId!,
        range: queryRange,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        observations: [],
        analytics: emptyAnalytics,
      };
      return NextResponse.json(response);
    }

    // Check location existence
    const { data: locationData, error: locError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', locationId)
      .maybeSingle();

    if (locError) {
      console.warn('[API /api/history] Location lookup warning:', locError.message);
    }

    if (!locationData && !locError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Location with ID ${locationId} does not exist.`,
        },
        { status: 404 }
      );
    }

    // Query observations strictly within the bounded range
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

    const observations: WeatherObservation[] = (rawObservations || []).map((row) => ({
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
