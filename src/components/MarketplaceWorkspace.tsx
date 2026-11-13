import React, { useState } from 'react';
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Fingerprint,
  Search,
  ShieldCheck,
  UserPlus,
  Wrench,
} from 'lucide-react';
import type { Booking, Contractor, ContractorCategory, FieldGig } from '../types';

const CATEGORIES: Array<'All' | ContractorCategory> = [
  'All',
  'General A (Heavy Engineering)',
  'General B (Building)',
  'General C-36 (Plumbing)',
  'General C-10 (Electrical)',
  'General Z (Specialty / Foundation)',
  'IICRC Restoration',
  'Structural Engineer',
  'Industrial Hygienist',
  'Property Attorney',
  'Generator Specialist',
];

interface Props {
  contractors: Contractor[];
  bookings: Booking[];
  fieldGigs: FieldGig[];
  initialFilter?: string;
  onAddContractor: (c: Contractor) => void;
  onAddBooking: (b: Booking) => void;
  onAddGig: (g: FieldGig) => void;
  onUpdateGig: (g: FieldGig) => void;
}

export const MarketplaceWorkspace: React.FC<Props> = ({
  contractors,
  bookings,
  fieldGigs,
  initialFilter,
  onAddContractor,
  onAddBooking,
  onAddGig,
  onUpdateGig,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialFilter || '');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ContractorCategory>('All');
  const [onlyLiveScan, setOnlyLiveScan] = useState<boolean>(false);
  const [onlyIicrc, setOnlyIicrc] = useState<boolean>(false);
  const [onlyRentals, setOnlyRentals] = useState<boolean>(false);

  // Booking Modal State
  const [bookingTarget, setBookingTarget] = useState<Contractor | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [serviceMode, setServiceMode] = useState<Booking['serviceMode']>('Virtual Diagnostic');
  const [scheduledDate, setScheduledDate] = useState<string>('2026-11-16');
  const [issueSummary, setIssueSummary] = useState<string>('');
  const [bookingFeedback, setBookingFeedback] = useState<string | null>(null);

  // Verification Application Modal State
  const [showApplyForm, setShowApplyForm] = useState<boolean>(false);
  const [applyName, setApplyName] = useState<string>('');
  const [applyCompany, setApplyCompany] = useState<string>('');
  const [applyCategory, setApplyCategory] = useState<ContractorCategory>('General B (Building)');
  const [applyLicenseNum, setApplyLicenseNum] = useState<string>('');
  const [applyCity, setApplyCity] = useState<string>('San Francisco, CA');
  const [applyLiveScan, setApplyLiveScan] = useState<boolean>(true);
  const [applyIicrc, setApplyIicrc] = useState<boolean>(false);
  const [applyRentsEquipment, setApplyRentsEquipment] = useState<boolean>(false);
  const [applyVirtualFee, setApplyVirtualFee] = useState<string>('0');
  const [applyBio, setApplyBio] = useState<string>('');

  // Field Scout Side-Work Gigs state
  const [scoutName, setScoutName] = useState<string>('');
  const [showPostGig, setShowPostGig] = useState<boolean>(false);
  const [gigTitle, setGigTitle] = useState<string>('');
  const [gigPoster, setGigPoster] = useState<string>('');
  const [gigPosterType, setGigPosterType] = useState<FieldGig['posterType']>('Insurance Company');
  const [gigCity, setGigCity] = useState<string>('Oakland, CA');
  const [gigPayout, setGigPayout] = useState<string>('90');

  const filtered = contractors.filter((c) => {
    const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchScan = !onlyLiveScan || c.liveScanCleared;
    const matchIicrc = !onlyIicrc || c.iicrcCertified;
    const matchRent = !onlyRentals || c.rentsEquipment;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.bio.toLowerCase().includes(q) ||
      c.licenseNumber.toLowerCase().includes(q);
    return matchCat && matchScan && matchIicrc && matchRent && matchQuery;
  });

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTarget || !clientName.trim()) return;
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractorId: bookingTarget.id,
        clientName,
        clientEmail,
        serviceMode,
        scheduledDate,
        issueSummary,
        feeUsd: serviceMode === 'Virtual Diagnostic' ? bookingTarget.virtualConsultFee : bookingTarget.hourlyRate,
      }),
    });
    if (res.ok) {
      const created = (await res.json()) as Booking;
      onAddBooking(created);
      setBookingFeedback(`Confirmed ${created.serviceMode} with ${created.contractorName} on ${created.scheduledDate}.`);
      setBookingTarget(null);
      setClientName('');
      setIssueSummary('');
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyName.trim() || !applyCompany.trim() || !applyLicenseNum.trim()) return;
    const res = await fetch('/api/contractors/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: applyName,
        company: applyCompany,
        category: applyCategory,
        licenseClass: applyCategory,
        licenseNumber: applyLicenseNum,
        city: applyCity,
        liveScanCleared: applyLiveScan,
        iicrcCertified: applyIicrc,
        rentsEquipment: applyRentsEquipment,
        virtualConsultFee: Number(applyVirtualFee) || 0,
        bio: applyBio,
      }),
    });
    if (res.ok) {
      const created = (await res.json()) as Contractor;
      onAddContractor(created);
      setShowApplyForm(false);
      setApplyName('');
      setApplyCompany('');
      setApplyLicenseNum('');
      setApplyBio('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Verification Controls */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              General A–Z Licenses · IICRC Remediation · Live-Scan Background Checks · Merit-Earned Visibility
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Verified Contractor, Engineer, Hygienist & Legal Marketplace
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowApplyForm((s) => !s)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {showApplyForm ? 'Close Verification Form' : 'Verify & List Your Practice'}
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search license #, city, mold, foundation, generator..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'All' | ContractorCategory)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyLiveScan((v) => !v)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                onlyLiveScan
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Live-Scan Cleared
            </button>
            <button
              type="button"
              onClick={() => setOnlyIicrc((v) => !v)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                onlyIicrc
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-800 dark:text-sky-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              IICRC Certified
            </button>
            <button
              type="button"
              onClick={() => setOnlyRentals((v) => !v)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                onlyRentals
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Rents Tools
            </button>
          </div>
        </div>

        {bookingFeedback && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span>{bookingFeedback}</span>
            <button type="button" onClick={() => setBookingFeedback(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* Contractor Onboarding & License Verification Form */}
      {showApplyForm && (
        <form
          onSubmit={handleApplySubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-amber-600" />
            Contractor / Specialist License & Live-Scan Onboarding
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={applyName}
              onChange={(e) => setApplyName(e.target.value)}
              placeholder="Principal Name (e.g. Jordan Reyes, PE)"
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              required
              value={applyCompany}
              onChange={(e) => setApplyCompany(e.target.value)}
              placeholder="Business / Firm Name"
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <select
              value={applyCategory}
              onChange={(e) => setApplyCategory(e.target.value as ContractorCategory)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={applyLicenseNum}
              onChange={(e) => setApplyLicenseNum(e.target.value)}
              placeholder="State License / Bar / CIH Number"
              className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={applyCity}
              onChange={(e) => setApplyCity(e.target.value)}
              placeholder="Service City & State"
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="number"
              min="0"
              value={applyVirtualFee}
              onChange={(e) => setApplyVirtualFee(e.target.value)}
              placeholder="Virtual Consult Fee ($0 = Free)"
              className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <textarea
            rows={2}
            value={applyBio}
            onChange={(e) => setApplyBio(e.target.value)}
            placeholder="Specialties, insurance zones covered, and rental tools offered to homeowners..."
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700 dark:text-slate-300">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={applyLiveScan} onChange={(e) => setApplyLiveScan(e.target.checked)} />
              Live-Scan Background Check Completed
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={applyIicrc} onChange={(e) => setApplyIicrc(e.target.checked)} />
              IICRC Remediation Certified
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={applyRentsEquipment}
                onChange={(e) => setApplyRentsEquipment(e.target.checked)}
              />
              Rents Restoration Equipment to Homeowners
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
          >
            Complete License Check & Publish Profile
          </button>
        </form>
      )}

      {/* Contractors Grid (Flat single-elevation cards, unboxed metadata) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{c.category}</span>
                <span className="font-mono tabular-nums">
                  {c.rating.toFixed(1)} ★ · {c.verifiedJobsCount} verified jobs
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{c.company}</h2>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {c.name} · {c.city}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Virtual Triage</div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {c.virtualConsultFee === 0 ? 'FREE' : `$${c.virtualConsultFee}`}
                  </div>
                </div>
              </div>

              {/* Clean unboxed verification metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Lic #{c.licenseNumber}
                </span>
                {c.liveScanCleared && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Live-Scan Cleared
                    </span>
                  </>
                )}
                {c.iicrcCertified && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-sky-700 dark:text-sky-400 font-medium">IICRC Verified</span>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">{c.bio}</p>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Insurance Zones: {c.insuranceZones.join(', ')}
              </div>

              {c.rentsEquipment && c.rentalInventory.length > 0 && (
                <div className="pt-1 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <Wrench className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Direct Equipment Rental: {c.rentalInventory.join(' · ')}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                On-Site Rate: ${c.hourlyRate}/hr
              </span>
              <button
                type="button"
                onClick={() => {
                  setBookingTarget(c);
                  setServiceMode('Virtual Diagnostic');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                Book Consult / Schedule
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Field Scout & Insurance Documentation Side-Work Gigs */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Paid Side-Work · Contractor Pre-Bids · Insurance Property Documentation
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Field Scout & Property Documentation Gigs
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Contractors and insurance companies dispatch local community members to capture timestamped property
              photos, measurements, and moisture readings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={scoutName}
              onChange={(e) => setScoutName(e.target.value)}
              placeholder="Your name to claim gigs"
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPostGig((v) => !v)}
              className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {showPostGig ? 'Cancel' : 'Post Field Gig'}
            </button>
          </div>
        </div>

        {showPostGig && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!gigTitle.trim() || !gigPoster.trim()) return;
              const res = await fetch('/api/gigs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: gigTitle,
                  postedBy: gigPoster,
                  posterType: gigPosterType,
                  city: gigCity,
                  payoutUsd: Number(gigPayout) || 85,
                }),
              });
              if (res.ok) {
                const created = (await res.json()) as FieldGig;
                onAddGig(created);
                setShowPostGig(false);
                setGigTitle('');
                setGigPoster('');
              }
            }}
            className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            <input
              type="text"
              required
              value={gigTitle}
              onChange={(e) => setGigTitle(e.target.value)}
              placeholder="Task (e.g. Roof Hail Photo Set)"
              className="md:col-span-2 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              required
              value={gigPoster}
              onChange={(e) => setGigPoster(e.target.value)}
              placeholder="Insurer / Contractor Name"
              className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <select
              value={gigPosterType}
              onChange={(e) => setGigPosterType(e.target.value as FieldGig['posterType'])}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Insurance Company">Insurance Company</option>
              <option value="Licensed Contractor">Licensed Contractor</option>
              <option value="Restoration Firm">Restoration Firm</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="25"
                value={gigPayout}
                onChange={(e) => setGigPayout(e.target.value)}
                placeholder="$"
                className="w-20 px-2 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="flex-1 px-3 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Dispatch
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fieldGigs.map((gig) => (
            <div
              key={gig.id}
              className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{gig.posterType}</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    ${gig.payoutUsd} · ~{gig.estimatedMinutes}m
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{gig.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {gig.postedBy} · {gig.city}
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 list-disc list-inside">
                  {gig.checklist.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {gig.status === 'Claimed' ? `Claimed by ${gig.claimedBy}` : 'Open Dispatch'}
                </span>
                {gig.status === 'Open' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const nameToUse = scoutName.trim() || 'Verified Field Scout';
                      const res = await fetch(`/api/gigs/${gig.id}/claim`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ scoutName: nameToUse }),
                      });
                      if (res.ok) {
                        onUpdateGig((await res.json()) as FieldGig);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg"
                  >
                    Accept Side Work
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Bookings Table */}
      {bookings.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Your Scheduled Inspections & Equipment Rentals
          </h3>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {bookings.map((b) => (
              <div key={b.id} className="py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{b.contractorName}</span>
                  <span className="text-slate-500 dark:text-slate-400"> · {b.serviceMode}</span>
                  <div className="text-slate-600 dark:text-slate-300">{b.issueSummary}</div>
                </div>
                <div className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                  {b.scheduledDate} · ${b.feeUsd} · {b.status}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Booking Modal */}
      {bookingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleBookSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Schedule with {bookingTarget.company}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {bookingTarget.name} · Lic #{bookingTarget.licenseNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingTarget(null)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Consultation Type
                </label>
                <select
                  value={serviceMode}
                  onChange={(e) => setServiceMode(e.target.value as Booking['serviceMode'])}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Virtual Diagnostic">
                    Virtual Diagnostic (${bookingTarget.virtualConsultFee})
                  </option>
                  <option value="On-Site Inspection">On-Site Inspection (${bookingTarget.hourlyRate}/hr)</option>
                  <option value="Legal / Hygienist Consult">Legal / Hygienist Virtual Review</option>
                  {bookingTarget.rentsEquipment && <option value="Equipment Rental">Restoration Equipment Rental</option>}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Project / Damage Notes
                </label>
                <textarea
                  rows={2}
                  value={issueSummary}
                  onChange={(e) => setIssueSummary(e.target.value)}
                  placeholder="Attach inspection context or equipment needed..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
            >
              Confirm Encrypted Booking
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
