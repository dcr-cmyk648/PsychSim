import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';

import type {
  CaseInstance,
  CatalogBundle,
  ClinicalReviewTicket,
  ClinicState,
  LiteratureSynthesisProposal,
  ProgressionMode,
  SaveData,
  SourceRequest,
  TicketLiteratureScoutCatalog,
  UpgradeDefinition,
} from '@psychsim/schemas';
import type { CaseRuleAudit, DeveloperOpinionReferenceNeed } from '@psychsim/content-runtime';
import { getPurchasableUpgradeDefinitions, getUpgradeOffer } from '@psychsim/engine';

import { CaseRuleAuditView } from './CaseRuleAuditView';
import { DeveloperOpinionQueue } from './DeveloperOpinionQueue';
import { LazyDisclosure } from './LazyDisclosure';
import { LiteratureSynthesisProposalView } from './LiteratureSynthesisProposalView';
import { SourceRequestQueue } from './SourceRequestQueue';
import { TicketLiteratureScoutView } from './TicketLiteratureScoutView';

const SourceReviewSnapshotView = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import('./SourceReviewSnapshotView');
      return { default: module.SourceReviewSnapshotView };
    })
  : null;

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
  reviewerBuild?: boolean;
  caseRuleAudits: readonly CaseRuleAudit[];
  opinionReferenceNeeds: readonly DeveloperOpinionReferenceNeed[];
  sourceRequests: readonly SourceRequest[];
  literatureSynthesisProposals?: readonly LiteratureSynthesisProposal[];
  ticketLiteratureScoutCatalog?: TicketLiteratureScoutCatalog | null;
  developerKnowledgeWorkbench?: ReactNode;
  sourceReviewFeedHealthy?: boolean;
  onStart: (slotId: string) => void;
  onOpenDatabase?: () => void;
  onOpenSavedAttempt?: (attemptId: string) => void;
  onSetMode: (mode: ProgressionMode) => void;
  onRefresh: () => void;
  onRerollDeveloper: (slotId: string) => void;
  onResetDeveloper: () => void;
  onSaveTicketReview: (ticketId: string, reviewerNotes: string) => Promise<void>;
  onWriteTickets: () => void;
  onExportTickets: () => void;
  ticketToolStatus: string | null;
  onPurchaseUpgrade: (upgradeId: string) => void;
  onConfigureStaffAutomation?: (staffUpgradeId: string, actionIds: readonly string[]) => void;
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
const reviewProvenanceLabel = (casePreview: CaseInstance, catalogs: CatalogBundle): string => {
  const labels = [
    ...new Set(
      casePreview.metadata.evidenceSourceIds.flatMap((id) => {
        const source = catalogs.evidenceSources.find((candidate) => candidate.id === id);
        return source ? [source.organization ?? source.title] : [];
      }),
    ),
  ];
  return labels.length > 0 ? labels.join(' · ') : 'No formal source linked';
};

const MODE_LABELS: ReadonlyArray<{ id: ProgressionMode; label: string }> = [
  { id: 'standard', label: 'Normal' },
  { id: 'endgame', label: 'Endgame' },
  { id: 'developer', label: 'Developer' },
];

const ticketPriority = { blocking: 0, high: 1, medium: 2, low: 3 } as const;

interface TicketReviewCardProps {
  ticket: ClinicalReviewTicket;
  caseRuleAudit: CaseRuleAudit | null;
  literatureSynthesisProposal: LiteratureSynthesisProposal | null;
  ticketLiteratureScoutCatalog: TicketLiteratureScoutCatalog | null;
  onSave: ClinicHubProps['onSaveTicketReview'];
  onAdvance?: () => void;
  advanceLabel?: string;
  positionLabel?: string;
  readOnlyReason?: string;
}

function TicketReviewCard({
  ticket,
  caseRuleAudit,
  literatureSynthesisProposal,
  ticketLiteratureScoutCatalog,
  onSave,
  onAdvance,
  advanceLabel = 'Save and go to next decision',
  positionLabel = 'Focused decision',
  readOnlyReason,
}: TicketReviewCardProps) {
  const [reviewerNotes, setReviewerNotes] = useState(ticket.reviewerNotes);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setReviewerNotes(ticket.reviewerNotes);
    setSaveMessage(null);
  }, [ticket.id, ticket.reviewerNotes]);

  const dirty = reviewerNotes !== ticket.reviewerNotes;
  const saveReview = async (): Promise<boolean> => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await onSave(ticket.id, reviewerNotes);
      setSaveMessage('Saved in this browser.');
      return true;
    } catch (caught) {
      setSaveMessage(
        caught instanceof Error ? `Could not save: ${caught.message}` : 'Could not save response.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  const saveAndAdvance = async (): Promise<void> => {
    if (!reviewerNotes.trim() || !onAdvance) return;
    if (dirty && !(await saveReview())) return;
    onAdvance();
  };
  const sourceReviewSnapshot = ticket.sourceReviewSnapshot;
  const cleanAdvanceLabel = advanceLabel
    .replace('Save and go', 'Go')
    .replace('Save and finish', 'Finish');

  return (
    <article
      className="ticket-card focused-review-card"
      aria-labelledby={`focused-ticket-title-${ticket.id}`}
    >
      <header className="focused-review-header">
        <div>
          <p className="eyebrow">{positionLabel}</p>
          <h3 id={`focused-ticket-title-${ticket.id}`} tabIndex={-1}>
            {ticket.title}
          </h3>
          <p>
            {caseRuleAudit ? `${caseRuleAudit.caseLabel} · ` : ''}
            {ticket.ticketType.replaceAll('_', ' ')} · {ticket.priority} ·{' '}
            {ticket.requiresClinicalAcumen ? 'clinical review' : 'technical review'}
          </p>
        </div>
        <span className="source-status">
          {readOnlyReason
            ? 'Quarantined'
            : ticket.reviewerNotes.trim()
              ? 'Response saved'
              : 'Response needed'}
        </span>
      </header>
      <div className="focused-review-body">
        <section className="decision-brief" aria-labelledby={`decision-brief-${ticket.id}`}>
          <h4>Decision needed</h4>
          <p id={`decision-brief-${ticket.id}`} className="decision-primary-question">
            {ticket.guidance}
          </p>
          <h4>Proposed direction</h4>
          <p>{literatureSynthesisProposal?.proposedDirection ?? ticket.proposedRouting}</p>
          {literatureSynthesisProposal ? (
            <div className="decision-evidence-summary">
              <div>
                <strong>What supports it</strong>
                <p>{literatureSynthesisProposal.supportingSummary}</p>
              </div>
              <div>
                <strong>What qualifies it</strong>
                <p>{literatureSynthesisProposal.opposingOrQualifyingSummary}</p>
              </div>
            </div>
          ) : null}
          {sourceReviewSnapshot ? (
            <div className="decision-source-summary">
              <strong>Imported source proposal</strong>
              <p>{sourceReviewSnapshot.originalSummary}</p>
              <ul>
                {sourceReviewSnapshot.atomicProposals.map((proposal) => (
                  <li key={proposal.id}>{proposal.summary}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {caseRuleAudit ? (
            <dl className="developer-question-context">
              <div>
                <dt>Linked patient</dt>
                <dd>
                  {caseRuleAudit.caseLabel} · case version {caseRuleAudit.contentVersion}
                </dd>
              </div>
              <div>
                <dt>Current database plan</dt>
                <dd>
                  {caseRuleAudit.databasePlan.carePoints} care points ·{' '}
                  {caseRuleAudit.databasePlan.workupCostPar} investigation points
                </dd>
              </div>
            </dl>
          ) : (
            <p className="audit-disclaimer">
              Cross-cutting question: no focused patient is linked yet.
            </p>
          )}
        </section>
        <div className="ticket-review-fields">
          {readOnlyReason ? (
            <p className="ticket-tool-status" role="alert">
              {readOnlyReason}
            </p>
          ) : null}
          <label htmlFor={`workbench-ticket-reviewer-notes-${ticket.id}`}>
            Your response, judgment, or alternative references
          </label>
          <textarea
            id={`workbench-ticket-reviewer-notes-${ticket.id}`}
            aria-describedby={`decision-brief-${ticket.id}`}
            value={reviewerNotes}
            rows={8}
            maxLength={8000}
            placeholder="Agree, disagree, qualify the proposed direction, describe the desired change, or paste better references."
            disabled={Boolean(readOnlyReason)}
            onChange={(event) => {
              setReviewerNotes(event.target.value);
              setSaveMessage(null);
            }}
          />
          <small>
            Codex will infer the intended action from your instructions and ask only if an important
            choice remains ambiguous. Saving does not alter a clinical rule.
          </small>
          <div className="focused-review-actions">
            <button
              className="secondary-button"
              type="button"
              disabled={Boolean(readOnlyReason) || !dirty || saving}
              onClick={() => void saveReview()}
            >
              {saving
                ? 'Saving…'
                : dirty
                  ? reviewerNotes.trim()
                    ? 'Save response'
                    : 'Clear saved response'
                  : 'Response saved'}
            </button>
            {onAdvance ? (
              <button
                className="primary-button"
                type="button"
                disabled={Boolean(readOnlyReason) || !reviewerNotes.trim() || saving}
                onClick={() => void saveAndAdvance()}
              >
                {saving ? 'Saving…' : dirty ? advanceLabel : cleanAdvanceLabel}
              </button>
            ) : null}
          </div>
          {saveMessage ? (
            <p className="ticket-tool-status" role="status">
              {saveMessage}
            </p>
          ) : null}
        </div>
        <LazyDisclosure
          className="focused-review-audit"
          summary="Related material, references, and exact audit"
        >
          {() => (
            <div className="focused-review-audit-body">
              {sourceReviewSnapshot && SourceReviewSnapshotView ? (
                <Suspense
                  fallback={<p className="audit-disclaimer">Loading local source packet…</p>}
                >
                  <SourceReviewSnapshotView snapshot={sourceReviewSnapshot} />
                </Suspense>
              ) : null}
              {caseRuleAudit ? (
                <CaseRuleAuditView
                  audit={caseRuleAudit}
                  targetContentIds={ticket.targetContentIds}
                />
              ) : null}
              {literatureSynthesisProposal ? (
                <LiteratureSynthesisProposalView proposal={literatureSynthesisProposal} />
              ) : null}
              {ticketLiteratureScoutCatalog ? (
                <TicketLiteratureScoutView
                  catalog={ticketLiteratureScoutCatalog}
                  ticketId={ticket.id}
                />
              ) : null}
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
          )}
        </LazyDisclosure>
      </div>
    </article>
  );
}

function StaffAutomationEditor({
  clinic,
  catalogs,
  upgrade,
  onConfigure,
}: {
  clinic: ClinicState;
  catalogs: CatalogBundle;
  upgrade: UpgradeDefinition;
  onConfigure: NonNullable<ClinicHubProps['onConfigureStaffAutomation']>;
}) {
  const automation = upgrade.staffAutomation;
  if (!automation) return null;
  const configuration = clinic.staffConfigurations.find(
    (candidate) => candidate.staffUpgradeId === upgrade.id,
  );
  const selectedIds = configuration?.automaticInformationActionIds ?? [];
  return (
    <fieldset className="staff-automation-editor">
      <legend>Automatic routine intake</legend>
      <p>
        Choose up to {automation.maximumAutomaticActions}. These results appear when a patient
        opens. Each still costs points, at the delegated rate shown.
      </p>
      <div className="staff-automation-options">
        {automation.eligibleInformationActionIds.map((actionId) => {
          const action = catalogs.informationActions.find((candidate) => candidate.id === actionId);
          const service = action
            ? catalogs.services.find((candidate) => candidate.id === action.serviceId)
            : undefined;
          const ordinaryCost = service?.fulfillmentMethods
            .filter((method) => method.requiredStaffUpgradeId === undefined)
            .reduce<
              number | null
            >((lowest, method) => (lowest === null ? method.operatingCost : Math.min(lowest, method.operatingCost)), null);
          const delegatedCost = service?.fulfillmentMethods.find(
            (method) => method.requiredStaffUpgradeId === upgrade.id,
          )?.operatingCost;
          const selected = selectedIds.includes(actionId);
          const atLimit = !selected && selectedIds.length >= automation.maximumAutomaticActions;
          return (
            <label key={actionId}>
              <input
                type="checkbox"
                checked={selected}
                disabled={atLimit}
                onChange={() =>
                  onConfigure(
                    upgrade.id,
                    selected
                      ? selectedIds.filter((id) => id !== actionId)
                      : [...selectedIds, actionId],
                  )
                }
              />
              <span>
                <b>{action?.label ?? actionId}</b>
                <small>
                  {ordinaryCost ?? '—'} → {delegatedCost ?? '—'} pts per patient
                </small>
              </span>
            </label>
          );
        })}
      </div>
      <small>
        {selectedIds.length} / {automation.maximumAutomaticActions} selected · changing this affects
        future encounters only.
      </small>
    </fieldset>
  );
}

export function ClinicHub({
  saveData,
  clinicState,
  catalogs,
  patientSlots,
  developerModeAvailable,
  reviewerBuild = false,
  caseRuleAudits,
  opinionReferenceNeeds,
  sourceRequests,
  literatureSynthesisProposals = [],
  ticketLiteratureScoutCatalog = null,
  developerKnowledgeWorkbench = null,
  sourceReviewFeedHealthy = true,
  onStart,
  onOpenDatabase = () => undefined,
  onOpenSavedAttempt = () => undefined,
  onSetMode,
  onRefresh,
  onRerollDeveloper,
  onResetDeveloper,
  onSaveTicketReview,
  onWriteTickets,
  onExportTickets,
  ticketToolStatus,
  onPurchaseUpgrade,
  onConfigureStaffAutomation = () => undefined,
  upgradeStatus,
}: ClinicHubProps) {
  const { clinic, progressionMode } = saveData.profile;
  const [focusedTicketId, setFocusedTicketId] = useState<string | null>(null);
  const latestAttempt = saveData.attempts.at(-1);
  const reviewedAttemptIds = new Set(saveData.attemptReviews.map((review) => review.attemptId));
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
  const focusedTicket = focusedTicketId
    ? (reviewTickets.find((ticket) => ticket.id === focusedTicketId) ?? null)
    : (ticketsNeedingInput[0] ?? null);
  const focusedPendingIndex = focusedTicket
    ? ticketsNeedingInput.findIndex((ticket) => ticket.id === focusedTicket.id)
    : -1;
  const caseRuleAuditByBlueprintId = new Map(
    caseRuleAudits.map((audit) => [audit.blueprintId, audit]),
  );
  const synthesisByTicketId = new Map(
    literatureSynthesisProposals.flatMap((proposal) =>
      proposal.linkedTicketIds.map((ticketId) => [ticketId, proposal] as const),
    ),
  );
  const localTicketLiteratureScoutCatalog =
    progressionMode === 'developer' && !reviewerBuild ? ticketLiteratureScoutCatalog : null;
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

  useEffect(() => {
    if (!focusedTicketId) return;
    if (!reviewTickets.some((ticket) => ticket.id === focusedTicketId)) {
      setFocusedTicketId(null);
    }
  }, [focusedTicketId, reviewTickets]);

  useEffect(() => {
    if (!focusedTicketId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`focused-ticket-title-${focusedTicketId}`)?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusedTicketId]);

  const advanceFromTicket = (ticketId: string): void => {
    const nextTicket = ticketsNeedingInput.find((ticket) => ticket.id !== ticketId) ?? null;
    setFocusedTicketId(nextTicket?.id ?? null);
  };
  const patientQueueBody = (
    <>
      {progressionMode === 'developer' ? (
        <div className="patient-queue-open-tools">
          <p>
            Open one patient at a time. Completed patient definitions leave this queue until the
            review run is reset.
          </p>
          <button className="small-button" type="button" onClick={onRefresh}>
            Refresh slots
          </button>
        </div>
      ) : null}
      {patientSlots.length > 0 ? (
        <div className="patient-slot-grid">
          {patientSlots.map((slot) => {
            const linkedTickets = reviewTickets.filter(
              (ticket) => ticket.blueprintId === slot.casePreview.blueprintId,
            );
            return (
              <article className="case-card" key={slot.id}>
                <div className="case-card-topline">
                  <span className="case-level">Patient</span>
                  <span className="status-chip">Waiting</span>
                </div>
                <p className="setting-label">
                  <span>Setting</span>
                  {slot.settingLabel}
                </p>
                {progressionMode === 'developer' && !reviewerBuild ? (
                  <p className="setting-label">
                    <span>Review provenance</span>
                    {reviewProvenanceLabel(slot.casePreview, catalogs)}
                  </p>
                ) : null}
                <h3>{slot.casePreview.opening.title}</h3>
                <p className="chief-complaint">
                  <span>Chief complaint</span>“{slot.casePreview.opening.chiefComplaint}”
                </p>
                {progressionMode === 'developer' && !reviewerBuild && linkedTickets.length > 0 ? (
                  <LazyDisclosure
                    className="patient-review-questions"
                    summary={`${linkedTickets.length} linked review question${
                      linkedTickets.length === 1 ? '' : 's'
                    }`}
                  >
                    {() => (
                      <ul>
                        {linkedTickets.map((ticket) => (
                          <li key={`${slot.id}.${ticket.id}`}>
                            <strong>{ticket.title}</strong>
                            <span>{ticket.guidance}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </LazyDisclosure>
                ) : null}
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
            );
          })}
        </div>
      ) : (
        <div className="empty-queue">
          <p>
            {reviewerBuild
              ? 'Every assigned patient definition has been run.'
              : progressionMode === 'developer'
                ? 'Every currently loaded patient definition has been run.'
                : 'No eligible patients are waiting.'}
          </p>
          {progressionMode === 'developer' ? (
            <button className="secondary-button" type="button" onClick={onResetDeveloper}>
              Reset {reviewerBuild ? 'reviewer' : 'developer'} run history
            </button>
          ) : null}
        </div>
      )}
    </>
  );

  return (
    <main className="hub-shell" id="main-content">
      <section className="clinic-banner" aria-labelledby="clinic-title">
        <div>
          <p className="eyebrow">{tierLabel(clinicState)}</p>
          <h1 id="clinic-title">{clinicState.label}</h1>
          <p className="banner-copy">
            {reviewerBuild
              ? 'Portable reviewer mode: complete assigned patients, save case or app-experience comments, then export one JSON bundle.'
              : progressionMode === 'standard'
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
          <span className="debug-label">{reviewerBuild ? 'PORTABLE REVIEW' : 'LOCAL MODE'}</span>
          <div className="mode-buttons" aria-label="Game mode">
            {reviewerBuild ? (
              <button className="secondary-button" type="button" aria-pressed="true">
                Reviewer
              </button>
            ) : (
              MODE_LABELS.filter((mode) => mode.id !== 'developer' || developerModeAvailable).map(
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
              )
            )}
          </div>
          <button
            id="database-launch-button"
            className="secondary-button database-launch-button"
            type="button"
            onClick={onOpenDatabase}
          >
            Database
          </button>
        </div>
      </section>

      <div className="hub-grid">
        {progressionMode === 'developer' ? (
          <LazyDisclosure
            className="patient-queue patient-queue-disclosure developer-major-disclosure"
            summary={
              <>
                <span>
                  <small>Available now</small>
                  <strong id="patient-queue-title">Patient queue</strong>
                </span>
                <span className="count-badge">{patientSlots.length} waiting</span>
              </>
            }
          >
            {() => <div className="patient-queue-body">{patientQueueBody}</div>}
          </LazyDisclosure>
        ) : (
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
            {patientQueueBody}
          </section>
        )}

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
                  {offer.owned && offer.upgrade.kind === 'staff' ? (
                    <StaffAutomationEditor
                      clinic={clinic}
                      catalogs={catalogs}
                      upgrade={offer.upgrade}
                      onConfigure={onConfigureStaffAutomation}
                    />
                  ) : null}
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

      {reviewerBuild && progressionMode === 'developer' ? (
        <section
          className="ticket-queue reviewer-export-panel"
          aria-labelledby="review-export-title"
        >
          <div className="queue-heading">
            <div>
              <p className="eyebrow">Portable review bundle</p>
              <h2 id="review-export-title">Export all saved feedback</h2>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={
                saveData.attemptReviews.length === 0 &&
                saveData.databaseEntryReviews.length === 0 &&
                saveData.flags.length === 0 &&
                saveData.clinicalTickets.every((ticket) => !ticket.reviewerNotes.trim())
              }
              onClick={onExportTickets}
            >
              Export all feedback
            </button>
          </div>
          <p className="ticket-handoff-explanation">
            Feedback is stored only in this browser on this device until you export it. One JSON
            file includes every saved case comment, database-entry comment and exact review-safe
            entry snapshot, the patient/options/choices/receipt/rule trace behind each case comment,
            plus all item flags and generated tickets. You can review multiple cases and database
            records before exporting and email the single file to the project owner.
          </p>
          <dl className="review-export-counts">
            <div>
              <dt>Completed cases</dt>
              <dd>{saveData.attempts.length}</dd>
            </div>
            <div>
              <dt>Saved case comments</dt>
              <dd>{saveData.attemptReviews.length}</dd>
            </div>
            <div>
              <dt>Database comments</dt>
              <dd>{saveData.databaseEntryReviews.length}</dd>
            </div>
            <div>
              <dt>Item flags</dt>
              <dd>{saveData.flags.length}</dd>
            </div>
            <div>
              <dt>Ticket responses</dt>
              <dd>
                {saveData.clinicalTickets.filter((ticket) => ticket.reviewerNotes.trim()).length} /{' '}
                {saveData.clinicalTickets.length}
              </dd>
            </div>
          </dl>
          {saveData.attempts.length > 0 ? (
            <details
              className="reviewer-attempt-list"
              open={saveData.attempts.some((attempt) => !reviewedAttemptIds.has(attempt.id))}
            >
              <summary>Open a completed case receipt</summary>
              <ul>
                {saveData.attempts.map((attempt) => {
                  const hasComment = reviewedAttemptIds.has(attempt.id);
                  return (
                    <li key={attempt.id}>
                      <div>
                        <strong>{attempt.caseInstance.opening.title}</strong>
                        <small>
                          “{attempt.caseInstance.opening.chiefComplaint}” ·{' '}
                          {hasComment ? 'Comment saved' : 'Needs comment'}
                        </small>
                      </div>
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => onOpenSavedAttempt(attempt.id)}
                      >
                        {hasComment ? 'Edit feedback' : 'Add feedback'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}
          {ticketToolStatus ? (
            <p className="ticket-tool-status" role="status">
              {ticketToolStatus}
            </p>
          ) : null}
        </section>
      ) : null}

      {progressionMode === 'developer' && !reviewerBuild ? developerKnowledgeWorkbench : null}

      {progressionMode === 'developer' && !reviewerBuild ? (
        <DeveloperOpinionQueue entries={opinionReferenceNeeds} />
      ) : null}

      {progressionMode === 'developer' && !reviewerBuild ? (
        <SourceRequestQueue
          requests={sourceRequests}
          tickets={saveData.clinicalTickets}
          caseRuleAudits={caseRuleAudits}
        />
      ) : null}

      {progressionMode === 'developer' ? (
        <LazyDisclosure
          className="ticket-queue developer-major-disclosure"
          summary={
            <>
              <span>
                <small>
                  {reviewerBuild ? 'Assigned review questions' : 'Proposed changes only'}
                </small>
                <strong id="ticket-queue-title">
                  {reviewerBuild ? 'Review tickets' : 'Clinical and content tickets'}
                </strong>
              </span>
              <span className="count-badge" aria-label={`${ticketsNeedingInput.length} need input`}>
                {ticketsNeedingInput.length} need input
              </span>
            </>
          }
        >
          {() => (
            <div className="developer-disclosure-body">
              <div className="queue-heading developer-queue-tools">
                <p>
                  {reviewerBuild
                    ? 'Open one assigned question at a time. Each ticket is linked to a playable patient and includes the current database plan.'
                    : 'Open one decision packet at a time. Patient-linked questions include the current executable values and can be reviewed against a playthrough.'}
                </p>
                <div className="queue-tools">
                  {!reviewerBuild ? (
                    <button
                      className="small-button"
                      type="button"
                      disabled={saveData.clinicalTickets.length === 0}
                      onClick={onWriteTickets}
                    >
                      Update Codex handoff file
                    </button>
                  ) : null}
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
                {reviewerBuild
                  ? 'Describe the outcome you want; there is no separate status decision. Responses remain in this browser until you export the review bundle. Saving never changes a clinical rule.'
                  : 'Describe the outcome you want; there is no separate status decision. Saving updates this browser’s local database and the fixed, gitignored Codex handoff file. Codex will interpret your instructions, ask if necessary, and make no clinical rule changes until processing the reviewed ticket. Use “Update Codex handoff file” to refresh or retry the copy, then tell Codex your review is ready.'}
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
                      {reviewerBuild
                        ? 'Every assigned ticket has a saved response. Export the review bundle when you are ready to send it.'
                        : 'Every open ticket has saved instructions. Tell Codex the local review is ready.'}
                    </p>
                  ) : null}
                  {focusedTicket ? (
                    <div className="focused-review-workbench">
                      <TicketReviewCard
                        key={focusedTicket.id}
                        ticket={focusedTicket}
                        caseRuleAudit={
                          focusedTicket.blueprintId
                            ? (caseRuleAuditByBlueprintId.get(focusedTicket.blueprintId) ?? null)
                            : null
                        }
                        literatureSynthesisProposal={
                          reviewerBuild ? null : (synthesisByTicketId.get(focusedTicket.id) ?? null)
                        }
                        ticketLiteratureScoutCatalog={
                          reviewerBuild ? null : localTicketLiteratureScoutCatalog
                        }
                        onSave={onSaveTicketReview}
                        onAdvance={() => advanceFromTicket(focusedTicket.id)}
                        advanceLabel={
                          ticketsNeedingInput.some((ticket) => ticket.id !== focusedTicket.id)
                            ? 'Save and go to next decision'
                            : 'Save and finish decision queue'
                        }
                        positionLabel={
                          focusedPendingIndex >= 0
                            ? `Decision ${focusedPendingIndex + 1} of ${ticketsNeedingInput.length}`
                            : 'Reviewed decision'
                        }
                        readOnlyReason={
                          focusedTicket.sourceReviewSnapshot && !sourceReviewFeedHealthy
                            ? 'This cached source packet is read-only because its private locator is currently quarantined. Repair and revalidate the local source feed before adding a response.'
                            : undefined
                        }
                      />
                    </div>
                  ) : null}
                  {reviewedTickets.length > 0 ? (
                    <LazyDisclosure
                      className="reviewed-ticket-group"
                      summary={`Reviewed decision history · ${reviewedTickets.length}`}
                    >
                      {() => (
                        <ul className="reviewed-decision-list">
                          {reviewedTickets.map((ticket) => (
                            <li key={ticket.id}>
                              <button
                                className="text-button"
                                type="button"
                                aria-pressed={focusedTicket?.id === ticket.id}
                                onClick={() => setFocusedTicketId(ticket.id)}
                              >
                                <strong>{ticket.title}</strong>
                                <small>Edit saved response</small>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </LazyDisclosure>
                  ) : null}
                  {focusedTicket && focusedPendingIndex < 0 && ticketsNeedingInput.length > 0 ? (
                    <button
                      className="small-button return-to-pending-button"
                      type="button"
                      onClick={() => setFocusedTicketId(ticketsNeedingInput[0]!.id)}
                    >
                      Return to next unanswered decision
                    </button>
                  ) : null}
                </>
              )}
            </div>
          )}
        </LazyDisclosure>
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
