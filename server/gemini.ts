import { GoogleGenAI } from '@google/genai';
import type { DamageAnalysisResult, GroundingSource, HazardGuidanceResult } from '../src/types.ts';

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
