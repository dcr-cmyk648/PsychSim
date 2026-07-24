import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildDistributionReloadUrl,
  compareDistribution,
  CURRENT_DISTRIBUTION,
  fetchDistributionManifest,
  isAppleMobileDevice,
  isStandaloneWebApp,
  type DistributionManifest,
} from '../distribution';

const UPDATE_INTERVAL_MS = 5 * 60 * 1_000;

interface DistributionControlsProps {
  safeToReload: boolean;
  showInstallControl: boolean;
  onNavigate?: (url: string) => void;
}

const shortDistributionId = (id: string): string => (id === 'development' ? id : id.slice(0, 12));

export function DistributionControls({
  safeToReload,
  showInstallControl,
  onNavigate = (url) => window.location.replace(url),
}: DistributionControlsProps) {
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [remoteDistribution, setRemoteDistribution] = useState<DistributionManifest | null>(null);
  const [checking, setChecking] = useState(false);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const installed = useMemo(() => isStandaloneWebApp(), []);
  const appleMobile = useMemo(() => isAppleMobileDevice(), []);
  const updateAvailable = compareDistribution(
    CURRENT_DISTRIBUTION,
    remoteDistribution,
  ).updateAvailable;

  const checkForUpdate = useCallback(async (manual = false): Promise<void> => {
    if (manual) {
      setChecking(true);
      setManualStatus(null);
    }
    try {
      const remote = await fetchDistributionManifest(document.baseURI, Date.now());
      setRemoteDistribution(remote);
      if (manual) {
        setManualStatus(
          compareDistribution(CURRENT_DISTRIBUTION, remote).updateAvailable
            ? 'A newer distribution is ready.'
            : remote
              ? 'This device has the current distribution.'
              : 'The distribution server could not be checked. Try again when online.',
        );
      }
    } catch {
      if (manual) {
        setManualStatus('The distribution server could not be checked. Try again when online.');
      }
    } finally {
      if (manual) setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') void checkForUpdate();
    };
    const onOnline = (): void => void checkForUpdate();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    const interval = window.setInterval(() => void checkForUpdate(), UPDATE_INTERVAL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      window.clearInterval(interval);
    };
  }, [checkForUpdate]);

  const applyUpdate = (): void => {
    if (!safeToReload || !remoteDistribution) return;
    onNavigate(buildDistributionReloadUrl(window.location.href, remoteDistribution.distributionId));
  };

  return (
    <>
      {updateAvailable ? (
        <aside className="distribution-update" role="alert" aria-label="Application update">
          <div>
            <strong>New PsychSim distribution ready</strong>
            <span>
              {safeToReload
                ? 'Saved browser data will be preserved. Update now to load the latest main release.'
                : 'Finish this patient or save/export your feedback, then return to the clinic to update.'}
            </span>
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={!safeToReload}
            onClick={applyUpdate}
          >
            {safeToReload ? 'Update now' : 'Update after returning'}
          </button>
        </aside>
      ) : null}

      {showInstallControl ? (
        <section className="distribution-controls" aria-label="Install and application updates">
          <div>
            <span className="debug-label">{installed ? 'HOME SCREEN APP' : 'PHONE INSTALL'}</span>
            <small>
              Build {shortDistributionId(CURRENT_DISTRIBUTION.distributionId)} ·{' '}
              {CURRENT_DISTRIBUTION.channel}
            </small>
          </div>
          <div className="distribution-control-actions">
            {!installed ? (
              <button
                className="small-button"
                type="button"
                onClick={() => setInstallHelpOpen(true)}
              >
                Install on iPhone
              </button>
            ) : (
              <span className="status-chip">Installed</span>
            )}
            <button
              className="small-button"
              type="button"
              disabled={checking}
              onClick={() => void checkForUpdate(true)}
            >
              {checking ? 'Checking…' : 'Check for update'}
            </button>
          </div>
          {manualStatus ? (
            <p className="distribution-check-status" role="status">
              {manualStatus}
            </p>
          ) : null}
        </section>
      ) : null}

      {installHelpOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-dialog-title"
          >
            <p className="eyebrow">{appleMobile ? 'iPhone or iPad' : 'Install on an iPhone'}</p>
            <h2 id="install-dialog-title">Add PsychSim to the Home Screen</h2>
            <ol>
              <li>Open this Pages address in Safari.</li>
              <li>Tap Share, then choose Add to Home Screen.</li>
              <li>Turn on Open as Web App, then tap Add.</li>
            </ol>
            <div className="install-storage-warning" role="note">
              <strong>Local data stays local.</strong>
              <span>
                If you already reviewed cases in Safari, export that feedback first. The installed
                Home Screen app may use separate device storage and does not copy the Safari
                database.
              </span>
            </div>
            <p>
              Installed copies check the main distribution when opened, brought back to the
              foreground, and every few minutes while online. Updates never clear saved PsychSim
              data.
            </p>
            <button
              className="primary-button"
              type="button"
              autoFocus
              onClick={() => setInstallHelpOpen(false)}
            >
              Done
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
