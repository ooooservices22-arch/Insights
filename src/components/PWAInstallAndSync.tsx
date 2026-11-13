import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        Download Offline App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Install iOS App
        </button>

        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Download insights for Offline Use
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                1. Tap the <strong>Share</strong> icon in your Safari toolbar.
                <br />
                2. Select <strong>Add to Home Screen</strong> to enable offline caching, live camera Audit Mode, and automatic background updates.
              </p>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuideModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        Offline App & Backup
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Install insights Desktop / Mobile App
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Use your browser&apos;s address bar <strong>Install App</strong> icon (Chrome/Edge) or{' '}
              <strong>Share → Add to Home Screen</strong> (Mobile) to run offline with cached hazard data, automatic local backups, and silent auto-updates.
            </p>
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded-lg"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineAndUpdateBanner: React.FC<{
  lastBackupAt: string | null;
  pendingAuditsCount: number;
  onSyncNow: () => void;
}> = ({ lastBackupAt, pendingAuditsCount, onSyncNow }) => {
  const isOnline = useOnlineStatus();
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdateReady(true);
        updateSW(true);
      },
    });
  }, []);

  if (isOnline && !updateReady && pendingAuditsCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-wrap items-center gap-3 rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs text-white shadow-lg">
      {!isOnline && (
        <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode · Using Local Backup
        </span>
      )}
      {lastBackupAt && (
        <span className="text-slate-300 font-mono text-[11px]">
          Auto-backup {new Date(lastBackupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      {pendingAuditsCount > 0 && isOnline && (
        <button
          type="button"
          onClick={onSyncNow}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-500 rounded font-semibold"
        >
          <RefreshCw className="w-3 h-3" />
          Sync {pendingAuditsCount} Offline Audit(s)
        </button>
      )}
      {updateReady && (
        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
          <RefreshCw className="w-3 h-3" />
          App update applied
        </span>
      )}
    </div>
  );
};
