import { NextRequest, NextResponse } from 'next/server';
import { isValidLatitude, isValidLongitude } from '@/lib/validation';
import { fetchWeatherFromOpenMeteo } from '@/lib/weather/client';
import { transformOpenMeteoForecast } from '@/lib/weather/transform';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const city = searchParams.get('city') || undefined;
    const country = searchParams.get('country') || undefined;
    const region = searchParams.get('region') || undefined;

    if (!isValidLatitude(latParam) || !isValidLongitude(lonParam)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.',
        },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latParam!);
    const longitude = parseFloat(lonParam!);

    const rawData = await fetchWeatherFromOpenMeteo({
      latitude,
      longitude,
    });

    const weatherData = transformOpenMeteoForecast(rawData, {
      city,
      country,
      region,
    });

    return NextResponse.json(weatherData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve weather data';
    console.error('[API /api/weather] Error:', message);

    return NextResponse.json(
      {
        error: 'Weather Provider Error',
        message,
      },
      { status: 502 }
    );
  }
}
