import { useEffect, useState } from 'react';
import type { ClinicalReviewTicket, CompletedAttempt, ContentFlag } from '@psychsim/schemas';

import type {
  AuditedPlayerPlan,
  AuditedReferenceTreatmentSelections,
  CompletedAuditedReferenceRun,
  ReferenceSolutionAudit,
} from '../reference-audit';
import { LazyDisclosure } from './LazyDisclosure';

interface FlagDraft {
  disputedItemId: string | null;
  issueCategory: ContentFlag['issueCategory'];
  requiresClinicalReview: boolean;
  note: string;
}

export interface GuidanceDraft {
  receiptItemId: string;
  ticketType: ClinicalReviewTicket['ticketType'];
  requiresClinicalAcumen: boolean;
  guidance: string;
  resurfacingTrigger: string;
}

interface ReceiptViewProps {
  attempt: CompletedAttempt;
  developerToolsEnabled: boolean;
  developerCaseReviewEnabled: boolean;
  referenceSolutionAudit: ReferenceSolutionAudit | null;
  initialDeveloperReviewNote: string;
  portableReviewerBuild?: boolean;
  reviewExportAvailable?: boolean;
  linkedReviewTickets?: readonly ClinicalReviewTicket[];
  onBackToClinic: () => void;
  onReplay: () => void;
  onExportReviews?: () => void;
  onFlag: (draft: FlagDraft) => Promise<void>;
  onSaveGuidance: (draft: GuidanceDraft) => Promise<void>;
  onSaveDeveloperReview: (reviewerNote: string) => Promise<boolean>;
  onSaveLinkedTicketReview?: (ticketId: string, reviewerNotes: string) => Promise<void>;
}

const displayLabel = (value: string): string => value.replaceAll('_', ' ');
const signed = (value: number): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}`;

type ComparablePlan = Pick<
  AuditedPlayerPlan | CompletedAuditedReferenceRun,
  | 'informationActions'
  | 'selections'
  | 'carePoints'
  | 'workupExpense'
  | 'treatmentExpense'
  | 'operatingExpense'
  | 'netPayout'
>;

const TREATMENT_GROUPS: ReadonlyArray<{
  label: string;
  key: keyof Pick<
    AuditedReferenceTreatmentSelections,
    'startMedications' | 'stopMedications' | 'continueMedications' | 'interventions'
  >;
}> = [
  { label: 'Start', key: 'startMedications' },
  { label: 'Stop', key: 'stopMedications' },
  { label: 'Continue', key: 'continueMedications' },
  { label: 'Nonmedication', key: 'interventions' },
];

export function ScoreComparisonBar({
  playerScore,
  databaseScore,
}: {
  playerScore: number;
  databaseScore: number;
}) {
  const scaleMaximum = Math.max(1, playerScore, databaseScore);
  const playerFill = Math.max(0, Math.min(100, (playerScore / scaleMaximum) * 100));
  const databaseMarker = Math.max(0, Math.min(100, (databaseScore / scaleMaximum) * 100));
  const markerEdge =
    databaseMarker >= 92 ? ' marker-right' : databaseMarker <= 8 ? ' marker-left' : '';
  const difference = playerScore - databaseScore;
  return (
    <section className="score-comparison-panel" aria-labelledby="score-comparison-title">
      <div className="panel-heading-row">
        <div>
          <p className="panel-kicker">Care-point comparison</p>
          <h2 id="score-comparison-title" tabIndex={-1}>
            Your care points
          </h2>
        </div>
      </div>
      <div className="score-bar-labels" aria-hidden="true">
        <span>0 pts</span>
        <span>Bar maximum · {scaleMaximum.toLocaleString()} pts</span>
      </div>
      <div
        className={`score-comparison-bar${playerScore < 0 ? ' negative-score' : ''}`}
        role="meter"
        aria-label="Player care points compared with the database plan"
        aria-valuemin={0}
        aria-valuemax={scaleMaximum}
        aria-valuenow={Math.max(0, Math.min(playerScore, scaleMaximum))}
        aria-valuetext={`${playerScore} player care points; ${databaseScore} database-plan care points`}
      >
        <span className="score-player-fill" style={{ width: `${playerFill}%` }} />
        <span
          className={`score-database-marker${markerEdge}`}
          style={{ left: `${databaseMarker}%` }}
        >
          <span>DB plan {databaseScore.toLocaleString()}</span>
        </span>
      </div>
      <div className="score-comparison-legend">
        <span>
          <i className="player-score-key" aria-hidden="true" />
          Your care points: <b>{playerScore.toLocaleString()}</b>
        </span>
        <span>
          <i className="database-score-key" aria-hidden="true" />
          Database plan: <b>{databaseScore.toLocaleString()}</b>
        </span>
      </div>
      {playerScore > databaseScore || playerScore < 0 ? (
        <p className="score-comparison-note">
          {playerScore > databaseScore
            ? `Above database plan by ${difference.toLocaleString()} points. The bar expands to your score and marks the database value inside it.`
            : `Signed score: ${signed(playerScore)} points. Negative totals keep zero visual fill and remain explicit here.`}
        </p>
      ) : null}
    </section>
  );
}

function PlanCard({
  title,
  kicker,
  plan,
}: {
  title: string;
  kicker: string;
  plan: ComparablePlan;
}) {
  return (
    <article className="plan-comparison-card">
      <header>
        <div>
          <p className="panel-kicker">{kicker}</p>
          <h3>{title}</h3>
        </div>
        <strong>{plan.carePoints.toLocaleString()} care pts</strong>
      </header>
      <dl className="plan-comparison-metrics">
        <div>
          <dt>Investigations</dt>
          <dd>{plan.workupExpense.toLocaleString()} pts</dd>
        </div>
        <div>
          <dt>Treatment services</dt>
          <dd>{plan.treatmentExpense.toLocaleString()} pts</dd>
        </div>
        <div>
          <dt>Total operating cost</dt>
          <dd>{plan.operatingExpense.toLocaleString()} pts</dd>
        </div>
        <div>
          <dt>Payout</dt>
          <dd>{plan.netPayout.toLocaleString()} pts</dd>
        </div>
      </dl>
      <section>
        <h4>Information and tests</h4>
        {plan.informationActions.length > 0 ? (
          <ol>
            {plan.informationActions.map((action) => (
              <li key={action.id}>
                <span>{action.label}</span>
                <small>
                  {action.operatingCost} pts · {action.fulfillmentLabel}
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <p className="plan-none">None</p>
        )}
      </section>
      <section>
        <h4>Treatment and disposition</h4>
        <dl className="plan-treatment-list">
          {TREATMENT_GROUPS.map((group) => (
            <div key={group.key}>
              <dt>{group.label}</dt>
              <dd>
                {plan.selections[group.key].length > 0
                  ? plan.selections[group.key].map((selection) => selection.label).join(', ')
                  : 'None'}
              </dd>
            </div>
          ))}
          <div>
            <dt>Disposition</dt>
            <dd>{plan.selections.disposition?.label ?? 'None'}</dd>
          </div>
        </dl>
      </section>
    </article>
  );
}

type RuleTrace = CompletedAttempt['receipt']['pointReport']['ruleTrace'][number];
type TraceComponent = RuleTrace['component'];

const TRACE_COMPONENT_ORDER: readonly TraceComponent[] = [
  'workup',
  'medication_selection',
  'medication_discontinuation',
  'safety',
  'nonmedication',
  'disposition',
  'efficiency',
];

const TRACE_COMPONENT_LABELS: Record<TraceComponent, string> = {
  workup: 'Workup',
  medication_selection: 'Medication selection',
  medication_discontinuation: 'Medication changes',
  safety: 'Safety and interactions',
  nonmedication: 'Nonmedication treatment',
  disposition: 'Disposition',
  efficiency: 'Efficiency',
};

function TraceRuleDetails({
  trace,
  onFlag,
}: {
  trace: RuleTrace;
  onFlag: (ruleId: string) => void;
}) {
  const formalCount = trace.evidenceAttributions.filter(
    (attribution) => attribution.authority === 'formal_publication',
  ).length;
  const hasExpertOpinion = trace.evidenceAttributions.some(
    (attribution) => attribution.authority === 'expert_opinion',
  );
  const provenanceLabel =
    trace.evidenceAttributions.length === 0
      ? 'Provenance unavailable'
      : formalCount > 0 && hasExpertOpinion
        ? `${formalCount} ${formalCount === 1 ? 'source' : 'sources'} + opinion`
        : formalCount > 0
          ? `${formalCount} ${formalCount === 1 ? 'reference' : 'references'}`
          : 'Expert opinion';
  const traceClasses = [
    trace.points < 0 ? 'negative-trace' : null,
    trace.classification === 'critical_omission' ? 'critical-trace' : null,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <details className={traceClasses || undefined}>
      <summary>
        <span>{trace.label}</span>
        <small
          className={`trace-provenance-badge${
            trace.evidenceAttributions.length === 0 ? ' unavailable' : ''
          }`}
        >
          {provenanceLabel}
        </small>
        <b>{signed(trace.points)} pts</b>
      </summary>
      <p>{trace.explanation}</p>
      <small>
        {displayLabel(trace.classification)} ·{' '}
        {trace.matched ? 'condition met' : 'condition not met'} · rule review:{' '}
        {displayLabel(trace.reviewStatus)}
      </small>
      <div className="evidence-attributions">
        <b>References &amp; provenance</b>
        {trace.evidenceAttributions.length > 0 ? (
          <ul>
            {trace.evidenceAttributions.map((attribution, index) => (
              <li key={`${trace.ruleId}-evidence-${index}`}>
                {attribution.authority === 'formal_publication' ? (
                  <>
                    <span>Formal publication: </span>
                    {attribution.url ? (
                      <a href={attribution.url} target="_blank" rel="noreferrer">
                        {attribution.citation}
                      </a>
                    ) : (
                      attribution.citation
                    )}
                    <span> — Contribution: {attribution.contribution}</span>
                  </>
                ) : (
                  <span>{attribution.contribution}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Legacy trace: no provenance snapshot was stored with this attempt.</p>
        )}
      </div>
      <button className="small-button" type="button" onClick={() => onFlag(trace.ruleId)}>
        Flag this rule
      </button>
    </details>
  );
}

function LinkedTicketReviewCard({
  ticket,
  onSave,
}: {
  ticket: ClinicalReviewTicket;
  onSave: (ticketId: string, reviewerNotes: string) => Promise<void>;
}) {
  const [reviewerNotes, setReviewerNotes] = useState(ticket.reviewerNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReviewerNotes(ticket.reviewerNotes);
  }, [ticket.id, ticket.reviewerNotes]);

  const dirty = reviewerNotes.trim() !== ticket.reviewerNotes;
  return (
    <LazyDisclosure
      className="ticket-card developer-question-card"
      summary={
        <>
          <span>
            <strong>{ticket.title}</strong>
            <small>{ticket.guidance}</small>
          </span>
          <span className="source-status">
            {ticket.reviewerNotes.trim() ? 'Response saved' : 'Response needed'}
          </span>
        </>
      }
    >
      {() => (
        <div className="developer-question-body">
          <p>
            Answer this question after reviewing the exact patient, your submitted choices, the
            database-plan comparison, and the rule trace on this receipt.
          </p>
          <label htmlFor={`receipt-ticket-response-${ticket.id}`}>
            Your response, judgment, or alternative references
          </label>
          <textarea
            id={`receipt-ticket-response-${ticket.id}`}
            rows={6}
            maxLength={8000}
            value={reviewerNotes}
            placeholder="Describe what the rule should do, qualify the proposed direction, or paste a better source."
            onChange={(event) => setReviewerNotes(event.target.value)}
          />
          <button
            className="secondary-button"
            type="button"
            disabled={!dirty || saving}
            onClick={() => {
              setSaving(true);
              void onSave(ticket.id, reviewerNotes.trim()).finally(() => setSaving(false));
            }}
          >
            {saving ? 'Saving…' : dirty ? 'Save response with this attempt' : 'Response saved'}
          </button>
          <small>
            This links the question to this immutable completed attempt. It does not change a
            clinical rule.
          </small>
        </div>
      )}
    </LazyDisclosure>
  );
}

export function ReceiptView({
  attempt,
  developerToolsEnabled,
  developerCaseReviewEnabled,
  referenceSolutionAudit,
  initialDeveloperReviewNote,
  portableReviewerBuild = false,
  reviewExportAvailable = false,
  linkedReviewTickets = [],
  onBackToClinic,
  onReplay,
  onExportReviews,
  onFlag,
  onSaveGuidance,
  onSaveDeveloperReview,
  onSaveLinkedTicketReview = async () => undefined,
}: ReceiptViewProps) {
  const { pointReport, settlement, items } = attempt.receipt;
  const [disputedItemId, setDisputedItemId] = useState<string | null>(null);
  const [issueCategory, setIssueCategory] =
    useState<ContentFlag['issueCategory']>('whole_encounter');
  const [flagNeedsClinicalReview, setFlagNeedsClinicalReview] = useState(true);
  const [note, setNote] = useState('');
  const [guidanceItemId, setGuidanceItemId] = useState<string | null>(null);
  const [guidanceType, setGuidanceType] = useState<ClinicalReviewTicket['ticketType']>('scoring');
  const [guidanceNeedsClinicalAcumen, setGuidanceNeedsClinicalAcumen] = useState(true);
  const [guidance, setGuidance] = useState('');
  const [resurfacingTrigger, setResurfacingTrigger] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [developerReviewNote, setDeveloperReviewNote] = useState(initialDeveloperReviewNote);
  const [savedDeveloperReviewNote, setSavedDeveloperReviewNote] = useState(
    initialDeveloperReviewNote,
  );
  const [developerReviewStatus, setDeveloperReviewStatus] = useState<string | null>(null);
  const [savingDeveloperReview, setSavingDeveloperReview] = useState(false);
  const variance = pointReport.actualWorkupExpense - pointReport.selectedPathWorkupCost;
  const databaseComparisonRun =
    referenceSolutionAudit?.databaseRun ?? referenceSolutionAudit?.bestRun ?? null;
  const databaseComparisonScore =
    databaseComparisonRun?.carePoints ?? pointReport.databasePlanCarePoints;
  const guidanceItem = items.find((item) => item.id === guidanceItemId);
  const externalCostAvoided = items.reduce((total, item) => total + item.externalCostAvoided, 0);
  const delegatedIntakeSavings = items.reduce((total, item) => total + item.upgradeSavings, 0);
  const traceGroups = TRACE_COMPONENT_ORDER.map((component) => {
    const rules = pointReport.ruleTrace.filter((trace) => trace.component === component);
    return {
      component,
      label: TRACE_COMPONENT_LABELS[component],
      pointRelevant: rules.filter((trace) => trace.points !== 0),
      zeroPoint: rules.filter((trace) => trace.points === 0),
      subtotal: rules.reduce((total, trace) => total + trace.points, 0),
    };
  }).filter((group) => group.pointRelevant.length > 0 || group.zeroPoint.length > 0);

  const submitFlag = async (): Promise<void> => {
    await onFlag({
      disputedItemId,
      issueCategory,
      requiresClinicalReview: flagNeedsClinicalReview,
      note,
    });
    setStatusMessage(
      flagNeedsClinicalReview
        ? 'Flag and clinical-review ticket saved locally.'
        : 'Flag saved locally.',
    );
    setNote('');
  };

  const submitGuidance = async (): Promise<void> => {
    if (!guidanceItemId || !guidance.trim()) return;
    await onSaveGuidance({
      receiptItemId: guidanceItemId,
      ticketType: guidanceType,
      requiresClinicalAcumen: guidanceNeedsClinicalAcumen,
      guidance: guidance.trim(),
      resurfacingTrigger: resurfacingTrigger.trim(),
    });
    setStatusMessage('Guidance saved as a proposed local review ticket. No content was changed.');
    setGuidance('');
    setResurfacingTrigger('');
    setGuidanceItemId(null);
  };

  const submitDeveloperReview = async (): Promise<void> => {
    const normalizedNote = developerReviewNote.trim();
    if (!normalizedNote) return;
    setSavingDeveloperReview(true);
    setDeveloperReviewStatus(null);
    try {
      const workspaceUpdated = await onSaveDeveloperReview(normalizedNote);
      setSavedDeveloperReviewNote(normalizedNote);
      setDeveloperReviewNote(normalizedNote);
      setDeveloperReviewStatus(
        portableReviewerBuild
          ? 'Feedback saved in this browser with the exact patient, offered options, choices, events, receipt, and rule trace. Export the reviewer bundle before clearing browser data or switching devices.'
          : workspaceUpdated
            ? 'Review saved locally with the exact patient, options, selections, events, and receipt. The Codex handoff file is up to date.'
            : 'Review saved in browser storage with the exact attempt. The Codex handoff file could not be refreshed; use “Update Codex handoff file” from the Developer hub to retry.',
      );
    } catch (caught) {
      setDeveloperReviewStatus(
        caught instanceof Error
          ? `The case review could not be saved: ${caught.message}`
          : 'The case review could not be saved.',
      );
    } finally {
      setSavingDeveloperReview(false);
    }
  };

  const developerReviewPanel = developerCaseReviewEnabled ? (
    <section className="developer-attempt-review" aria-labelledby="developer-review-title">
      <div>
        <p className="panel-kicker">
          {portableReviewerBuild ? 'Portable reviewer notes' : 'Developer patient review'}
        </p>
        <h2 id="developer-review-title" tabIndex={-1}>
          Case and app experience notes
        </h2>
        <p>
          Add case-specific clinical or scoring feedback, or subjective comments about pacing,
          clarity, usability, screen density, and the overall feel of the app. Saving also preserves
          the exact patient, every offered option, your choices, events, receipt, and rule trace so
          the comment can be evaluated against what you actually saw.
        </p>
      </div>
      <div className="flag-fields">
        <label htmlFor="developer-case-review">Your feedback</label>
        <textarea
          id="developer-case-review"
          value={developerReviewNote}
          onChange={(event) => {
            setDeveloperReviewNote(event.target.value);
            setDeveloperReviewStatus(null);
          }}
          rows={6}
          placeholder="For example: “I missed suicide risk assessment and was not penalized,” or “The treatment pane felt too dense on my phone.”"
        />
        <div className="flag-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={
              savingDeveloperReview ||
              !developerReviewNote.trim() ||
              developerReviewNote.trim() === savedDeveloperReviewNote.trim()
            }
            onClick={() => void submitDeveloperReview()}
          >
            {savingDeveloperReview ? 'Saving feedback…' : 'Save feedback for Codex'}
          </button>
        </div>
        {developerReviewStatus ? (
          <p className="success-message" role="status">
            {developerReviewStatus}
          </p>
        ) : null}
      </div>
    </section>
  ) : null;

  return (
    <main className="receipt-shell">
      <section className="receipt-hero" aria-labelledby="receipt-title">
        <div className="receipt-title-block">
          <p className="eyebrow">Case receipt · {displayLabel(pointReport.treatmentGrade)}</p>
          <h1 id="receipt-title" tabIndex={-1}>
            {attempt.caseInstance.metadata.debriefTitle}
          </h1>
          <p>{pointReport.selectedPathwayLabel ?? 'No accepted complete pathway matched'}</p>
        </div>
        <dl className="reward-cards">
          <div>
            <dt>{settlement.practiceMode ? 'Projected payout' : 'Points earned'}</dt>
            <dd>+{settlement.netClinicPointsEarned.toLocaleString()} pts</dd>
          </div>
          <div>
            <dt>{settlement.practiceMode ? 'Practice mode' : 'Point balance'}</dt>
            <dd>
              {settlement.practiceMode
                ? 'Not banked'
                : `${settlement.persistentPointsAfter.toLocaleString()} pts`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="evaluation-notice" aria-label="Treatment evaluation source">
        <strong>
          {pointReport.treatmentEvaluationSource === 'authored_pathway'
            ? 'Database pathway'
            : pointReport.treatmentEvaluationSource === 'engine_inferred'
              ? 'Engine-inferred treatment'
              : 'No matched treatment path'}
        </strong>
        <span>{pointReport.treatmentEvaluationNotice}</span>
      </section>

      <ScoreComparisonBar
        playerScore={pointReport.carePointsEarned}
        databaseScore={databaseComparisonScore}
      />

      {portableReviewerBuild ? developerReviewPanel : null}

      {developerCaseReviewEnabled && linkedReviewTickets.length > 0 ? (
        <LazyDisclosure
          className="ticket-queue developer-major-disclosure receipt-linked-questions"
          summary={
            <>
              <span>
                <small>Questions attached to this patient</small>
                <strong>Review this case against queued decisions</strong>
              </span>
              <span className="count-badge">{linkedReviewTickets.length}</span>
            </>
          }
        >
          {() => (
            <div className="developer-disclosure-body ticket-list">
              {linkedReviewTickets.map((ticket) => (
                <LinkedTicketReviewCard
                  key={ticket.id}
                  ticket={ticket}
                  onSave={onSaveLinkedTicketReview}
                />
              ))}
            </div>
          )}
        </LazyDisclosure>
      ) : null}

      <div className="receipt-grid">
        <section className="receipt-panel" aria-labelledby="points-title">
          <p className="panel-kicker">Clinical decisions</p>
          <h2 id="points-title">Care points</h2>
          <dl className="calculation-list">
            <div>
              <dt>Database-plan care points</dt>
              <dd>{pointReport.databasePlanCarePoints.toLocaleString()} pts</dd>
            </div>
            {Object.entries(pointReport.componentPoints).map(([component, points]) => (
              <div key={component} className={points < 0 ? 'negative-row' : undefined}>
                <dt>{displayLabel(component)}</dt>
                <dd>{signed(points)} pts</dd>
              </div>
            ))}
            <div className="total-row">
              <dt>Your care points</dt>
              <dd>{pointReport.carePointsEarned.toLocaleString()} pts</dd>
            </div>
            {pointReport.carePointCapApplied !== null ? (
              <div className="negative-row">
                <dt>Safety cap applied</dt>
                <dd>{pointReport.carePointCapApplied} pts</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="receipt-panel" aria-labelledby="settlement-title">
          <p className="panel-kicker">All-points settlement</p>
          <h2 id="settlement-title">Payout calculation</h2>
          <dl className="calculation-list">
            <div>
              <dt>Base reimbursement</dt>
              <dd>+{settlement.baseReimbursement.toLocaleString()} pts</dd>
            </div>
            <div className={settlement.carePoints < 0 ? 'negative-row' : undefined}>
              <dt>Care points</dt>
              <dd>{signed(settlement.carePoints)} pts</dd>
            </div>
            <div>
              <dt>Complexity + challenge</dt>
              <dd>
                +{(settlement.complexityBonus + settlement.challengeBonus).toLocaleString()} pts
              </dd>
            </div>
            <div>
              <dt>Satisfaction</dt>
              <dd>×{settlement.satisfactionMultiplier.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Gross reimbursement</dt>
              <dd>{settlement.grossPayout.toLocaleString()} pts</dd>
            </div>
            <div className="negative-row">
              <dt>Information and test costs</dt>
              <dd>−{settlement.informationExpenses.toLocaleString()} pts</dd>
            </div>
            <div className="negative-row">
              <dt>Treatment-service costs</dt>
              <dd>−{settlement.treatmentExpenses.toLocaleString()} pts</dd>
            </div>
            <div className="negative-row">
              <dt>Total operating costs</dt>
              <dd>−{settlement.operatingExpenses.toLocaleString()} pts</dd>
            </div>
            <div className="total-row">
              <dt>{settlement.practiceMode ? 'Projected payout' : 'Payout after zero floor'}</dt>
              <dd>{settlement.netClinicPointsEarned.toLocaleString()} pts</dd>
            </div>
          </dl>
        </section>

        <section className="receipt-panel" aria-labelledby="par-title">
          <p className="panel-kicker">Investigation efficiency</p>
          <h2 id="par-title">Workup costs</h2>
          <dl className="calculation-list">
            <div>
              <dt>Database-plan sendout baseline</dt>
              <dd>{pointReport.databasePlanWorkupCost.toLocaleString()} pts</dd>
            </div>
            <div>
              <dt>Selected-path sendout baseline</dt>
              <dd>{pointReport.selectedPathWorkupCost.toLocaleString()} pts</dd>
            </div>
            <div>
              <dt>Actual after clinic services</dt>
              <dd>{pointReport.actualWorkupExpense.toLocaleString()} pts</dd>
            </div>
            {externalCostAvoided > 0 ? (
              <div className="positive-row">
                <dt>External cost avoided by upgrades</dt>
                <dd>+{externalCostAvoided.toLocaleString()} pts</dd>
              </div>
            ) : null}
            {delegatedIntakeSavings > 0 ? (
              <div className="positive-row">
                <dt>Delegated intake savings</dt>
                <dd>+{delegatedIntakeSavings.toLocaleString()} pts</dd>
              </div>
            ) : null}
            <div className={variance > 0 ? 'negative-row' : 'positive-row'}>
              <dt>{variance > 0 ? 'Above selected path' : 'Below selected path'}</dt>
              <dd>{Math.abs(variance).toLocaleString()} pts</dd>
            </div>
          </dl>
        </section>
      </div>

      {pointReport.safetyErrors.length > 0 ? (
        <section className="safety-errors" aria-labelledby="safety-errors-title">
          <h2 id="safety-errors-title">Safety errors</h2>
          <ul>
            {pointReport.safetyErrors.map((safetyError) => (
              <li key={safetyError}>{safetyError}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {referenceSolutionAudit ? (
        <section className="plan-comparison-panel" aria-labelledby="plan-comparison-title">
          <div className="panel-heading-row">
            <div>
              <p className="panel-kicker">Parallel plan audit</p>
              <h2 id="plan-comparison-title">What you did vs the database-calculated plan</h2>
            </div>
            <span className="count-badge">
              Engine v{referenceSolutionAudit.currentEngineVersion}
            </span>
          </div>
          <p className="reference-audit-notice">
            The right-hand plan is the declared database-plan replay for this exact patient, clinic
            snapshot, and service cost. It is a tested database solution, not proof that every
            possible combination was exhaustively searched.
          </p>
          {referenceSolutionAudit.error ? (
            <p className="reference-audit-error" role="alert">
              {referenceSolutionAudit.error}
            </p>
          ) : null}
          <div className="plan-comparison-grid">
            <PlanCard
              title="Your submitted plan"
              kicker="Player"
              plan={referenceSolutionAudit.playerPlan}
            />
            {databaseComparisonRun ? (
              <PlanCard
                title="Database plan"
                kicker={databaseComparisonRun.label}
                plan={databaseComparisonRun}
              />
            ) : (
              <article className="plan-comparison-card unavailable-plan">
                <h3>No database replay completed</h3>
                <p>The player plan remains preserved above; inspect the replay error before use.</p>
              </article>
            )}
          </div>
          {developerCaseReviewEnabled && referenceSolutionAudit.runs.length > 0 ? (
            <details className="reference-comparison">
              <summary>Developer audit · compare all declared reference runs</summary>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Kind</th>
                      <th scope="col">Care points</th>
                      <th scope="col">Workup</th>
                      <th scope="col">Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referenceSolutionAudit.runs.map((run) => (
                      <tr key={run.id}>
                        <th scope="row">
                          {run.label}
                          <small>{run.explanation}</small>
                        </th>
                        <td>{displayLabel(run.kind)}</td>
                        {run.status === 'completed' ? (
                          <>
                            <td>{signed(run.carePoints)} pts</td>
                            <td>{run.workupExpense.toLocaleString()} pts</td>
                            <td>{run.netPayout.toLocaleString()} pts</td>
                          </>
                        ) : (
                          <td colSpan={3} className="negative-cell">
                            Replay failed: {run.error}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      <section className="receipt-table-panel" aria-labelledby="itemized-title">
        <div className="panel-heading-row">
          <div>
            <p className="panel-kicker">Base awards and modifiers separated</p>
            <h2 id="itemized-title">Itemized case receipt</h2>
          </div>
          <span className="count-badge">{items.length}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Point category</th>
                <th scope="col">Fulfillment</th>
                <th scope="col">Cost</th>
                <th scope="col">Upgrade savings</th>
                <th scope="col">Care points</th>
                <th scope="col">Classification</th>
                <th scope="col">Path</th>
                <th scope="col">Review</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    {item.itemName}
                    <small>{item.explanation}</small>
                  </th>
                  <td>{displayLabel(item.scoreCategory)}</td>
                  <td>{item.fulfillmentMethod}</td>
                  <td>{item.operatingCost} pts</td>
                  <td>
                    {item.externalCostAvoided + item.upgradeSavings > 0
                      ? `+${(item.externalCostAvoided + item.upgradeSavings).toLocaleString()} pts`
                      : '—'}
                  </td>
                  <td className={item.pointDelta < 0 ? 'negative-cell' : undefined}>
                    {signed(item.pointDelta)} pts
                  </td>
                  <td>{displayLabel(item.classification)}</td>
                  <td>{item.acceptedPathwayMatch ? 'Matched' : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => {
                          setDisputedItemId(item.id);
                          setIssueCategory(
                            item.kind === 'information' ? 'information_result' : 'treatment_grade',
                          );
                        }}
                      >
                        Flag
                      </button>
                      {developerToolsEnabled ? (
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => setGuidanceItemId(item.id)}
                        >
                          Add guidance
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {developerToolsEnabled && guidanceItem ? (
        <section className="guidance-panel" aria-labelledby="guidance-title">
          <div>
            <p className="panel-kicker">
              {portableReviewerBuild ? 'Reviewer feedback' : 'Local developer database'}
            </p>
            <h2 id="guidance-title">Guidance for {guidanceItem.itemName}</h2>
            <p>
              This creates a proposed ticket. It does not silently modify patient, medication, test,
              or scoring data.
            </p>
          </div>
          <div className="flag-fields">
            <label htmlFor="guidance-type">Ticket type</label>
            <select
              id="guidance-type"
              value={guidanceType}
              onChange={(event) =>
                setGuidanceType(event.target.value as ClinicalReviewTicket['ticketType'])
              }
            >
              <option value="technical">Technical</option>
              <option value="case_construction">Case construction</option>
              <option value="test_generation">Test generation</option>
              <option value="medication_fit">Medication fit</option>
              <option value="treatment_pathway">Treatment pathway</option>
              <option value="scoring">Scoring</option>
              <option value="narrative">Narrative</option>
              <option value="clinical_conflict">Clinical conflict</option>
              <option value="source_gap">Needs another guideline/source</option>
            </select>
            <label className="inline-checkbox">
              <input
                type="checkbox"
                checked={guidanceNeedsClinicalAcumen}
                onChange={(event) => setGuidanceNeedsClinicalAcumen(event.target.checked)}
              />
              Requires clinical judgment
            </label>
            <label htmlFor="guidance-note">Guidance</label>
            <textarea
              id="guidance-note"
              value={guidance}
              onChange={(event) => setGuidance(event.target.value)}
              rows={4}
              placeholder="What should be audited or changed, and why?"
            />
            <label htmlFor="resurfacing-trigger">Resurface when (optional)</label>
            <input
              id="resurfacing-trigger"
              className="search-input"
              value={resurfacingTrigger}
              onChange={(event) => setResurfacingTrigger(event.target.value)}
              placeholder="For example: when this medication catalog entry changes"
            />
            <div className="flag-actions">
              <button className="text-button" type="button" onClick={() => setGuidanceItemId(null)}>
                Cancel
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={!guidance.trim()}
                onClick={() => void submitGuidance()}
              >
                Queue guidance
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="trace-panel" aria-labelledby="trace-title">
        <p className="panel-kicker">No hidden rules</p>
        <h2 id="trace-title">Categorized rule trace</h2>
        <p className="trace-intro">
          Rules that changed this receipt appear first in each category. Zero-point evaluations
          remain available underneath so the full engine decision can still be audited. References
          show what informed the clinical direction. Exact game-point weights are Developer balance
          values and are not claims made by the cited source.
        </p>
        <div className="trace-category-list">
          {traceGroups.map((group) => (
            <section className="trace-category" key={group.component}>
              <header>
                <div>
                  <h3>{group.label}</h3>
                  <small>
                    {group.pointRelevant.length} point-relevant · {group.zeroPoint.length} other
                  </small>
                </div>
                <b className={group.subtotal < 0 ? 'negative-cell' : undefined}>
                  {signed(group.subtotal)} pts
                </b>
              </header>
              {group.pointRelevant.length > 0 ? (
                <div className="trace-list" aria-label={`${group.label} point-relevant rules`}>
                  {group.pointRelevant.map((trace) => (
                    <TraceRuleDetails
                      key={trace.ruleId}
                      trace={trace}
                      onFlag={(ruleId) => {
                        setDisputedItemId(ruleId);
                        setIssueCategory('rationale');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="trace-empty">No rule in this category changed the point total.</p>
              )}
              {group.zeroPoint.length > 0 ? (
                <details className="zero-point-rules">
                  <summary>Show {group.zeroPoint.length} zero-point evaluation(s)</summary>
                  <div className="trace-list">
                    {group.zeroPoint.map((trace) => (
                      <TraceRuleDetails
                        key={trace.ruleId}
                        trace={trace}
                        onFlag={(ruleId) => {
                          setDisputedItemId(ruleId);
                          setIssueCategory('rationale');
                        }}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      {!portableReviewerBuild ? developerReviewPanel : null}

      <section className="flag-panel" aria-labelledby="flag-title">
        <div>
          <p className="panel-kicker">Content disagreement</p>
          <h2 id="flag-title">Flag for review</h2>
          <p>
            {disputedItemId ? `Selected item: ${disputedItemId}` : 'Flagging the whole encounter.'}
          </p>
        </div>
        <div className="flag-fields">
          <label htmlFor="flag-category">Issue category</label>
          <select
            id="flag-category"
            value={issueCategory}
            onChange={(event) =>
              setIssueCategory(event.target.value as ContentFlag['issueCategory'])
            }
          >
            <option value="whole_encounter">Whole encounter</option>
            <option value="information_result">Information result</option>
            <option value="workup_objective">Workup objective</option>
            <option value="treatment_grade">Treatment grade</option>
            <option value="interaction_rule">Interaction rule</option>
            <option value="penalty">Penalty</option>
            <option value="rationale">Rationale</option>
            <option value="missing_alternative">Missing acceptable alternative</option>
            <option value="needs_additional_source">Needs another guideline/source</option>
            <option value="narrative_ambiguity">Narrative ambiguity</option>
            <option value="ui_or_engine_bug">UI or engine bug</option>
          </select>
          <label className="inline-checkbox">
            <input
              type="checkbox"
              checked={flagNeedsClinicalReview}
              onChange={(event) => setFlagNeedsClinicalReview(event.target.checked)}
            />
            Requires clinical judgment and should create a ticket
          </label>
          <label htmlFor="flag-note">Note</label>
          <textarea
            id="flag-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="What seems wrong or unclear?"
          />
          <div className="flag-actions">
            {disputedItemId ? (
              <button className="text-button" type="button" onClick={() => setDisputedItemId(null)}>
                Clear selected item
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={() => void submitFlag()}>
              Save locally
            </button>
          </div>
          {statusMessage ? (
            <p className="success-message" role="status">
              {statusMessage}
            </p>
          ) : null}
        </div>
      </section>

      <div className="receipt-actions">
        <button className="secondary-button" type="button" onClick={onBackToClinic}>
          Return to clinic
        </button>
        <button className="primary-button" type="button" onClick={onReplay}>
          Replay same patient
        </button>
        {portableReviewerBuild && onExportReviews ? (
          <button
            className="secondary-button"
            type="button"
            disabled={!reviewExportAvailable}
            onClick={onExportReviews}
          >
            Export all saved feedback
          </button>
        ) : null}
      </div>
    </main>
  );
}
