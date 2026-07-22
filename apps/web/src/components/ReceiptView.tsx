import { useState } from 'react';
import type { ClinicalReviewTicket, CompletedAttempt, ContentFlag } from '@psychsim/schemas';

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
  onBackToClinic: () => void;
  onReplay: () => void;
  onFlag: (draft: FlagDraft) => Promise<void>;
  onSaveGuidance: (draft: GuidanceDraft) => Promise<void>;
}

const displayLabel = (value: string): string => value.replaceAll('_', ' ');
const signed = (value: number): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}`;

export function ReceiptView({
  attempt,
  developerToolsEnabled,
  onBackToClinic,
  onReplay,
  onFlag,
  onSaveGuidance,
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
  const variance = pointReport.actualWorkupExpense - pointReport.selectedPathWorkupCost;
  const databaseDifference = pointReport.differenceFromDatabasePlan;
  const guidanceItem = items.find((item) => item.id === guidanceItemId);
  const externalCostAvoided = items.reduce((total, item) => total + item.externalCostAvoided, 0);

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

  return (
    <main className="receipt-shell" id="main-content">
      <section className="receipt-hero" aria-labelledby="receipt-title">
        <div className="point-seal" aria-label={`${pointReport.carePointsEarned} care points`}>
          <span>Care</span>
          <strong>{pointReport.carePointsEarned}</strong>
          <small>points</small>
        </div>
        <div className="receipt-title-block">
          <p className="eyebrow">Case settled · {displayLabel(pointReport.treatmentGrade)}</p>
          <h1 id="receipt-title">{signed(databaseDifference)} points vs database plan</h1>
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
                    {item.externalCostAvoided > 0
                      ? `+${item.externalCostAvoided.toLocaleString()} pts`
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
            <p className="panel-kicker">Local developer database</p>
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
        <h2 id="trace-title">Complete rule trace</h2>
        <div className="trace-list">
          {pointReport.ruleTrace.map((trace) => (
            <details
              key={trace.ruleId}
              className={
                trace.classification === 'critical_omission' ? 'critical-trace' : undefined
              }
            >
              <summary>
                <span>{trace.label}</span>
                <b>{signed(trace.points)} pts</b>
              </summary>
              <p>{trace.explanation}</p>
              <small>
                {displayLabel(trace.classification)} ·{' '}
                {trace.matched ? 'condition met' : 'condition not met'} · rule review:{' '}
                {displayLabel(trace.reviewStatus)}
              </small>
              <div className="evidence-attributions">
                <b>Evidence basis</b>
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
              </div>
              <button
                className="small-button"
                type="button"
                onClick={() => {
                  setDisputedItemId(trace.ruleId);
                  setIssueCategory('rationale');
                }}
              >
                Flag this rule
              </button>
            </details>
          ))}
        </div>
      </section>

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
      </div>
    </main>
  );
}
