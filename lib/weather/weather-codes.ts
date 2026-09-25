export interface WeatherCodeInfo {
  label: string;
  category: 'Clear' | 'Partly Cloudy' | 'Cloudy' | 'Fog' | 'Rain' | 'Heavy Rain' | 'Snow' | 'Thunderstorm';
  icon: string;
  description: string;
}

export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: {
    label: 'Clear sky',
    category: 'Clear',
    icon: 'Sun',
    description: 'Completely clear sky with no cloud cover',
  },
  1: {
    label: 'Mainly clear',
    category: 'Clear',
    icon: 'SunDim',
    description: 'Mainly clear sky with slight cloudiness',
  },
  2: {
    label: 'Partly cloudy',
    category: 'Partly Cloudy',
    icon: 'CloudSun',
    description: 'Scattered clouds with intermittent sunshine',
  },
  3: {
    label: 'Overcast',
    category: 'Cloudy',
    icon: 'Cloud',
    description: 'Completely covered by dense clouds',
  },
  45: {
    label: 'Fog',
    category: 'Fog',
    icon: 'CloudFog',
    description: 'Reduced visibility due to dense fog',
  },
  48: {
    label: 'Depositing rime fog',
    category: 'Fog',
    icon: 'CloudFog',
    description: 'Freezing fog depositing ice crystals',
  },
  51: {
    label: 'Light drizzle',
    category: 'Rain',
    icon: 'CloudDrizzle',
    description: 'Very light and fine continuous rain',
  },
  53: {
    label: 'Moderate drizzle',
    category: 'Rain',
    icon: 'CloudDrizzle',
    description: 'Moderate fine rain with damp conditions',
  },
  55: {
    label: 'Dense drizzle',
    category: 'Rain',
    icon: 'CloudDrizzle',
    description: 'Heavy drizzle causing reduced visibility',
  },
  56: {
    label: 'Light freezing drizzle',
    category: 'Rain',
    icon: 'CloudSnow',
    description: 'Freezing drizzle turning to ice on impact',
  },
  57: {
    label: 'Dense freezing drizzle',
    category: 'Rain',
    icon: 'CloudSnow',
    description: 'Heavy freezing drizzle creating slippery ice',
  },
  61: {
    label: 'Slight rain',
    category: 'Rain',
    icon: 'CloudRain',
    description: 'Light steady rainfall',
  },
  63: {
    label: 'Moderate rain',
    category: 'Rain',
    icon: 'CloudRain',
    description: 'Continuous moderate rainfall',
  },
  65: {
    label: 'Heavy rain',
    category: 'Heavy Rain',
    icon: 'CloudRainWind',
    description: 'Intense precipitation with strong surface runoff',
  },
  66: {
    label: 'Light freezing rain',
    category: 'Rain',
    icon: 'CloudSnow',
    description: 'Freezing rain creating icy glaze',
  },
  67: {
    label: 'Heavy freezing rain',
    category: 'Heavy Rain',
    icon: 'CloudSnow',
    description: 'Substantial freezing rain causing hazardous ice accumulation',
  },
  71: {
    label: 'Slight snow fall',
    category: 'Snow',
    icon: 'Snowflake',
    description: 'Light fluttering snow flakes',
  },
  73: {
    label: 'Moderate snow fall',
    category: 'Snow',
    icon: 'Snowflake',
    description: 'Steady moderate snow accumulation',
  },
  75: {
    label: 'Heavy snow fall',
    category: 'Snow',
    icon: 'Snowflake',
    description: 'Heavy continuous snow with rapid accumulation',
  },
  77: {
    label: 'Snow grains',
    category: 'Snow',
    icon: 'Snowflake',
    description: 'Frozen white opaque grains of ice',
  },
  80: {
    label: 'Slight rain showers',
    category: 'Rain',
    icon: 'CloudDrizzle',
    description: 'Brief showers of light rain',
  },
  81: {
    label: 'Moderate rain showers',
    category: 'Rain',
    icon: 'CloudRain',
    description: 'Passing moderate rain showers',
  },
  82: {
    label: 'Violent rain showers',
    category: 'Heavy Rain',
    icon: 'CloudRainWind',
    description: 'Torrents of rain showers with high intensity',
  },
  85: {
    label: 'Slight snow showers',
    category: 'Snow',
    icon: 'Snowflake',
    description: 'Intermittent light snow squalls',
  },
  86: {
    label: 'Heavy snow showers',
    category: 'Snow',
    icon: 'Snowflake',
    description: 'Intermittent heavy snow squalls',
  },
  95: {
    label: 'Thunderstorm',
    category: 'Thunderstorm',
    icon: 'CloudLightning',
    description: 'Thunderstorm with lightning and convective rain',
  },
  96: {
    label: 'Thunderstorm with slight hail',
    category: 'Thunderstorm',
    icon: 'CloudLightning',
    description: 'Severe thunderstorm accompanied by small hail stones',
  },
  99: {
    label: 'Thunderstorm with heavy hail',
    category: 'Thunderstorm',
    icon: 'CloudLightning',
    description: 'Severe storm with intense hail and damaging winds',
  },
};

export function getWeatherCodeInfo(code: number): WeatherCodeInfo {
  return (
    WEATHER_CODES[code] ?? {
      label: 'Unknown',
      category: 'Cloudy',
      icon: 'Cloud',
      description: 'Atmospheric conditions recorded',
    }
  );
}

export function getWeatherConditionLabel(code: number): string {
  return getWeatherCodeInfo(code).label;
}

export function getWeatherCategory(code: number): string {
  return getWeatherCodeInfo(code).category;
}
