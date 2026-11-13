import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type {
  AgencyCrossCheck,
  DamageAnalysisResult,
  GroundingSource,
  HazardGuidanceResult,
  IndependentForecastResult,
  LiveHazardSnapshot,
  PublicCloudAgencyRecord,
} from '../src/types.ts';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractGroundingSources(response: unknown): GroundingSource[] {
  const r = response as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{
          web?: { uri?: string; title?: string };
        }>;
      };
    }>;
  };
  const chunks = r.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title || uri;
    if (uri && title && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ title, uri });
    }
  }
  return sources;
}

function extractJsonBlock<T>(rawText: string): T {
  const cleaned = rawText.trim();
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : cleaned;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as T;
  }
  return JSON.parse(candidate) as T;
}

export async function analyzePropertyPhoto(params: {
  imageBase64?: string;
  mimeType?: string;
  description: string;
  mode: string;
  locationLabel: string;
}): Promise<DamageAnalysisResult> {
  const ai = getClient();

  const prompt = `You are a licensed structural engineer, IICRC master restorer, and property insurance claims specialist inside "insights", a glass-wall truth platform.
Analyze the user's property issue${params.imageBase64 ? ' (using the attached photo)' : ''} in location: "${params.locationLabel}".
Inspection Focus Mode: "${params.mode}".
User notes: "${params.description || 'Routine structural integrity and early wear inspection'}".

Use Google Search grounding to verify building code standards (IBC/IRC, IICRC S500/S520, FEMA, or EPA mold guidelines) and realistic 2026 material/contractor labor rates.

Return ONLY valid JSON matching this exact structure (no markdown commentary outside JSON):
{
  "summary": "Clear, calm plain-English diagnostic summary",
  "severity": "Low" | "Moderate" | "High" | "Critical",
  "structuralIntegrityNote": "Assessment of load-bearing, foundation, moisture, or early hidden wear-and-tear",
  "earlyWearIndicators": ["indicator 1", "indicator 2", "indicator 3"],
  "leakVsGroundwaterDiagnosis": "Clear explanation distinguishing pressurized plumbing leak vs. hydrostatic groundwater table intrusion and exact DIY test steps",
  "costEstimate": {
    "diyLowUsd": 120,
    "diyHighUsd": 380,
    "proLowUsd": 950,
    "proHighUsd": 2400,
    "breakdown": [
      { "item": "Material or labor line item", "diyUsd": 85, "proUsd": 650 }
    ]
  },
  "insuranceClaimVerbiage": "Exact professional script & terminology the homeowner can copy when speaking to an insurance adjuster or contractor so they are not taken advantage of",
  "recommendedSpecialistType": "e.g. IICRC Restoration or Structural Engineer or HVAC & Sealed-Air Systems",
  "animatedSteps": [
    {
      "stepNumber": 1,
      "title": "Short step title",
      "instruction": "Exact code-compliant step-by-step action for the DIYer or inspector",
      "actionType": "inspect" | "seal" | "drain" | "cut" | "test" | "ventilate",
      "targetX": 45,
      "targetY": 55,
      "toolNeeded": "Specific tool name",
      "materialSpec": "Code-compliant material spec",
      "codeReference": "e.g. IRC R406.1 / IICRC S500",
      "sourceQueryUrl": "https://codes.iccsafe.org/"
    }
  ]
}
Provide 4 to 5 animatedSteps with realistic targetX and targetY coordinates (15..85) pointing to logical zones of the photo.`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (params.imageBase64 && params.mimeType) {
    parts.push({
      inlineData: {
        mimeType: params.mimeType,
        data: params.imageBase64,
      },
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? '';
  const parsed = extractJsonBlock<Omit<DamageAnalysisResult, 'sources'>>(text);
  const sources = extractGroundingSources(response);

  return {
    ...parsed,
    sources,
  };
}

export async function getLocationIntelligence(params: {
  lat: number;
  lon: number;
  locationLabel: string;
}): Promise<{
  summary: string;
  waterTableDepth: string;
  pumpingStations: string;
  floodZoneRisk: string;
  earthquakeFaultContext: string;
  fireHazardZone: string;
  soilComposition: string;
  townDisasterHistory: string;
  agencyReadinessAndUpgrades: string;
  investmentRiskAudit: string;
  sources: GroundingSource[];
}> {
  const ai = getClient();

  const prompt = `Provide verified worldwide municipal, geological, historical disaster, and pre-purchase property intelligence for coordinates (${params.lat.toFixed(4)}, ${params.lon.toFixed(4)}) / "${params.locationLabel}".
Use Google Search to retrieve real data from USGS, FEMA, local municipal public works, after-action emergency management reports, and geological surveys.
Return ONLY valid JSON with these keys:
{
  "summary": "2-3 sentence objective overview of property hazard profile for this location",
  "waterTableDepth": "Historical and current regional groundwater table depth and seasonal fluctuation notes",
  "pumpingStations": "Nearest municipal stormwater/groundwater pumping stations or flood-control districts",
  "floodZoneRisk": "FEMA / regional flood zone context and historical inundation events",
  "earthquakeFaultContext": "Nearest mapped earthquake fault lines, last major rupture year, and seismic hazard recurrence context",
  "fireHazardZone": "Local wildfire / WUI hazard severity and defensible space guidance",
  "soilComposition": "Dominant soil type (clay, sandy loam, alluvium, liquefaction susceptibility) and DIY soil percolation tips",
  "townDisasterHistory": "Documented major historical floods, wildfires, freezes, or earthquakes in this town/region",
  "agencyReadinessAndUpgrades": "Documented after-action findings on whether local/government agencies were understaffed or ill-equipped during past disasters, and specific drainage, grid, pump, or alert upgrades implemented afterward",
  "investmentRiskAudit": "Pre-purchase property & neighborhood due-diligence checklist to prevent buyers from making a costly bad investment here"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const parsed = extractJsonBlock<{
    summary: string;
    waterTableDepth: string;
    pumpingStations: string;
    floodZoneRisk: string;
    earthquakeFaultContext: string;
    fireHazardZone: string;
    soilComposition: string;
    townDisasterHistory: string;
    agencyReadinessAndUpgrades: string;
    investmentRiskAudit: string;
  }>(response.text ?? '');

  return {
    ...parsed,
    sources: extractGroundingSources(response),
  };
}

export async function askInsightsGuide(params: {
  question: string;
  contextSection: string;
  locationLabel: string;
}): Promise<{ answer: string; sources: GroundingSource[] }> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `User location: ${params.locationLabel}. Current workspace: ${params.contextSection}.\n\nUser question: ${params.question}`,
    config: {
      systemInstruction:
        'You are the insights Guide—an authoritative, calm property, health-hygiene, and equipment-rebuild advisor. Help everyday users stay independent and avoid losing money: (1) explain organic growth/mold biology and sealed fresh-air prevention, (2) give step-by-step smart-home vacation sensor & shutoff setups, (3) provide clear maintenance & rebuild tutorials for used dehumidifiers, air scrubbers, generators, and water filters, (4) translate contractor bids, IICRC standards, and insurance exclusions into empowering plain English. Always cite verified standards and real web sources when grounded via Google Search.',
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    answer: response.text ?? 'Unable to generate guidance right now.',
    sources: extractGroundingSources(response),
  };
}

export async function moderateSubmission(params: {
  type: 'review' | 'blacklist' | 'forum';
  text: string;
  hasEvidence: boolean;
}): Promise<{
  constructive: boolean;
  requiresHold: boolean;
  reason: string;
}> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Evaluate this ${params.type} submission for a transparent, truth-only property platform ("insights").
Evidence attached: ${params.hasEvidence ? 'Yes' : 'No'}.
Text: "${params.text}"

Return ONLY valid JSON:
{
  "constructive": boolean (false if abusive profanity, slurs, or purely hostile attack without factual detail),
  "requiresHold": boolean (true for blacklist claims or negative reviews lacking independent verification so fact-checkers hold before publishing),
  "reason": "1 short factual sentence explaining moderation decision"
}`,
    });
    return extractJsonBlock<{ constructive: boolean; requiresHold: boolean; reason: string }>(
      response.text ?? ''
    );
  } catch {
    return {
      constructive: true,
      requiresHold: params.type === 'blacklist' || !params.hasEvidence,
      reason: 'Queued for standard evidence and fact-check verification prior to public display.',
    };
  }
}

export async function generateHazardGuidance(params: {
  hazardType: string;
  locationLabel: string;
  alertContext?: string;
}): Promise<HazardGuidanceResult> {
  const ai = getClient();
  const prompt = `You are an emergency structural recovery specialist and code-compliant DIY instructor for "insights".
Generate an interactive repair & mitigation diagnostic plan for hazard type: "${params.hazardType}" at location: "${params.locationLabel}".
${params.alertContext ? `Active sensor/alert context: ${params.alertContext}` : ''}

Use Google Search grounding to align with FEMA, USGS, ICC/IRC, IICRC S500, or NFPA standards.
Return ONLY valid JSON matching this schema:
{
  "hazardType": "${params.hazardType}",
  "locationLabel": "${params.locationLabel}",
  "headline": "Short actionable headline",
  "immediateSafetySummary": "2-sentence immediate safety & utility shutoff check before starting repairs",
  "suggestedVideos": [
    {
      "title": "Specific how-to repair video tutorial title",
      "focus": "Exact structural/drainage/seismic/smoke task demonstrated",
      "durationEstimate": "6–9 min",
      "codeStandard": "FEMA / IRC / IICRC code section",
      "searchUrl": "https://www.youtube.com/results?search_query=..."
    }
  ],
  "animatedSteps": [
    {
      "stepNumber": 1,
      "title": "Short step title",
      "instruction": "Exact step-by-step action for the property owner",
      "actionType": "inspect" | "seal" | "drain" | "cut" | "test" | "ventilate",
      "targetX": 50,
      "targetY": 50,
      "toolNeeded": "Specific tool",
      "materialSpec": "Material spec",
      "codeReference": "Code ref",
      "sourceQueryUrl": "https://www.fema.gov/"
    }
  ]
}
Include 3 targeted suggestedVideos and 4–5 animatedSteps with targetX/targetY between 18 and 82.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const parsed = extractJsonBlock<Omit<HazardGuidanceResult, 'sources'>>(response.text ?? '');
  return {
    ...parsed,
    sources: extractGroundingSources(response),
  };
}

export async function generateIndependentForecast(params: {
  locationLabel: string;
  snapshot: LiveHazardSnapshot;
}): Promise<IndependentForecastResult> {
  const ai = getClient();
  const s = params.snapshot;
  const prompt = `You are an independent atmospheric physicist, hydrologist, and property-protection forecaster inside "insights".
CRITICAL RULE: Do NOT repeat vague television or mainstream news weather clichés. Derive your own first-principles meteorological, air-quality, and property-risk forecast strictly from the LIVE RAW SENSOR TELEMETRY below plus raw NOAA/Open-Meteo station physics.

Location: "${params.locationLabel}" (${s.lat.toFixed(4)}, ${s.lon.toFixed(4)})
Observed Timestamp: ${s.updatedAt}

RAW SENSOR TELEMETRY:
- Temperature: ${s.weather.temperatureF}°F | Dew Point: ${s.atmosphericRaw.dewPointF}°F | Relative Humidity: ${s.atmosphericRaw.humidityPct}%
- Sea-Level Barometric Pressure: ${s.atmosphericRaw.pressureHpa} hPa | 3-Hour Barometric Slope: ${s.atmosphericRaw.pressureTrend3hHpa >= 0 ? '+' : ''}${s.atmosphericRaw.pressureTrend3hHpa} hPa
- CAPE Convective Instability: ${s.atmosphericRaw.capeJkg} J/kg | Cloud Cover: ${s.atmosphericRaw.cloudCoverPct}%
- Wind: ${s.weather.windMph} mph (Gusts ${s.weather.windGustMph} mph) | Rain Rate: ${s.weather.precipitationMm} mm/hr
- Upper Soil Moisture (3-9cm): ${(s.weather.soilMoisture * 100).toFixed(0)}% | Basin River Discharge: ${s.weather.riverDischargeM3s ?? 'N/A'} m³/s
- Air Quality: US AQI ${s.airQuality.usAqi} (${s.airQuality.category}) | PM2.5 ${s.airQuality.pm25} µg/m³ | PM10 ${s.airQuality.pm10} µg/m³ | Ozone ${s.airQuality.ozone} µg/m³ | Mold Risk: ${s.airQuality.moldSporeRisk}
- 48h Raw Sensor Trajectory (6h intervals): ${JSON.stringify(s.atmosphericRaw.hourly48h)}

Return ONLY valid JSON matching this schema:
{
  "locationLabel": "${params.locationLabel}",
  "generatedAt": "${new Date().toISOString()}",
  "headline": "Sharp sensor-derived forecast verdict",
  "methodologyNote": "Explain concisely how this AI forecast calculates barometric slope, dew-point spread, hydrostatic lag, and particulate trapping directly from physical telemetry instead of broadcast news scripts",
  "barometricAndMoistureAnalysis": "Technical reading of pressure gradient, condensation/mold window, and inversion/AQI dispersion",
  "predictedPeriods": [
    {
      "window": "Next 12 Hours",
      "condition": "Concise physical weather & air condition",
      "confidencePct": 88,
      "tempRangeF": "54–66°F",
      "precipProbabilityPct": 20,
      "aqiProjection": "US AQI 35–48 (Good)",
      "hazardDriver": "Primary physical driver (e.g. barometric trough / radiative cooling inversion)",
      "actionablePrep": "Exact home, HVAC, sump, or travel action"
    }
  ],
  "blindSpotsMediaMisses": [
    "Specific hidden hazard broadcast news skips (e.g. 24-72h groundwater hydrostatic lag after rain stops, night dew-point condensation inside crawlspaces, stagnant valley PM2.5 trapping)"
  ]
}
Include exactly 4 predictedPeriods ("Next 12 Hours", "24–48 Hours", "Days 3–4", "Days 5–7") and 3 concrete blindSpotsMediaMisses.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      tools: [{ googleSearch: {} }],
    },
  });

  const parsed = extractJsonBlock<Omit<IndependentForecastResult, 'sources'>>(response.text ?? '');
  return {
    ...parsed,
    locationLabel: params.locationLabel,
    generatedAt: parsed.generatedAt || new Date().toISOString(),
    sources: extractGroundingSources(response),
  };
}

export async function runMultiAgencyFactCheck(params: {
  topicCategory: PublicCloudAgencyRecord['topicCategory'];
  region: string;
  title: string;
  claimOrMetric: string;
}): Promise<{
  consensusStatus: PublicCloudAgencyRecord['consensusStatus'];
  agencyChecks: AgencyCrossCheck[];
}> {
  const ai = getClient();
  const prompt = `You are the Public Cloud Multi-Agency Fact-Check Engine for "insights".
Cross-verify the following public environmental, safety, contractor, or infrastructure claim across distinct government agencies using live Google Search grounding so the public database exposes both corroboration and any inter-agency discrepancies.

Topic Category: ${params.topicCategory}
Region: ${params.region}
Title: ${params.title}
Claim / Metric to Audit: ${params.claimOrMetric}

Evaluate against at least 3 relevant agencies chosen from:
"NOAA / NWS", "USGS", "US EPA", "FEMA", "CDC", "FDA", "OSHA", "State Licensing Board".

Return ONLY valid JSON:
{
  "consensusStatus": "Multi-Agency Verified" | "Discrepancy Under Review",
  "agencyChecks": [
    {
      "agency": "US EPA",
      "status": "Corroborated" | "Discrepancy Flagged" | "Updated",
      "finding": "Concise 1-2 sentence factual finding referencing real standards or agency telemetry",
      "verifiedAt": "${new Date().toISOString()}",
      "sourceUrl": "https://www.epa.gov/"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return extractJsonBlock<{
    consensusStatus: PublicCloudAgencyRecord['consensusStatus'];
    agencyChecks: AgencyCrossCheck[];
  }>(response.text ?? '');
}

export async function triageUnsupportedFeature(params: {
  title: string;
  category: string;
  description: string;
}): Promise<{ aiScopeNote: string }> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `A user requested an unsupported feature for the "insights" property, air quality, hazard, and accountability platform.
Title: ${params.title}
Category: ${params.category}
Description: ${params.description}

Write a 2-sentence practical engineering scope note explaining how this can be added to the public roadmap (data source, safety/verification guardrails, and user benefit). Return plain text only.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    return {
      aiScopeNote:
        response.text?.trim() ||
        'Logged to the public engineering backlog for sensor integration and community verification.',
    };
  } catch {
    return {
      aiScopeNote:
        'Logged to the public roadmap queue for API scoping, multi-agency data verification, and offline PWA sync support.',
    };
  }
}
