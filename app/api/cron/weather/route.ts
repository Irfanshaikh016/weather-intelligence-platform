import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { fetchWeatherFromOpenMeteo } from '@/lib/weather/client';
import { Location } from '@/types/weather';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max serverless function duration for Vercel

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // 1. Authenticate Scheduled Request
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const querySecret = new URL(request.url).searchParams.get('secret');

  // If CRON_SECRET is configured, enforce strict authorization
  if (cronSecret) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isQueryValid = process.env.NODE_ENV === 'development' && querySecret === cronSecret;

    if (!isBearerValid && !isQueryValid) {
      console.warn('[Vercel Cron] Unauthorized request rejected.');
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or missing CRON_SECRET authorization.',
        },
        { status: 401 }
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    // In production, CRON_SECRET must be configured
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'CRON_SECRET is not configured on the server.',
      },
      { status: 401 }
    );
  }

  // 2. Load Active Locations from Supabase
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error: 'Configuration Error',
        message: 'Supabase server environment variables are not configured.',
      },
      { status: 503 }
    );
  }

  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true);

  if (locError) {
    console.error('[Vercel Cron] Failed to fetch active locations:', locError.message);
    return NextResponse.json(
      {
        error: 'Database Error',
        message: locError.message,
      },
      { status: 500 }
    );
  }

  if (!locations || locations.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      successful: 0,
      failed: 0,
      message: 'No active locations found for weather observation collection.',
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Process Each Location Sequentially / Resiliently
  const results: {
    city: string;
    locationId: string;
    status: 'success' | 'failed';
    error?: string;
  }[] = [];

  let successfulCount = 0;
  let failedCount = 0;

  for (const location of locations as Location[]) {
    try {
      // Fetch latest weather from Open-Meteo
      const rawWeather = await fetchWeatherFromOpenMeteo({
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone || 'auto',
      });

      const current = rawWeather.current;
      if (!current) {
        throw new Error('No current weather payload received from provider.');
      }

      // Format observation time. Normalize to ISO string to ensure consistency
      const observationTime = current.time 
        ? new Date(current.time).toISOString() 
        : new Date().toISOString();

      const observation = {
        location_id: location.id,
        recorded_at: observationTime,
        temperature: current.temperature_2m,
        feels_like: current.apparent_temperature ?? current.temperature_2m,
        humidity: current.relative_humidity_2m,
        pressure: current.pressure_msl ?? current.surface_pressure ?? 1013.25,
        wind_speed: current.wind_speed_10m,
        wind_direction: current.wind_direction_10m,
        precipitation: current.precipitation ?? 0,
        precipitation_probability: rawWeather.hourly?.precipitation_probability?.[0] ?? null,
        cloud_cover: current.cloud_cover ?? 0,
        visibility: rawWeather.hourly?.visibility?.[0] 
          ? rawWeather.hourly.visibility[0] / 1000 
          : 10,
        uv_index: current.uv_index ?? 0,
        weather_code: current.weather_code ?? 0,
      };

      // 4. Insert Weather Observation with Duplicate Prevention
      // Use upsert with ignoreDuplicates to avoid duplicates if Cron re-runs at the same interval
      const { error: insertError } = await supabase
        .from('weather_observations')
        .upsert(observation, {
          onConflict: 'location_id,recorded_at',
          ignoreDuplicates: true,
        });

      if (insertError) {
        throw new Error(`Database insert error: ${insertError.message}`);
      }

      successfulCount++;
      results.push({
        city: location.city,
        locationId: location.id,
        status: 'success',
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown provider error';
      console.error(`[Vercel Cron] Error collecting weather for ${location.city}:`, errMsg);
      failedCount++;
      results.push({
        city: location.city,
        locationId: location.id,
        status: 'failed',
        error: errMsg,
      });
    }
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    processed: locations.length,
    successful: successfulCount,
    failed: failedCount,
    durationMs,
    timestamp: new Date().toISOString(),
    results,
  });
}
