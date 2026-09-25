export function formatDate(dateStr: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', options ?? {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateStr: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', options ?? {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateStr: string | number | Date): string {
  const d = new Date(dateStr);
  return `${formatDate(d)} at ${formatTime(d)}`;
}

export function formatNumber(val: number | null | undefined, decimals = 1, fallback = '--'): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return Number(val.toFixed(decimals)).toString();
}

export function formatDegree(val: number | null | undefined, fallback = '--'): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return `${Math.round(val)}°C`;
}

export function formatWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index] || 'N';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
