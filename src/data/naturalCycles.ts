export interface NaturalCycleEntry {
  id: string;
  name: string;
  cadence: string;
  category: 'Ocean & Atmospheric' | 'Hydrology & Wildfire' | 'Astronomy & Tides' | 'Soil & Structural' | 'Biological & Air';
  whyPeopleForget: string;
  activePhaseNote: (monthZeroBased: number, year: number, lat: number) => {
    phaseLabel: string;
    urgency: 'Elevated' | 'Transitional' | 'Baseline';
  };
  earlySignals: string[];
  propertyProtectionSteps: string[];
  hazardOverlayKey: string;
}

export const NATURAL_CYCLES: NaturalCycleEntry[] = [
  {
    id: 'enso-oscillation',
    name: 'El Niño / La Niña (ENSO Wet-Dry Pendulum)',
    cadence: '2 to 7 Year Cycle',
    category: 'Ocean & Atmospheric',
    whyPeopleForget:
      'Three to five dry La Niña or neutral winters lull neighborhoods and city councils into neglecting storm drains, French drains, and roof flashing—until a single wet winter drops 200% normal rain.',
    activePhaseNote: (month) => {
      const wetSeason = month >= 9 || month <= 3;
      return {
        phaseLabel: wetSeason
          ? 'Peak Atmospheric-River & Storm-Track Window'
          : 'Dry Inter-Season Preparation Window',
        urgency: wetSeason ? 'Elevated' : 'Transitional',
      };
    },
    earlySignals: [
      'Equatorial Pacific SST anomalies shifting ±0.8°C over 90 days',
      'Back-to-back saturated soil (>35% 3–9cm volumetric moisture)',
      'Municipal storm grates backing up before peak storm',
    ],
    propertyProtectionSteps: [
      'Clean French drain outlets and backwater valves during dry months',
      'Inspect crawlspace sump pump float switch & backup marine battery',
      'Verify foundation grade slopes 6 inches away within 10 feet of walls',
    ],
    hazardOverlayKey: 'Flood & Groundwater',
  },
  {
    id: 'post-fire-debris-lag',
    name: 'Wildfire Burn-Scar → Hydrophobic Soil → Mudslide Cycle',
    cadence: '1 to 5 Year Post-Fire Lag',
    category: 'Hydrology & Wildfire',
    whyPeopleForget:
      'People assume danger ends once wildfire smoke clears. In reality, high-heat fires bake waxy plant resins into topsoil, turning slopes water-repellent so normal winter rains trigger debris flows 1–4 years later.',
    activePhaseNote: (month) => {
      const debrisWindow = month >= 10 || month <= 2;
      return {
        phaseLabel: debrisWindow
          ? 'High Hydrophobic Runoff & Slope Slip Window'
          : 'Dry Brush Fuel Accumulation Window',
        urgency: debrisWindow ? 'Elevated' : 'Transitional',
      };
    },
    earlySignals: [
      'Water beading instead of soaking on dry slope topsoil',
      'Muddy water sheeting down driveways within 15 minutes of rain',
      'Tension cracks along uphill retaining walls or hillside fences',
    ],
    propertyProtectionSteps: [
      'Install wattles, sandbag deflection berms, and silt fencing uphill before winter',
      'Clear V-ditches and culvert trash racks before every >0.5"/hr rainfall event',
      'Verify earth-movement / mudflow coverage separately from standard fire policies',
    ],
    hazardOverlayKey: 'Fire Weather & Smoke',
  },
  {
    id: 'king-tide-lunar-nodal',
    name: 'Perigean King Tides & 18.6-Year Lunar Nodal Cycle',
    cadence: 'Monthly Perigee + 18.6 Year Nodal Peak',
    category: 'Astronomy & Tides',
    whyPeopleForget:
      'Coastal and bayfront streets flood on completely sunny, rainless days because perigee (moon closest to Earth) aligns with full/new moon and the 18.6-year lunar nodal tilt (2025–2030 amplification window).',
    activePhaseNote: (month) => {
      const winterKing = month === 10 || month === 11 || month === 0 || month === 1;
      return {
        phaseLabel: winterKing
          ? 'Solstice-Perihelion King Tide Peak Alignment'
          : 'Standard Spring-Neap Monthly Tidal Cycle',
        urgency: winterKing ? 'Elevated' : 'Baseline',
      };
    },
    earlySignals: [
      'Saltwater bubbling up through dry-street municipal storm drains',
      'High tide overlapping with negative barometric pressure troughs',
      'Rising brackish groundwater inside low-lying basements',
    ],
    propertyProtectionSteps: [
      'Install inline sewer & drain backwater check valves on low-elevation laterals',
      'Avoid driving vehicles through brackish tidal street water (corrodes brakes/harnesses)',
      'Track tidal alignment alongside pressure drops—not rainfall totals alone',
    ],
    hazardOverlayKey: 'Flood & Groundwater',
  },
  {
    id: 'solar-cycle-25',
    name: 'Solar Cycle 25 Geomagnetic Storms & Grid Stress',
    cadence: '11-Year Solar Magnetic Reversal Cycle',
    category: 'Astronomy & Tides',
    whyPeopleForget:
      'During solar quiet years, societies rely 100% on fragile grid transformers and precision GPS. Around solar maximum (2024–2027), X-class CMEs induce geomagnetically induced currents that trip substations and skew GPS.',
    activePhaseNote: (_month, year) => ({
      phaseLabel:
        year >= 2024 && year <= 2027
          ? 'Solar Cycle 25 Maximum / Elevated Flare Activity'
          : 'Declining Solar Phase',
      urgency: year >= 2024 && year <= 2027 ? 'Elevated' : 'Baseline',
    }),
    earlySignals: [
      'NOAA SWPC Kp index >= 6 or G3+ geomagnetic storm watch',
      'Voltage flicker, transformer hum, or GPS drift >15 meters',
      'Shortwave radio blackouts preceding CME arrival by 18–48 hours',
    ],
    propertyProtectionSteps: [
      'Protect HVAC inverters, refrigerators, and routers with surge/brownout arrestors',
      'Keep offline PWA hazard maps and emergency battery backups charged above 80%',
      'Verify transfer switch & non-perishable grocery backup readiness',
    ],
    hazardOverlayKey: 'Severe Storm & Wind',
  },
  {
    id: 'dewpoint-mold-wave',
    name: 'Thermal Dew-Point Swing & Hidden Mold Sporulation Cycle',
    cadence: 'Seasonal & 72-Hour Barometric Swing',
    category: 'Biological & Air',
    whyPeopleForget:
      'Most people only watch for visible pipe leaks. When cool nights drop exterior wall temperatures below indoor dew point during humid transitions, hidden condensation saturates drywall backing and HVAC coils in 48 hours.',
    activePhaseNote: (month) => {
      const transition = month === 3 || month === 4 || month === 9 || month === 10;
      return {
        phaseLabel: transition
          ? 'High Dew-Point / Condensation Transition Window'
          : 'Steady-State Humidity Regime',
        urgency: transition ? 'Elevated' : 'Transitional',
      };
    },
    earlySignals: [
      'Indoor RH > 58% paired with cool >12°F wall/window surface drops',
      'Musty odor inside closets on exterior north-facing walls or grocery cold-cases',
      'Rising nighttime outdoor AQI trapping damp particulates near ground level',
    ],
    propertyProtectionSteps: [
      'Maintain sealed indoor RH strictly between 35% and 50% with LGR dehumidifiers',
      'Run MERV-13+ or HEPA air scrubbing during morning/night inversion windows',
      'Inspect HVAC evaporator coil pans and exterior grocery misters weekly',
    ],
    hazardOverlayKey: 'Flood & Groundwater',
  },
  {
    id: 'clay-shrink-swell-floodplain',
    name: '100-Year Floodplain & Expansive Clay Shrink–Swell Fatigue',
    cadence: 'Seasonal + 25–100 Year Recurrence',
    category: 'Soil & Structural',
    whyPeopleForget:
      'A "100-year flood" sounds like once a century—actually it carries a 26% probability over a 30-year mortgage. Meanwhile, expansive clay shrinks during droughts, opens foundation gaps, then heaves violently when saturated.',
    activePhaseNote: (_month, _year, lat) => ({
      phaseLabel:
        Math.abs(lat) < 40
          ? 'High Shrink-Swell & Flash Runoff Latitudinal Belt'
          : 'Freeze-Thaw Structural Expansion Belt',
      urgency: 'Transitional',
    }),
    earlySignals: [
      'Seasonal drywall diagonal cracks opening in summer and pinching shut in winter',
      'Exterior perimeter soil pulling 0.5–1.5 inches away from slab edges',
      'Doors sticking right after the first major soaking storm',
    ],
    propertyProtectionSteps: [
      'Maintain uniform perimeter moisture or root barriers—never let clay bone-dry then flood',
      'Check USGS subsidence and local Neighbor Almanac flood depth before buying property',
      'Anchor cripple walls and install flexible gas/water connectors in seismic zones',
    ],
    hazardOverlayKey: 'Earthquake / Seismic',
  },
];
