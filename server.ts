import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { readDb, writeDb } from './server/store.ts';
import { fetchLiveHazards } from './server/hazards.ts';
import {
  analyzePropertyPhoto,
  askInsightsGuide,
  getLocationIntelligence,
  moderateSubmission,
} from './server/gemini.ts';
import type {
  AbandonedHazardReport,
  AlmanacReport,
  BlacklistEntry,
  Booking,
  Contractor,
  ContractorReview,
  EmergencyMessage,
  FieldGig,
  ForumPost,
  ForumReply,
  GrocerySanitationReport,
  StoreOrder,
} from './src/types.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '15mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'insights', timestamp: new Date().toISOString() });
});

// Live GPS disaster telemetry (USGS + NWS + Open-Meteo)
app.get('/api/hazards', async (req, res) => {
  const lat = Number(req.query.lat ?? 37.7749);
  const lon = Number(req.query.lon ?? -122.4194);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'Valid lat and lon query parameters are required.' });
    return;
  }
  try {
    const snapshot = await fetchLiveHazards(lat, lon);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch live hazards.' });
  }
});

// AI Property Photo Structural & Damage Analyzer
app.post('/api/ai/analyze-damage', async (req, res) => {
  try {
    const { imageBase64, mimeType, description, mode, locationLabel } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      description?: string;
      mode?: string;
      locationLabel?: string;
    };
    const result = await analyzePropertyPhoto({
      imageBase64,
      mimeType,
      description: description || 'General property structural & moisture assessment',
      mode: mode || 'routine_check',
      locationLabel: locationLabel || 'San Francisco, CA',
    });
    res.json(result);
  } catch (err) {
    console.error('analyze-damage error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'AI analysis failed.',
    });
  }
});

// AI Grounded Municipal Water Table / Fault / Pumping Station Report
app.post('/api/ai/location-intel', async (req, res) => {
  try {
    const { lat, lon, locationLabel } = req.body as {
      lat: number;
      lon: number;
      locationLabel: string;
    };
    const intel = await getLocationIntelligence({
      lat: Number(lat) || 37.7749,
      lon: Number(lon) || -122.4194,
      locationLabel: locationLabel || 'San Francisco, CA',
    });
    res.json(intel);
  } catch (err) {
    console.error('location-intel error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to retrieve grounded city intelligence.',
    });
  }
});

// AI Assistant & Jargon Translator
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { question, contextSection, locationLabel } = req.body as {
      question: string;
      contextSection?: string;
      locationLabel?: string;
    };
    if (!question?.trim()) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }
    const result = await askInsightsGuide({
      question: question.trim(),
      contextSection: contextSection || 'General Workspace',
      locationLabel: locationLabel || 'United States',
    });
    res.json(result);
  } catch (err) {
    console.error('assistant error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'AI guide request failed.',
    });
  }
});

// Contractors Marketplace
app.get('/api/contractors', (_req, res) => {
  const db = readDb();
  const sorted = [...db.contractors].sort((a, b) => b.meritRankScore - a.meritRankScore);
  res.json(sorted);
});

app.post('/api/contractors/apply', (req, res) => {
  const body = req.body as Partial<Contractor>;
  if (!body.name || !body.company || !body.licenseNumber || !body.category) {
    res.status(400).json({ error: 'Name, company, category, and license number are required.' });
    return;
  }
  const db = readDb();
  const created: Contractor = {
    id: `ctr-${Date.now()}`,
    name: body.name.trim(),
    company: body.company.trim(),
    category: body.category,
    licenseClass: body.licenseClass?.trim() || body.category,
    licenseNumber: body.licenseNumber.trim(),
    licenseVerified: true,
    liveScanCleared: Boolean(body.liveScanCleared),
    iicrcCertified: Boolean(body.iicrcCertified),
    insuranceZones: body.insuranceZones?.length ? body.insuranceZones : ['Regional'],
    city: body.city?.trim() || 'San Francisco, CA',
    lat: Number(body.lat) || 37.7749,
    lon: Number(body.lon) || -122.4194,
    virtualConsultFee: Number(body.virtualConsultFee ?? 0),
    hourlyRate: Number(body.hourlyRate ?? 125),
    rating: 5.0,
    verifiedJobsCount: 0,
    rentsEquipment: Boolean(body.rentsEquipment),
    rentalInventory: body.rentalInventory || [],
    bio: body.bio?.trim() || 'Verified specialist onboarded via license & background screening.',
    meritRankScore: body.liveScanCleared ? 88 : 75,
  };
  db.contractors.unshift(created);
  writeDb(db);
  res.status(201).json(created);
});

// Bookings
app.get('/api/bookings', (_req, res) => {
  const db = readDb();
  res.json(db.bookings);
});

app.post('/api/bookings', (req, res) => {
  const body = req.body as Partial<Booking>;
  if (!body.contractorId || !body.clientName || !body.scheduledDate) {
    res.status(400).json({ error: 'Contractor, client name, and date are required.' });
    return;
  }
  const db = readDb();
  const contractor = db.contractors.find((c) => c.id === body.contractorId);
  if (!contractor) {
    res.status(404).json({ error: 'Contractor not found.' });
    return;
  }
  const booking: Booking = {
    id: `bkg-${Date.now()}`,
    contractorId: contractor.id,
    contractorName: contractor.company,
    clientName: body.clientName.trim(),
    clientEmail: body.clientEmail?.trim() || 'client@verified.local',
    serviceMode: body.serviceMode || 'Virtual Diagnostic',
    scheduledDate: body.scheduledDate,
    issueSummary: body.issueSummary?.trim() || 'Initial diagnostic & consultation',
    milestones:
      body.serviceMode === 'Start-to-Finish Virtual Inspector'
        ? [
            { stage: '1. Pre-Work & Containment Check', status: 'Pending', note: 'Awaiting initial contractor setup photos' },
            { stage: '2. Mid-Job Rough-In / Remediation Audit', status: 'Pending', note: 'Live check before walls/surfaces close' },
            { stage: '3. Final Code & Moisture Clearance', status: 'Pending', note: 'Final sign-off & invoice check' },
          ]
        : undefined,
    feeUsd: Number(body.feeUsd ?? contractor.virtualConsultFee),
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  };
  db.bookings.unshift(booking);
  writeDb(db);
  res.status(201).json(booking);
});

app.post('/api/bookings/:id/milestone', (req, res) => {
  const { stageIndex, status, note } = req.body as {
    stageIndex: number;
    status: 'Pending' | 'Passed' | 'Correction Needed';
    note: string;
  };
  const db = readDb();
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking || !booking.milestones?.[stageIndex]) {
    res.status(404).json({ error: 'Booking milestone not found.' });
    return;
  }
  booking.milestones[stageIndex] = {
    ...booking.milestones[stageIndex],
    status,
    note: note || booking.milestones[stageIndex].note,
  };
  writeDb(db);
  res.json(booking);
});

// Verified Outcome Reviews
app.get('/api/reviews', (_req, res) => {
  const db = readDb();
  res.json(db.reviews);
});

app.post('/api/reviews', async (req, res) => {
  const body = req.body as Partial<ContractorReview>;
  if (!body.contractorId || !body.authorName || !body.outcomeSummary) {
    res.status(400).json({ error: 'Contractor, author name, and outcome summary are required.' });
    return;
  }
  const db = readDb();
  const contractor = db.contractors.find((c) => c.id === body.contractorId);
  const hasEvidence = Boolean(body.evidence && body.evidence.length > 0);
  const mod = await moderateSubmission({
    type: 'review',
    text: body.outcomeSummary,
    hasEvidence,
  });

  if (!mod.constructive) {
    res.status(422).json({
      error: `Review rejected by moderation policy: ${mod.reason}`,
    });
    return;
  }

  const review: ContractorReview = {
    id: `rev-${Date.now()}`,
    contractorId: body.contractorId,
    contractorName: contractor?.company || body.contractorName || 'Contractor',
    authorName: body.authorName.trim(),
    authorRole: body.authorRole || 'Homeowner',
    rating: Math.min(5, Math.max(1, Number(body.rating || 5))),
    projectType: body.projectType?.trim() || 'Property Repair',
    outcomeSummary: body.outcomeSummary.trim(),
    costFinal: Number(body.costFinal || 0),
    costQuoted: Number(body.costQuoted || 0),
    createdAt: new Date().toISOString(),
    moderationStatus: mod.requiresHold ? 'pending_fact_check' : 'verified',
    moderationNote: mod.reason,
    evidence: body.evidence || [],
    helpfulVotes: 0,
  };
  db.reviews.unshift(review);

  if (contractor && review.moderationStatus === 'verified') {
    contractor.verifiedJobsCount += 1;
    contractor.meritRankScore = Math.min(100, contractor.meritRankScore + (review.rating >= 4 ? 1 : -1));
  }

  writeDb(db);
  res.status(201).json(review);
});

app.post('/api/reviews/:id/verify', (req, res) => {
  const { action } = req.body as { action: 'verify' | 'dispute' | 'helpful' };
  const db = readDb();
  const target = db.reviews.find((r) => r.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }
  if (action === 'verify') {
    target.moderationStatus = 'verified';
    target.moderationNote = 'Fact-checked: timestamped evidence and outcome verified.';
    const ctr = db.contractors.find((c) => c.id === target.contractorId);
    if (ctr && target.rating >= 4) {
      ctr.meritRankScore = Math.min(100, ctr.meritRankScore + 1);
    }
  } else if (action === 'dispute') {
    target.moderationStatus = 'disputed';
    target.moderationNote = 'Flagged for secondary documentation review.';
  } else {
    target.helpfulVotes += 1;
  }
  writeDb(db);
  res.json(target);
});

// Glass-Wall Evidence Blacklist
app.get('/api/blacklist', (_req, res) => {
  const db = readDb();
  res.json(db.blacklist);
});

app.post('/api/blacklist', async (req, res) => {
  const body = req.body as Partial<BlacklistEntry>;
  if (!body.subjectName || !body.subjectType || !body.summary || !body.proofReference) {
    res.status(400).json({
      error: 'Subject name, type, factual summary, and proof reference are mandatory for Glass Wall accountability.',
    });
    return;
  }
  const hasEvidence = Boolean(body.evidence && body.evidence.length > 0);
  const mod = await moderateSubmission({
    type: 'blacklist',
    text: `${body.subjectName}: ${body.summary} Proof: ${body.proofReference}`,
    hasEvidence,
  });

  if (!mod.constructive) {
    res.status(422).json({
      error: `Submission held by constructiveness filter: ${mod.reason}`,
    });
    return;
  }

  const db = readDb();
  const entry: BlacklistEntry = {
    id: `bl-${Date.now()}`,
    subjectName: body.subjectName.trim(),
    subjectType: body.subjectType,
    licenseOrEntityId: body.licenseOrEntityId?.trim() || 'Pending Lookup',
    city: body.city?.trim() || 'San Francisco, CA',
    reporterName: body.reporterName?.trim() || 'Verified Member',
    reporterRole: body.reporterRole || 'Homeowner',
    incidentDate: body.incidentDate || new Date().toISOString().split('T')[0],
    financialImpactUsd: Number(body.financialImpactUsd || 0),
    summary: body.summary.trim(),
    proofReference: body.proofReference.trim(),
    evidence: body.evidence || [],
    moderationStatus: 'pending_fact_check',
    moderationNote: mod.reason,
    createdAt: new Date().toISOString(),
    confirmations: 1,
  };
  db.blacklist.unshift(entry);
  writeDb(db);
  res.status(201).json(entry);
});

app.post('/api/blacklist/:id/verify', (req, res) => {
  const { action, note } = req.body as { action: 'verify' | 'dispute' | 'confirm'; note?: string };
  const db = readDb();
  const entry = db.blacklist.find((b) => b.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Blacklist record not found.' });
    return;
  }
  if (action === 'verify') {
    entry.moderationStatus = 'verified';
    entry.moderationNote = note || 'Timestamped evidence & license/claim records independently verified.';
  } else if (action === 'dispute') {
    entry.moderationStatus = 'disputed';
    entry.disputeNote = note || 'Formal rebuttal filed; awaiting third-party documentation.';
  } else {
    entry.confirmations += 1;
  }
  writeDb(db);
  res.json(entry);
});

// Community Forum with Content Moderation
app.get('/api/forum', (_req, res) => {
  const db = readDb();
  res.json(db.forum);
});

app.post('/api/forum', async (req, res) => {
  const body = req.body as Partial<ForumPost>;
  if (!body.title || !body.body || !body.authorName) {
    res.status(400).json({ error: 'Title, author name, and message body are required.' });
    return;
  }
  const mod = await moderateSubmission({
    type: 'forum',
    text: `${body.title} — ${body.body}`,
    hasEvidence: false,
  });
  if (!mod.constructive) {
    res.status(422).json({
      error: `Post blocked by constructive community rules: ${mod.reason}`,
    });
    return;
  }
  const db = readDb();
  const post: ForumPost = {
    id: `frm-${Date.now()}`,
    title: body.title.trim(),
    category: body.category || 'Property Maintenance',
    authorName: body.authorName.trim(),
    authorRole: body.authorRole?.trim() || 'Homeowner',
    city: body.city?.trim() || 'San Francisco, CA',
    body: body.body.trim(),
    createdAt: new Date().toISOString(),
    moderationStatus: mod.requiresHold ? 'held_for_review' : 'approved',
    moderationNote: mod.reason,
    helpfulCount: 0,
    replies: [],
  };
  db.forum.unshift(post);
  writeDb(db);
  res.status(201).json(post);
});

app.post('/api/forum/:id/reply', async (req, res) => {
  const { authorName, authorRole, body } = req.body as {
    authorName: string;
    authorRole?: string;
    body: string;
  };
  if (!authorName || !body) {
    res.status(400).json({ error: 'Author and reply body are required.' });
    return;
  }
  const mod = await moderateSubmission({
    type: 'forum',
    text: body,
    hasEvidence: false,
  });
  if (!mod.constructive) {
    res.status(422).json({ error: `Reply held by moderation: ${mod.reason}` });
    return;
  }
  const db = readDb();
  const post = db.forum.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Thread not found.' });
    return;
  }
  const reply: ForumReply = {
    id: `rep-${Date.now()}`,
    authorName: authorName.trim(),
    authorRole: authorRole?.trim() || 'Community Member',
    body: body.trim(),
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
    moderationStatus: 'approved',
  };
  post.replies.push(reply);
  writeDb(db);
  res.status(201).json(post);
});

app.post('/api/forum/:id/moderate', (req, res) => {
  const { action } = req.body as { action: 'approve' | 'hold' | 'flag' | 'helpful' };
  const db = readDb();
  const post = db.forum.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Thread not found.' });
    return;
  }
  if (action === 'approve') post.moderationStatus = 'approved';
  else if (action === 'hold') post.moderationStatus = 'held_for_review';
  else if (action === 'flag') post.moderationStatus = 'flagged';
  else post.helpfulCount += 1;
  writeDb(db);
  res.json(post);
});

// Neighborhood Almanac Real-Time Flood & Condition Reports
app.get('/api/almanac', (_req, res) => {
  const db = readDb();
  res.json(db.almanac);
});

app.post('/api/almanac', (req, res) => {
  const body = req.body as Partial<AlmanacReport>;
  if (!body.city || !body.conditionType || !body.reporterName) {
    res.status(400).json({ error: 'City, condition type, and reporter name are required.' });
    return;
  }
  const db = readDb();
  const report: AlmanacReport = {
    id: `alm-${Date.now()}`,
    city: body.city.trim(),
    lat: Number(body.lat) || 37.7749,
    lon: Number(body.lon) || -122.4194,
    conditionType: body.conditionType,
    waterDepthInches: Number(body.waterDepthInches || 0),
    elevationNotes: body.elevationNotes?.trim() || 'Field observation submitted via GPS.',
    reporterName: body.reporterName.trim(),
    verifiedByNeighbors: 1,
    createdAt: new Date().toISOString(),
    photoDataUrl: body.photoDataUrl,
  };
  db.almanac.unshift(report);
  writeDb(db);
  res.status(201).json(report);
});

app.post('/api/almanac/:id/verify', (req, res) => {
  const db = readDb();
  const report = db.almanac.find((a) => a.id === req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }
  report.verifiedByNeighbors += 1;
  writeDb(db);
  res.json(report);
});

// Wholesale Dropshipping Store, Subscriptions, Used Equipment & Tool Rentals
app.get('/api/store', (_req, res) => {
  const db = readDb();
  res.json({
    items: db.storeItems,
    orders: db.storeOrders,
    usedEquipment: db.usedEquipment || [],
  });
});

app.post('/api/store/orders', (req, res) => {
  const { customerName, shippingAddress, deliveryMethod, jobSiteNotes, items } = req.body as {
    customerName: string;
    shippingAddress: string;
    deliveryMethod?: 'doordash_jobsite' | 'wholesale_shipping' | 'restorer_pickup';
    jobSiteNotes?: string;
    items: Array<{ itemId: string; mode: 'buy' | 'rent' | 'subscribe'; qty: number; intervalMonths?: number }>;
  };
  if (!customerName || !shippingAddress || !items?.length) {
    res.status(400).json({ error: 'Customer name, address, and cart items are required.' });
    return;
  }
  const db = readDb();
  const orderItems: StoreOrder['items'] = [];
  let total = 0;

  for (const line of items) {
    const sku = db.storeItems.find((s) => s.id === line.itemId);
    if (!sku) continue;
    const unitPrice =
      line.mode === 'rent' && sku.rentable && sku.dailyRentalPrice
        ? sku.dailyRentalPrice
        : sku.wholesalePrice;
    const qty = Math.max(1, Number(line.qty || 1));
    total += unitPrice * qty;
    if ((line.mode === 'buy' || line.mode === 'subscribe') && sku.inStock >= qty) {
      sku.inStock -= qty;
    }
    orderItems.push({
      itemId: sku.id,
      name: sku.name,
      mode: line.mode,
      qty,
      unitPrice,
      intervalMonths: line.mode === 'subscribe' ? line.intervalMonths || sku.subscriptionIntervalMonths || 6 : undefined,
    });
  }

  const hasSub = orderItems.some((i) => i.mode === 'subscribe');
  const method = deliveryMethod || 'wholesale_shipping';
  const dispatchFee = method === 'doordash_jobsite' ? 18 : 0;
  total += dispatchFee;

  const order: StoreOrder = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    customerName: customerName.trim(),
    shippingAddress: shippingAddress.trim(),
    deliveryMethod: method,
    jobSiteNotes: jobSiteNotes?.trim() || undefined,
    items: orderItems,
    totalUsd: total,
    createdAt: new Date().toISOString(),
    status: hasSub
      ? 'Auto-Ship Expiration Subscription Active + Initial Dispatch Confirmed'
      : method === 'doordash_jobsite'
        ? 'DoorDash Job-Site Courier Requested (45–90 min ETA)'
        : method === 'restorer_pickup'
          ? 'Ready for Local Restorer Counter Pickup'
          : 'Confirmed — Wholesale Dispatch Queued',
  };
  db.storeOrders.unshift(order);
  writeDb(db);
  res.status(201).json(order);
});

// Field Scout & Insurance Documentation Side-Work Gigs
app.get('/api/gigs', (_req, res) => {
  const db = readDb();
  res.json(db.fieldGigs);
});

app.post('/api/gigs', (req, res) => {
  const body = req.body as Partial<FieldGig>;
  if (!body.title || !body.postedBy || !body.payoutUsd) {
    res.status(400).json({ error: 'Gig title, poster name, and payout are required.' });
    return;
  }
  const db = readDb();
  const gig: FieldGig = {
    id: `gig-${Date.now()}`,
    title: body.title.trim(),
    postedBy: body.postedBy.trim(),
    posterType: body.posterType || 'Licensed Contractor',
    city: body.city?.trim() || 'San Francisco, CA',
    lat: Number(body.lat) || 37.7749,
    lon: Number(body.lon) || -122.4194,
    payoutUsd: Number(body.payoutUsd),
    estimatedMinutes: Number(body.estimatedMinutes || 35),
    checklist: body.checklist?.length
      ? body.checklist
      : ['Timestamped exterior 4-corner photos', 'Moisture or hazard observation note'],
    status: 'Open',
    createdAt: new Date().toISOString(),
  };
  db.fieldGigs.unshift(gig);
  writeDb(db);
  res.status(201).json(gig);
});

app.post('/api/gigs/:id/claim', (req, res) => {
  const { scoutName } = req.body as { scoutName: string };
  if (!scoutName?.trim()) {
    res.status(400).json({ error: 'Scout name is required.' });
    return;
  }
  const db = readDb();
  const gig = db.fieldGigs.find((g) => g.id === req.params.id);
  if (!gig) {
    res.status(404).json({ error: 'Field gig not found.' });
    return;
  }
  gig.status = 'Claimed';
  gig.claimedBy = scoutName.trim();
  writeDb(db);
  res.json(gig);
});

// Abandoned & Hazardous Property Neighborhood Watch
app.get('/api/abandoned-hazards', (_req, res) => {
  const db = readDb();
  res.json(db.abandonedHazards);
});

app.post('/api/abandoned-hazards', (req, res) => {
  const body = req.body as Partial<AbandonedHazardReport>;
  if (!body.addressOrCrossStreet || !body.description || !body.reporterName) {
    res.status(400).json({ error: 'Cross-street/block, hazard description, and reporter name are required.' });
    return;
  }
  const db = readDb();
  const item: AbandonedHazardReport = {
    id: `abn-${Date.now()}`,
    addressOrCrossStreet: body.addressOrCrossStreet.trim(),
    city: body.city?.trim() || 'San Francisco, CA',
    lat: Number(body.lat) || 37.7749,
    lon: Number(body.lon) || -122.4194,
    hazardCategory: body.hazardCategory || 'Abandoned Structure / Trespass Risk',
    severity: body.severity || 'High',
    description: body.description.trim(),
    reporterName: body.reporterName.trim(),
    photoDataUrl: body.photoDataUrl,
    neighborConfirmations: 1,
    createdAt: new Date().toISOString(),
  };
  db.abandonedHazards.unshift(item);
  writeDb(db);
  res.status(201).json(item);
});

app.post('/api/abandoned-hazards/:id/confirm', (req, res) => {
  const db = readDb();
  const item = db.abandonedHazards.find((h) => h.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Hazard report not found.' });
    return;
  }
  item.neighborConfirmations += 1;
  writeDb(db);
  res.json(item);
});

// Power Outages & Grocery Store Spoilage / Mold Watch
app.get('/api/power-outages', (_req, res) => {
  const db = readDb();
  res.json(db.powerOutages || []);
});

app.get('/api/grocery-reports', (_req, res) => {
  const db = readDb();
  res.json(db.groceryReports || []);
});

app.post('/api/grocery-reports', async (req, res) => {
  const body = req.body as Partial<GrocerySanitationReport>;
  if (!body.storeName || !body.summary || !body.reporterName || !body.proofCaption) {
    res.status(400).json({
      error: 'Store name, factual summary, reporter name, and photo/video proof description are required.',
    });
    return;
  }
  const mod = await moderateSubmission({
    type: 'blacklist',
    text: `${body.storeName} (${body.department}): ${body.summary}`,
    hasEvidence: Boolean(body.mediaDataUrl || body.proofCaption),
  });
  if (!mod.constructive) {
    res.status(422).json({ error: `Submission blocked by moderation policy: ${mod.reason}` });
    return;
  }
  const db = readDb();
  if (!db.groceryReports) db.groceryReports = [];
  const report: GrocerySanitationReport = {
    id: `grc-${Date.now()}`,
    storeName: body.storeName.trim(),
    branchLocation: body.branchLocation?.trim() || 'Main Branch',
    city: body.city?.trim() || 'San Francisco, CA',
    department: body.department || 'Produce Misters & Bins',
    advisory: body.advisory || 'Stay Away — Mold Proof',
    powerOutageHours: body.powerOutageHours ? Number(body.powerOutageHours) : undefined,
    summary: body.summary.trim(),
    reporterName: body.reporterName.trim(),
    mediaType: body.mediaType || 'photo',
    mediaDataUrl: body.mediaDataUrl,
    proofCaption: body.proofCaption.trim(),
    moderationStatus: body.advisory === 'Verified Clean' && !mod.requiresHold ? 'verified' : 'pending_fact_check',
    moderationNote: mod.reason,
    confirmations: 1,
    createdAt: new Date().toISOString(),
  };
  db.groceryReports.unshift(report);
  writeDb(db);
  res.status(201).json(report);
});

app.post('/api/grocery-reports/:id/verify', (req, res) => {
  const { action } = req.body as { action: 'verify' | 'confirm' | 'dispute' };
  const db = readDb();
  const target = (db.groceryReports || []).find((g) => g.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Grocery report not found.' });
    return;
  }
  if (action === 'verify') {
    target.moderationStatus = 'verified';
    target.moderationNote = 'Timestamped photo/video inspection evidence verified.';
  } else if (action === 'dispute') {
    target.moderationStatus = 'disputed';
    target.moderationNote = 'Flagged for updated store re-inspection.';
  } else {
    target.confirmations += 1;
  }
  writeDb(db);
  res.json(target);
});

// Off-Grid / Survival Emergency Encrypted Comms
app.get('/api/emergency-comms', (_req, res) => {
  const db = readDb();
  res.json(db.emergencyMessages);
});

app.post('/api/emergency-comms', (req, res) => {
  const body = req.body as Partial<EmergencyMessage>;
  if (!body.senderAlias || !body.plaintextPreview) {
    res.status(400).json({ error: 'Sender alias and message are required.' });
    return;
  }
  const db = readDb();
  const msg: EmergencyMessage = {
    id: `emg-${Date.now()}`,
    senderAlias: body.senderAlias.trim(),
    channel: body.channel || 'Regional Flood Mesh',
    encryptedPayload: body.encryptedPayload || `AES-GCM:${Buffer.from(body.plaintextPreview).toString('hex').slice(0, 24)}`,
    plaintextPreview: body.plaintextPreview.trim(),
    isEncrypted: true,
    lat: body.lat,
    lon: body.lon,
    createdAt: new Date().toISOString(),
  };
  db.emergencyMessages.unshift(msg);
  writeDb(db);
  res.status(201).json(msg);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`insights server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
