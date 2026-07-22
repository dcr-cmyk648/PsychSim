import type {
  CaseInstance,
  CatalogBundle,
  ClinicalTicketStatus,
  ClinicState,
  ProgressionMode,
  SaveData,
} from '@psychsim/schemas';
import { getUpgradeOffer } from '@psychsim/engine';

export interface PatientSlotPreview {
  id: string;
  casePreview: CaseInstance;
  settingLabel: string;
  locationId: string;
}

interface ClinicHubProps {
  saveData: SaveData;
  clinicState: ClinicState;
  catalogs: CatalogBundle;
  patientSlots: PatientSlotPreview[];
  developerModeAvailable: boolean;
  onStart: (slotId: string) => void;
  onSetMode: (mode: ProgressionMode) => void;
  onRefresh: () => void;
  onRerollDeveloper: (slotId: string) => void;
  onResetDeveloper: () => void;
  onSetTicketStatus: (ticketId: string, status: ClinicalTicketStatus) => void;
  onWriteTickets: () => void;
  onExportTickets: () => void;
  ticketToolStatus: string | null;
  onPurchaseUpgrade: (upgradeId: string) => void;
  upgradeStatus: string | null;
}

const tierLabel = (clinic: ClinicState): string =>
  clinic.facilityTier === 'behavioral_health_system'
    ? 'Tier 7 · Behavioral-Health System'
    : 'Tier 1 · Solo Psychiatric Office';

const MODE_LABELS: ReadonlyArray<{ id: ProgressionMode; label: string }> = [
  { id: 'standard', label: 'Normal' },
  { id: 'endgame', label: 'Endgame' },
  { id: 'developer', label: 'Developer' },
];

const ticketPriority = { blocking: 0, high: 1, medium: 2, low: 3 } as const;

export function ClinicHub({
  saveData,
  clinicState,
  catalogs,
  patientSlots,
  developerModeAvailable,
  onStart,
  onSetMode,
  onRefresh,
  onRerollDeveloper,
  onResetDeveloper,
  onSetTicketStatus,
  onWriteTickets,
  onExportTickets,
  ticketToolStatus,
  onPurchaseUpgrade,
  upgradeStatus,
}: ClinicHubProps) {
  const { clinic, progressionMode } = saveData.profile;
  const latestAttempt = saveData.attempts.at(-1);
  const openTickets = [...saveData.clinicalTickets]
    .filter((ticket) => !['rejected', 'resolved'].includes(ticket.status))
    .sort(
      (left, right) =>
        Number(right.requiresClinicalAcumen) - Number(left.requiresClinicalAcumen) ||
        ticketPriority[left.priority] - ticketPriority[right.priority] ||
        left.createdAt.localeCompare(right.createdAt),
    );
  const upgradeOffers = catalogs.upgrades.flatMap((upgrade) => {
    const offer = getUpgradeOffer(clinic, upgrade.id, catalogs);
    return offer.ok ? [offer.value] : [];
  });
  const activeFormularyLabels = catalogs.formularies
    .filter((formulary) => clinic.formularyIds.includes(formulary.id))
    .map((formulary) => formulary.label);

  return (
    <main className="hub-shell" id="main-content">
      <section className="clinic-banner" aria-labelledby="clinic-title">
        <div>
          <p className="eyebrow">{tierLabel(clinicState)}</p>
          <h1 id="clinic-title">{clinicState.label}</h1>
          <p className="banner-copy">
            {progressionMode === 'standard'
              ? 'One room, a starter formulary, and a waiting patient.'
              : progressionMode === 'endgame'
                ? 'Practice mode with all approved patients and modeled capabilities unlocked.'
                : 'Local content-development mode: review content appears once until reset.'}
          </p>
        </div>
        <dl className="profile-stats" aria-label="Clinic profile">
          <div>
            <dt>Points</dt>
            <dd>{clinic.clinicPoints.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Lifetime</dt>
            <dd>{clinic.lifetimePointsEarned.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{saveData.attempts.length}</dd>
          </div>
        </dl>
        <div className="mode-control">
          <span className="debug-label">LOCAL MODE</span>
          <div className="mode-buttons" aria-label="Game mode">
            {MODE_LABELS.filter((mode) => mode.id !== 'developer' || developerModeAvailable).map(
              (mode) => (
                <button
                  key={mode.id}
                  className="secondary-button"
                  type="button"
                  aria-pressed={progressionMode === mode.id}
                  onClick={() => onSetMode(mode.id)}
                >
                  {mode.label}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <div className="hub-grid">
        <section className="patient-queue" aria-labelledby="patient-queue-title">
          <div className="queue-heading">
            <div>
              <p className="eyebrow">Available now</p>
              <h2 id="patient-queue-title">Patient queue</h2>
            </div>
            <div className="queue-tools">
              <span className="count-badge">{patientSlots.length}</span>
              {progressionMode !== 'standard' ? (
                <button className="small-button" type="button" onClick={onRefresh}>
                  Refresh slots
                </button>
              ) : null}
            </div>
          </div>
          {patientSlots.length > 0 ? (
            <div className="patient-slot-grid">
              {patientSlots.map((slot) => (
                <article className="case-card" key={slot.id}>
                  <div className="case-card-topline">
                    <span className="case-level">Patient</span>
                    <span className="status-chip">Waiting</span>
                  </div>
                  <p className="setting-label">
                    <span>Setting</span>
                    {slot.settingLabel}
                  </p>
                  <h3>{slot.casePreview.opening.title}</h3>
                  <p className="chief-complaint">
                    <span>Chief complaint</span>“{slot.casePreview.opening.chiefComplaint}”
                  </p>
                  <div className="case-card-actions">
                    <button
                      className="primary-button large-button"
                      type="button"
                      aria-label={`Open chart for ${slot.casePreview.opening.title}`}
                      onClick={() => onStart(slot.id)}
                    >
                      Open chart
                    </button>
                    {progressionMode === 'developer' ? (
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => onRerollDeveloper(slot.id)}
                      >
                        Reroll patient
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-queue">
              <p>
                {progressionMode === 'developer'
                  ? 'Every currently loaded patient definition has been run.'
                  : 'No eligible patients are waiting.'}
              </p>
              {progressionMode === 'developer' ? (
                <button className="secondary-button" type="button" onClick={onResetDeveloper}>
                  Reset developer run history
                </button>
              ) : null}
            </div>
          )}
        </section>

        <aside className="office-card" aria-labelledby="office-capabilities-title">
          <div className="office-illustration" aria-hidden="true">
            <span className="plant">♧</span>
            <span className="desk" />
            <span className="chair chair-one" />
            <span className="chair chair-two" />
          </div>
          <h2 id="office-capabilities-title">Current setting</h2>
          <ul className="capability-list">
            {progressionMode === 'standard' ? (
              <>
                <li>History and physical examination in house</li>
                <li>
                  ECG {clinic.capabilities.includes('equipment.ecg') ? 'in house' : 'by sendout'}
                </li>
                <li>{activeFormularyLabels.join(' + ')}</li>
                <li>Outpatient care, referral, and transfer</li>
              </>
            ) : (
              <>
                <li>All currently modeled service capabilities</li>
                <li>Full current medication catalog</li>
                <li>Practice results do not change banked points</li>
                <li>Review quarantine remains enforced</li>
              </>
            )}
          </ul>
        </aside>
      </div>

      {progressionMode === 'standard' ? (
        <section className="upgrade-store" aria-labelledby="upgrade-store-title">
          <div className="queue-heading">
            <div>
              <p className="eyebrow">Clinic building</p>
              <h2 id="upgrade-store-title">Upgrade store</h2>
            </div>
            <span className="count-badge">{upgradeOffers.length}</span>
          </div>
          <p className="store-intro">
            Purchases spend banked points only. Lifetime progression never decreases.
          </p>
          {upgradeStatus ? (
            <p className="ticket-tool-status" role="status">
              {upgradeStatus}
            </p>
          ) : null}
          <div className="upgrade-grid">
            {upgradeOffers.map((offer) => {
              const economics = offer.serviceEconomics[0];
              return (
                <article className="upgrade-card" key={offer.upgrade.id}>
                  <div className="upgrade-card-heading">
                    <div>
                      <span className="status-chip">{offer.upgrade.kind}</span>
                      <h3>{offer.upgrade.label}</h3>
                    </div>
                    <strong>{offer.upgrade.purchaseCost.toLocaleString()} pts</strong>
                  </div>
                  <p>{offer.upgrade.description}</p>
                  <dl className="upgrade-economics">
                    <div>
                      <dt>Facility tiers</dt>
                      <dd>
                        {offer.upgrade.allowedFacilityTiers
                          .map((tier) => tier.replaceAll('_', ' '))
                          .join(', ')}
                      </dd>
                    </div>
                    <div>
                      <dt>Prerequisites</dt>
                      <dd>
                        {offer.upgrade.prerequisiteUpgradeIds.length > 0
                          ? offer.upgrade.prerequisiteUpgradeIds.join(', ')
                          : 'None'}
                      </dd>
                    </div>
                    <div>
                      <dt>Department</dt>
                      <dd>{offer.upgrade.requiredDepartmentId ?? 'None'}</dd>
                    </div>
                    {economics ? (
                      <>
                        <div>
                          <dt>Current fulfillment</dt>
                          <dd>
                            {economics.currentMethodLabel} ·{' '}
                            {economics.currentPerUseCost.toLocaleString()} pts
                          </dd>
                        </div>
                        <div>
                          <dt>After purchase</dt>
                          <dd>
                            {economics.projectedMethodLabel} ·{' '}
                            {economics.projectedPerUseCost.toLocaleString()} pts
                          </dd>
                        </div>
                        <div>
                          <dt>Savings per use</dt>
                          <dd>{economics.estimatedSavingsPerUse.toLocaleString()} pts</dd>
                        </div>
                        <div>
                          <dt>Break-even</dt>
                          <dd>
                            {offer.approximateBreakEvenUses === null
                              ? 'Not applicable'
                              : `About ${offer.approximateBreakEvenUses} uses`}
                          </dd>
                        </div>
                      </>
                    ) : null}
                    <div>
                      <dt>Patient categories unlocked</dt>
                      <dd>
                        {offer.upgrade.patientCategoryIdsUnlocked.length > 0
                          ? offer.upgrade.patientCategoryIdsUnlocked.join(', ')
                          : 'None — existing care becomes cheaper or broader'}
                      </dd>
                    </div>
                  </dl>
                  <ul className="capability-list compact-list">
                    {offer.upgrade.clinicalCapabilityLabels.map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                  {offer.blockers.length > 0 && !offer.owned ? (
                    <p className="upgrade-blocker">{offer.blockers[0]!.message}</p>
                  ) : null}
                  <button
                    className="primary-button"
                    type="button"
                    disabled={!offer.canPurchase}
                    onClick={() => onPurchaseUpgrade(offer.upgrade.id)}
                  >
                    {offer.owned
                      ? 'Owned'
                      : `Buy for ${offer.upgrade.purchaseCost.toLocaleString()} pts`}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {progressionMode === 'developer' ? (
        <section className="ticket-queue" aria-labelledby="ticket-queue-title">
          <div className="queue-heading">
            <div>
              <p className="eyebrow">Proposed changes only</p>
              <h2 id="ticket-queue-title">Clinical and content tickets</h2>
            </div>
            <div className="queue-tools">
              <span className="count-badge">{openTickets.length}</span>
              <button
                className="small-button"
                type="button"
                disabled={saveData.clinicalTickets.length === 0}
                onClick={onWriteTickets}
              >
                Save queue to workspace
              </button>
              <button
                className="small-button"
                type="button"
                disabled={saveData.clinicalTickets.length === 0}
                onClick={onExportTickets}
              >
                Export JSON
              </button>
            </div>
          </div>
          {ticketToolStatus ? (
            <p className="ticket-tool-status" role="status">
              {ticketToolStatus}
            </p>
          ) : null}
          {openTickets.length === 0 ? (
            <p className="no-results">No open local review tickets.</p>
          ) : (
            <div className="ticket-list">
              {openTickets.map((ticket) => (
                <article className="ticket-card" key={ticket.id}>
                  <div>
                    <strong>{ticket.title}</strong>
                    <small>
                      {ticket.ticketType.replaceAll('_', ' ')} · {ticket.priority} ·{' '}
                      {ticket.requiresClinicalAcumen ? 'clinical review' : 'technical review'}
                    </small>
                    <p>{ticket.guidance}</p>
                  </div>
                  <label>
                    Status
                    <select
                      value={ticket.status}
                      onChange={(event) =>
                        onSetTicketStatus(ticket.id, event.target.value as ClinicalTicketStatus)
                      }
                    >
                      <option value="proposed">Proposed</option>
                      <option value="in_review">In review</option>
                      <option value="accepted_for_workflow">Accepted for workflow</option>
                      <option value="deferred">Deferred</option>
                      <option value="rejected">Rejected</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {latestAttempt ? (
        <section className="recent-result" aria-label="Most recent saved attempt">
          <div>
            <p className="eyebrow">Saved locally</p>
            <h2>Most recent: {latestAttempt.receipt.pointReport.carePointsEarned} care points</h2>
          </div>
          <p>
            Database plan {latestAttempt.receipt.pointReport.databasePlanCarePoints} · +
            {latestAttempt.receipt.settlement.netClinicPointsEarned.toLocaleString()} points
            {latestAttempt.receipt.settlement.practiceMode ? ' projected · practice result' : ''}
          </p>
        </section>
      ) : null}
    </main>
  );
}
