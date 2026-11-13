import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  Compass,
  Droplets,
  ExternalLink,
  Flame,
  MapPin,
  Navigation,
  RefreshCw,
  Waves,
  Wind,
} from 'lucide-react';
import type {
  AlmanacReport,
  Contractor,
  GroundingSource,
  HazardAlert,
  LiveHazardSnapshot,
} from '../types';

interface PresetRegion {
  label: string;
  lat: number;
  lon: number;
}

const REGION_PRESETS: PresetRegion[] = [
  { label: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  { label: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
  { label: 'Houston, TX', lat: 29.7604, lon: -95.3698 },
  { label: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
  { label: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
];

interface CityIntel {
  summary: string;
  waterTableDepth: string;
  pumpingStations: string;
  floodZoneRisk: string;
  earthquakeFaultContext: string;
  fireHazardZone: string;
  soilComposition: string;
  sources: GroundingSource[];
}

interface Props {
  coords: { lat: number; lon: number; label: string };
  onUpdateCoords: (next: { lat: number; lon: number; label: string }) => void;
  contractors: Contractor[];
  almanac: AlmanacReport[];
  onAddAlmanac: (report: AlmanacReport) => void;
  onVerifyAlmanac: (id: string) => void;
}

export const HazardsMapWorkspace: React.FC<Props> = ({
  coords,
  onUpdateCoords,
  contractors,
  almanac,
  onAddAlmanac,
  onVerifyAlmanac,
}) => {
  const [snapshot, setSnapshot] = useState<LiveHazardSnapshot | null>(null);
  const [loadingHazards, setLoadingHazards] = useState<boolean>(true);
  const [gpsNotice, setGpsNotice] = useState<string>('');

  const [cityIntel, setCityIntel] = useState<CityIntel | null>(null);
  const [loadingIntel, setLoadingIntel] = useState<boolean>(false);

  // Interactive geospatial map layer toggles
  const [showQuakes, setShowQuakes] = useState<boolean>(true);
  const [showContractors, setShowContractors] = useState<boolean>(true);
  const [showAlmanac, setShowAlmanac] = useState<boolean>(true);
  const [selectedPinInfo, setSelectedPinInfo] = useState<{ title: string; detail: string } | null>(null);

  // Almanac form
  const [conditionType, setConditionType] = useState<AlmanacReport['conditionType']>('High Water Table');
  const [waterDepthInches, setWaterDepthInches] = useState<string>('2.5');
  const [elevationNotes, setElevationNotes] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);

  const loadHazards = async (lat: number, lon: number) => {
    setLoadingHazards(true);
    try {
      const res = await fetch(`/api/hazards?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = (await res.json()) as LiveHazardSnapshot;
        setSnapshot(data);
      }
    } finally {
      setLoadingHazards(false);
    }
  };

  useEffect(() => {
    loadHazards(coords.lat, coords.lon);
  }, [coords.lat, coords.lon]);

  const handleUseBrowserGps = () => {
    if (!navigator.geolocation) {
      setGpsNotice('Browser geolocation unavailable; select a regional preset below.');
      return;
    }
    setGpsNotice('Acquiring live GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        onUpdateCoords({ lat, lon, label: `Live GPS (${lat}, ${lon})` });
        setGpsNotice(`Locked to GPS (${lat}, ${lon}) · accuracy ±${Math.round(pos.coords.accuracy)}m`);
      },
      () => {
        setGpsNotice('Location permission declined; using selected regional coordinates.');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleFetchCityIntel = async () => {
    setLoadingIntel(true);
    try {
      const res = await fetch('/api/ai/location-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coords.lat,
          lon: coords.lon,
          locationLabel: coords.label,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as CityIntel;
        setCityIntel(data);
      }
    } finally {
      setLoadingIntel(false);
    }
  };

  const handleSubmitAlmanac = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !elevationNotes.trim()) return;
    setSubmittingReport(true);
    try {
      const res = await fetch('/api/almanac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: coords.label,
          lat: coords.lat,
          lon: coords.lon,
          conditionType,
          waterDepthInches: Number(waterDepthInches) || 0,
          elevationNotes,
          reporterName,
        }),
      });
      if (res.ok) {
        const created = (await res.json()) as AlmanacReport;
        onAddAlmanac(created);
        setElevationNotes('');
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  // Map projection relative to current GPS center (span +/- 2.5 deg)
  const projectPoint = (lat: number, lon: number) => {
    const span = 2.2;
    const x = 50 + ((lon - coords.lon) / span) * 44;
    const y = 50 - ((lat - coords.lat) / span) * 44;
    return {
      x: Math.min(94, Math.max(6, x)),
      y: Math.min(94, Math.max(6, y)),
    };
  };

  const renderSeverityStyle = (sev: HazardAlert['severity']) => {
    if (sev === 'Urgent') return 'text-red-700 dark:text-red-400';
    if (sev === 'Warning') return 'text-amber-700 dark:text-amber-400';
    return 'text-slate-700 dark:text-slate-300';
  };

  return (
    <div className="space-y-8">
      {/* Live GPS Controls & Telemetry Strip */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              USGS Seismic · NOAA/NWS Alerts · Open-Meteo Hydrology · Confidential Owner Privacy Enforced
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Live GPS Disaster Telemetry & Property Almanac
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUseBrowserGps}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              Use My GPS
            </button>
            <select
              value={coords.label}
              onChange={(e) => {
                const preset = REGION_PRESETS.find((r) => r.label === e.target.value);
                if (preset) onUpdateCoords(preset);
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {!REGION_PRESETS.some((r) => r.label === coords.label) && (
                <option value={coords.label}>{coords.label}</option>
              )}
              {REGION_PRESETS.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadHazards(coords.lat, coords.lon)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHazards ? 'animate-spin' : ''}`} />
              Refresh Feeds
            </button>
          </div>
        </div>

        {gpsNotice && <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">{gpsNotice}</div>}

        {/* 5-Column Tabular Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Coordinates</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Wind / Gusts</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {snapshot ? `${snapshot.weather.windMph} / ${snapshot.weather.windGustMph} mph` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Precipitation Rate</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {snapshot ? `${snapshot.weather.precipitationMm} mm/hr` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Soil Moisture (3–9cm)</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {snapshot ? `${Math.round(snapshot.weather.soilMoisture * 100)}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Basin River Discharge</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {snapshot?.weather.riverDischargeM3s != null ? `${snapshot.weather.riverDischargeM3s} m³/s` : 'Normal'}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Geospatial Radar + Active Warnings Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600" />
              Geospatial Hazard, Seismic & Contractor Overlay (250 km Radius)
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowQuakes((v) => !v)}
                className={`px-2.5 py-1 rounded-md border ${
                  showQuakes
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                Seismic
              </button>
              <button
                type="button"
                onClick={() => setShowAlmanac((v) => !v)}
                className={`px-2.5 py-1 rounded-md border ${
                  showAlmanac
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                Flood Almanac
              </button>
              <button
                type="button"
                onClick={() => setShowContractors((v) => !v)}
                className={`px-2.5 py-1 rounded-md border ${
                  showContractors
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                Verified Pros
              </button>
            </div>
          </div>

          <div className="relative bg-slate-950 rounded-lg border border-slate-800 overflow-hidden aspect-[16/10]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Topographic / coordinate grid */}
              {[20, 40, 60, 80].map((v) => (
                <g key={v} stroke="rgba(148,163,184,0.14)" strokeWidth="0.25">
                  <line x1={v} y1="0" x2={v} y2="100" />
                  <line x1="0" y1={v} x2="100" y2={v} />
                </g>
              ))}
              {/* Distance rings */}
              <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(217,119,6,0.35)" strokeWidth="0.3" strokeDasharray="1 1" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.3" />

              {/* Simulated active geological fault line corridor near selected GPS */}
              <path
                d="M 12 85 Q 42 56 68 14"
                fill="none"
                stroke="rgba(239,68,68,0.45)"
                strokeWidth="0.55"
                strokeDasharray="1.8 1.2"
              />

              {/* Almanac neighborhood flood reports */}
              {showAlmanac &&
                almanac.map((rep) => {
                  const pt = projectPoint(rep.lat, rep.lon);
                  return (
                    <g
                      key={rep.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedPinInfo({
                          title: `${rep.conditionType} · ${rep.city}`,
                          detail: `${rep.waterDepthInches}" depth — ${rep.elevationNotes} (${rep.verifiedByNeighbors} neighbor confirmations)`,
                        })
                      }
                    >
                      <circle cx={pt.x} cy={pt.y} r="2.2" fill="#0ea5e9" stroke="#ffffff" strokeWidth="0.35" />
                    </g>
                  );
                })}

              {/* Verified Contractor pins */}
              {showContractors &&
                contractors.map((c) => {
                  const pt = projectPoint(c.lat, c.lon);
                  return (
                    <g
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedPinInfo({
                          title: `${c.company} (${c.licenseClass})`,
                          detail: `${c.city} · Virtual Consult $${c.virtualConsultFee} · ${c.verifiedJobsCount} verified outcomes`,
                        })
                      }
                    >
                      <rect
                        x={pt.x - 1.5}
                        y={pt.y - 1.5}
                        width="3"
                        height="3"
                        rx="0.5"
                        fill="#16a34a"
                        stroke="#ffffff"
                        strokeWidth="0.35"
                      />
                    </g>
                  );
                })}

              {/* Live USGS Earthquakes */}
              {showQuakes &&
                snapshot?.recentQuakes.map((q) => {
                  const pt = projectPoint(q.lat, q.lon);
                  const r = Math.max(1.8, Math.min(4.5, (q.magnitude || 2.5) * 0.7));
                  return (
                    <g
                      key={q.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedPinInfo({
                          title: q.title,
                          detail: `${q.description} · Source: ${q.source}`,
                        })
                      }
                    >
                      <circle cx={pt.x} cy={pt.y} r={r} fill="rgba(239,68,68,0.45)" stroke="#ef4444" strokeWidth="0.4" />
                    </g>
                  );
                })}

              {/* Center User GPS Pin */}
              <circle cx="50" cy="50" r="2.2" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.5" />
            </svg>

            <div className="absolute top-3 left-3 text-xs font-mono text-slate-300 bg-slate-900/85 px-2.5 py-1 rounded border border-slate-700">
              GPS Center: {coords.label}
            </div>

            {selectedPinInfo && (
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-slate-700 rounded-lg p-3 text-xs text-white flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-amber-300">{selectedPinInfo.title}</div>
                  <div className="text-slate-300 mt-0.5">{selectedPinInfo.detail}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPinInfo(null)}
                  className="text-slate-400 hover:text-white shrink-0"
                >
                  Close
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span>Amber Pin: Your GPS</span>
            <span aria-hidden="true">·</span>
            <span>Red Circles: Live USGS Quakes</span>
            <span aria-hidden="true">·</span>
            <span>Blue Pins: Flood Almanac Reports</span>
            <span aria-hidden="true">·</span>
            <span>Green Squares: Live-Scan Verified Contractors</span>
          </div>
        </div>

        {/* Active Alerts & Live USGS Feed */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              Active Location-Specific Warnings
            </h2>

            {loadingHazards ? (
              <div className="text-xs text-slate-500 py-6">Querying USGS, NWS, and Open-Meteo telemetry...</div>
            ) : snapshot && snapshot.alerts.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {snapshot.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={`font-bold ${renderSeverityStyle(alert.severity)}`}>
                        {alert.severity} · {alert.type}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{alert.title}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{alert.description}</p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Source: {alert.source}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                No extreme NWS weather or M3.5+ close-range seismic alerts active at {coords.label} right now.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Recent Regional Seismic Events (USGS 250 km)
            </div>
            {snapshot?.recentQuakes.length ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-44 overflow-y-auto">
                {snapshot.recentQuakes.slice(0, 5).map((q) => (
                  <div key={q.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="truncate text-slate-800 dark:text-slate-200">{q.title}</div>
                    <div className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                      {q.distanceKm} km
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                No M2.0+ USGS earthquakes recorded within 250 km in the past 30 days.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gemini Grounded Municipal Water Table, Pumping Stations & Fault History */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              City Water Table, Pumping Stations, Flood Zones & Seismic Fault Intelligence
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Retrieves grounded geological, FEMA flood, pumping infrastructure, and fault-line history for{' '}
              {coords.label}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFetchCityIntel}
            disabled={loadingIntel}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 disabled:opacity-60 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {loadingIntel ? 'Querying Municipal & USGS Records...' : 'Generate Grounded Location Report'}
          </button>
        </div>

        {cityIntel && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{cityIntel.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" /> Historical Water Table
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{cityIntel.waterTableDepth}</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-sky-600" /> Pumping Stations & Flood Zone
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {cityIntel.pumpingStations} {cityIntel.floodZoneRisk}
                </p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Faults, Fire & Soil Composition
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {cityIntel.earthquakeFaultContext} {cityIntel.fireHazardZone} {cityIntel.soilComposition}
                </p>
              </div>
            </div>
            {cityIntel.sources?.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {cityIntel.sources.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {s.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Neighborhood Property Almanac (Real-Time Flood & Condition Feed) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Community Neighborhood Almanac (Real-Time Field Conditions)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Neighbor-verified flooding, standing water depth, and elevation observations feeding predictive risk models.
            </p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {almanac.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{item.conditionType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.city}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{item.waterDepthInches}" water</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{item.elevationNotes}</p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Logged by {item.reporterName} · {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onVerifyAlmanac(item.id)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 tabular-nums"
                >
                  Confirm Observation ({item.verifiedByNeighbors})
                </button>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmitAlmanac}
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <MapPin className="w-4 h-4 text-amber-600" />
            Log Real-Time Street / Flood Observation
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Condition</label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value as AlmanacReport['conditionType'])}
                className="w-full px-2.5 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Active Flooding">Active Flooding</option>
                <option value="High Water Table">High Water Table</option>
                <option value="Standing Drainage">Standing Drainage</option>
                <option value="Fire Smoke / Ash">Fire Smoke / Ash</option>
                <option value="Structural / Ground Shift">Structural / Ground Shift</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Water Depth (in)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={waterDepthInches}
                onChange={(e) => setWaterDepthInches(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
            <input
              type="text"
              required
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="e.g. Jordan P."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Elevation / Drainage Observation
            </label>
            <textarea
              rows={3}
              required
              value={elevationNotes}
              onChange={(e) => setElevationNotes(e.target.value)}
              placeholder="Note street cross-section, curb overflow, or sump pump activity..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={submittingReport}
            className="w-full py-2 px-4 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg transition-colors"
          >
            {submittingReport ? 'Logging GPS Report...' : 'Submit Neighborhood Report'}
          </button>
        </form>
      </section>
    </div>
  );
};
