import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Copy,
  Droplets,
  ExternalLink,
  FileText,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  Wrench,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { DamageAnalysisResult } from '../types';

interface DiyGuide {
  id: string;
  category:
    | 'Organic Growth & Mold'
    | 'Smart Home Guard'
    | 'Soil & Groundwater'
    | 'Leak vs. Water Table'
    | 'Pest Control'
    | 'Equipment Rebuild'
    | 'Generators';
  title: string;
  readTime: string;
  codeStandard: string;
  summary: string;
  communityAttempt?: string;
  prosCons?: { pros: string[]; cons: string[] };
  steps: string[];
  toolsMaterials: { name: string; sourceUrl: string }[];
}

const DIY_GUIDES: DiyGuide[] = [
  {
    id: 'guide-soil',
    category: 'Soil & Groundwater',
    title: 'How to Test Soil Percolation & Check Local Water Table Yourself',
    readTime: '6 min guide',
    codeStandard: 'EPA / ASTM D5093 Field Percolation',
    summary:
      'Measure drainage speed, clay expansion, and shallow groundwater intrusion around your perimeter footing before waterproofing or installing French drains.',
    steps: [
      'Dig a 12-inch wide by 18-inch deep test hole 5 feet away from the foundation wall (call 811 utility locate first).',
      'Pour 2 inches of coarse gravel in the bottom, fill with water, and let it pre-soak for 4 hours so clay swells naturally.',
      'Refill the hole to 12 inches deep and measure drop per hour with a rigid ruler. Under 0.5 in/hr indicates low-permeability clay needing perimeter relief drainage.',
      'Leave an empty perforated 4-inch PVC observation sleeve overnight: if water rises from the bottom without rain, you have intersected a seasonal perched water table.',
    ],
    toolsMaterials: [
      { name: 'USGS National Water Dashboard (Groundwater Levels)', sourceUrl: 'https://dashboard.waterdata.usgs.gov/' },
      { name: 'USDA Web Soil Survey (Soil Hydrologic Group)', sourceUrl: 'https://websoilsurvey.nrcs.usda.gov/' },
    ],
  },
  {
    id: 'guide-leak',
    category: 'Leak vs. Water Table',
    title: 'Differentiating a Pressurized Pipe Leak from Groundwater Intrusion',
    readTime: '4 min guide',
    codeStandard: 'IICRC S500 / AWWA Meter Audit',
    summary:
      'Avoid tearing into slab concrete unnecessarily by verifying water chemistry, meter flow, and hydrostatic pressure gradients.',
    steps: [
      'Shut off all interior water fixtures, ice makers, and irrigation valves, then inspect the low-flow triangle on your municipal water meter for 15 continuous minutes.',
      'Dip a DPD free-chlorine test strip into the seepage water: municipal pipe leaks typically register 0.4–2.0 ppm free chlorine; rainwater/groundwater registers 0 ppm and higher TDS minerals.',
      'Use an infrared camera or pinless moisture meter along the slab-to-wall cove joint: groundwater shows a uniform horizontal capillary band, while pipe leaks radiate from a concentrated thermal hotspot.',
    ],
    toolsMaterials: [
      { name: 'IICRC S500 Water Damage Restoration Standard', sourceUrl: 'https://iicrc.org/s500/' },
      { name: 'EPA WaterSense Leak Detection Guide', sourceUrl: 'https://www.epa.gov/watersense/fix-leak' },
    ],
  },
  {
    id: 'guide-pest',
    category: 'Pest Control',
    title: 'Structural Tenting (Fumigation) vs. Hotspot Treatment: Pros, Cons & Code',
    readTime: '5 min guide',
    codeStandard: 'NPMA / Structural Pest Control Board',
    summary:
      'Compare whole-structure sulfuryl fluoride tenting against localized borate, foam, and bait hotspot remediation before signing a WDO contract.',
    prosCons: {
      pros: [
        'Tenting: Penetrates 100% of inaccessible attic rafters, wall voids, and sheathing simultaneously with zero surface residue.',
        'Hotspot (Borates / Non-Repellent Foam): Zero house evacuation required, 70% lower cost, leaves long-term residual protection in exposed framing.',
      ],
      cons: [
        'Tenting: Requires 48–72 hr evacuation, utility gas shutoff, food double-bagging, and zero residual protection against new swarmers.',
        'Hotspot: Cannot eliminate hidden secondary drywood termite galleries sealed behind finished drywall or stucco.',
      ],
    },
    steps: [
      'Demand a written Wood Destroying Organism (WDO) inspection diagram separating active Section 1 infestation from conducive Section 2 moisture.',
      'Repair plumbing leaks and grade soil 6 inches below siding weep screeds before applying any chemical barrier.',
      'For localized subterranean or sill-plate activity, inject non-repellent foam into kick-out holes and install exterior perimeter bait monitors.',
    ],
    toolsMaterials: [
      { name: 'EPA Termite Treatment & Fumigation Safety', sourceUrl: 'https://www.epa.gov/safepestcontrol/termites-how-identify-and-control-them' },
      { name: 'NPMA Pest Control Consumer Standards', sourceUrl: 'https://www.pestworld.org/' },
    ],
  },
  {
    id: 'guide-gen',
    category: 'Generators',
    title: 'Standby & Inverter Generator Safety, Transfer Switches & Brand Audit',
    readTime: '5 min guide',
    codeStandard: 'NEC Article 702 / ANSI/PGMA G300',
    summary:
      'Size backup power accurately for sump pumps, refrigerators, and medical loads while avoiding deadly carbon monoxide backfeed mistakes.',
    steps: [
      'Calculate running watts plus 2x–3x surge watts for inductive sump pumps (typical 1/2 HP sump pump needs 800W running / 2,000W surge).',
      'Install a UL-listed manual transfer switch or interlock kit—never use a male-to-male suicide cord into a dryer outlet.',
      'Position portable inverter generators at least 20 feet downwind from doors, windows, and crawlspace vents with battery-backed CO detectors inside.',
    ],
    toolsMaterials: [
      { name: 'CPSC Portable Generator Safety Guidelines', sourceUrl: 'https://www.cpsc.gov/Safety-Education/Safety-Guides/Home/Portable-Generators' },
      { name: 'FEMA Backup Power Readiness', sourceUrl: 'https://www.ready.gov/power-outages' },
    ],
  },
  {
    id: 'guide-organic-growth',
    category: 'Organic Growth & Mold',
    title: 'Organic Growth Biology: Preventing a Contaminated House & Spore Bring-Home',
    readTime: '6 min guide',
    codeStandard: 'EPA Mold Guide / IICRC S520',
    summary:
      'Microbial mold spores exist everywhere outdoors, but colonize indoors when relative humidity exceeds 60% or contaminated produce/packaging enters damp rooms. Keep a sealed positive-pressure filtered envelope.',
    communityAttempt:
      'Previous homeowner solution: Replaced open produce storage + ran ERV HEPA bypass keeping indoor RH at 44%, eliminating recurrent pantry and window-sill spotting without bleach.',
    steps: [
      'Maintain indoor relative humidity strictly between 35% and 50% using calibrated hygrometers in bathrooms, kitchens, and crawlspaces.',
      'Inspect grocery produce bags and corrugated cardboard boxes outside before bringing them into pantries—discard damp packaging from stores with moldy misters.',
      'Run a sealed-system ERV + MERV-16/HEPA positive-pressure filtration unit so filtered air pushes outward rather than pulling unconditioned crawlspace spores inward.',
      'Never paint over or bleach porous drywall/wood showing organic growth; physically remove affected porous material under negative-air HEPA containment.',
    ],
    toolsMaterials: [
      { name: 'EPA Mold Course & Moisture Control Standard', sourceUrl: 'https://www.epa.gov/mold/mold-course-chapter-1' },
      { name: 'IICRC S520 Professional Mold Remediation Standard', sourceUrl: 'https://iicrc.org/s520/' },
    ],
  },
  {
    id: 'guide-smart-guard',
    category: 'Smart Home Guard',
    title: 'Smart Home Vacation Guard: Automated Leak Shutoff & Remote Pro Alerting',
    readTime: '5 min guide',
    codeStandard: 'UL 1951 / Cellular Telemetry',
    summary:
      'Protect your property while traveling by pairing motorized main water shutoff valves with battery-backed leak, sump-level, and humidity alerts routed to trusted neighbors or verified contractors.',
    communityAttempt:
      'Verified outcome: Ultrasonic valve shut off a burst braided washer hose within 40 seconds while owners were overseas, preventing $18,000 in hardwood loss.',
    steps: [
      'Install a motorized ball valve on the main cold-water riser downstream of the fire sprinkler tee (never restrict fire suppression lines).',
      'Place Zigbee/Wi-Fi water-detection pucks under water heaters, dishwashers, washing machines, and inside sump pump basins.',
      'Configure secondary SMS/webhook escalation to a nearby trusted contact and your verified local C-36 plumber or IICRC restorer before leaving on vacation.',
    ],
    toolsMaterials: [
      { name: 'Insurance Institute for Business & Home Safety (IBHS) Water Shutoff', sourceUrl: 'https://ibhs.org/' },
    ],
  },
  {
    id: 'guide-rebuild',
    category: 'Equipment Rebuild',
    title: 'How to Clean, Maintain & Rebuild Used Dehumidifiers, Scrubbers & Filters',
    readTime: '7 min guide',
    codeStandard: 'EPA 608 Safe Service / Manufacturer Spec',
    summary:
      'Save 60%+ buying ex-rental commercial restoration gear by safely sanitizing coils, replacing motor brushes/bearings, and swapping HEPA cassettes.',
    steps: [
      'Unplug unit and discharge start capacitors safely; open outer housing and vacuum intake pre-filter screen and blower wheel.',
      'Apply non-acidic evaporator coil cleaner to aluminum fins, rinse condensate pan, and replace brittle vinyl drain check-valves.',
      'Inspect gasket perimeter seals around HEPA H13 cartridges so zero air bypasses the filter media; log baseline amp draw with a clamp meter.',
    ],
    toolsMaterials: [
      { name: 'ASHRAE Indoor Air Filtration Guidance', sourceUrl: 'https://www.ashrae.org/technical-resources/filtration-and-disinfection-faq' },
    ],
  },
];

function createSampleDamageImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Concrete foundation wall & slab floor visual sample
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 960, 360);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 360, 960, 180);

  // Damp hydrostatic dark band along cove joint
  const grad = ctx.createLinearGradient(0, 270, 0, 390);
  grad.addColorStop(0, 'rgba(51, 65, 85, 0)');
  grad.addColorStop(0.65, 'rgba(30, 41, 59, 0.55)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(40, 270, 880, 120);

  // Efflorescence white mineral deposits
  ctx.fillStyle = 'rgba(248, 250, 252, 0.65)';
  for (let i = 0; i < 45; i++) {
    ctx.beginPath();
    ctx.arc(160 + i * 14, 325 + Math.sin(i) * 14, 4 + (i % 5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Diagonal structural hairline crack
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(410, 85);
  ctx.lineTo(435, 165);
  ctx.lineTo(422, 240);
  ctx.lineTo(458, 348);
  ctx.stroke();

  // Mold/moisture corner darkening
  ctx.fillStyle = 'rgba(20, 30, 25, 0.35)';
  ctx.beginPath();
  ctx.ellipse(730, 335, 95, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 18px sans-serif';
  ctx.fillText('SAMPLE FIELD CAPTURE · FOUNDATION COVE JOINT & EFFLORESCENCE', 28, 38);

  return canvas.toDataURL('image/jpeg', 0.88);
}

interface Props {
  locationLabel: string;
  onNavigateToContractors: (specialty?: string) => void;
  onNavigateToStore: (category?: string) => void;
  onAskGuide: (question: string) => void;
}

export const DiagnosticsWorkspace: React.FC<Props> = ({
  locationLabel,
  onNavigateToContractors,
  onNavigateToStore,
  onAskGuide,
}) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [description, setDescription] = useState<string>('');
  const [mode, setMode] = useState<string>('water_leak_vs_groundwater');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DamageAnalysisResult | null>(null);

  // Animated overlay playback state
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copiedVerbiage, setCopiedVerbiage] = useState<boolean>(false);

  // Searchable DIY guide state
  const [guideSearch, setGuideSearch] = useState<string>('');
  const [guideCategory, setGuideCategory] = useState<string>('All');
  const [expandedGuideId, setExpandedGuideId] = useState<string>('guide-soil');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!result?.animatedSteps?.length || !isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveStepIdx((prev) => (prev + 1) % result.animatedSteps.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [result, isPlaying]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setResult(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseSamplePhoto = () => {
    const sample = createSampleDamageImage();
    setImageDataUrl(sample);
    setMimeType('image/jpeg');
    setDescription(
      'White powdery mineral crust and damp concrete along basement cove joint with a diagonal hairline crack after heavy rain.'
    );
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);
    try {
      const base64 = imageDataUrl ? imageDataUrl.split(',')[1] : undefined;
      const res = await fetch('/api/ai/analyze-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: base64 ? mimeType : undefined,
          description:
            description ||
            'Inspect this structure for damage, early wear-and-tear, moisture intrusion, and repair cost breakdown.',
          mode,
          locationLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed.');
      }
      setResult(data as DamageAnalysisResult);
      setActiveStepIdx(0);
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyVerbiage = () => {
    if (!result?.insuranceClaimVerbiage) return;
    navigator.clipboard.writeText(result.insuranceClaimVerbiage);
    setCopiedVerbiage(true);
    setTimeout(() => setCopiedVerbiage(false), 2000);
  };

  const filteredGuides = DIY_GUIDES.filter((g) => {
    const matchesCat = guideCategory === 'All' || g.category === guideCategory;
    const q = guideSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.steps.some((s) => s.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const activeStep = result?.animatedSteps?.[activeStepIdx];

  return (
    <div className="space-y-10">
      {/* Split Hero Focal Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 lg:p-8">
          <div className="space-y-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Structural Intelligence · Cost Transparency · Code-Grounded
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
              Upload any property photo for instant structural diagnosis and animated repair steps.
            </h1>
            <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Whether you spot active water intrusion, hairline foundation cracks, suspected mold, or simply want a
              preventive check before buying—insights verifies building codes, separates plumbing leaks from groundwater,
              and prepares exact adjuster language.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Contractor Coverage</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                General A – Z
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Virtual Triage</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">$0 – $35</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Standards</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                IICRC · IRC
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[280px]">
          <img
            src="/src/assets/images/hero_property_inspection_1794575184487.jpg"
            alt="Structural engineer and homeowner inspecting concrete foundation with moisture meter"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent flex flex-col justify-end p-6">
            <div className="text-xs font-medium text-amber-300">
              Glass-Wall Verification · Live-Scan Pros · Grounded Public Records
            </div>
            <p className="text-sm text-white/95 mt-1 max-w-lg">
              Every diagnostic suggestion cites verified building codes, wholesale material specs, and local specialist
              licensure.
            </p>
          </div>
        </div>
      </section>

      {/* AI Photo Analyzer + Animated Solution Blueprint */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              AI Damage Analyzer & Animated Repair Walkthrough
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Inspects uploaded photos for structural integrity, early wear, leak vs. groundwater, and projects animated
              how-to vectors onto your image.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUseSamplePhoto}
            className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Load Sample Foundation Photo
          </button>
        </div>

        <form onSubmit={handleAnalyze} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left Column: Photo Upload / Animated Overlay Stage */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {imageDataUrl ? (
                <>
                  <img
                    src={imageDataUrl}
                    alt="Uploaded property inspection subject"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />

                  {/* Interactive Animated Repair Overlay */}
                  {result?.animatedSteps && result.animatedSteps.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                        {result.animatedSteps.map((step, idx) => {
                          const isCurrent = idx === activeStepIdx;
                          return (
                            <g key={step.stepNumber}>
                              {isCurrent && (
                                <motion.circle
                                  cx={step.targetX}
                                  cy={step.targetY}
                                  r={7}
                                  fill="rgba(217, 119, 6, 0.22)"
                                  stroke="#f59e0b"
                                  strokeWidth="0.7"
                                  initial={{ scale: 0.7, opacity: 0.4 }}
                                  animate={{ scale: [0.85, 1.3, 0.95], opacity: [0.6, 1, 0.7] }}
                                  transition={{ duration: 1.8, repeat: Infinity }}
                                />
                              )}
                              <circle
                                cx={step.targetX}
                                cy={step.targetY}
                                r={isCurrent ? 3.2 : 2.1}
                                fill={isCurrent ? '#d97706' : '#0f172a'}
                                stroke="#ffffff"
                                strokeWidth="0.5"
                              />
                              <text
                                x={step.targetX}
                                y={step.targetY + 0.9}
                                textAnchor="middle"
                                fontSize="2.4"
                                fontWeight="700"
                                fill="#ffffff"
                              >
                                {step.stepNumber}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {activeStep && (
                        <motion.div
                          key={activeStep.stepNumber}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-3 left-3 right-3 bg-slate-950/90 text-white border border-slate-700 rounded-lg p-3 pointer-events-auto"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-amber-300 font-medium">
                            <span>
                              Step {activeStep.stepNumber} of {result.animatedSteps.length} · {activeStep.actionType.toUpperCase()}
                            </span>
                            <span className="font-mono">{activeStep.codeReference}</span>
                          </div>
                          <div className="text-sm font-semibold mt-0.5">{activeStep.title}</div>
                          <p className="text-xs text-slate-200 mt-1">{activeStep.instruction}</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Capture or upload any wall, slab, roof, crawlspace, or plumbing photo
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Even if you do not see obvious damage, AI checks hairline settlement, moisture gradients, and early
                    material wear.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select Photo
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {imageDataUrl && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    Replace Photo
                  </button>
                  {result?.animatedSteps && result.animatedSteps.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsPlaying((p) => !p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-500 whitespace-nowrap shrink-0"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isPlaying ? 'Pause Solution' : 'Play Animated Solution'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStepIdx(0);
                          setIsPlaying(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Replay
                      </button>
                    </>
                  )}
                </div>

                {result?.animatedSteps && (
                  <div className="flex items-center gap-1">
                    {result.animatedSteps.map((s, idx) => (
                      <button
                        key={s.stepNumber}
                        type="button"
                        onClick={() => {
                          setActiveStepIdx(idx);
                          setIsPlaying(false);
                        }}
                        className={`w-7 h-7 text-xs font-mono font-semibold rounded-md transition-colors ${
                          idx === activeStepIdx
                            ? 'bg-slate-900 dark:bg-amber-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {s.stepNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Context Form & Instant Cost/Action Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Inspection Focus Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="routine_check">Routine Preventive Structural Check (No Suspected Issue)</option>
                  <option value="water_leak_vs_groundwater">Water Intrusion: Pipe Leak vs. Groundwater Table</option>
                  <option value="structural_crack">Foundation Settlement & Crack Integrity</option>
                  <option value="mold_habitability">Mold & Tenant Habitability Documentation</option>
                  <option value="insurance_claim">Insurance Claim & Adjuster Preparation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observed Conditions or Questions ({locationLabel})
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when moisture appears (after rain vs. constant), odors, hairline cracks, or contractor quotes you want verified..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {error && (
                <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={analyzing}
                className="w-full py-2.5 px-4 text-sm font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                {analyzing ? 'Analyzing Structure & Grounding Codes...' : 'Analyze Photo & Estimate Repair Costs'}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grounded with real-time building code references and wholesale material pricing.
              </p>
            </div>
          </div>
        </form>

        {/* Detailed AI Diagnostic Output */}
        {result && (
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">Risk Severity</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      result.severity === 'Critical' || result.severity === 'High'
                        ? 'text-red-600'
                        : result.severity === 'Moderate'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                    }`}
                  />
                  {result.severity}
                </div>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">Estimated DIY Materials</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                  ${result.costEstimate.diyLowUsd.toLocaleString()} – ${result.costEstimate.diyHighUsd.toLocaleString()}
                </div>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">Licensed Pro Estimate</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                  ${result.costEstimate.proLowUsd.toLocaleString()} – ${result.costEstimate.proHighUsd.toLocaleString()}
                </div>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">Recommended Specialist</div>
                <button
                  type="button"
                  onClick={() => onNavigateToContractors(result.recommendedSpecialistType)}
                  className="text-left text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline mt-1"
                >
                  Book {result.recommendedSpecialistType} →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Structural Integrity & Early Wear Assessment
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {result.summary} {result.structuralIntegrityNote}
                  </p>
                  {result.earlyWearIndicators?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      {result.earlyWearIndicators.map((ind, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    Leak vs. Groundwater Table Differential
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {result.leakVsGroundwaterDiagnosis}
                  </p>
                </div>

                {/* Step-by-step Code Compliant Breakdown */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Code-Compliant How-To Steps & Material Links
                  </h3>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                    {result.animatedSteps.map((step, idx) => (
                      <div
                        key={step.stepNumber}
                        onClick={() => {
                          setActiveStepIdx(idx);
                          setIsPlaying(false);
                        }}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          idx === activeStepIdx
                            ? 'bg-amber-50/60 dark:bg-amber-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {step.stepNumber}. {step.title}
                          </div>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                            {step.codeReference}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{step.instruction}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>Tool: {step.toolNeeded}</span>
                          <span aria-hidden="true">·</span>
                          <span>Material: {step.materialSpec}</span>
                          <span aria-hidden="true">·</span>
                          <a
                            href={step.sourceQueryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            Verify Standard <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cost Table & Adjuster Verbiage */}
              <div className="lg:col-span-5 space-y-5">
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                    Itemized Cost Comparison (DIY vs. Licensed Pro)
                  </div>
                  <table className="w-full text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="text-left font-medium px-4 py-2">Line Item</th>
                        <th className="text-right font-medium px-3 py-2">DIY</th>
                        <th className="text-right font-medium px-4 py-2">Pro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {result.costEstimate.breakdown.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{row.item}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            ${row.diyUsd.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                            ${row.proUsd.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Need supplies or rental meters?</span>
                    <button
                      type="button"
                      onClick={() => onNavigateToStore('All')}
                      className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Open Wholesale Store →
                    </button>
                  </div>
                </div>

                {/* Insurance / Contractor Language Empowerment */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Insurance & Contractor Verbiage Script
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyVerbiage}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedVerbiage ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.insuranceClaimVerbiage}
                  </p>
                </div>

                {/* Grounded Sources */}
                {result.sources?.length > 0 && (
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Verified Grounding Sources
                    </div>
                    <ul className="space-y-1.5">
                      {result.sources.map((src, i) => (
                        <li key={i}>
                          <a
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:underline break-all"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {src.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Searchable Code-Compliant DIY Video & Guide Library */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Code-Compliant How-To Library & Self-Testing Protocols
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Soil testing, water-table differentiation, termite tenting vs. hotspot analysis, IICRC dry-out, and
              generator safety.
            </p>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={guideSearch}
              onChange={(e) => setGuideSearch(e.target.value)}
              placeholder="Search soil, leak, termite, generator..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg w-fit">
          {[
            'All',
            'Organic Growth & Mold',
            'Smart Home Guard',
            'Soil & Groundwater',
            'Leak vs. Water Table',
            'Pest Control',
            'Equipment Rebuild',
            'Generators',
          ].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setGuideCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                guideCategory === cat
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Direct Virtual Assistant Fallback Bar for Any How-To Question */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-700 dark:text-slate-300">
            Need a custom how-to walkthrough, equipment rebuild tutorial, or healthy-home hygiene advice not listed
            below?
          </div>
          <button
            type="button"
            onClick={() =>
              onAskGuide(
                guideSearch.trim()
                  ? `Give me a step-by-step code-compliant how-to guide and source links for: ${guideSearch}`
                  : 'Walk me through preventing organic growth and setting up smart home alerts while away.'
              )
            }
            className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg whitespace-nowrap shrink-0"
          >
            Open Virtual Assistant Chat for Custom How-To
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGuides.length === 0 ? (
            <div className="md:col-span-2 p-6 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                No pre-saved tutorial matched "{guideSearch}".
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Launch our Virtual Assistant directly with your topic to receive verified step-by-step instructions and
                material sources.
              </p>
              <button
                type="button"
                onClick={() =>
                  onAskGuide(`Provide a detailed, code-compliant step-by-step how-to guide for: ${guideSearch}`)
                }
                className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded-lg"
              >
                Ask AI Assistant About "{guideSearch}"
              </button>
            </div>
          ) : (
            filteredGuides.map((guide) => {
              const isOpen = expandedGuideId === guide.id;
              return (
                <div
                  key={guide.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{guide.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{guide.readTime}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{guide.codeStandard}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{guide.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{guide.summary}</p>
                    {guide.communityAttempt && (
                      <div className="mt-2 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                        {guide.communityAttempt}
                      </div>
                    )}
                  </div>

                {isOpen && (
                  <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {guide.prosCons && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg space-y-1">
                          <div className="font-bold text-emerald-900 dark:text-emerald-300">Pros</div>
                          {guide.prosCons.pros.map((p, i) => (
                            <p key={i} className="text-emerald-800 dark:text-emerald-200">
                              {p}
                            </p>
                          ))}
                        </div>
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg space-y-1">
                          <div className="font-bold text-amber-900 dark:text-amber-300">Cons & Limitations</div>
                          {guide.prosCons.cons.map((c, i) => (
                            <p key={i} className="text-amber-800 dark:text-amber-200">
                              {c}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside">
                      {guide.steps.map((s, i) => (
                        <li key={i} className="leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ol>

                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Verified Reference Links
                      </div>
                      {guide.toolsMaterials.map((tm, i) => (
                        <a
                          key={i}
                          href={tm.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {tm.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedGuideId(isOpen ? '' : guide.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white hover:text-amber-600"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {isOpen ? 'Collapse Steps' : 'View Code-Compliant Steps'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToStore(
                        guide.category === 'Pest Control'
                          ? 'Pest Control'
                          : guide.category === 'Organic Growth & Mold'
                            ? 'Remediation & Air'
                            : guide.category === 'Smart Home Guard'
                              ? 'Survival & Smart Guard'
                              : guide.category === 'Generators'
                                ? 'Emergency Power'
                                : 'Soil & Moisture'
                      )
                    }
                    className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    Shop Tools →
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>
      </section>
    </div>
  );
};
