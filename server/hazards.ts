import type { HazardAlert, LiveHazardSnapshot } from '../src/types.ts';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchLiveHazards(lat: number, lon: number): Promise<LiveHazardSnapshot> {
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&latitude=${lat}&longitude=${lon}&maxradiuskm=250&minmagnitude=2.0&limit=12&orderby=time`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,soil_moisture_3_to_9cm&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&forecast_days=3`;
  const nwsUrl = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`;

  const [usgsRes, weatherRes, floodRes, nwsRes] = await Promise.allSettled([
    fetch(usgsUrl, { signal: AbortSignal.timeout(5500) }),
    fetch(weatherUrl, { signal: AbortSignal.timeout(5500) }),
    fetch(floodUrl, { signal: AbortSignal.timeout(5500) }),
    fetch(nwsUrl, {
      headers: { 'User-Agent': 'insights-property-app/1.0' },
      signal: AbortSignal.timeout(5500),
    }),
  ]);

  let temperatureF = 64;
  let windMph = 8;
  let windGustMph = 14;
  let precipitationMm = 0;
  let soilMoisture = 0.24;
  let riverDischargeM3s: number | null = null;

  const alerts: HazardAlert[] = [];
  const recentQuakes: HazardAlert[] = [];

  if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
    try {
      const wData = (await weatherRes.value.json()) as {
        current?: {
          temperature_2m?: number;
          precipitation?: number;
          wind_speed_10m?: number;
          wind_gusts_10m?: number;
          soil_moisture_3_to_9cm?: number;
        };
      };
      if (wData.current) {
        temperatureF = wData.current.temperature_2m ?? temperatureF;
        precipitationMm = wData.current.precipitation ?? 0;
        windMph = wData.current.wind_speed_10m ?? windMph;
        windGustMph = wData.current.wind_gusts_10m ?? windGustMph;
        soilMoisture = wData.current.soil_moisture_3_to_9cm ?? soilMoisture;
      }
    } catch {
      // keep defaults
    }
  }

  if (floodRes.status === 'fulfilled' && floodRes.value.ok) {
    try {
      const fData = (await floodRes.value.json()) as {
        daily?: { river_discharge?: Array<number | null> };
      };
      const val = fData.daily?.river_discharge?.[0];
      if (typeof val === 'number') {
        riverDischargeM3s = Number(val.toFixed(2));
      }
    } catch {
      // ignore
    }
  }

  if (usgsRes.status === 'fulfilled' && usgsRes.value.ok) {
    try {
      const qData = (await usgsRes.value.json()) as {
        features?: Array<{
          id: string;
          properties: { mag: number; place: string; time: number; title: string };
          geometry: { coordinates: [number, number, number] };
        }>;
      };
      for (const f of qData.features ?? []) {
        const qLon = f.geometry.coordinates[0];
        const qLat = f.geometry.coordinates[1];
        const depthKm = f.geometry.coordinates[2];
        const mag = f.properties.mag ?? 0;
        const dist = Math.round(haversineKm(lat, lon, qLat, qLon));
        const item: HazardAlert = {
          id: `usgs-${f.id}`,
          type: 'Earthquake',
          severity: mag >= 5 ? 'Urgent' : mag >= 4 ? 'Warning' : 'Advisory',
          title: f.properties.title || `M${mag.toFixed(1)} Seismic Event`,
          description: `Depth ${depthKm.toFixed(1)} km · ${dist} km from selected GPS point`,
          source: 'USGS Earthquake Hazards Program',
          timestamp: new Date(f.properties.time).toISOString(),
          distanceKm: dist,
          lat: qLat,
          lon: qLon,
          magnitude: mag,
        };
        recentQuakes.push(item);
        if (mag >= 3.5 && dist <= 120) {
          alerts.push(item);
        }
      }
    } catch {
      // ignore
    }
  }

  if (nwsRes.status === 'fulfilled' && nwsRes.value.ok) {
    try {
      const nData = (await nwsRes.value.json()) as {
        features?: Array<{
          id: string;
          properties: {
            event: string;
            severity: string;
            headline: string;
            description: string;
            sent: string;
          };
        }>;
      };
      for (const f of (nData.features ?? []).slice(0, 6)) {
        const ev = f.properties.event || 'Weather Alert';
        const lower = ev.toLowerCase();
        const type: HazardAlert['type'] = lower.includes('flood')
          ? 'Flood'
          : lower.includes('fire') || lower.includes('red flag')
            ? 'Fire Weather'
            : 'Severe Storm';
        const sevRaw = (f.properties.severity || '').toLowerCase();
        const severity: HazardAlert['severity'] =
          sevRaw === 'extreme'
            ? 'Urgent'
            : sevRaw === 'severe'
              ? 'Warning'
              : sevRaw === 'moderate'
                ? 'Watch'
                : 'Advisory';

        alerts.push({
          id: f.id,
          type,
          severity,
          title: ev,
          description: f.properties.headline || f.properties.description?.slice(0, 180) || '',
          source: 'NOAA / National Weather Service',
          timestamp: f.properties.sent || new Date().toISOString(),
          lat,
          lon,
        });
      }
    } catch {
      // ignore
    }
  }

  // Synthesize telemetry threshold advisories strictly from live sensor readings
  if (precipitationMm >= 4.0 || soilMoisture >= 0.38) {
    alerts.push({
      id: 'telemetry-hydrostatic',
      type: 'Groundwater',
      severity: precipitationMm >= 10 ? 'Warning' : 'Watch',
      title: 'Elevated Soil Saturation & Hydrostatic Risk',
      description: `Live upper-soil moisture ${(soilMoisture * 100).toFixed(0)}% · precipitation ${precipitationMm.toFixed(1)} mm/hr. Inspect basement cove joints and sump pump float switches.`,
      source: 'Open-Meteo Hydrological Telemetry',
      timestamp: new Date().toISOString(),
      lat,
      lon,
    });
  }

  if (windGustMph >= 35 && temperatureF >= 78) {
    alerts.push({
      id: 'telemetry-fire-wind',
      type: 'Fire Weather',
      severity: 'Watch',
      title: 'High Wind & Warm Air Defensible Space Advisory',
      description: `Live gusts reaching ${windGustMph.toFixed(0)} mph at ${temperatureF.toFixed(0)}°F. Clear roof gutters and ember traps.`,
      source: 'Open-Meteo Atmospheric Telemetry',
      timestamp: new Date().toISOString(),
      lat,
      lon,
    });
  }

  return {
    lat,
    lon,
    updatedAt: new Date().toISOString(),
    weather: {
      temperatureF: Math.round(temperatureF),
      windMph: Math.round(windMph),
      windGustMph: Math.round(windGustMph),
      precipitationMm: Number(precipitationMm.toFixed(1)),
      soilMoisture: Number(soilMoisture.toFixed(2)),
      riverDischargeM3s,
    },
    alerts,
    recentQuakes,
  };
}
