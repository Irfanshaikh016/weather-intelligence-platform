import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { searchLocationsFromOpenMeteo } from '@/lib/weather/client';
import { isValidLatitude, isValidLongitude, sanitizeString } from '@/lib/validation';
import { Location } from '@/types/weather';

export const dynamic = 'force-dynamic';

// Built-in curated locations for initial display and offline/unconnected fallback
const DEFAULT_LOCATIONS: Location[] = [
  {
    id: 'b1b51075-8025-4202-b054-e0eb29241511',
    city: 'Pune',
    country: 'India',
    region: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
    is_active: true,
  },
  {
    id: 'b1b51075-8025-4202-b054-e0eb29241512',
    city: 'Mumbai',
    country: 'India',
    region: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    is_active: true,
  },
  {
    id: 'b1b51075-8025-4202-b054-e0eb29241513',
    city: 'Delhi',
    country: 'India',
    region: 'Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    is_active: true,
  },
  {
    id: 'b1b51075-8025-4202-b054-e0eb29241514',
    city: 'Bengaluru',
    country: 'India',
    region: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
    is_active: true,
  },
  {
    id: 'b1b51075-8025-4202-b054-e0eb29241515',
    city: 'London',
    country: 'United Kingdom',
    region: 'Greater London',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    is_active: true,
  },
  {
    id: 'b1b51075-8025-4202-b054-e0eb29241516',
    city: 'New York',
    country: 'United States',
    region: 'New York',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
    is_active: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');

    // If search query is provided, geocode via Open-Meteo
    if (searchQuery && searchQuery.trim().length >= 2) {
      const results = await searchLocationsFromOpenMeteo(searchQuery);
      return NextResponse.json({ results });
    }

    // Otherwise, fetch active locations from Supabase
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      // Supabase not yet configured, return default curated list
      return NextResponse.json({
        locations: DEFAULT_LOCATIONS,
        source: 'default',
      });
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('city', { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn('[API /api/locations GET] Supabase query notice:', error.message);
        }
        return NextResponse.json({
          locations: DEFAULT_LOCATIONS,
          source: 'fallback',
        });
      }

      return NextResponse.json({
        locations: data,
        source: 'database',
      });
    } catch (queryErr) {
      console.warn('[API /api/locations GET] Connection error (using curated fallback):', queryErr);
      return NextResponse.json({
        locations: DEFAULT_LOCATIONS,
        source: 'fallback',
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve locations';
    console.error('[API /api/locations GET] Error:', message);

    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Request body must be a valid JSON object.' },
        { status: 400 }
      );
    }

    const { city, latitude, longitude, country, region, timezone } = body;

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'City name is required.' },
        { status: 400 }
      );
    }

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Valid latitude and longitude are required.' },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);

    // Create a deterministic or standard UUID for fallback/memory active location
    const fallbackLocation: Location = {
      id: crypto.randomUUID(),
      city: sanitizeString(city, 150),
      country: sanitizeString(country, 100) || null,
      region: sanitizeString(region, 150) || null,
      latitude: parsedLat,
      longitude: parsedLon,
      timezone: sanitizeString(timezone, 100) || 'UTC',
      is_active: true,
    };

    let savedLocation: Location = fallbackLocation;
    const supabase = createServerSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('locations')
          .upsert(
            {
              city: fallbackLocation.city,
              country: fallbackLocation.country,
              region: fallbackLocation.region,
              latitude: fallbackLocation.latitude,
              longitude: fallbackLocation.longitude,
              timezone: fallbackLocation.timezone,
              is_active: true,
            },
            { onConflict: 'latitude,longitude' }
          )
          .select()
          .maybeSingle();

        if (error) {
          console.warn('[API /api/locations POST] Supabase write notice (falling back to memory):', error.message);
        } else if (data) {
          savedLocation = data as Location;
        }
      } catch (dbErr) {
        console.warn('[API /api/locations POST] Database connection notice (falling back to memory):', dbErr);
      }
    }

    return NextResponse.json(
      {
        location: savedLocation,
        message: 'Location saved successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save location';
    console.error('[API /api/locations POST] Error:', message);

    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}
