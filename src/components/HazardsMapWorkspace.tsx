import React, { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Droplets,
  ExternalLink,
  Flame,
  MapPin,
  Navigation,
  Play,
  RefreshCw,
  Sparkles,
  Square,
  Video,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { NATURAL_CYCLES, type NaturalCycleEntry } from '../data/naturalCycles';
import type {
  AlmanacReport,
  Contractor,
  FieldAuditRecord,
  GroundingSource,
  HazardAlert,
  HazardGuidanceResult,
  IndependentForecastResult,
  LiveHazardSnapshot,
  PowerOutageReport,
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
  { label: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { label: 'London, UK', lat: 51.5072, lon: -0.1276 },
];

interface CityIntel {
  summary: string;
  waterTableDepth: string;
  pumpingStations: string;
  floodZoneRisk: string;
  earthquakeFaultContext: string;
  fireHazardZone: string;
  soilComposition: string;
  townDisasterHistory?: string;
  agencyReadinessAndUpgrades?: string;
  investmentRiskAudit?: string;
  sources: GroundingSource[];
}

interface Props {
  coords: { lat: number; lon: number; label: string };
  onUpdateCoords: (next: { lat: number; lon: number; label: string }) => void;
  contractors: Contractor[];
  almanac: AlmanacReport[];
  powerOutages: PowerOutageReport[];
  audits: FieldAuditRecord[];
  onSaveAudit: (audit: FieldAuditRecord) => void;
  onAddAlmanac: (report: AlmanacReport) => void;
  onVerifyAlmanac: (id: string) => void;
  onAskGuide: (question: string) => void;
}

export const HazardsMapWorkspace: React.FC<Props> = ({
  coords,
  onUpdateCoords,
  contractors,
  almanac,
  powerOutages,
  audits,
  onSaveAudit,
  onAddAlmanac,
  onVerifyAlmanac,
  onAskGuide,
}) => {
  const [snapshot, setSnapshot] = useState<LiveHazardSnapshot | null>(null);
  const [loadingHazards, setLoadingHazards] = useState<boolean>(true);
  const [gpsNotice, setGpsNotice] = useState<string>('');
  const [worldQuery, setWorldQuery] = useState<string>('');
  const [searchingWorld, setSearchingWorld] = useState<boolean>(false);

  const [cityIntel, setCityIntel] = useState<CityIntel | null>(null);
  const [loadingIntel, setLoadingIntel] = useState<boolean>(false);

  // Interactive geospatial map layer toggles
  const [showQuakes, setShowQuakes] = useState<boolean>(true);
  const [showContractors, setShowContractors] = useState<boolean>(true);
  const [showAlmanac, setShowAlmanac] = useState<boolean>(true);
  const [selectedPinInfo, setSelectedPinInfo] = useState<{ title: string; detail: string } | null>(null);

  // Interactive Diagnostic Overlay State
  const [selectedHazardType, setSelectedHazardType] = useState<string>('Flood & Groundwater');
  const [diagOverlayOpen, setDiagOverlayOpen] = useState<boolean>(false);
  const [hazardGuidance, setHazardGuidance] = useState<HazardGuidanceResult | null>(null);
  const [loadingGuidance, setLoadingGuidance] = useState<boolean>(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [diagStepIdx, setDiagStepIdx] = useState<number>(0);

  // Independent AI Forecast State (Raw Sensors vs News Media)
  const [aiForecast, setAiForecast] = useState<IndependentForecastResult | null>(null);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Mother Nature Cycles Explorer State
  const [cycleCategoryFilter, setCycleCategoryFilter] = useState<string>('All');
  const [activeCycleId, setActiveCycleId] = useState<string>(NATURAL_CYCLES[0].id);

  // Live Camera & Video Audit Mode State
  const [auditOpen, setAuditOpen] = useState<boolean>(false);
  const [auditVenueType, setAuditVenueType] = useState<FieldAuditRecord['venueType']>('Home / Residential');
  const [auditVenueName, setAuditVenueName] = useState<string>('');
  const [auditWeekLabel, setAuditWeekLabel] = useState<string>('Week 1');
  const [auditCleanlinessScore, setAuditCleanlinessScore] = useState<string>('45');
  const [auditCosmeticCoverup, setAuditCosmeticCoverup] = useState<boolean>(false);
  const [auditReporterName, setAuditReporterName] = useState<string>('');
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [auditMediaType, setAuditMediaType] = useState<'photo' | 'video'>('photo');
  const [auditMediaDataUrl, setAuditMediaDataUrl] = useState<string | undefined>(undefined);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [cameraStatus, setCameraStatus] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Almanac form
  const [conditionType, setConditionType] = useState<AlmanacReport['conditionType']>('High Water Table');
  const [waterDepthInches, setWaterDepthInches] = useState<string>('2.5');
  const [elevationNotes, setElevationNotes] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);

  const stopCamera = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsRecordingVideo(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const launchDiagnosticOverlay = async (hazardType: string, alertContext?: string) => {
    setSelectedHazardType(hazardType);
    setDiagOverlayOpen(true);
    setLoadingGuidance(true);
    setGuidanceError(null);
    setDiagStepIdx(0);
    try {
      const res = await fetch('/api/ai/hazard-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazardType,
          locationLabel: coords.label,
          alertContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load AI hazard overlay.');
      setHazardGuidance(data as HazardGuidanceResult);
    } catch (err) {
      setGuidanceError(err instanceof Error ? err.message : 'Unable to fetch hazard diagnostic overlay.');
    } finally {
      setLoadingGuidance(false);
    }
  };

  const startLiveCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('Live camera API unavailable; use file photo/video upload below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCameraActive(true);
      setCameraStatus('Live Audit Camera active — snap a photo or record video.');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraStatus('Camera permission denied or unavailable; attach photo/video directly below.');
    }
  };

  const snapAuditPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setAuditMediaType('photo');
      setAuditMediaDataUrl(dataUrl);
      setCameraStatus('Timestamped photo captured into Audit Mode.');
    }
  };

  const toggleVideoRecording = () => {
    if (!streamRef.current) return;
    if (isRecordingVideo && recorderRef.current) {
      recorderRef.current.stop();
      setIsRecordingVideo(false);
      return;
    }
    const chunks: BlobPart[] = [];
    const rec = new MediaRecorder(streamRef.current);
    recorderRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAuditMediaType('video');
          setAuditMediaDataUrl(reader.result);
          setCameraStatus('Audit video clip saved and ready for backup.');
        }
      };
      reader.readAsDataURL(blob);
    };
    rec.start();
    setIsRecordingVideo(true);
    setCameraStatus('Recording Audit Mode video...');
  };

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

  const handleGenerateIndependentForecast = async () => {
    setLoadingForecast(true);
    setForecastError(null);
    try {
      const res = await fetch('/api/ai/independent-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coords.lat,
          lon: coords.lon,
          locationLabel: coords.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compute raw-sensor AI forecast.');
      if (data.snapshot) setSnapshot(data.snapshot as LiveHazardSnapshot);
      setAiForecast(data.forecast as IndependentForecastResult);
    } catch (err) {
      setForecastError(err instanceof Error ? err.message : 'Unable to run independent AI forecast.');
    } finally {
      setLoadingForecast(false);
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!worldQuery.trim()) return;
                setSearchingWorld(true);
                try {
                  const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(worldQuery.trim())}&count=1&language=en&format=json`
                  );
                  if (res.ok) {
                    const data = await res.json();
                    const hit = data?.results?.[0];
                    if (hit) {
                      const label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(', ');
                      onUpdateCoords({ lat: Number(hit.latitude.toFixed(4)), lon: Number(hit.longitude.toFixed(4)), label });
                      setGpsNotice(`Worldwide lock: ${label} (${hit.latitude.toFixed(3)}, ${hit.longitude.toFixed(3)})`);
                      setCityIntel(null);
                    } else {
                      setGpsNotice(`No location matched "${worldQuery}". Try another city worldwide.`);
                    }
                  }
                } finally {
                  setSearchingWorld(false);
                }
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={worldQuery}
                onChange={(e) => setWorldQuery(e.target.value)}
                placeholder="Any city worldwide..."
                className="w-40 px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={searchingWorld}
                className="px-3 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-lg whitespace-nowrap shrink-0"
              >
                {searchingWorld ? 'Finding...' : 'Go'}
              </button>
            </form>
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
                if (preset) {
                  setCityIntel(null);
                  onUpdateCoords(preset);
                }
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

        {/* GPS Live Air Quality & Mold Spore Telemetry Band */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">GPS Air Quality (US AQI)</div>
            <div
              className={`text-sm font-mono font-bold tabular-nums mt-0.5 ${
                (snapshot?.airQuality?.usAqi ?? 0) >= 151
                  ? 'text-red-700 dark:text-red-400'
                  : (snapshot?.airQuality?.usAqi ?? 0) >= 101
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {snapshot?.airQuality ? `${snapshot.airQuality.usAqi} · ${snapshot.airQuality.category}` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">PM2.5 / PM10</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {snapshot?.airQuality ? `${snapshot.airQuality.pm25} / ${snapshot.airQuality.pm10} µg/m³` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Ozone (O₃) / Dust</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {snapshot?.airQuality ? `${snapshot.airQuality.ozone} / ${snapshot.airQuality.dust} µg/m³` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Outdoor Mold Spore Risk</div>
            <div
              className={`text-sm font-semibold mt-0.5 ${
                snapshot?.airQuality?.moldSporeRisk === 'High'
                  ? 'text-red-700 dark:text-red-400'
                  : snapshot?.airQuality?.moldSporeRisk === 'Moderate'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {snapshot?.airQuality
                ? `${snapshot.airQuality.moldSporeRisk} (${snapshot.atmosphericRaw.humidityPct}% RH)`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Barometer / 3h Slope</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {snapshot?.atmosphericRaw
                ? `${snapshot.atmosphericRaw.pressureHpa} hPa (${snapshot.atmosphericRaw.pressureTrend3hHpa >= 0 ? '+' : ''}${snapshot.atmosphericRaw.pressureTrend3hHpa})`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pollen &amp; Filtration Note</div>
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={snapshot?.airQuality?.pollenSummary}>
              {snapshot?.airQuality?.pollenSummary || '—'}
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
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span>Amber Pin: Your GPS</span>
              <span aria-hidden="true">·</span>
              <span>Red Circles: Live USGS Quakes</span>
              <span aria-hidden="true">·</span>
              <span>Blue Pins: Flood Almanac Reports</span>
              <span aria-hidden="true">·</span>
              <span>Green Squares: Live-Scan Verified Contractors</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['Flood & Groundwater', 'Earthquake / Seismic', 'Fire Weather & Smoke', 'Severe Storm & Wind'].map(
                (hz) => (
                  <button
                    key={hz}
                    type="button"
                    onClick={() => launchDiagnosticOverlay(hz)}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-md whitespace-nowrap"
                  >
                    AI Overlay: {hz.split(' ')[0]}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setAuditOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-md whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                {auditOpen ? 'Close Audit Mode' : 'Audit Mode (Photo/Video)'}
              </button>
            </div>
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
                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5"
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
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Source: {alert.source}</span>
                      <button
                        type="button"
                        onClick={() => launchDiagnosticOverlay(alert.type, `${alert.title}: ${alert.description}`)}
                        className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        Repair Overlay & Videos →
                      </button>
                    </div>
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
                    <button
                      type="button"
                      onClick={() => launchDiagnosticOverlay('Earthquake / Seismic', q.title)}
                      className="truncate text-left text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      {q.title}
                    </button>
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

      {/* INTERACTIVE HAZARD DIAGNOSTIC OVERLAY (AI Step-by-Step Repair Guidance + Suggested Videos) */}
      {diagOverlayOpen && (
        <section className="bg-slate-900 text-white border border-amber-600/60 rounded-xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-mono text-amber-400">
                INTERACTIVE HAZARD DIAGNOSTIC OVERLAY · {selectedHazardType.toUpperCase()} · {coords.label}
              </div>
              <h2 className="text-lg font-bold mt-1">
                {hazardGuidance ? hazardGuidance.headline : `Generating AI Repair Plan & How-To Videos for ${selectedHazardType}...`}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onAskGuide(`Create a detailed DIY survival and repair checklist for ${selectedHazardType} in ${coords.label}`)
                }
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Ask AI Guide
              </button>
              <button
                type="button"
                onClick={() => setDiagOverlayOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-700"
                aria-label="Close diagnostic overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingGuidance ? (
            <div className="py-8 text-xs text-slate-300">
              Analyzing {selectedHazardType} risks and retrieving code-compliant repair video tutorials...
            </div>
          ) : guidanceError ? (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-200">{guidanceError}</div>
          ) : hazardGuidance ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-200 leading-relaxed">
                  <strong>Immediate Safety Protocol:</strong> {hazardGuidance.immediateSafetySummary}
                </div>

                {hazardGuidance.animatedSteps?.[diagStepIdx] && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-400 font-bold">
                        STEP {hazardGuidance.animatedSteps[diagStepIdx].stepNumber} OF{' '}
                        {hazardGuidance.animatedSteps.length} ·{' '}
                        {hazardGuidance.animatedSteps[diagStepIdx].actionType.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDiagStepIdx((i) => Math.max(0, i - 1))}
                          className="p-1 border border-slate-700 rounded hover:bg-slate-800"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDiagStepIdx((i) => (i + 1) % hazardGuidance.animatedSteps.length)
                          }
                          className="p-1 border border-slate-700 rounded hover:bg-slate-800"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {hazardGuidance.animatedSteps[diagStepIdx].title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {hazardGuidance.animatedSteps[diagStepIdx].instruction}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
                      <span>Tool: {hazardGuidance.animatedSteps[diagStepIdx].toolNeeded}</span>
                      <span aria-hidden="true">·</span>
                      <span>Material: {hazardGuidance.animatedSteps[diagStepIdx].materialSpec}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-amber-400">
                        {hazardGuidance.animatedSteps[diagStepIdx].codeReference}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  Suggested Code-Compliant How-To Repair Videos
                </div>
                <div className="space-y-2.5">
                  {hazardGuidance.suggestedVideos.map((vid, idx) => (
                    <a
                      key={idx}
                      href={vid.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-lg space-y-1 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
                        <span>{vid.codeStandard}</span>
                        <span>{vid.durationEstimate}</span>
                      </div>
                      <div className="text-xs font-bold text-white flex items-center justify-between gap-2">
                        <span>{vid.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      </div>
                      <div className="text-xs text-slate-400">{vid.focus}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* AUDIT MODE: LIVE PHOTO / VIDEO CAPTURE FOR STORE, HOUSE OR BUSINESS + OFFLINE AUTO-BACKUP */}
      {auditOpen && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Field Evidence Audit Mode · Works Offline with Automatic Local Backup & Sync
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-600" />
                Live Photo & Video Condition Audit (Store, House, or Business)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startLiveCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Start Live Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                >
                  Stop Camera
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-3">
              {cameraActive && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 aspect-video object-cover"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={snapAuditPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded-lg"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Snap Photo
                    </button>
                    <button
                      type="button"
                      onClick={toggleVideoRecording}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white ${
                        isRecordingVideo ? 'bg-red-600' : 'bg-slate-800'
                      }`}
                    >
                      {isRecordingVideo ? <Square className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      {isRecordingVideo ? 'Stop Recording' : 'Record Video Clip'}
                    </button>
                  </div>
                </div>
              )}

              {cameraStatus && (
                <div className="text-xs font-mono text-amber-700 dark:text-amber-300">{cameraStatus}</div>
              )}

              {auditMediaDataUrl && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-950">
                  {auditMediaType === 'video' ? (
                    <video src={auditMediaDataUrl} controls className="w-full max-h-56 rounded" />
                  ) : (
                    <img
                      src={auditMediaDataUrl}
                      alt="Captured audit condition"
                      className="w-full max-h-56 object-cover rounded"
                    />
                  )}
                </div>
              )}

              <label className="block text-xs text-slate-600 dark:text-slate-300">
                Or Upload Photo / Video from Device:
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAuditMediaType(file.type.startsWith('video') ? 'video' : 'photo');
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') setAuditMediaDataUrl(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="mt-1 block w-full text-xs"
                />
              </label>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!auditVenueName.trim() || !auditNotes.trim()) return;
                const record: FieldAuditRecord = {
                  id: `aud-${Date.now()}`,
                  venueType: auditVenueType,
                  venueName: auditVenueName.trim(),
                  locationLabel: coords.label,
                  lat: coords.lat,
                  lon: coords.lon,
                  notes: auditNotes.trim(),
                  weekLabel: auditVenueType !== 'Home / Residential' ? auditWeekLabel.trim() || 'Week 1' : undefined,
                  cleanlinessScore:
                    auditVenueType !== 'Home / Residential' ? Number(auditCleanlinessScore) || 45 : undefined,
                  cosmeticCoverupDetected: auditCosmeticCoverup,
                  reporterName: auditReporterName.trim() || undefined,
                  mediaType: auditMediaType,
                  mediaDataUrl: auditMediaDataUrl,
                  capturedAt: new Date().toISOString(),
                  syncedToServer: false,
                };
                onSaveAudit(record);
                setAuditVenueName('');
                setAuditNotes('');
                setAuditCosmeticCoverup(false);
                setAuditMediaDataUrl(undefined);
                setCameraStatus('Audit saved & backed up locally (auto-syncing when online).');
              }}
              className="lg:col-span-6 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={auditVenueType}
                  onChange={(e) => setAuditVenueType(e.target.value as FieldAuditRecord['venueType'])}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Home / Residential">Home / Residential</option>
                  <option value="Grocery Store">Grocery Store (+$20/$35 Scout Pay)</option>
                  <option value="Restaurant / Food Business">Restaurant / Food Business (+$20/$35)</option>
                  <option value="Storage Facility">Storage Facility (+$20/$35)</option>
                  <option value="Hygiene / Cleaning Business">Hygiene / Cleaning Business (+$20/$35)</option>
                  <option value="Commercial Building">Commercial Building (+$20/$35)</option>
                </select>
                <input
                  type="text"
                  required
                  value={auditVenueName}
                  onChange={(e) => setAuditVenueName(e.target.value)}
                  placeholder="House, Store, Storage or Business Name"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {auditVenueType !== 'Home / Residential' && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={auditWeekLabel}
                      onChange={(e) => setAuditWeekLabel(e.target.value)}
                      placeholder="Week (Week 1)"
                      className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={auditCleanlinessScore}
                      onChange={(e) => setAuditCleanlinessScore(e.target.value)}
                      placeholder="Cleanliness (0-100)"
                      className="px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={auditReporterName}
                      onChange={(e) => setAuditReporterName(e.target.value)}
                      placeholder="Beta Scout Name"
                      className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auditCosmeticCoverup}
                      onChange={(e) => setAuditCosmeticCoverup(e.target.checked)}
                    />
                    Cosmetic cover-up detected (hid grime/mold behind displays instead of cleaning)
                  </label>
                </div>
              )}

              <textarea
                rows={3}
                required
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Document water intrusion, mold growth, pest signs, structural cracks, storage humidity, or cooler temperature..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Save Timestamped Audit &amp; Auto-Backup
              </button>

              {audits.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 max-h-44 overflow-y-auto">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Recent Saved Audits ({audits.length})
                  </div>
                  {audits.map((a) => (
                    <div key={a.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {a.venueName} ({a.venueType})
                        </span>
                        <span className={a.syncedToServer ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                          {a.syncedToServer ? 'Synced' : 'Local Backup (Offline)'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{a.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </section>
      )}

      {/* INDEPENDENT AI SENSOR FORECAST (ZERO BROADCAST MEDIA SPIN) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              First-Principles Atmospheric Physics · Barometric Slope, Dew Point &amp; AQI Dispersion · No TV News Spin
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Independent AI Predicted Forecast for {coords.label}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Computes its own multi-day weather, mold-humidity window, and air-quality forecast strictly from raw station telemetry instead of relying on broadcast news anchors.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateIndependentForecast}
            disabled={loadingForecast}
            className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {loadingForecast ? 'Computing Raw Sensor Forecast...' : 'Run Independent AI Forecast'}
          </button>
        </div>

        {/* Raw Sensor Metrics Bar */}
        {snapshot?.atmosphericRaw && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Temp / Dew Point Spread</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {snapshot.weather.temperatureF}°F / {snapshot.atmosphericRaw.dewPointF}°F
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Convective Energy (CAPE)</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {snapshot.atmosphericRaw.capeJkg} J/kg
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Cloud Cover / UV Index</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {snapshot.atmosphericRaw.cloudCoverPct}% · UV {snapshot.airQuality.uvIndex}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">NO₂ / CO Trace Load</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {snapshot.airQuality.no2} / {snapshot.airQuality.co} µg/m³
              </div>
            </div>
          </div>
        )}

        {forecastError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-800 dark:text-red-200">
            {forecastError}
          </div>
        )}

        {aiForecast && (
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">{aiForecast.headline}</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {aiForecast.methodologyNote}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <strong>Barometric &amp; Moisture Physics:</strong> {aiForecast.barometricAndMoistureAnalysis}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiForecast.predictedPeriods.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{p.window}</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                      {p.confidencePct}% conf
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{p.condition}</div>
                  <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                    {p.tempRangeF} · {p.precipProbabilityPct}% precip · {p.aqiProjection}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Driver:</strong> {p.hazardDriver}
                  </div>
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-400">
                    {p.actionablePrep}
                  </div>
                </div>
              ))}
            </div>

            {aiForecast.blindSpotsMediaMisses?.length > 0 && (
              <div className="p-4 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  What TV / News Weather Misses at This Location
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-200">
                  {aiForecast.blindSpotsMediaMisses.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CYCLES MOTHER NATURE GOES THROUGH & PEOPLE FORGET */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Longitudinal Earth Rhythms · Active Phase Tracker ({new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })})
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Cycles Mother Nature Repeats That People Forget
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Multi-year weather, tidal, solar, burn-scar, and soil cycles that catch homeowners off guard between quiet decades.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
            {['All', 'Ocean & Atmospheric', 'Hydrology & Wildfire', 'Astronomy & Tides', 'Biological & Air', 'Soil & Structural'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCycleCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    cycleCategoryFilter === cat
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            {NATURAL_CYCLES.filter(
              (c) => cycleCategoryFilter === 'All' || c.category === cycleCategoryFilter
            ).map((cycle) => {
              const now = new Date();
              const phase = cycle.activePhaseNote(now.getMonth(), now.getFullYear(), coords.lat);
              const isSelected = activeCycleId === cycle.id;
              return (
                <button
                  key={cycle.id}
                  type="button"
                  onClick={() => setActiveCycleId(cycle.id)}
                  className={`w-full text-left p-3.5 transition-colors space-y-1 ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-slate-800 text-white'
                      : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className={isSelected ? 'text-amber-300 font-mono' : 'text-slate-500 dark:text-slate-400 font-mono'}>
                      {cycle.cadence}
                    </span>
                    <span
                      className={`font-semibold ${
                        phase.urgency === 'Elevated'
                          ? isSelected
                            ? 'text-amber-300'
                            : 'text-red-700 dark:text-red-400'
                          : isSelected
                            ? 'text-slate-300'
                            : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {phase.urgency} Now
                    </span>
                  </div>
                  <div className="text-xs font-bold">{cycle.name}</div>
                  <div className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {phase.phaseLabel}
                  </div>
                </button>
              );
            })}
          </div>

          {(() => {
            const selectedCycle: NaturalCycleEntry =
              NATURAL_CYCLES.find((c) => c.id === activeCycleId) || NATURAL_CYCLES[0];
            const now = new Date();
            const phase = selectedCycle.activePhaseNote(now.getMonth(), now.getFullYear(), coords.lat);
            return (
              <div className="lg:col-span-7 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    {selectedCycle.category} · {selectedCycle.cadence}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{phase.phaseLabel}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedCycle.name}</h3>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Why People Forget This Cycle</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedCycle.whyPeopleForget}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white mb-1.5">Early Warning Signals</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                      {selectedCycle.earlySignals.map((sig, i) => (
                        <li key={i}>{sig}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white mb-1.5">Protect Property Before Impact</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                      {selectedCycle.propertyProtectionSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => launchDiagnosticOverlay(selectedCycle.hazardOverlayKey, selectedCycle.name)}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                  >
                    Open Repair Overlay for This Cycle
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onAskGuide(
                        `How does the "${selectedCycle.name}" cycle impact homes near ${coords.label}, and what step-by-step preparations should I do now?`
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900"
                  >
                    Ask AI Guide About This Cycle
                  </button>
                </div>
              </div>
            );
          })()}
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
              {cityIntel.townDisasterHistory && (
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-amber-600" /> Town Disaster & Infrastructure History
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {cityIntel.townDisasterHistory}
                  </p>
                </div>
              )}
              {cityIntel.agencyReadinessAndUpgrades && (
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-emerald-600" /> Agency Staffing & Post-Disaster Upgrades
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {cityIntel.agencyReadinessAndUpgrades}
                  </p>
                </div>
              )}
              {cityIntel.investmentRiskAudit && (
                <div className="p-4 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-600" /> Pre-Purchase Property & Neighbor Risk Audit
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    {cityIntel.investmentRiskAudit}
                  </p>
                </div>
              )}
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

      {/* Live Power Outages & Grocery Store Cold-Chain Spoilage Advisories */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Grid Feeder Telemetry · Cold-Chain Refrigeration Watch
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Active Power Outages & Affected Grocery Store Spoilage Alerts
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Tracks grid blackouts exceeding FDA 4-hour cold-holding thresholds so shoppers avoid spoiled perishables.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {powerOutages.map((po) => (
            <div
              key={po.id}
              className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 bg-slate-50 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{po.utilityOrDistrict}</span>
                <span
                  className={`font-semibold ${
                    po.status === 'Active Outage'
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {po.status} · {po.durationHours}h
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                {po.city} · {po.affectedCustomers.toLocaleString()} customers impacted
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-200">
                <span className="font-semibold">Affected Grocery Stores (Inspect Cold Cases Before Buying):</span>{' '}
                {po.nearbyAffectedGrocers.join(' · ')}
              </div>
            </div>
          ))}
        </div>
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
