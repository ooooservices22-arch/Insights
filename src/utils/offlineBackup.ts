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
} from '../types';

const BACKUP_KEY = 'insights_offline_backup_v1';

export interface OfflineBackupSnapshot {
  savedAt: string;
  contractors: Contractor[];
  reviews: ContractorReview[];
  blacklist: BlacklistEntry[];
  forum: ForumPost[];
  almanac: AlmanacReport[];
  fieldGigs: FieldGig[];
  abandonedHazards: AbandonedHazardReport[];
  groceryReports: GrocerySanitationReport[];
  powerOutages: PowerOutageReport[];
  usedEquipment: UsedEquipmentListing[];
  storeItems: StoreItem[];
  storeOrders: StoreOrder[];
  bookings: Booking[];
  emergencyMessages: EmergencyMessage[];
  audits: FieldAuditRecord[];
  formerEmployeeInsights?: FormerEmployeeInsight[];
  crowdfundCampaigns?: FamilyCrowdfundCampaign[];
  betaEnrollments?: BetaScoutProgramEnrollment[];
}

export function saveOfflineBackup(snapshot: OfflineBackupSnapshot): string {
  const stamped = { ...snapshot, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(stamped));
  } catch {
    // If media payloads exceed localStorage quota, store lightweight backup without base64 blobs
    try {
      const compact: OfflineBackupSnapshot = {
        ...stamped,
        audits: stamped.audits.map((a) => ({ ...a, mediaDataUrl: undefined })),
        groceryReports: stamped.groceryReports.map((g) => ({ ...g, mediaDataUrl: undefined })),
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(compact));
    } catch {
      // ignore storage quota overflow
    }
  }
  return stamped.savedAt;
}

export function loadOfflineBackup(): OfflineBackupSnapshot | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineBackupSnapshot;
  } catch {
    return null;
  }
}
