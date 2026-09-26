const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidLatitude(lat: unknown): boolean {
  if (lat === null || lat === undefined || lat === '') return false;
  const num = typeof lat === 'number' ? lat : parseFloat(String(lat));
  return !isNaN(num) && isFinite(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(lon: unknown): boolean {
  if (lon === null || lon === undefined || lon === '') return false;
  const num = typeof lon === 'number' ? lon : parseFloat(String(lon));
  return !isNaN(num) && isFinite(num) && num >= -180 && num <= 180;
}

export function isValidUUID(id: unknown): id is string {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

export function isValidIsoDate(dateStr: unknown): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const timestamp = Date.parse(dateStr);
  return !isNaN(timestamp);
}

export function isValidHistoryRange(range: unknown): range is '24h' | '7d' | '30d' {
  return typeof range === 'string' && ['24h', '7d', '30d'].includes(range);
}

export function sanitizeString(str: unknown, maxLength = 150): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}
