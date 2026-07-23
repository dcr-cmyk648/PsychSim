import { useEffect, useState } from 'react';

import type {
  CaseInstance,
  CatalogBundle,
  ClinicalReviewTicket,
  ClinicState,
  ProgressionMode,
  SaveData,
} from '@psychsim/schemas';
import { getPurchasableUpgradeDefinitions, getUpgradeOffer } from '@psychsim/engine';

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
  onSaveTicketReview: (ticketId: string, reviewerNotes: string) => Promise<void>;
  onWriteTickets: () => void;
  onExportTickets: () => void;
  ticketToolStatus: string | null;
  onPurchaseUpgrade: (upgradeId: string) => void;
  upgradeStatus: string | null;
}

const TIER_LABELS: Record<ClinicState['facilityTier'], string> = {
  solo_office: 'Tier 1 · Solo Psychiatric Office',
  outpatient_clinic: 'Tier 2 · Outpatient Psychiatric Clinic',
  multidisciplinary_center: 'Tier 3 · Multidisciplinary Behavioral-Health Center',
  psychopharmacology_center: 'Tier 4 · Specialty Psychopharmacology Center',
  psychiatric_hospital: 'Tier 5 · Psychiatric Hospital',
  integrated_medical_center: 'Tier 6 · Integrated Psychiatric-Medical Center',
  behavioral_health_system: 'Tier 7 · Behavioral-Health System',
};

const tierLabel = (clinic: ClinicState): string => TIER_LABELS[clinic.facilityTier];

const MODE_LABELS: ReadonlyArray<{ id: ProgressionMode; label: string }> = [
  { id: 'standard', label: 'Normal' },
  { id: 'endgame', label: 'Endgame' },
  { id: 'developer', label: 'Developer' },
];

const ticketPriority = { blocking: 0, high: 1, medium: 2, low: 3 } as const;

interface TicketReviewCardProps {
  ticket: ClinicalReviewTicket;
  onSave: ClinicHubProps['onSaveTicketReview'];
}

function TicketReviewCard({ ticket, onSave }: TicketReviewCardProps) {
  const [reviewerNotes, setReviewerNotes] = useState(ticket.reviewerNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReviewerNotes(ticket.reviewerNotes);
  }, [ticket.id, ticket.reviewerNotes]);

  const dirty = reviewerNotes !== ticket.reviewerNotes;
  const saveReview = async (): Promise<void> => {
    setSaving(true);
    try {
      await onSave(ticket.id, reviewerNotes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="ticket-card">
      <div>
        <strong>{ticket.title}</strong>
        <small>
          {ticket.ticketType.replaceAll('_', ' ')} · {ticket.priority} ·{' '}
          {ticket.requiresClinicalAcumen ? 'clinical review' : 'technical review'}
        </small>
        <p>{ticket.guidance}</p>
        <details className="ticket-context">
          <summary>Targets and review routing</summary>
          <dl>
            <div>
              <dt>Source</dt>
              <dd>
                {ticket.sourceKind.replaceAll('_', ' ')} ·{' '}
                {ticket.sourceAuthority.replaceAll('_', ' ')}
              </dd>
            </div>
            <div>
              <dt>Proposed routing</dt>
              <dd>{ticket.proposedRouting}</dd>
            </div>
            <div>
              <dt>Target IDs</dt>
              <dd>{ticket.targetContentIds.join(', ') || 'None'}</dd>
            </div>
            <div>
              <dt>Dependencies</dt>
              <dd>{ticket.dependencyTicketIds.join(', ') || 'None'}</dd>
            </div>
            <div>
              <dt>Conflicts</dt>
              <dd>{ticket.conflictContentIds.join(', ') || 'None'}</dd>
            </div>
            {ticket.resurfacingTrigger ? (
              <div>
                <dt>Resurface when</dt>
                <dd>{ticket.resurfacingTrigger}</dd>
              </div>
            ) : null}
          </dl>
        </details>
      </div>
      <div className="ticket-review-fields">
        <label htmlFor={`ticket-reviewer-notes-${ticket.id}`}>What should Codex do?</label>
        <textarea
          id={`ticket-reviewer-notes-${ticket.id}`}
          value={reviewerNotes}
          rows={6}
          maxLength={8000}
          placeholder="Describe what should change, what should stay, and any reasoning Codex should preserve."
          onChange={(event) => setReviewerNotes(event.target.value)}
        />
        <small>
          Codex will infer the intended action from your instructions and ask only if an important
          choice remains ambiguous.
        </small>
        <button
          className="secondary-button"
          type="button"
          disabled={!dirty || saving}
          onClick={() => void saveReview()}
        >
          {saving
            ? 'Saving…'
            : dirty
              ? reviewerNotes.trim()
                ? 'Save instructions'
                : 'Clear saved instructions'
              : 'Instructions saved'}
        </button>
      </div>
    </article>
  );
}

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
  onSaveTicketReview,
  onWriteTickets,
  onExportTickets,
  ticketToolStatus,
  onPurchaseUpgrade,
  upgradeStatus,
}: ClinicHubProps) {
  const { clinic, progressionMode } = saveData.profile;
  const latestAttempt = saveData.attempts.at(-1);
  const reviewTickets = [...saveData.clinicalTickets]
    .filter((ticket) => ticket.status !== 'resolved')
    .sort(
      (left, right) =>
        Number(right.requiresClinicalAcumen) - Number(left.requiresClinicalAcumen) ||
        ticketPriority[left.priority] - ticketPriority[right.priority] ||
        left.createdAt.localeCompare(right.createdAt),
    );
  const ticketsNeedingInput = reviewTickets.filter((ticket) => !ticket.reviewerNotes.trim());
  const reviewedTickets = reviewTickets.filter((ticket) => ticket.reviewerNotes.trim());
  const currentFacility = catalogs.facilities.find((facility) => facility.id === clinic.facilityId);
  const upgradeOffers = getPurchasableUpgradeDefinitions(catalogs)
    .filter(
      (upgrade) =>
        currentFacility?.allowedUpgradeIds.includes(upgrade.id) ||
        clinic.ownedUpgradeIds.includes(upgrade.id),
    )
    .flatMap((upgrade) => {
      const offer = getUpgradeOffer(clinic, upgrade.id, catalogs);
      return offer.ok ? [offer.value] : [];
    });
  const activeFormularyLabels = catalogs.formularies
    .filter((formulary) => clinicState.formularyIds.includes(formulary.id))
    .map((formulary) => formulary.label);
  const progressionFacilities = catalogs.facilities
    .filter((facility) => facility.tier !== 'behavioral_health_system')
    .sort((left, right) => left.minimumLifetimePoints - right.minimumLifetimePoints);
  const nextFacility = progressionFacilities.find(
    (facility) => facility.minimumLifetimePoints > (currentFacility?.minimumLifetimePoints ?? 0),
  );
  const hasPlant = clinicState.ownedUpgradeIds.includes('decor.plant.pothos');
  const hasArt = clinicState.ownedUpgradeIds.includes('decor.art.abstract-print');
  const hasWarmLighting = clinicState.ownedUpgradeIds.includes('decor.lighting.warm-lamps');

  return (
    <main className="hub-shell" id="main-content">
      <section className="clinic-banner" aria-labelledby="clinic-title">
        <div>
          <p className="eyebrow">{tierLabel(clinicState)}</p>
          <h1 id="clinic-title">{clinicState.label}</h1>
          <p className="banner-copy">
            {progressionMode === 'standard'
              ? clinic.facilityTier === 'solo_office'
                ? 'One room, a starter formulary, and a waiting patient.'
                : `${currentFacility?.patientSlotCount ?? 1} persistent patient slots with every earlier purchase preserved.`
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
          <div>
            <dt>Ambience</dt>
            <dd>{clinicState.satisfactionMultiplier.toFixed(3)}×</dd>
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
          <div
            className={`office-illustration${hasArt ? ' has-art' : ''}${hasWarmLighting ? ' warm-lighting' : ''}`}
            aria-hidden="true"
          >
            {hasPlant ? <span className="plant">♧</span> : null}
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
          {progressionMode === 'standard' && nextFacility ? (
            <div className="facility-progress">
              <span>Next facility eligibility</span>
              <strong>{nextFacility.label}</strong>
              <progress
                max={nextFacility.minimumLifetimePoints}
                value={Math.min(clinic.lifetimePointsEarned, nextFacility.minimumLifetimePoints)}
              />
              <small>
                {clinic.lifetimePointsEarned.toLocaleString()} /{' '}
                {nextFacility.minimumLifetimePoints.toLocaleString()} lifetime points. Eligibility
                still requires a separate purchase.
              </small>
            </div>
          ) : null}
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
                      <dt>Lifetime required</dt>
                      <dd>{offer.upgrade.minimumLifetimePoints.toLocaleString()} pts</dd>
                    </div>
                    {offer.targetFacility ? (
                      <div>
                        <dt>Moves clinic to</dt>
                        <dd>
                          {offer.targetFacility.label} · {offer.targetFacility.patientSlotCount}{' '}
                          patient slots
                        </dd>
                      </div>
                    ) : null}
                    {offer.satisfactionPreview ? (
                      <>
                        <div>
                          <dt>Ambience</dt>
                          <dd>+{offer.satisfactionPreview.pointsAdded} satisfaction</dd>
                        </div>
                        <div>
                          <dt>Reward multiplier</dt>
                          <dd>
                            {offer.satisfactionPreview.multiplierBefore.toFixed(3)}× →{' '}
                            {offer.satisfactionPreview.multiplierAfter.toFixed(3)}× (cap{' '}
                            {offer.satisfactionPreview.multiplierCap.toFixed(2)}×)
                          </dd>
                        </div>
                      </>
                    ) : null}
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
              <span className="count-badge" aria-label={`${ticketsNeedingInput.length} need input`}>
                {ticketsNeedingInput.length} need input
              </span>
              <button
                className="small-button"
                type="button"
                disabled={saveData.clinicalTickets.length === 0}
                onClick={onWriteTickets}
              >
                Update Codex handoff file
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
          <p className="ticket-handoff-explanation">
            Describe the outcome you want; there is no separate status decision. Saving updates this
            browser’s local database and the fixed, gitignored Codex handoff file. Codex will
            interpret your instructions, ask if necessary, and make no clinical rule changes until
            processing the reviewed ticket. Use “Update Codex handoff file” to refresh or retry the
            copy, then tell Codex your review is ready.
          </p>
          {ticketToolStatus ? (
            <p className="ticket-tool-status" role="status">
              {ticketToolStatus}
            </p>
          ) : null}
          {reviewTickets.length === 0 ? (
            <p className="no-results">No open local review tickets.</p>
          ) : (
            <>
              {ticketsNeedingInput.length === 0 ? (
                <p className="review-complete-message">
                  Every open ticket has saved instructions. Tell Codex the local review is ready.
                </p>
              ) : (
                <div className="ticket-list">
                  {ticketsNeedingInput.map((ticket) => (
                    <TicketReviewCard key={ticket.id} ticket={ticket} onSave={onSaveTicketReview} />
                  ))}
                </div>
              )}
              {reviewedTickets.length > 0 ? (
                <details className="reviewed-ticket-group">
                  <summary>Reviewed locally · {reviewedTickets.length}</summary>
                  <div className="ticket-list">
                    {reviewedTickets.map((ticket) => (
                      <TicketReviewCard
                        key={ticket.id}
                        ticket={ticket}
                        onSave={onSaveTicketReview}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </>
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
