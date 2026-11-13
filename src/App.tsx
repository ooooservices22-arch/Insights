import React, { useCallback, useEffect, useState } from 'react';
import { AiGuideDrawer } from './components/AiGuideDrawer';
import { BetaAppStoreModal } from './components/BetaAppStoreModal';
import { CommunityGlassWallWorkspace } from './components/CommunityGlassWallWorkspace';
import { DiagnosticsWorkspace } from './components/DiagnosticsWorkspace';
import { HazardsMapWorkspace } from './components/HazardsMapWorkspace';
import { MarketplaceWorkspace } from './components/MarketplaceWorkspace';
import { OfflineAndUpdateBanner, PWAInstallButton } from './components/PWAInstallAndSync';
import { StoreAndSurvivalWorkspace } from './components/StoreAndSurvivalWorkspace';
import { loadOfflineBackup, saveOfflineBackup } from './utils/offlineBackup';
import type {
  AbandonedHazardReport,
  AlmanacReport,
  BetaScoutProgramEnrollment,
  BlacklistEntry,
  Booking,
  Contractor,
  ContractorReview,
  EmergencyMessage,
  FamilyCrowdfundCampaign,
  FieldAuditRecord,
  FieldGig,
  FormerEmployeeInsight,
  ForumPost,
  GrocerySanitationReport,
  PowerOutageReport,
  StoreItem,
  StoreOrder,
  UsedEquipmentListing,
} from './types';

type WorkspaceTab = 'diagnostics' | 'hazards' | 'marketplace' | 'community' | 'store';

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'hazards', label: 'Hazards' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'community', label: 'Glass Wall' },
  { id: 'store', label: 'Supply Store' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('diagnostics');
  const [survivalMode, setSurvivalMode] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [prefillGuideQuestion, setPrefillGuideQuestion] = useState<string | null>(null);
  const [betaModalOpen, setBetaModalOpen] = useState<boolean>(false);

  const [coords, setCoords] = useState<{ lat: number; lon: number; label: string }>({
    lat: 37.7749,
    lon: -122.4194,
    label: 'San Francisco, CA',
  });

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [reviews, setReviews] = useState<ContractorReview[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [forum, setForum] = useState<ForumPost[]>([]);
  const [almanac, setAlmanac] = useState<AlmanacReport[]>([]);
  const [fieldGigs, setFieldGigs] = useState<FieldGig[]>([]);
  const [abandonedHazards, setAbandonedHazards] = useState<AbandonedHazardReport[]>([]);
  const [groceryReports, setGroceryReports] = useState<GrocerySanitationReport[]>([]);
  const [powerOutages, setPowerOutages] = useState<PowerOutageReport[]>([]);
  const [usedEquipment, setUsedEquipment] = useState<UsedEquipmentListing[]>([]);
  const [audits, setAudits] = useState<FieldAuditRecord[]>([]);
  const [formerEmployeeInsights, setFormerEmployeeInsights] = useState<FormerEmployeeInsight[]>([]);
  const [crowdfundCampaigns, setCrowdfundCampaigns] = useState<FamilyCrowdfundCampaign[]>([]);
  const [betaEnrollments, setBetaEnrollments] = useState<BetaScoutProgramEnrollment[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencyMessages, setEmergencyMessages] = useState<EmergencyMessage[]>([]);

  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('');
  const [storeCategory, setStoreCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (survivalMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [survivalMode]);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const [
          ctrRes,
          revRes,
          blRes,
          frmRes,
          almRes,
          strRes,
          bkgRes,
          gigRes,
          abnRes,
          emgRes,
          pwrRes,
          grcRes,
          audRes,
          exRes,
          cfRes,
          betaRes,
        ] = await Promise.all([
          fetch('/api/contractors'),
          fetch('/api/reviews'),
          fetch('/api/blacklist'),
          fetch('/api/forum'),
          fetch('/api/almanac'),
          fetch('/api/store'),
          fetch('/api/bookings'),
          fetch('/api/gigs'),
          fetch('/api/abandoned-hazards'),
          fetch('/api/emergency-comms'),
          fetch('/api/power-outages'),
          fetch('/api/grocery-reports'),
          fetch('/api/audits'),
          fetch('/api/ex-employer-insights'),
          fetch('/api/crowdfund'),
          fetch('/api/beta-program'),
        ]);
        if (!active) return;

        setContractors(await ctrRes.json());
        setReviews(await revRes.json());
        setBlacklist(await blRes.json());
        setForum(await frmRes.json());
        setAlmanac(await almRes.json());

        const storePayload = await strRes.json();
        setStoreItems(storePayload.items || []);
        setStoreOrders(storePayload.orders || []);
        setUsedEquipment(storePayload.usedEquipment || []);

        setBookings(await bkgRes.json());
        setFieldGigs(await gigRes.json());
        setAbandonedHazards(await abnRes.json());
        setEmergencyMessages(await emgRes.json());
        setPowerOutages(await pwrRes.json());
        setGroceryReports(await grcRes.json());

        const serverAudits = (await audRes.json()) as FieldAuditRecord[];
        const cached = loadOfflineBackup();
        const unsyncedLocal = (cached?.audits || []).filter(
          (la) => !la.syncedToServer && !serverAudits.some((sa) => sa.id === la.id)
        );
        setAudits([...unsyncedLocal, ...serverAudits]);

        setFormerEmployeeInsights(await exRes.json());
        setCrowdfundCampaigns(await cfRes.json());

        const betaPayload = await betaRes.json();
        setBetaEnrollments(betaPayload.enrollments || []);
      } catch (err) {
        if (!active) return;
        const cached = loadOfflineBackup();
        if (cached) {
          setContractors(cached.contractors || []);
          setReviews(cached.reviews || []);
          setBlacklist(cached.blacklist || []);
          setForum(cached.forum || []);
          setAlmanac(cached.almanac || []);
          setFieldGigs(cached.fieldGigs || []);
          setAbandonedHazards(cached.abandonedHazards || []);
          setGroceryReports(cached.groceryReports || []);
          setPowerOutages(cached.powerOutages || []);
          setUsedEquipment(cached.usedEquipment || []);
          setStoreItems(cached.storeItems || []);
          setStoreOrders(cached.storeOrders || []);
          setBookings(cached.bookings || []);
          setEmergencyMessages(cached.emergencyMessages || []);
          setAudits(cached.audits || []);
          setFormerEmployeeInsights(cached.formerEmployeeInsights || []);
          setCrowdfundCampaigns(cached.crowdfundCampaigns || []);
          setBetaEnrollments(cached.betaEnrollments || []);
          setLastBackupAt(cached.savedAt);
          setLoadError(null);
        } else {
          setLoadError(err instanceof Error ? err.message : 'Failed to load workspace data.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  // Auto-backup all workspace state & audits locally for offline resilience
  useEffect(() => {
    if (loading) return;
    const stamped = saveOfflineBackup({
      savedAt: new Date().toISOString(),
      contractors,
      reviews,
      blacklist,
      forum,
      almanac,
      fieldGigs,
      abandonedHazards,
      groceryReports,
      powerOutages,
      usedEquipment,
      storeItems,
      storeOrders,
      bookings,
      emergencyMessages,
      audits,
      formerEmployeeInsights,
      crowdfundCampaigns,
      betaEnrollments,
    });
    setLastBackupAt(stamped);
  }, [
    loading,
    contractors,
    reviews,
    blacklist,
    forum,
    almanac,
    fieldGigs,
    abandonedHazards,
    groceryReports,
    powerOutages,
    usedEquipment,
    storeItems,
    storeOrders,
    bookings,
    emergencyMessages,
    audits,
    formerEmployeeInsights,
    crowdfundCampaigns,
    betaEnrollments,
  ]);

  const handleSaveAudit = async (audit: FieldAuditRecord) => {
    setAudits((prev) => [audit, ...prev]);
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audit),
      });
      if (res.ok) {
        const synced = (await res.json()) as FieldAuditRecord;
        setAudits((prev) => prev.map((a) => (a.id === audit.id ? { ...synced, syncedToServer: true } : a)));
      }
    } catch {
      // Offline: stays safely in local backup with syncedToServer: false
    }
  };

  const syncPendingAudits = useCallback(async () => {
    const pending = audits.filter((a) => !a.syncedToServer);
    if (!pending.length || !navigator.onLine) return;
    for (const item of pending) {
      try {
        const res = await fetch('/api/audits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const synced = (await res.json()) as FieldAuditRecord;
          setAudits((prev) => prev.map((a) => (a.id === item.id ? { ...synced, syncedToServer: true } : a)));
        }
      } catch {
        break;
      }
    }
  }, [audits]);

  useEffect(() => {
    const handleOnline = () => {
      syncPendingAudits();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncPendingAudits]);

  const handleAskGuide = (question: string) => {
    setPrefillGuideQuestion(question);
    setGuideOpen(true);
  };

  const navigateToContractors = (specialty?: string) => {
    setMarketplaceFilter(specialty || '');
    setActiveTab('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStore = (cat?: string) => {
    setStoreCategory(cat || 'All');
    setActiveTab('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('diagnostics');
            }}
            className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            insights
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'border-amber-600 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Ask AI Guide
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Workspace Tabs */}
      <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === item.id
                ? 'bg-slate-900 dark:bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 lg:px-8 py-8">
        {loadError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-800 dark:text-red-200">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
            <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
          </div>
        ) : (
          <>
            {activeTab === 'diagnostics' && (
              <DiagnosticsWorkspace
                locationLabel={coords.label}
                onNavigateToContractors={navigateToContractors}
                onNavigateToStore={navigateToStore}
                onAskGuide={handleAskGuide}
              />
            )}

            {activeTab === 'hazards' && (
              <HazardsMapWorkspace
                coords={coords}
                onUpdateCoords={setCoords}
                contractors={contractors}
                almanac={almanac}
                powerOutages={powerOutages}
                audits={audits}
                onSaveAudit={handleSaveAudit}
                onAddAlmanac={(r) => setAlmanac((prev) => [r, ...prev])}
                onVerifyAlmanac={async (id) => {
                  const res = await fetch(`/api/almanac/${id}/verify`, { method: 'POST' });
                  if (res.ok) {
                    const updated = (await res.json()) as AlmanacReport;
                    setAlmanac((prev) => prev.map((a) => (a.id === id ? updated : a)));
                  }
                }}
                onAskGuide={handleAskGuide}
              />
            )}

            {activeTab === 'marketplace' && (
              <MarketplaceWorkspace
                contractors={contractors}
                bookings={bookings}
                fieldGigs={fieldGigs}
                initialFilter={marketplaceFilter}
                onAddContractor={(c) => setContractors((prev) => [c, ...prev])}
                onAddBooking={(b) => setBookings((prev) => [b, ...prev])}
                onUpdateBooking={(b) => setBookings((prev) => prev.map((x) => (x.id === b.id ? b : x)))}
                onAddGig={(g) => setFieldGigs((prev) => [g, ...prev])}
                onUpdateGig={(g) => setFieldGigs((prev) => prev.map((x) => (x.id === g.id ? g : x)))}
                onOpenBetaProgram={() => setBetaModalOpen(true)}
              />
            )}

            {activeTab === 'community' && (
              <CommunityGlassWallWorkspace
                contractors={contractors}
                reviews={reviews}
                blacklist={blacklist}
                forum={forum}
                abandonedHazards={abandonedHazards}
                groceryReports={groceryReports}
                formerEmployeeInsights={formerEmployeeInsights}
                onAddReview={(r) => setReviews((prev) => [r, ...prev])}
                onUpdateReview={(r) => setReviews((prev) => prev.map((x) => (x.id === r.id ? r : x)))}
                onAddBlacklist={(b) => setBlacklist((prev) => [b, ...prev])}
                onUpdateBlacklist={(b) => setBlacklist((prev) => prev.map((x) => (x.id === b.id ? b : x)))}
                onAddForumPost={(p) => setForum((prev) => [p, ...prev])}
                onUpdateForumPost={(p) => setForum((prev) => prev.map((x) => (x.id === p.id ? p : x)))}
                onAddAbandonedHazard={(h) => setAbandonedHazards((prev) => [h, ...prev])}
                onUpdateAbandonedHazard={(h) =>
                  setAbandonedHazards((prev) => prev.map((x) => (x.id === h.id ? h : x)))
                }
                onAddGroceryReport={(g) => setGroceryReports((prev) => [g, ...prev])}
                onUpdateGroceryReport={(g) =>
                  setGroceryReports((prev) => prev.map((x) => (x.id === g.id ? g : x)))
                }
                onAddFormerEmployeeInsight={(ex) => setFormerEmployeeInsights((prev) => [ex, ...prev])}
                onUpdateFormerEmployeeInsight={(ex) =>
                  setFormerEmployeeInsights((prev) => prev.map((x) => (x.id === ex.id ? ex : x)))
                }
                onOpenBetaProgram={() => setBetaModalOpen(true)}
              />
            )}

            {activeTab === 'store' && (
              <StoreAndSurvivalWorkspace
                items={storeItems}
                orders={storeOrders}
                usedEquipment={usedEquipment}
                crowdfundCampaigns={crowdfundCampaigns}
                emergencyMessages={emergencyMessages}
                survivalMode={survivalMode}
                onToggleSurvivalMode={() => setSurvivalMode((s) => !s)}
                initialCategory={storeCategory}
                onOrderCreated={(o) => setStoreOrders((prev) => [o, ...prev])}
                onItemUpdated={(updatedItem) =>
                  setStoreItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)))
                }
                onAddCampaign={(c) => setCrowdfundCampaigns((prev) => [c, ...prev])}
                onCampaignUpdated={(c) =>
                  setCrowdfundCampaigns((prev) => prev.map((x) => (x.id === c.id ? c : x)))
                }
                onEmergencyPosted={(m) => setEmergencyMessages((prev) => [m, ...prev])}
                onNavigateToContractors={navigateToContractors}
                onAskGuide={handleAskGuide}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            insights · Open Beta Property &amp; Hygiene Transparency Platform · Private Residential Owner Data Kept Confidential
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setBetaModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white underline font-semibold text-amber-700 dark:text-amber-400"
            >
              iOS Beta &amp; Paid Scout Program
            </button>
            <button
              type="button"
              onClick={() => setSurvivalMode((s) => !s)}
              className="hover:text-slate-900 dark:hover:text-white underline"
            >
              {survivalMode ? 'Standard Daylight Mode' : 'Off-Grid Survival Mode'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className="hover:text-slate-900 dark:hover:text-white underline"
            >
              Emergency Mesh Comms
            </button>
          </div>
        </div>
      </footer>

      <OfflineAndUpdateBanner
        lastBackupAt={lastBackupAt}
        pendingAuditsCount={audits.filter((a) => !a.syncedToServer).length}
        onSyncNow={syncPendingAudits}
      />

      <BetaAppStoreModal
        open={betaModalOpen}
        onClose={() => setBetaModalOpen(false)}
        enrollments={betaEnrollments}
        onEnrolled={(entry) => setBetaEnrollments((prev) => [entry, ...prev])}
        onLaunchAuditMode={() => {
          setActiveTab('hazards');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <AiGuideDrawer
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        contextSection={NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Workspace'}
        locationLabel={coords.label}
        prefillQuestion={prefillGuideQuestion}
        onClearPrefill={() => setPrefillGuideQuestion(null)}
      />
    </div>
  );
}
