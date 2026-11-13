import React, { useState } from 'react';
import { Award, Car, CheckCircle2, Download, Smartphone, X } from 'lucide-react';
import type { BetaScoutProgramEnrollment } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  enrollments: BetaScoutProgramEnrollment[];
  onEnrolled: (entry: BetaScoutProgramEnrollment) => void;
  onLaunchAuditMode: () => void;
}

export const BetaAppStoreModal: React.FC<Props> = ({
  open,
  onClose,
  enrollments,
  onEnrolled,
  onLaunchAuditMode,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Oakland, CA');
  const [deviceType, setDeviceType] = useState<BetaScoutProgramEnrollment['deviceType']>(
    'iPhone / iPad (iOS TestFlight Beta)'
  );
  const [track, setTrack] = useState<BetaScoutProgramEnrollment['track']>(
    'iOS Beta Tester + Paid Drive-Around Scout'
  );
  const [vehicleAvailable, setVehicleAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!open) return null;

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !city.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/beta-program/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          city,
          deviceType,
          track,
          vehicleAvailable,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || 'Could not complete beta enrollment.');
        return;
      }
      onEnrolled(data as BetaScoutProgramEnrollment);
      setFullName('');
      setEmail('');
      setFeedback(
        'Enrolled! Log store/facility audits using your exact Scout Name to earn $20–$35 per verified week-over-week audit and advance toward Priority Hire.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCapacitorConfig = () => {
    const config = {
      appId: 'app.insights.fieldaudit.beta',
      appName: 'insights',
      webDir: 'dist',
      bundledWebRuntime: false,
      ios: {
        contentInset: 'automatic',
        scheme: 'insights',
        preferredContentMode: 'mobile',
      },
      server: {
        androidScheme: 'https',
      },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capacitor.config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPayouts = enrollments.reduce((s, e) => s + e.earnedIncentivesUsd, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl my-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
              iOS Beta Program · TestFlight Distribution Ready · Paid Field Audit Recruitment
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-600" />
              iOS App Store Beta &amp; Paid Drive-Around Field Scout Program
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Incentive & Hiring Path Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-slate-500 dark:text-slate-400">Base Store Audit</div>
              <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                $20 / site
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Verified photo/video condition check
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-slate-500 dark:text-slate-400">Week-over-Week Repeat</div>
              <div className="text-lg font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">
                $35 / week
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Follow-up proving chronic hiding vs cleaning
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-slate-500 dark:text-slate-400">Hiring Fast-Track</div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                5+ Audits
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Unlocks Priority Hire Field Inspector role
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-slate-500 dark:text-slate-400">Active Beta Pool</div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {enrollments.length} Scouts · ${totalPayouts}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Earned across live weekly audits
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Beta & Scout Enrollment Form */}
            <form onSubmit={handleEnroll} className="lg:col-span-6 space-y-3">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-600" />
                Join iOS Beta &amp; Apply for Drive-Around Audit Pay
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign up with your Apple ID / email for iOS TestFlight beta access, install the offline Web Clip today,
                and earn audit incentives driving to inspect grocery stores, storage facilities, and commercial sites.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name / Scout Handle"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Apple ID / Contact Email"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City & Metro Area"
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as BetaScoutProgramEnrollment['deviceType'])}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="iPhone / iPad (iOS TestFlight Beta)">iPhone / iPad (iOS TestFlight Beta)</option>
                  <option value="Android / Web PWA">Android / Web PWA</option>
                </select>
              </div>

              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as BetaScoutProgramEnrollment['track'])}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="iOS Beta Tester + Paid Drive-Around Scout">
                  iOS Beta Tester + Paid Drive-Around Scout
                </option>
                <option value="Weekly Store Cleanliness Auditor">
                  Weekly Store Cleanliness Auditor ($35 repeat audits)
                </option>
                <option value="Full-Time Field Inspector Track">
                  Full-Time Regional Field Inspector Track
                </option>
              </select>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicleAvailable}
                  onChange={(e) => setVehicleAvailable(e.target.checked)}
                />
                I have reliable transportation to drive and photograph local businesses week-over-week
              </label>

              {feedback && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-xs text-emerald-800 dark:text-emerald-200">
                  {feedback}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                >
                  {submitting ? 'Enrolling...' : 'Join iOS Beta & Scout Program'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchAuditMode();
                  }}
                  className="py-2 px-3 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Start Live Audit →
                </button>
              </div>
            </form>

            {/* Right Column: Apple App Store TestFlight Readiness + Live Scout Hiring Roster */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Apple App Store &amp; TestFlight Beta Packaging
                  </div>
                  <button
                    type="button"
                    onClick={downloadCapacitorConfig}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded"
                  >
                    <Download className="w-3 h-3" />
                    capacitor.config.json
                  </button>
                </div>
                <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>
                    <strong>Live Now (Zero Friction):</strong> iPhone users open in Safari → <em>Share → Add to Home Screen</em> for full-screen offline camera audits &amp; auto-backup.
                  </li>
                  <li>
                    <strong>TestFlight Binary Build:</strong> Wrap <code className="font-mono">npm run build</code> (<code className="font-mono">dist/</code>) via Capacitor (<code className="font-mono">npx cap add ios &amp;&amp; npx cap open ios</code>) using Bundle ID <code className="font-mono">app.insights.fieldaudit.beta</code>.
                  </li>
                  <li>
                    <strong>Beta Review &amp; Public Link:</strong> Upload archive in Xcode Organizer to App Store Connect → enable TestFlight External Testing link to invite enrolled Apple IDs.
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  Active Beta Scouts &amp; Hiring Track Leaderboard
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg max-h-48 overflow-y-auto">
                  {enrollments.map((en) => (
                    <div key={en.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {en.fullName}
                          {en.hiringTier === 'Priority Hire Candidate' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {en.city} · {en.hiringTier}
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400">
                          ${en.earnedIncentivesUsd}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {en.auditsLoggedCount} audits
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
