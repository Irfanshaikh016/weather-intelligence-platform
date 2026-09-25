'use client';

import React from 'react';
import {
  Sun,
  SunDim,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  Moon,
  CloudMoon,
} from 'lucide-react';

interface WeatherIconProps {
  name: string;
  isDay?: boolean;
  className?: string;
}

export function WeatherIcon({ name, isDay = true, className = 'w-6 h-6' }: WeatherIconProps) {
  // If it's night and clear or mainly clear, show moon variant
  if (!isDay && (name === 'Sun' || name === 'SunDim')) {
    return <Moon className={className} />;
  }
  if (!isDay && name === 'CloudSun') {
    return <CloudMoon className={className} />;
  }

  switch (name) {
    case 'Sun':
      return <Sun className={className} />;
    case 'SunDim':
      return <SunDim className={className} />;
    case 'CloudSun':
      return <CloudSun className={className} />;
    case 'Cloud':
      return <Cloud className={className} />;
    case 'CloudFog':
      return <CloudFog className={className} />;
    case 'CloudDrizzle':
      return <CloudDrizzle className={className} />;
    case 'CloudRain':
      return <CloudRain className={className} />;
    case 'CloudRainWind':
      return <CloudRainWind className={className} />;
    case 'CloudSnow':
      return <CloudSnow className={className} />;
    case 'Snowflake':
      return <Snowflake className={className} />;
    case 'CloudLightning':
      return <CloudLightning className={className} />;
    default:
      return <Cloud className={className} />;
  }
}
