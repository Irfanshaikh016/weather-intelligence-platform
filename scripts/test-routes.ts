import { NextRequest } from 'next/server';
import { GET as weatherGET } from '../app/api/weather/route';
import { GET as locationsGET } from '../app/api/locations/route';
import { GET as historyGET } from '../app/api/history/route';
import { GET as cronGET } from '../app/api/cron/weather/route';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runEndpointTests() {
  console.log('--- TESTING SERVERLESS ROUTE HANDLERS ---');

  // Test 1: GET /api/weather with valid coordinates (Pune)
  console.log('\n[1] Testing GET /api/weather (Valid Coordinates)...');
  const req1 = new NextRequest('http://localhost:3000/api/weather?lat=18.5204&lon=73.8567&city=Pune');
  const res1 = await weatherGET(req1);
  assert(res1.status === 200, `Weather status should be 200, got ${res1.status}`);
  const data1 = await res1.json();
  assert(data1.current && typeof data1.current.temperature === 'number', 'Current temperature is a valid number');
  assert(Array.isArray(data1.hourly) && data1.hourly.length > 0, 'Hourly forecast contains intervals');
  assert(Array.isArray(data1.daily) && data1.daily.length > 0, 'Daily forecast contains intervals');
  console.log(`    Current Weather in Pune: ${data1.current.temperature}°C, ${data1.current.condition}`);

  // Test 2: GET /api/weather with invalid coordinates
  console.log('\n[2] Testing GET /api/weather (Invalid Coordinates)...');
  const req2 = new NextRequest('http://localhost:3000/api/weather?lat=150&lon=300');
  const res2 = await weatherGET(req2);
  assert(res2.status === 400, `Expected 400 for out-of-range coordinates, got ${res2.status}`);

  // Test 3: GET /api/locations (Available locations)
  console.log('\n[3] Testing GET /api/locations...');
  const req3 = new NextRequest('http://localhost:3000/api/locations');
  const res3 = await locationsGET(req3);
  assert(res3.status === 200, `Locations status should be 200, got ${res3.status}`);
  const data3 = await res3.json();
  assert(Array.isArray(data3.locations) && data3.locations.length >= 4, 'Locations list returned curated active locations');
  console.log(`    Retrieved ${data3.locations.length} locations (e.g. ${data3.locations[0].city})`);

  // Test 4: GET /api/locations?search=Mumbai (Geocoding search)
  console.log('\n[4] Testing GET /api/locations?search=Mumbai (Geocoding)...');
  const req4 = new NextRequest('http://localhost:3000/api/locations?search=Mumbai');
  const res4 = await locationsGET(req4);
  assert(res4.status === 200, `Geocoding search status should be 200, got ${res4.status}`);
  const data4 = await res4.json();
  assert(Array.isArray(data4.results) && data4.results.length > 0, 'Geocoding search returned matches');
  console.log(`    Geocoded: ${data4.results[0].name} (${data4.results[0].latitude}, ${data4.results[0].longitude})`);

  // Test 5: GET /api/history (UUID validation)
  console.log('\n[5] Testing GET /api/history (Invalid UUID)...');
  const req5 = new NextRequest('http://localhost:3000/api/history?locationId=invalid-id&range=24h');
  const res5 = await historyGET(req5);
  assert(res5.status === 400, `Expected 400 for invalid UUID, got ${res5.status}`);

  // Test 6: GET /api/history (Valid UUID, empty observation handling)
  console.log('\n[6] Testing GET /api/history (Valid UUID)...');
  const req6 = new NextRequest('http://localhost:3000/api/history?locationId=b1b51075-8025-4202-b054-e0eb29241511&range=24h');
  const res6 = await historyGET(req6);
  assert(res6.status === 200 || res6.status === 404, `History status should be 200 or 404, got ${res6.status}`);
  if (res6.status === 200) {
    const data6 = await res6.json();
    assert(data6.analytics !== undefined, 'Analytics object present');
    assert(Array.isArray(data6.observations), 'Observations array present');
    console.log(`    Observations returned: ${data6.observations.length}`);
  }

  // Test 7: GET /api/cron/weather (Unauthorized check)
  console.log('\n[7] Testing GET /api/cron/weather (Unauthorized)...');
  process.env.CRON_SECRET = 'test-secret-123456';
  const req7 = new NextRequest('http://localhost:3000/api/cron/weather');
  const res7 = await cronGET(req7);
  assert(res7.status === 401, `Expected 401 Unauthorized for unprotected cron call, got ${res7.status}`);

  // Test 8: GET /api/cron/weather (Authorized with Bearer)
  console.log('\n[8] Testing GET /api/cron/weather (Authorized with Bearer)...');
  const req8 = new NextRequest('http://localhost:3000/api/cron/weather', {
    headers: {
      Authorization: 'Bearer test-secret-123456',
    },
  });
  const res8 = await cronGET(req8);
  // Without Supabase configured, should return 503 (Configuration Error) or 200 if connected
  assert(res8.status === 503 || res8.status === 200, `Expected 503 (Supabase unconfigured) or 200, got ${res8.status}`);
  const data8 = await res8.json();
  console.log(`    Cron response message: ${data8.message || data8.error}`);

  console.log('\n--- ALL ROUTE HANDLER TESTS PASSED SUCCESSFULLY ---');
}

runEndpointTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
