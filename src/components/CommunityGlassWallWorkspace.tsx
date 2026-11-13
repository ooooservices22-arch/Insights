import React, { useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  FileCheck2,
  MessageSquare,
  Scale,
  ShieldAlert,
  Smartphone,
  ThumbsUp,
} from 'lucide-react';
import type {
  AbandonedHazardReport,
  BlacklistEntry,
  BlacklistSubjectType,
  Contractor,
  ContractorReview,
  EvidenceMedia,
  FormerEmployeeInsight,
  ForumCategory,
  ForumPost,
  GrocerySanitationReport,
} from '../types';

interface Props {
  contractors: Contractor[];
  reviews: ContractorReview[];
  blacklist: BlacklistEntry[];
  forum: ForumPost[];
  abandonedHazards: AbandonedHazardReport[];
  groceryReports: GrocerySanitationReport[];
  formerEmployeeInsights: FormerEmployeeInsight[];
  onAddReview: (r: ContractorReview) => void;
  onUpdateReview: (r: ContractorReview) => void;
  onAddBlacklist: (b: BlacklistEntry) => void;
  onUpdateBlacklist: (b: BlacklistEntry) => void;
  onAddForumPost: (p: ForumPost) => void;
  onUpdateForumPost: (p: ForumPost) => void;
  onAddAbandonedHazard: (h: AbandonedHazardReport) => void;
  onUpdateAbandonedHazard: (h: AbandonedHazardReport) => void;
  onAddGroceryReport: (g: GrocerySanitationReport) => void;
  onUpdateGroceryReport: (g: GrocerySanitationReport) => void;
  onAddFormerEmployeeInsight: (ex: FormerEmployeeInsight) => void;
  onUpdateFormerEmployeeInsight: (ex: FormerEmployeeInsight) => void;
  onOpenBetaProgram: () => void;
}

export const CommunityGlassWallWorkspace: React.FC<Props> = ({
  contractors,
  reviews,
  blacklist,
  forum,
  abandonedHazards,
  groceryReports,
  formerEmployeeInsights,
  onAddReview,
  onUpdateReview,
  onAddBlacklist,
  onUpdateBlacklist,
  onAddForumPost,
  onUpdateForumPost,
  onAddAbandonedHazard,
  onUpdateAbandonedHazard,
  onAddGroceryReport,
  onUpdateGroceryReport,
  onAddFormerEmployeeInsight,
  onUpdateFormerEmployeeInsight,
  onOpenBetaProgram,
}) => {
  const [subTab, setSubTab] = useState<'forum' | 'reviews' | 'blacklist' | 'abandoned' | 'grocery' | 'ex_employers'>(
    'forum'
  );

  // Forum state
  const [forumFilter, setForumFilter] = useState<string>('All');
  const [postTitle, setPostTitle] = useState<string>('');
  const [postCategory, setPostCategory] = useState<ForumCategory>('Property Maintenance');
  const [postAuthor, setPostAuthor] = useState<string>('');
  const [postRole, setPostRole] = useState<string>('Homeowner');
  const [postBody, setPostBody] = useState<string>('');
  const [forumFeedback, setForumFeedback] = useState<string | null>(null);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState<string>('');
  const [replyBody, setReplyBody] = useState<string>('');

  // Review state (Contractors, Terrible Restoration Companies & Landlord/Slumlord Fixes)
  const [revFilter, setRevFilter] = useState<string>('All');
  const [revSubjectType, setRevSubjectType] = useState<'Contractor' | 'Restoration Company' | 'Landlord / Slumlord Fix'>('Contractor');
  const [revContractorId, setRevContractorId] = useState<string>(contractors[0]?.id || 'ctr-01');
  const [revCustomSubjectName, setRevCustomSubjectName] = useState<string>('');
  const [revAuthor, setRevAuthor] = useState<string>('');
  const [revRole, setRevRole] = useState<ContractorReview['authorRole']>('Homeowner');
  const [revRating, setRevRating] = useState<number>(5);
  const [revProject, setRevProject] = useState<string>('');
  const [revQuoted, setRevQuoted] = useState<string>('1500');
  const [revFinal, setRevFinal] = useState<string>('1500');
  const [revSummary, setRevSummary] = useState<string>('');
  const [revEvidenceCaption, setRevEvidenceCaption] = useState<string>('');
  const [revEvidenceDataUrl, setRevEvidenceDataUrl] = useState<string | undefined>(undefined);
  const [revFeedback, setRevFeedback] = useState<string | null>(null);

  // Blacklist state
  const [blName, setBlName] = useState<string>('');
  const [blType, setBlType] = useState<BlacklistSubjectType>('Contractor');
  const [blEntityId, setBlEntityId] = useState<string>('');
  const [blCity, setBlCity] = useState<string>('Oakland, CA');
  const [blReporter, setBlReporter] = useState<string>('');
  const [blRole, setBlRole] = useState<BlacklistEntry['reporterRole']>('Homeowner');
  const [blImpact, setBlImpact] = useState<string>('2500');
  const [blProofRef, setBlProofRef] = useState<string>('');
  const [blSummary, setBlSummary] = useState<string>('');
  const [blEvidenceDataUrl, setBlEvidenceDataUrl] = useState<string | undefined>(undefined);
  const [blFeedback, setBlFeedback] = useState<string | null>(null);
  const [blTypeFilter, setBlTypeFilter] = useState<string>('All');

  // Abandoned / Hazardous Neighborhood Watch state
  const [abnAddress, setAbnAddress] = useState<string>('');
  const [abnCity, setAbnCity] = useState<string>('Oakland, CA');
  const [abnCategory, setAbnCategory] = useState<AbandonedHazardReport['hazardCategory']>(
    'Abandoned Structure / Trespass Risk'
  );
  const [abnSeverity, setAbnSeverity] = useState<AbandonedHazardReport['severity']>('High');
  const [abnReporter, setAbnReporter] = useState<string>('');
  const [abnDesc, setAbnDesc] = useState<string>('');
  const [abnPhoto, setAbnPhoto] = useState<string | undefined>(undefined);

  // Business, Restaurant, Storage, Hygiene & Grocery Sanitation, Pests & Spoilage Watch state
  const [groceryFilter, setGroceryFilter] = useState<string>('All');
  const [grBusinessType, setGrBusinessType] = useState<NonNullable<GrocerySanitationReport['businessType']>>(
    'Grocery Store'
  );
  const [grStoreName, setGrStoreName] = useState<string>('');
  const [grBranch, setGrBranch] = useState<string>('');
  const [grCity, setGrCity] = useState<string>('Oakland, CA');
  const [grDept, setGrDept] = useState<GrocerySanitationReport['department']>('Produce Misters & Bins');
  const [grAdvisory, setGrAdvisory] = useState<GrocerySanitationReport['advisory']>('Stay Away — Mold Proof');
  const [grOutageHours, setGrOutageHours] = useState<string>('0');
  const [grWeekLabel, setGrWeekLabel] = useState<string>('Week 1');
  const [grCleanlinessScore, setGrCleanlinessScore] = useState<string>('35');
  const [grCosmeticCoverup, setGrCosmeticCoverup] = useState<boolean>(true);
  const [grSummary, setGrSummary] = useState<string>('');
  const [grReporter, setGrReporter] = useState<string>('');
  const [grProofCaption, setGrProofCaption] = useState<string>('');
  const [grMediaDataUrl, setGrMediaDataUrl] = useState<string | undefined>(undefined);
  const [grMediaType, setGrMediaType] = useState<'photo' | 'video'>('photo');
  const [grFeedback, setGrFeedback] = useState<string | null>(null);

  // Former Employee / Ex-Employer Business & Hygiene Insights state
  const [exSectorFilter, setExSectorFilter] = useState<string>('All');
  const [exCompany, setExCompany] = useState<string>('');
  const [exSector, setExSector] = useState<FormerEmployeeInsight['businessSector']>('Storage Facility');
  const [exCity, setExCity] = useState<string>('Oakland, CA');
  const [exRole, setExRole] = useState<string>('');
  const [exDates, setExDates] = useState<string>('');
  const [exAlias, setExAlias] = useState<string>('');
  const [exHidesIssues, setExHidesIssues] = useState<boolean>(true);
  const [exSummary, setExSummary] = useState<string>('');
  const [exProofCaption, setExProofCaption] = useState<string>('');
  const [exMediaDataUrl, setExMediaDataUrl] = useState<string | undefined>(undefined);
  const [exFeedback, setExFeedback] = useState<string | null>(null);

  const readUpload = (file: File | undefined, cb: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') cb(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setForumFeedback(null);
    const res = await fetch('/api/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: postTitle,
        category: postCategory,
        authorName: postAuthor,
        authorRole: postRole,
        body: postBody,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setForumFeedback(data.error || 'Post held by moderation.');
      return;
    }
    onAddForumPost(data as ForumPost);
    setPostTitle('');
    setPostBody('');
    setForumFeedback(
      data.moderationStatus === 'held_for_review'
        ? 'Submitted to Fact-Check Hold Queue prior to public approval.'
        : 'Published constructively to the community forum.'
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevFeedback(null);
    const evidence: EvidenceMedia[] = revEvidenceCaption.trim() || revEvidenceDataUrl
      ? [
          {
            id: `ev-${Date.now()}`,
            type: 'photo',
            caption: revEvidenceCaption.trim() || 'Timestamped project outcome photo',
            capturedAt: new Date().toISOString(),
            gpsVerified: true,
            dataUrl: revEvidenceDataUrl,
          },
        ]
      : [];

    const targetId =
      revSubjectType === 'Contractor' ? revContractorId : `ext-${Date.now()}`;
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractorId: targetId,
        contractorName:
          revSubjectType === 'Contractor'
            ? undefined
            : revCustomSubjectName.trim() || `${revSubjectType} Record`,
        subjectType: revSubjectType,
        authorName: revAuthor,
        authorRole: revRole,
        rating: revRating,
        projectType: revProject,
        costQuoted: Number(revQuoted) || 0,
        costFinal: Number(revFinal) || 0,
        outcomeSummary: revSummary,
        evidence,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRevFeedback(data.error || 'Review rejected by moderation.');
      return;
    }
    onAddReview(data as ContractorReview);
    setRevSummary('');
    setRevProject('');
    setRevCustomSubjectName('');
    setRevEvidenceCaption('');
    setRevEvidenceDataUrl(undefined);
    setRevFeedback(
      data.moderationStatus === 'pending_fact_check'
        ? 'Held in Fact-Check Queue until timestamped invoice/photo proof is verified.'
        : 'Verified outcome review published.'
    );
  };

  const handleSubmitBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlFeedback(null);
    const evidence: EvidenceMedia[] = [
      {
        id: `ev-bl-${Date.now()}`,
        type: 'document',
        caption: blProofRef,
        capturedAt: new Date().toISOString(),
        gpsVerified: true,
        dataUrl: blEvidenceDataUrl,
      },
    ];
    const res = await fetch('/api/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectName: blName,
        subjectType: blType,
        licenseOrEntityId: blEntityId,
        city: blCity,
        reporterName: blReporter,
        reporterRole: blRole,
        financialImpactUsd: Number(blImpact) || 0,
        proofReference: blProofRef,
        summary: blSummary,
        evidence,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBlFeedback(data.error || 'Filing blocked by moderation.');
      return;
    }
    onAddBlacklist(data as BlacklistEntry);
    setBlName('');
    setBlProofRef('');
    setBlSummary('');
    setBlEvidenceDataUrl(undefined);
    setBlFeedback(
      'Filing placed in Mandatory Fact-Check Hold Queue. Truth-verification reviewers must approve evidence before public display.'
    );
  };

  const handleSubmitAbandoned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abnAddress.trim() || !abnDesc.trim() || !abnReporter.trim()) return;
    const res = await fetch('/api/abandoned-hazards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addressOrCrossStreet: abnAddress,
        city: abnCity,
        hazardCategory: abnCategory,
        severity: abnSeverity,
        reporterName: abnReporter,
        description: abnDesc,
        photoDataUrl: abnPhoto,
      }),
    });
    if (res.ok) {
      onAddAbandonedHazard((await res.json()) as AbandonedHazardReport);
      setAbnAddress('');
      setAbnDesc('');
      setAbnPhoto(undefined);
    }
  };

  const handleSubmitGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrFeedback(null);
    if (!grStoreName.trim() || !grSummary.trim() || !grReporter.trim()) return;
    const res = await fetch('/api/grocery-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: grStoreName,
        businessType: grBusinessType,
        branchLocation: grBranch || 'Main Location',
        city: grCity,
        department: grDept,
        advisory: grAdvisory,
        powerOutageHours: Number(grOutageHours) || 0,
        weekLabel: grWeekLabel,
        cleanlinessScore: Number(grCleanlinessScore) || 35,
        cosmeticCoverupDetected: grCosmeticCoverup,
        summary: grSummary,
        reporterName: grReporter,
        mediaType: grMediaType,
        mediaDataUrl: grMediaDataUrl,
        proofCaption: grProofCaption || 'Timestamped weekly business cleanliness inspection evidence',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setGrFeedback(data.error || 'Submission rejected.');
      return;
    }
    const created = data as GrocerySanitationReport;
    onAddGroceryReport(created);
    setGrStoreName('');
    setGrBranch('');
    setGrSummary('');
    setGrProofCaption('');
    setGrMediaDataUrl(undefined);
    setGrFeedback(
      `Audit logged (${created.weekLabel || 'Week 1'}) · +$${created.bountyCreditedUsd || 20} Field Scout incentive credited if enrolled.`
    );
  };

  const handleSubmitExEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    setExFeedback(null);
    if (!exCompany.trim() || !exRole.trim() || !exSummary.trim() || !exAlias.trim()) return;
    const res = await fetch('/api/ex-employer-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: exCompany,
        businessSector: exSector,
        city: exCity,
        formerRole: exRole,
        employmentDates: exDates || 'Former Employee',
        authorAlias: exAlias,
        hidesIssuesFromCustomers: exHidesIssues,
        summary: exSummary,
        proofCaption: exProofCaption || 'Former employee operational & sanitation disclosure',
        mediaDataUrl: exMediaDataUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setExFeedback(data.error || 'Submission held by moderation.');
      return;
    }
    onAddFormerEmployeeInsight(data as FormerEmployeeInsight);
    setExCompany('');
    setExRole('');
    setExDates('');
    setExSummary('');
    setExProofCaption('');
    setExMediaDataUrl(undefined);
    setExFeedback(
      data.moderationStatus === 'pending_fact_check'
        ? 'Submitted to Fact-Check Queue prior to public badge.'
        : 'Verified former-employee insider report published.'
    );
  };

  const filteredPosts = forum.filter((p) => forumFilter === 'All' || p.category === forumFilter);
  const filteredReviews = reviews.filter((r) => revFilter === 'All' || (r.subjectType || 'Contractor') === revFilter);
  const filteredBlacklist = blacklist.filter((b) => blTypeFilter === 'All' || b.subjectType === blTypeFilter);
  const filteredGrocery = groceryReports.filter((g) => groceryFilter === 'All' || g.advisory === groceryFilter);
  const filteredExEmployers = formerEmployeeInsights.filter(
    (x) => exSectorFilter === 'All' || x.businessSector === exSectorFilter
  );

  // Group multi-week store audits to expose week-after-week cosmetic cover-ups vs real cleaning
  const multiWeekStoreGroups = Array.from(
    groceryReports.reduce((map, r) => {
      const key = r.storeName.trim();
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
      return map;
    }, new Map<string, GrocerySanitationReport[]>())
  )
    .filter(([, arr]) => arr.length >= 2)
    .map(([storeName, arr]) => ({
      storeName,
      entries: [...arr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }));

  return (
    <div className="space-y-8">
      {/* Glass Wall Sub-Navigation */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Glass-Wall Truth Ledger · Weekly Store Audits · Ex-Employee Storage &amp; Hygiene Disclosures
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Community Forum, Slumlord &amp; Restoration Reviews, Business Hygiene &amp; Ex-Employers
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
            {[
              { id: 'forum', label: 'Community Forum' },
              { id: 'reviews', label: 'Work & Landlord Reviews' },
              { id: 'blacklist', label: 'Glass-Wall Blacklist' },
              { id: 'abandoned', label: 'Abandoned Watch' },
              { id: 'grocery', label: 'Weekly Store & Hygiene Audits' },
              { id: 'ex_employers', label: 'Ex-Employee Insights' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id as typeof subTab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  subTab === t.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SUB-TAB 1: COMMUNITY FORUM & MODERATION */}
      {subTab === 'forum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'Property Maintenance',
                'Contractor & Insurance Advice',
                'Tenant Mold & Habitability',
                'Soil & Groundwater Testing',
                'Off-Grid & Generators',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForumFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    forumFilter === cat
                      ? 'bg-slate-900 dark:bg-amber-600 text-white border-transparent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{post.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      {post.authorName} ({post.authorRole})
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{post.city}</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      post.moderationStatus === 'approved'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : post.moderationStatus === 'held_for_review'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {post.moderationStatus === 'approved'
                      ? 'Moderated · Constructive'
                      : post.moderationStatus === 'held_for_review'
                        ? 'Held for Fact-Check'
                        : 'Flagged'}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">{post.title}</h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{post.body}</p>
                {post.moderationNote && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Moderation note: {post.moderationNote}</div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/forum/${post.id}/moderate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'helpful' }),
                        });
                        if (res.ok) onUpdateForumPost((await res.json()) as ForumPost);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 tabular-nums"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Helpful ({post.helpfulCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyTargetId(replyTargetId === post.id ? null : post.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reply ({post.replies.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {post.moderationStatus !== 'approved' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/forum/${post.id}/moderate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'approve' }),
                          });
                          if (res.ok) onUpdateForumPost((await res.json()) as ForumPost);
                        }}
                        className="px-2.5 py-1 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/forum/${post.id}/moderate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'hold' }),
                        });
                        if (res.ok) onUpdateForumPost((await res.json()) as ForumPost);
                      }}
                      className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded"
                    >
                      Hold for Review
                    </button>
                  </div>
                </div>

                {/* Thread Replies */}
                {post.replies.length > 0 && (
                  <div className="pl-4 border-l border-slate-200 dark:border-slate-800 space-y-2.5 pt-2">
                    {post.replies.map((rep) => (
                      <div key={rep.id} className="text-xs space-y-1">
                        <div className="text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{rep.authorName}</span> ·{' '}
                          {rep.authorRole}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{rep.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {replyTargetId === post.id && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!replyAuthor.trim() || !replyBody.trim()) return;
                      const res = await fetch(`/api/forum/${post.id}/reply`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ authorName: replyAuthor, body: replyBody }),
                      });
                      if (res.ok) {
                        onUpdateForumPost((await res.json()) as ForumPost);
                        setReplyBody('');
                        setReplyTargetId(null);
                      }
                    }}
                    className="pt-2 space-y-2"
                  >
                    <input
                      type="text"
                      required
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <textarea
                      rows={2}
                      required
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Share constructive advice, code citations, or direct experience..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg"
                    >
                      Post Constructive Reply
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>

          {/* Forum Composer */}
          <form
            onSubmit={handleCreatePost}
            className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Start a Moderated Thread</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All submissions pass through constructive & factual screening before public visibility.
            </p>
            <input
              type="text"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Topic title"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <select
              value={postCategory}
              onChange={(e) => setPostCategory(e.target.value as ForumCategory)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Property Maintenance">Property Maintenance</option>
              <option value="Contractor & Insurance Advice">Contractor & Insurance Advice</option>
              <option value="Tenant Mold & Habitability">Tenant Mold & Habitability</option>
              <option value="Soil & Groundwater Testing">Soil & Groundwater Testing</option>
              <option value="Off-Grid & Generators">Off-Grid & Generators</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={postAuthor}
                onChange={(e) => setPostAuthor(e.target.value)}
                placeholder="Your name"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <select
                value={postRole}
                onChange={(e) => setPostRole(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Homeowner">Homeowner</option>
                <option value="Tenant">Tenant</option>
                <option value="Contractor">Contractor</option>
                <option value="Insurance Adjuster">Insurance Adjuster</option>
                <option value="Engineer">Engineer</option>
              </select>
            </div>
            <textarea
              rows={4}
              required
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="Ask a technical question, share repair costs, or help a neighbor..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            {forumFeedback && <div className="text-xs text-amber-700 dark:text-amber-300">{forumFeedback}</div>}
            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-amber-500"
            >
              Submit to Moderated Forum
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: VERIFIED OUTCOME REVIEWS (CONTRACTORS, RESTORATION CO. & SLUMLORD FIXES) */}
      {subTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {['All', 'Contractor', 'Restoration Company', 'Landlord / Slumlord Fix'].map((rf) => (
                <button
                  key={rf}
                  type="button"
                  onClick={() => setRevFilter(rf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    revFilter === rf
                      ? 'bg-slate-900 dark:bg-amber-600 text-white border-transparent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {rf}
                </button>
              ))}
            </div>

            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">
                      {rev.subjectType || 'Contractor'}
                    </strong>{' '}
                    · {rev.contractorName} · {rev.projectType}
                  </span>
                  <span
                    className={`font-semibold ${
                      rev.moderationStatus === 'verified'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {rev.moderationStatus === 'verified' ? 'Evidence Verified' : 'Pending Fact-Check'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {rev.rating}.0 ★ — Reviewed by {rev.authorName} ({rev.authorRole})
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    Quoted ${rev.costQuoted.toLocaleString()} · Final ${rev.costFinal.toLocaleString()}
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rev.outcomeSummary}</p>

                {rev.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                        {ev.caption}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(ev.capturedAt).toLocaleString()}
                      </span>
                    </div>
                    {ev.dataUrl && (
                      <img
                        src={ev.dataUrl}
                        alt={ev.caption}
                        referrerPolicy="no-referrer"
                        className="max-h-40 rounded border border-slate-200 dark:border-slate-800 object-cover"
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{rev.moderationNote}</span>
                  <div className="flex items-center gap-2">
                    {rev.moderationStatus !== 'verified' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/reviews/${rev.id}/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'verify' }),
                          });
                          if (res.ok) onUpdateReview((await res.json()) as ContractorReview);
                        }}
                        className="px-2.5 py-1 border border-emerald-400 text-emerald-700 dark:text-emerald-300 rounded"
                      >
                        Fact-Check Verify
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/reviews/${rev.id}/verify`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'helpful' }),
                        });
                        if (res.ok) onUpdateReview((await res.json()) as ContractorReview);
                      }}
                      className="text-slate-600 dark:text-slate-300 hover:text-amber-600 tabular-nums"
                    >
                      Helpful ({rev.helpfulVotes})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmitReview}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Review Contractor, Restoration Work, or Landlord / Slumlord Fix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expose shoddy landlord repair attempts, cosmetic mold paint-overs, or terrible restoration companies
              compromising homes with timestamped proof.
            </p>
            <select
              value={revSubjectType}
              onChange={(e) =>
                setRevSubjectType(e.target.value as 'Contractor' | 'Restoration Company' | 'Landlord / Slumlord Fix')
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Contractor">Licensed Contractor</option>
              <option value="Restoration Company">Restoration Company (Show Bad / Good Work)</option>
              <option value="Landlord / Slumlord Fix">Landlord / Slumlord Repair Attempt</option>
            </select>

            {revSubjectType === 'Contractor' ? (
              <select
                value={revContractorId}
                onChange={(e) => setRevContractorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.licenseClass})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={revCustomSubjectName}
                onChange={(e) => setRevCustomSubjectName(e.target.value)}
                placeholder={
                  revSubjectType === 'Landlord / Slumlord Fix'
                    ? 'Landlord / Property Mgmt / Building Address'
                    : 'Restoration Company Name'
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={revAuthor}
                onChange={(e) => setRevAuthor(e.target.value)}
                placeholder="Your Name"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <select
                value={revRole}
                onChange={(e) => setRevRole(e.target.value as ContractorReview['authorRole'])}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Homeowner">Homeowner</option>
                <option value="Insurance Adjuster">Insurance Adjuster</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Tenant">Tenant</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min="1"
                max="5"
                value={revRating}
                onChange={(e) => setRevRating(Number(e.target.value))}
                placeholder="Rating 1-5"
                className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                value={revQuoted}
                onChange={(e) => setRevQuoted(e.target.value)}
                placeholder="Quoted $"
                className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                value={revFinal}
                onChange={(e) => setRevFinal(e.target.value)}
                placeholder="Final $"
                className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <input
              type="text"
              required
              value={revProject}
              onChange={(e) => setRevProject(e.target.value)}
              placeholder="Project Scope (e.g. Perimeter French Drain)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <textarea
              rows={3}
              required
              value={revSummary}
              onChange={(e) => setRevSummary(e.target.value)}
              placeholder="Detailed factual project outcome, code compliance, and timeline..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={revEvidenceCaption}
              onChange={(e) => setRevEvidenceCaption(e.target.value)}
              placeholder="Timestamped evidence caption (e.g. Invoice # + post-dry reading)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              Attach Timestamped Outcome Photo:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => readUpload(e.target.files?.[0], setRevEvidenceDataUrl)}
                className="mt-1 block w-full text-xs"
              />
            </label>
            {revFeedback && <div className="text-xs text-amber-700 dark:text-amber-300">{revFeedback}</div>}
            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
            >
              Submit Evidence-Backed Review
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: GLASS-WALL BLACKLIST */}
      {subTab === 'blacklist' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'Contractor',
                'Non-Paying Client',
                'Insurance Carrier / Adjuster',
                'Restoration Company',
                'Apartment Management / Landlord',
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBlTypeFilter(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    blTypeFilter === t
                      ? 'bg-red-700 text-white border-transparent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {filteredBlacklist.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {entry.subjectType} · {entry.licenseOrEntityId} · {entry.city}
                  </span>
                  <span
                    className={`font-bold ${
                      entry.moderationStatus === 'verified'
                        ? 'text-red-700 dark:text-red-400'
                        : entry.moderationStatus === 'disputed'
                          ? 'text-slate-600 dark:text-slate-300'
                          : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {entry.moderationStatus === 'verified'
                      ? 'Verified Proof on Record'
                      : entry.moderationStatus === 'disputed'
                        ? 'Disputed — Under Review'
                        : 'Held for Fact-Check Verification'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{entry.subjectName}</h3>
                  <span className="text-sm font-mono font-bold text-red-700 dark:text-red-400 tabular-nums shrink-0">
                    ${entry.financialImpactUsd.toLocaleString()} Impact
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{entry.summary}</p>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    Timestamped Proof Reference: {entry.proofReference}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Filed by {entry.reporterName} ({entry.reporterRole}) · Incident {entry.incidentDate}
                  </div>
                  {entry.evidence[0]?.dataUrl && (
                    <img
                      src={entry.evidence[0].dataUrl}
                      alt={entry.proofReference}
                      referrerPolicy="no-referrer"
                      className="max-h-40 rounded border border-slate-200 dark:border-slate-800 object-cover mt-2"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{entry.moderationNote}</span>
                  <div className="flex items-center gap-2">
                    {entry.moderationStatus !== 'verified' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/blacklist/${entry.id}/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'verify' }),
                          });
                          if (res.ok) onUpdateBlacklist((await res.json()) as BlacklistEntry);
                        }}
                        className="px-2.5 py-1 border border-emerald-400 text-emerald-700 dark:text-emerald-300 rounded"
                      >
                        Verify Evidence
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/blacklist/${entry.id}/verify`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'confirm' }),
                        });
                        if (res.ok) onUpdateBlacklist((await res.json()) as BlacklistEntry);
                      }}
                      className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded tabular-nums"
                    >
                      Corroborate ({entry.confirmations})
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/blacklist/${entry.id}/verify`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'dispute' }),
                        });
                        if (res.ok) onUpdateBlacklist((await res.json()) as BlacklistEntry);
                      }}
                      className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 text-slate-500 rounded"
                    >
                      Dispute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Blacklist Submission Form */}
          <form
            onSubmit={handleSubmitBlacklist}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              File Evidence-Backed Blacklist Record
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Covers negligent contractors, non-paying client scams, bad-faith insurers, and landlords hiding mold. All
              filings are held for fact-check before public release.
            </p>
            <select
              value={blType}
              onChange={(e) => setBlType(e.target.value as BlacklistSubjectType)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Contractor">Contractor (Negligence / Abandonment)</option>
              <option value="Non-Paying Client">Non-Paying Client (Scam / NSF)</option>
              <option value="Insurance Carrier / Adjuster">Insurance Carrier / Adjuster</option>
              <option value="Restoration Company">Restoration Company</option>
              <option value="Apartment Management / Landlord">Apartment Management / Tenant Mold</option>
            </select>
            <input
              type="text"
              required
              value={blName}
              onChange={(e) => setBlName(e.target.value)}
              placeholder="Company, Landlord, or Account Name"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={blEntityId}
                onChange={(e) => setBlEntityId(e.target.value)}
                placeholder="License / Lien / Case #"
                className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                value={blImpact}
                onChange={(e) => setBlImpact(e.target.value)}
                placeholder="Financial Impact ($)"
                className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={blReporter}
                onChange={(e) => setBlReporter(e.target.value)}
                placeholder="Your Name"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <select
                value={blRole}
                onChange={(e) => setBlRole(e.target.value as BlacklistEntry['reporterRole'])}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Homeowner">Homeowner</option>
                <option value="Contractor">Contractor</option>
                <option value="Insurance Adjuster">Insurance Adjuster</option>
                <option value="Tenant">Tenant</option>
              </select>
            </div>
            <input
              type="text"
              value={blCity}
              onChange={(e) => setBlCity(e.target.value)}
              placeholder="City & State"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              required
              value={blProofRef}
              onChange={(e) => setBlProofRef(e.target.value)}
              placeholder="Proof Reference (Citation #, Lien #, Stop-Payment ID)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <textarea
              rows={3}
              required
              value={blSummary}
              onChange={(e) => setBlSummary(e.target.value)}
              placeholder="Objective timeline of negligence, non-payment, or hidden mold..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              Attach Timestamped Evidence Photo:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => readUpload(e.target.files?.[0], setBlEvidenceDataUrl)}
                className="mt-1 block w-full text-xs"
              />
            </label>
            {blFeedback && <div className="text-xs text-amber-700 dark:text-amber-300">{blFeedback}</div>}
            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold bg-red-700 hover:bg-red-600 text-white rounded-lg"
            >
              Submit to Fact-Check Blacklist Queue
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: ABANDONED & HAZARDOUS PROPERTY NEIGHBORHOOD WATCH */}
      {subTab === 'abandoned' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {abandonedHazards.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.hazardCategory} · {item.city}
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      item.severity === 'Immediate Danger'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {item.severity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  {item.addressOrCrossStreet}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</p>
                {item.photoDataUrl && (
                  <img
                    src={item.photoDataUrl}
                    alt={item.addressOrCrossStreet}
                    referrerPolicy="no-referrer"
                    className="max-h-48 rounded-lg border border-slate-200 dark:border-slate-800 object-cover"
                  />
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Documented by {item.reporterName} · {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/abandoned-hazards/${item.id}/confirm`, { method: 'POST' });
                      if (res.ok) onUpdateAbandonedHazard((await res.json()) as AbandonedHazardReport);
                    }}
                    className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 tabular-nums"
                  >
                    Confirm Neighborhood Warning ({item.neighborConfirmations})
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmitAbandoned}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Camera className="w-4 h-4 text-amber-600" />
              Document Abandoned / Hazardous Structure
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Warn neighbors, buyers, and first responders about collapsing roofs, exposed electrical lines, standing
              mold water, or fire brush on vacant properties. Private owner info stays confidential.
            </p>
            <input
              type="text"
              required
              value={abnAddress}
              onChange={(e) => setAbnAddress(e.target.value)}
              placeholder="Block or Cross-Street (e.g. 1400 Block E. 14th St)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={abnCategory}
                onChange={(e) => setAbnCategory(e.target.value as AbandonedHazardReport['hazardCategory'])}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Abandoned Structure / Trespass Risk">Abandoned Structure</option>
                <option value="Structural Collapse / Roof Sag">Structural Collapse / Roof Sag</option>
                <option value="Standing Water / Mold & Vector Hazard">Standing Water / Mold</option>
                <option value="Exposed Electrical / Gas Risk">Exposed Electrical / Gas</option>
                <option value="Fire Load / Overgrown Brush">Fire Load / Overgrown Brush</option>
              </select>
              <select
                value={abnSeverity}
                onChange={(e) => setAbnSeverity(e.target.value as AbandonedHazardReport['severity'])}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Immediate Danger">Immediate Danger</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={abnCity}
                onChange={(e) => setAbnCity(e.target.value)}
                placeholder="City"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="text"
                required
                value={abnReporter}
                onChange={(e) => setAbnReporter(e.target.value)}
                placeholder="Your Name"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <textarea
              rows={3}
              required
              value={abnDesc}
              onChange={(e) => setAbnDesc(e.target.value)}
              placeholder="Describe visible structural instability, fire fuel load, or containment hazards..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              Attach Photo Documentation:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => readUpload(e.target.files?.[0], setAbnPhoto)}
                className="mt-1 block w-full text-xs"
              />
            </label>
            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
            >
              Publish Neighborhood Hazard Warning
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 5: WEEK-OVER-WEEK BUSINESS, STORAGE, HYGIENE & GROCERY CLEANLINESS AUDITS */}
      {subTab === 'grocery' && (
        <div className="space-y-6">
          {/* Paid Weekly Store Audit & iOS Beta Recruitment Strip */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4" />
                Week-After-Week Cleanliness Verification · $20 Initial Audit · $35 Repeat Weekly Check Bonus
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl">
                Audit the same grocery store, restaurant, storage facility, or commercial business week after week to
                prove whether management genuinely deep-cleaned or simply hid mold/pests behind new signage.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenBetaProgram}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Join iOS Beta &amp; Paid Scout Program
            </button>
          </div>

          {/* Multi-Week Longitudinal Cleanliness Timelines */}
          {multiWeekStoreGroups.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Week-over-Week Store Cleanliness Proof (Hiding Grime vs. Real Sanitation)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chronological weekly audit logs exposing recurring mold, biofilm, and cosmetic cover-ups.
                  </p>
                </div>
              </div>

              {multiWeekStoreGroups.map((group) => {
                const latest = group.entries[group.entries.length - 1];
                const coverupCount = group.entries.filter((e) => e.cosmeticCoverupDetected).length;
                return (
                  <div
                    key={group.storeName}
                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {group.storeName} · {latest.branchLocation}, {latest.city}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {group.entries.length} weekly inspections logged
                          {coverupCount > 0 ? (
                            <span className="text-red-700 dark:text-red-400 font-semibold">
                              {' '}
                              · Cosmetic Cover-Up / Hiding Pattern Flagged ({coverupCount}×)
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {' '}
                              · Consistent Sanitation Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGrStoreName(group.storeName);
                          setGrBranch(latest.branchLocation);
                          setGrCity(latest.city);
                          setGrBusinessType(latest.businessType || 'Grocery Store');
                          setGrWeekLabel(`Week ${group.entries.length + 1}`);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg whitespace-nowrap"
                      >
                        Log Week {group.entries.length + 1} Follow-Up (+$35)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {group.entries.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900 dark:text-white">
                              {entry.weekLabel || `Week ${idx + 1}`}
                            </span>
                            {entry.cleanlinessScore !== undefined && (
                              <span
                                className={`font-mono tabular-nums ${
                                  entry.cleanlinessScore >= 75
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-red-700 dark:text-red-400'
                                }`}
                              >
                                {entry.cleanlinessScore}/100 Clean
                              </span>
                            )}
                          </div>
                          {entry.cosmeticCoverupDetected && (
                            <div className="text-[11px] font-semibold text-red-700 dark:text-red-400">
                              Cosmetic Cover-Up Flagged (Hid Grime / Uncleaned Underneath)
                            </div>
                          )}
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{entry.summary}</p>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {entry.reporterName} · {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'All',
                  'Stay Away — Mold Proof',
                  'Stay Away — Pests / Hygiene',
                  'Power Outage — Spoilage Risk',
                  'Caution — Poor Cleaning',
                  'Verified Clean',
                ].map((adv) => (
                  <button
                    key={adv}
                    type="button"
                    onClick={() => setGroceryFilter(adv)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      groceryFilter === adv
                        ? 'bg-slate-900 dark:bg-amber-600 text-white border-transparent'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {adv}
                  </button>
                ))}
              </div>

              {filteredGrocery.map((gr) => (
                <div
                  key={gr.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {gr.businessType || 'Grocery Store'} · {gr.department} · {gr.city}
                      {gr.weekLabel ? ` · ${gr.weekLabel}` : ''}
                    </span>
                    <span
                      className={`font-bold ${
                        gr.advisory === 'Verified Clean'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : gr.advisory.startsWith('Stay Away') || gr.advisory.startsWith('Power Outage')
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {gr.advisory}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{gr.storeName}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{gr.branchLocation}</div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      {gr.cleanlinessScore !== undefined && (
                        <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          Score: {gr.cleanlinessScore}/100
                        </div>
                      )}
                      {gr.powerOutageHours && gr.powerOutageHours > 0 ? (
                        <div className="text-xs font-mono font-bold text-red-700 dark:text-red-400 tabular-nums">
                          {gr.powerOutageHours}h Power Loss
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {gr.cosmeticCoverupDetected && (
                    <div className="text-xs font-semibold text-red-700 dark:text-red-400">
                      Cosmetic Cover-Up Flagged: Store wiped/masked surface instead of deep cleaning
                    </div>
                  )}

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{gr.summary}</p>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                      {gr.mediaType.toUpperCase()} Proof: {gr.proofCaption}
                    </div>
                    {gr.mediaDataUrl &&
                      (gr.mediaType === 'video' ? (
                        <video
                          src={gr.mediaDataUrl}
                          controls
                          className="max-h-44 rounded border border-slate-200 dark:border-slate-800"
                        />
                      ) : (
                        <img
                          src={gr.mediaDataUrl}
                          alt={gr.proofCaption}
                          referrerPolicy="no-referrer"
                          className="max-h-44 rounded border border-slate-200 dark:border-slate-800 object-cover"
                        />
                      ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {gr.moderationStatus === 'verified' ? 'Verified Proof' : 'Pending Fact-Check'} · Logged by{' '}
                      {gr.reporterName}
                    </span>
                    <div className="flex items-center gap-2">
                      {gr.moderationStatus !== 'verified' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch(`/api/grocery-reports/${gr.id}/verify`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'verify' }),
                            });
                            if (res.ok) onUpdateGroceryReport((await res.json()) as GrocerySanitationReport);
                          }}
                          className="px-2.5 py-1 border border-emerald-400 text-emerald-700 dark:text-emerald-300 rounded"
                        >
                          Verify Proof
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/grocery-reports/${gr.id}/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'confirm' }),
                          });
                          if (res.ok) onUpdateGroceryReport((await res.json()) as GrocerySanitationReport);
                        }}
                        className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded tabular-nums"
                      >
                        Confirm ({gr.confirmations})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSubmitGrocery}
              className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Camera className="w-4 h-4 text-amber-600" />
                Submit Weekly Store, Storage or Hygiene Audit
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Document pests, hidden mold, storage unit dampness, fake cleaning, or outage spoilage week-after-week.
                Enrolled scouts earn $20 initial / $35 repeat weekly credit.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={grBusinessType}
                  onChange={(e) =>
                    setGrBusinessType(e.target.value as NonNullable<GrocerySanitationReport['businessType']>)
                  }
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Grocery Store">Grocery Store</option>
                  <option value="Restaurant / Cafe">Restaurant / Cafe</option>
                  <option value="Storage Facility">Storage Facility</option>
                  <option value="Hygiene / Cleaning Business">Hygiene / Cleaning Business</option>
                  <option value="Retail / Other Business">Retail / Other Business</option>
                </select>
                <input
                  type="text"
                  required
                  value={grStoreName}
                  onChange={(e) => setGrStoreName(e.target.value)}
                  placeholder="Business / Store / Facility Name"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={grBranch}
                  onChange={(e) => setGrBranch(e.target.value)}
                  placeholder="Street Address / Branch"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={grCity}
                  onChange={(e) => setGrCity(e.target.value)}
                  placeholder="City & State"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={grDept}
                  onChange={(e) => setGrDept(e.target.value as GrocerySanitationReport['department'])}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Produce Misters & Bins">Produce Misters &amp; Bins</option>
                  <option value="Pests Seen (Roaches / Rodents / Flies)">Pests Seen (Roaches / Rodents / Flies)</option>
                  <option value="Kitchen / Dining / Restroom Hygiene">Kitchen / Dining / Restroom Hygiene</option>
                  <option value="Climate Control / Unit Moisture & Mold">
                    Climate Control / Unit Moisture &amp; Mold
                  </option>
                  <option value="Facility Pest / Sanitation Compliance">
                    Facility Pest / Sanitation Compliance
                  </option>
                  <option value="Dairy & Deli Coolers">Dairy &amp; Deli Coolers</option>
                  <option value="Meat & Seafood Cases">Meat &amp; Seafood Cases</option>
                  <option value="Bakery & Dry Bulk">Bakery &amp; Dry Bulk</option>
                  <option value="Power Outage / Spoilage">Power Outage / Spoilage</option>
                </select>
                <select
                  value={grAdvisory}
                  onChange={(e) => setGrAdvisory(e.target.value as GrocerySanitationReport['advisory'])}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Stay Away — Mold Proof">Stay Away — Mold Proof</option>
                  <option value="Stay Away — Pests / Hygiene">Stay Away — Pests / Hygiene</option>
                  <option value="Power Outage — Spoilage Risk">Power Outage — Spoilage Risk</option>
                  <option value="Caution — Poor Cleaning">Caution — Poor Cleaning</option>
                  <option value="Verified Clean">Verified Clean</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={grWeekLabel}
                  onChange={(e) => setGrWeekLabel(e.target.value)}
                  placeholder="Week Label (Week 2)"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={grCleanlinessScore}
                  onChange={(e) => setGrCleanlinessScore(e.target.value)}
                  placeholder="Cleanliness (0-100)"
                  className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  value={grOutageHours}
                  onChange={(e) => setGrOutageHours(e.target.value)}
                  placeholder="Outage hrs"
                  className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                required
                value={grReporter}
                onChange={(e) => setGrReporter(e.target.value)}
                placeholder="Your Name / Beta Scout Handle"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={grCosmeticCoverup}
                  onChange={(e) => setGrCosmeticCoverup(e.target.checked)}
                />
                Store/facility masked or hid grime cosmetically instead of deep cleaning
              </label>
              <textarea
                rows={3}
                required
                value={grSummary}
                onChange={(e) => setGrSummary(e.target.value)}
                placeholder="Compare this week vs last week: hidden mold behind trim, pests, uncleaned drains, or damp storage units..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={grProofCaption}
                onChange={(e) => setGrProofCaption(e.target.value)}
                placeholder="Photo/video evidence description"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <label className="block text-xs text-slate-600 dark:text-slate-300">
                Attach Timestamped Photo or Video Proof:
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setGrMediaType(file.type.startsWith('video') ? 'video' : 'photo');
                      readUpload(file, setGrMediaDataUrl);
                    }
                  }}
                  className="mt-1 block w-full text-xs"
                />
              </label>
              {grFeedback && <div className="text-xs text-emerald-700 dark:text-emerald-300">{grFeedback}</div>}
              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Submit Weekly Audit &amp; Hygiene Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: FORMER EMPLOYEE / EX-EMPLOYER BUSINESS & HYGIENE INSIGHTS */}
      {subTab === 'ex_employers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'Storage Facility',
                'Hygiene / Cleaning Business',
                'Grocery Store',
                'Restaurant / Food Service',
                'Restoration / Contractor',
                'Property Management',
              ].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setExSectorFilter(sec)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    exSectorFilter === sec
                      ? 'bg-slate-900 dark:bg-amber-600 text-white border-transparent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {filteredExEmployers.map((ex) => (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {ex.businessSector} · {ex.city} · {ex.employmentDates}
                  </span>
                  <span
                    className={`font-semibold ${
                      ex.moderationStatus === 'verified'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {ex.moderationStatus === 'verified' ? 'Verified Ex-Staff Disclosure' : 'Fact-Check Queue'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    {ex.companyName}
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {ex.formerRole} ({ex.authorAlias})
                  </div>
                </div>

                {ex.hidesIssuesFromCustomers && (
                  <div className="text-xs font-semibold text-red-700 dark:text-red-400">
                    Insider Warning: Management hides sanitation, climate-control, or pest issues from customers
                  </div>
                )}

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{ex.summary}</p>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                    Insider Proof Reference: {ex.proofCaption}
                  </div>
                  {ex.mediaDataUrl && (
                    <img
                      src={ex.mediaDataUrl}
                      alt={ex.proofCaption}
                      referrerPolicy="no-referrer"
                      className="max-h-44 rounded border border-slate-200 dark:border-slate-800 object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(ex.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {ex.moderationStatus !== 'verified' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/ex-employer-insights/${ex.id}/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'verify' }),
                          });
                          if (res.ok) onUpdateFormerEmployeeInsight((await res.json()) as FormerEmployeeInsight);
                        }}
                        className="px-2.5 py-1 border border-emerald-400 text-emerald-700 dark:text-emerald-300 rounded"
                      >
                        Verify Employment Proof
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/ex-employer-insights/${ex.id}/verify`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'confirm' }),
                        });
                        if (res.ok) onUpdateFormerEmployeeInsight((await res.json()) as FormerEmployeeInsight);
                      }}
                      className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded tabular-nums"
                    >
                      Corroborate ({ex.confirmations})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmitExEmployer}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Briefcase className="w-4 h-4 text-amber-600" />
              Share Ex-Employer Business &amp; Hygiene Insight
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Former employees can warn customers &amp; job seekers about dishonest storage facility climate shutoffs,
              chemical dilution at hygiene/cleaning companies, or management hiding mold and pests.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={exSector}
                onChange={(e) => setExSector(e.target.value as FormerEmployeeInsight['businessSector'])}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Storage Facility">Storage Facility</option>
                <option value="Hygiene / Cleaning Business">Hygiene / Cleaning Business</option>
                <option value="Grocery Store">Grocery Store</option>
                <option value="Restaurant / Food Service">Restaurant / Food Service</option>
                <option value="Restoration / Contractor">Restoration / Contractor</option>
                <option value="Property Management">Property Management</option>
              </select>
              <input
                type="text"
                required
                value={exCompany}
                onChange={(e) => setExCompany(e.target.value)}
                placeholder="Ex-Employer / Business Name"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={exRole}
                onChange={(e) => setExRole(e.target.value)}
                placeholder="Former Role (e.g. Night Lead)"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={exDates}
                onChange={(e) => setExDates(e.target.value)}
                placeholder="Dates Worked (2024–2026)"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={exAlias}
                onChange={(e) => setExAlias(e.target.value)}
                placeholder="Protected Alias (e.g. Former Tech J.M.)"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={exCity}
                onChange={(e) => setExCity(e.target.value)}
                placeholder="City & State"
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={exHidesIssues}
                onChange={(e) => setExHidesIssues(e.target.checked)}
              />
              Company hides sanitation, pest, moisture, or HVAC issues from paying customers
            </label>
            <textarea
              rows={3}
              required
              value={exSummary}
              onChange={(e) => setExSummary(e.target.value)}
              placeholder="Factual insider practices: e.g., shutting climate HVAC off overnight in storage wings, diluting sanitizers, or covering mold before tours..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={exProofCaption}
              onChange={(e) => setExProofCaption(e.target.value)}
              placeholder="Proof description (schedule memo, chemical log, thermostat photo)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              Attach Redacted Log / Photo Proof (Optional):
              <input
                type="file"
                accept="image/*"
                onChange={(e) => readUpload(e.target.files?.[0], setExMediaDataUrl)}
                className="mt-1 block w-full text-xs"
              />
            </label>
            {exFeedback && <div className="text-xs text-amber-700 dark:text-amber-300">{exFeedback}</div>}
            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg"
            >
              Publish Ex-Employer Insider Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

