export type VerificationStatus = 'verified' | 'pending_fact_check' | 'disputed';

export type ContractorCategory =
  | 'General A (Heavy Engineering)'
  | 'General B (Building)'
  | 'General C-36 (Plumbing)'
  | 'General C-10 (Electrical)'
  | 'General Z (Specialty / Foundation)'
  | 'IICRC Restoration'
  | 'Structural Engineer'
  | 'Industrial Hygienist'
  | 'Property Attorney'
  | 'Generator Specialist'
  | 'HVAC & Sealed-Air Systems'
  | 'Virtual Job Inspector';

export interface Contractor {
  id: string;
  name: string;
  company: string;
  category: ContractorCategory;
  licenseClass: string;
  licenseNumber: string;
  licenseVerified: boolean;
  liveScanCleared: boolean;
  iicrcCertified: boolean;
  insuranceZones: string[];
  city: string;
  lat: number;
  lon: number;
  virtualConsultFee: number;
  hourlyRate: number;
  rating: number;
  verifiedJobsCount: number;
  rentsEquipment: boolean;
  rentalInventory: string[];
  bio: string;
  meritRankScore: number;
}

export interface EvidenceMedia {
  id: string;
  type: 'photo' | 'video' | 'document';
  caption: string;
  capturedAt: string;
  gpsVerified: boolean;
  dataUrl?: string;
}

export interface ContractorReview {
  id: string;
  contractorId: string;
  contractorName: string;
  authorName: string;
  authorRole: 'Homeowner' | 'Insurance Adjuster' | 'Business Owner' | 'Tenant';
  rating: number;
  projectType: string;
  outcomeSummary: string;
  costFinal: number;
  costQuoted: number;
  createdAt: string;
  moderationStatus: VerificationStatus;
  moderationNote?: string;
  evidence: EvidenceMedia[];
  helpfulVotes: number;
}

export type BlacklistSubjectType =
  | 'Contractor'
  | 'Non-Paying Client'
  | 'Insurance Carrier / Adjuster'
  | 'Restoration Company'
  | 'Apartment Management / Landlord';

export interface BlacklistEntry {
  id: string;
  subjectName: string;
  subjectType: BlacklistSubjectType;
  licenseOrEntityId: string;
  city: string;
  reporterName: string;
  reporterRole: 'Homeowner' | 'Contractor' | 'Insurance Adjuster' | 'Tenant';
  incidentDate: string;
  financialImpactUsd: number;
  summary: string;
  proofReference: string;
  evidence: EvidenceMedia[];
  moderationStatus: VerificationStatus;
  moderationNote?: string;
  disputeNote?: string;
  createdAt: string;
  confirmations: number;
}

export type ForumCategory =
  | 'Property Maintenance'
  | 'Contractor & Insurance Advice'
  | 'Tenant Mold & Habitability'
  | 'Soil & Groundwater Testing'
  | 'Off-Grid & Generators';

export interface ForumReply {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  helpfulCount: number;
  moderationStatus: 'approved' | 'held_for_review';
}

export interface ForumPost {
  id: string;
  title: string;
  category: ForumCategory;
  authorName: string;
  authorRole: string;
  city: string;
  body: string;
  createdAt: string;
  moderationStatus: 'approved' | 'held_for_review' | 'flagged';
  moderationNote?: string;
  helpfulCount: number;
  replies: ForumReply[];
}

export interface AlmanacReport {
  id: string;
  city: string;
  lat: number;
  lon: number;
  conditionType: 'Active Flooding' | 'High Water Table' | 'Standing Drainage' | 'Fire Smoke / Ash' | 'Structural / Ground Shift';
  waterDepthInches: number;
  elevationNotes: string;
  reporterName: string;
  verifiedByNeighbors: number;
  createdAt: string;
  photoDataUrl?: string;
}

export interface StoreItem {
  id: string;
  name: string;
  category:
    | 'Leak Detection'
    | 'Remediation & Air'
    | 'Soil & Moisture'
    | 'Pest Control'
    | 'Emergency Power'
    | 'Water Filtration'
    | 'Survival & Smart Guard'
    | 'Safety & PPE';
  sku: string;
  wholesalePrice: number;
  retailPrice: number;
  rentable: boolean;
  dailyRentalPrice?: number;
  rentalProvider?: string;
  subscribable?: boolean;
  subscriptionIntervalMonths?: number;
  recommendedInstallerCategory?: ContractorCategory;
  imageUrl?: string;
  specs: string;
  contractorEndorsements: number;
  inStock: number;
}

export interface StoreOrder {
  id: string;
  customerName: string;
  shippingAddress: string;
  deliveryMethod: 'doordash_jobsite' | 'wholesale_shipping' | 'restorer_pickup';
  jobSiteNotes?: string;
  items: {
    itemId: string;
    name: string;
    mode: 'buy' | 'rent' | 'subscribe';
    qty: number;
    unitPrice: number;
    intervalMonths?: number;
  }[];
  totalUsd: number;
  createdAt: string;
  status: string;
}

export interface UsedEquipmentListing {
  id: string;
  name: string;
  sellerCompany: string;
  city: string;
  conditionGrade: 'Grade A — Serviced' | 'Grade B — Rebuilt' | 'As-Is — Rebuild Project';
  hoursUsed: number;
  usedPriceUsd: number;
  originalRetailUsd: number;
  maintenanceHistory: string;
}

export interface GrocerySanitationReport {
  id: string;
  storeName: string;
  branchLocation: string;
  city: string;
  department:
    | 'Produce Misters & Bins'
    | 'Dairy & Deli Coolers'
    | 'Meat & Seafood Cases'
    | 'Bakery & Dry Bulk'
    | 'Power Outage / Spoilage';
  advisory: 'Stay Away — Mold Proof' | 'Power Outage — Spoilage Risk' | 'Caution — Poor Cleaning' | 'Verified Clean';
  powerOutageHours?: number;
  summary: string;
  reporterName: string;
  mediaType: 'photo' | 'video';
  mediaDataUrl?: string;
  proofCaption: string;
  moderationStatus: VerificationStatus;
  moderationNote?: string;
  confirmations: number;
  createdAt: string;
}

export interface PowerOutageReport {
  id: string;
  utilityOrDistrict: string;
  city: string;
  lat: number;
  lon: number;
  affectedCustomers: number;
  durationHours: number;
  nearbyAffectedGrocers: string[];
  status: 'Active Outage' | 'Restored — Spoilage Window';
  updatedAt: string;
}

export interface FieldGig {
  id: string;
  title: string;
  postedBy: string;
  posterType: 'Insurance Company' | 'Licensed Contractor' | 'Restoration Firm';
  city: string;
  lat: number;
  lon: number;
  payoutUsd: number;
  estimatedMinutes: number;
  checklist: string[];
  status: 'Open' | 'Claimed' | 'Submitted';
  claimedBy?: string;
  createdAt: string;
}

export interface AbandonedHazardReport {
  id: string;
  addressOrCrossStreet: string;
  city: string;
  lat: number;
  lon: number;
  hazardCategory:
    | 'Abandoned Structure / Trespass Risk'
    | 'Structural Collapse / Roof Sag'
    | 'Standing Water / Mold & Vector Hazard'
    | 'Exposed Electrical / Gas Risk'
    | 'Fire Load / Overgrown Brush';
  severity: 'Moderate' | 'High' | 'Immediate Danger';
  description: string;
  reporterName: string;
  photoDataUrl?: string;
  neighborConfirmations: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  contractorId: string;
  contractorName: string;
  clientName: string;
  clientEmail: string;
  serviceMode:
    | 'Virtual Diagnostic'
    | 'Start-to-Finish Virtual Inspector'
    | 'On-Site Inspection'
    | 'Equipment Rental'
    | 'Legal / Hygienist Consult';
  scheduledDate: string;
  issueSummary: string;
  milestones?: { stage: string; status: 'Pending' | 'Passed' | 'Correction Needed'; note: string }[];
  feeUsd: number;
  status: 'Confirmed' | 'Pending';
  createdAt: string;
}

export interface EmergencyMessage {
  id: string;
  senderAlias: string;
  channel: 'Regional Flood Mesh' | 'Off-Grid Power & Generators' | 'Structural SOS' | 'Tenant Habitability';
  encryptedPayload: string;
  plaintextPreview: string;
  isEncrypted: boolean;
  lat?: number;
  lon?: number;
  createdAt: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnimatedRepairStep {
  stepNumber: number;
  title: string;
  instruction: string;
  actionType: 'inspect' | 'seal' | 'drain' | 'cut' | 'test' | 'ventilate';
  targetX: number; // 0-100 percentage on photo
  targetY: number; // 0-100 percentage on photo
  toolNeeded: string;
  materialSpec: string;
  codeReference: string;
  sourceQueryUrl: string;
}

export interface DamageAnalysisResult {
  summary: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  structuralIntegrityNote: string;
  earlyWearIndicators: string[];
  leakVsGroundwaterDiagnosis: string;
  costEstimate: {
    diyLowUsd: number;
    diyHighUsd: number;
    proLowUsd: number;
    proHighUsd: number;
    breakdown: { item: string; diyUsd: number; proUsd: number }[];
  };
  insuranceClaimVerbiage: string;
  recommendedSpecialistType: string;
  animatedSteps: AnimatedRepairStep[];
  sources: GroundingSource[];
}

export interface HazardAlert {
  id: string;
  type: 'Earthquake' | 'Flood' | 'Fire Weather' | 'Severe Storm' | 'Groundwater';
  severity: 'Advisory' | 'Watch' | 'Warning' | 'Urgent';
  title: string;
  description: string;
  source: string;
  timestamp: string;
  distanceKm?: number;
  lat: number;
  lon: number;
  magnitude?: number;
}

export interface LiveHazardSnapshot {
  lat: number;
  lon: number;
  updatedAt: string;
  weather: {
    temperatureF: number;
    windMph: number;
    windGustMph: number;
    precipitationMm: number;
    soilMoisture: number;
    riverDischargeM3s: number | null;
  };
  alerts: HazardAlert[];
  recentQuakes: HazardAlert[];
}
