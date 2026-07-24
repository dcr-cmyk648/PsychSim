import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CatalogBundle,
  EncounterState,
  InformationActionCategory,
  InformationPurchase,
  TreatmentSelection,
} from '@psychsim/schemas';
import {
  getInformationActionQuote,
  getAvailableStartMedicationIds,
  purchaseInformationAction,
  updateTreatmentSelections,
} from '@psychsim/engine';
import type { MobileWorkflowPane } from './MobileWorkflowTabs';

interface EncounterViewProps {
  state: EncounterState;
  catalogs: CatalogBundle;
  onStateChange: (state: EncounterState) => void;
  onSubmit: () => void;
  onExit: () => void;
  mobileActivePane?: MobileWorkflowPane;
  onMobilePaneChange?: (pane: MobileWorkflowPane) => void;
  readOnly?: boolean;
}

type MedicationMode = 'startMedicationIds' | 'stopMedicationIds' | 'continueMedicationIds';

const INFORMATION_CATEGORIES: ReadonlyArray<{
  id: InformationActionCategory;
  label: string;
}> = [
  { id: 'history', label: 'History' },
  { id: 'physical', label: 'Physical' },
  { id: 'labs', label: 'Labs' },
  { id: 'imaging', label: 'Imaging' },
];

const MEDICATION_MODES: ReadonlyArray<{ id: MedicationMode; label: string }> = [
  { id: 'startMedicationIds', label: 'Start' },
  { id: 'stopMedicationIds', label: 'Stop' },
  { id: 'continueMedicationIds', label: 'Continue' },
];

const includesSearch = (search: string, ...values: Array<string | undefined>): boolean =>
  values.join(' ').toLowerCase().includes(search.trim().toLowerCase());

const findingMarker = (
  outcome: EncounterState['purchases'][number]['result']['findings'][number]['outcome'],
): string => {
  if (outcome === 'present' || outcome === 'positive') return '+';
  if (outcome === 'absent' || outcome === 'negative') return '−';
  if (outcome === 'high') return '↑';
  if (outcome === 'low') return '↓';
  if (outcome === 'not_applicable') return 'N/A';
  return '=';
};

const findingOutcomeLabel = (
  outcome: EncounterState['purchases'][number]['result']['findings'][number]['outcome'],
): string => {
  if (outcome === 'present') return 'Present';
  if (outcome === 'positive') return 'Positive';
  if (outcome === 'absent') return 'Absent';
  if (outcome === 'negative') return 'Negative';
  if (outcome === 'high') return 'High';
  if (outcome === 'low') return 'Low';
  if (outcome === 'not_applicable') return 'Not applicable';
  return 'Normal';
};

function ResultCard({
  purchase,
  actionLabel,
}: {
  purchase: InformationPurchase;
  actionLabel: string;
}) {
  const numericFindings = purchase.result.findings.filter(
    (finding) => finding.numericMeasurement !== undefined,
  );
  const narrativeFindings = purchase.result.findings.filter(
    (finding) => finding.numericMeasurement === undefined,
  );

  return (
    <article className="result-card">
      <div className="result-card-heading">
        <h3>{actionLabel}</h3>
        <span>
          {purchase.initiatedBy === 'automatic_intake' ? (
            <em className="automatic-intake-badge">Automatic intake</em>
          ) : null}
          {purchase.operatingCost} pts
          {purchase.upgradeSavings > 0 ? <small>saved {purchase.upgradeSavings} pts</small> : null}
        </span>
      </div>
      {numericFindings.length > 0 ? (
        <div className="lab-table-scroll">
          <table className="lab-result-table">
            <thead>
              <tr>
                <th scope="col">Test</th>
                <th scope="col">Result</th>
                <th scope="col">Reference interval</th>
                <th scope="col">Flag</th>
              </tr>
            </thead>
            <tbody>
              {numericFindings.map((finding) => {
                const measurement = finding.numericMeasurement!;
                return (
                  <tr key={finding.id} className={`outcome-${finding.outcome}`}>
                    <th scope="row">{finding.label}</th>
                    <td className="lab-value">
                      {measurement.displayValue} {measurement.unit}
                    </td>
                    <td>
                      {measurement.referenceInterval.display}
                      {measurement.referenceInterval.applicablePopulation ? (
                        <small>{measurement.referenceInterval.applicablePopulation}</small>
                      ) : null}
                    </td>
                    <td>
                      <b
                        className={`lab-flag outcome-${finding.outcome}`}
                        aria-label={findingOutcomeLabel(finding.outcome)}
                      >
                        {finding.outcome === 'high' ? '↑' : finding.outcome === 'low' ? '↓' : 'N'}
                      </b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {narrativeFindings.length > 0 ? (
        <ul className="finding-list">
          {narrativeFindings.map((finding) => (
            <li key={finding.id} className={`finding-row outcome-${finding.outcome}`}>
              <b
                className={`finding-marker outcome-${finding.outcome}`}
                aria-label={findingOutcomeLabel(finding.outcome)}
              >
                {findingMarker(finding.outcome)}
              </b>
              <span className="finding-content">
                <span className={`finding-outcome-chip outcome-${finding.outcome}`}>
                  {findingOutcomeLabel(finding.outcome)}
                </span>
                <span>{finding.label}</span>
                {finding.valueText ? <small>{finding.valueText}</small> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <small>Fulfilled by {purchase.fulfillmentLabel}</small>
    </article>
  );
}

export function EncounterView({
  state,
  catalogs,
  onStateChange,
  onSubmit,
  onExit,
  mobileActivePane = 'patient',
  onMobilePaneChange = () => undefined,
  readOnly = false,
}: EncounterViewProps) {
  const [informationSearch, setInformationSearch] = useState('');
  const [informationCategory, setInformationCategory] =
    useState<InformationActionCategory>('history');
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [medicationMode, setMedicationMode] = useState<MedicationMode>('startMedicationIds');
  const [message, setMessage] = useState<string | null>(null);
  const [newestResultsFirst, setNewestResultsFirst] = useState(true);
  const [latestPurchaseActionId, setLatestPurchaseActionId] = useState<string | null>(null);
  const purchaseDialogRef = useRef<HTMLDialogElement | null>(null);
  const purchaseTriggerRef = useRef<HTMLElement | null>(null);
  const settingLabel =
    catalogs.locations.find((location) => location.id === state.locationId)?.label ??
    state.locationId;

  const caseActionIds = useMemo(
    () => new Set(state.caseInstance.informationActions.map((action) => action.actionId)),
    [state.caseInstance.informationActions],
  );
  const actions = useMemo(
    () =>
      catalogs.informationActions.filter(
        (action) =>
          caseActionIds.has(action.id) &&
          action.category === informationCategory &&
          includesSearch(informationSearch, action.label, action.description),
      ),
    [caseActionIds, catalogs.informationActions, informationCategory, informationSearch],
  );

  const medicationLabel = (id: string): string =>
    catalogs.medications.find((medication) => medication.id === id)?.label ?? id;

  const availableMedicationIds =
    medicationMode === 'startMedicationIds'
      ? getAvailableStartMedicationIds(
          state.caseInstance,
          state.clinicState,
          state.locationId,
          catalogs,
        )
      : state.caseInstance.availableTreatments[medicationMode];
  const medications = availableMedicationIds
    .map((id) => catalogs.medications.find((medication) => medication.id === id))
    .filter((medication) => medication !== undefined)
    .filter((medication) =>
      includesSearch(treatmentSearch, medication.label, ...medication.classes),
    );
  const interventions = state.caseInstance.availableTreatments.interventionIds
    .map((id) => catalogs.treatments.find((treatment) => treatment.id === id))
    .filter((treatment) => treatment !== undefined)
    .filter((treatment) => includesSearch(treatmentSearch, treatment.label, treatment.category));
  const dispositions = state.caseInstance.availableTreatments.dispositionIds
    .map((id) => catalogs.treatments.find((treatment) => treatment.id === id))
    .filter((treatment) => treatment !== undefined)
    .filter((treatment) => includesSearch(treatmentSearch, treatment.label));

  const buy = (actionId: string): void => {
    if (readOnly) return;
    purchaseTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const result = purchaseInformationAction(state, actionId, catalogs);
    if (result.ok) {
      onStateChange(result.value);
      setLatestPurchaseActionId(actionId);
      setMessage(null);
    } else {
      setMessage(result.error.message);
    }
  };

  const dismissLatestPurchase = (restorePurchaseFocus = true): void => {
    setLatestPurchaseActionId(null);
    window.requestAnimationFrame(() => {
      if (restorePurchaseFocus) {
        const trigger = purchaseTriggerRef.current;
        if (trigger && !trigger.matches(':disabled')) {
          trigger.focus();
        } else {
          document.getElementById('mobile-tab-investigate')?.focus();
        }
      }
    });
  };

  const update = (next: TreatmentSelection): void => {
    if (readOnly) return;
    const result = updateTreatmentSelections(state, next, catalogs);
    if (result.ok) {
      onStateChange(result.value);
      setMessage(null);
    } else {
      setMessage(result.error.message);
    }
  };

  const toggle = (key: MedicationMode | 'interventionIds', id: string): void => {
    const values = state.selections[key];
    const selecting = !values.includes(id);
    const next: TreatmentSelection = {
      ...state.selections,
      [key]: selecting ? [...values, id] : values.filter((value) => value !== id),
    };
    if (selecting && key === 'startMedicationIds') {
      next.stopMedicationIds = next.stopMedicationIds.filter((value) => value !== id);
      next.continueMedicationIds = next.continueMedicationIds.filter((value) => value !== id);
    }
    if (selecting && key === 'stopMedicationIds') {
      next.startMedicationIds = next.startMedicationIds.filter((value) => value !== id);
      next.continueMedicationIds = next.continueMedicationIds.filter((value) => value !== id);
    }
    if (selecting && key === 'continueMedicationIds') {
      next.startMedicationIds = next.startMedicationIds.filter((value) => value !== id);
      next.stopMedicationIds = next.stopMedicationIds.filter((value) => value !== id);
    }
    update(next);
  };

  const selectedTreatmentCount =
    state.selections.startMedicationIds.length +
    state.selections.stopMedicationIds.length +
    state.selections.continueMedicationIds.length +
    state.selections.interventionIds.length +
    (state.selections.dispositionId ? 1 : 0);
  const displayedPurchases = newestResultsFirst
    ? [...state.purchases].reverse()
    : [...state.purchases];
  const latestPurchase = latestPurchaseActionId
    ? state.purchases.find((purchase) => purchase.actionId === latestPurchaseActionId)
    : undefined;
  const latestAction = latestPurchase
    ? catalogs.informationActions.find((action) => action.id === latestPurchase.actionId)
    : undefined;

  useEffect(() => {
    const dialog = purchaseDialogRef.current;
    if (!latestPurchase || !dialog) return;

    const mobileQuery = window.matchMedia('(max-width: 760px)');
    const synchronizeDialog = (): void => {
      if (!mobileQuery.matches) {
        if (dialog.open) dialog.close();
        setLatestPurchaseActionId(null);
        return;
      }
      if (!dialog.open) dialog.showModal();
    };

    synchronizeDialog();
    mobileQuery.addEventListener('change', synchronizeDialog);
    return () => {
      mobileQuery.removeEventListener('change', synchronizeDialog);
      if (dialog.open) dialog.close();
    };
  }, [latestPurchase]);

  return (
    <main
      className={`encounter-shell compact-encounter mobile-pane-${mobileActivePane}${
        readOnly ? ' encounter-read-only' : ''
      }`}
    >
      <header className="encounter-status">
        <button className="text-button" type="button" onClick={onExit}>
          ← Clinic
        </button>
        <div>
          <strong>{state.clinicState.label}</strong>
          <span>{settingLabel}</span>
        </div>
        <dl>
          <div>
            <dt>Expense</dt>
            <dd>{state.expenseTotal.toLocaleString()} pts</dd>
          </div>
          <div>
            <dt>Bank</dt>
            <dd>{state.clinicState.clinicPoints.toLocaleString()} pts</dd>
          </div>
          <div>
            <dt>Revealed</dt>
            <dd>{state.purchases.length}</dd>
          </div>
        </dl>
      </header>

      {message ? (
        <div className="inline-alert encounter-alert" role="alert">
          {message}
        </div>
      ) : null}

      <div className="encounter-workspace">
        <section
          id="mobile-panel-patient"
          className="chart-panel panel"
          data-mobile-pane="patient"
          role="tabpanel"
          aria-labelledby="mobile-tab-patient patient-chart-title"
        >
          <div className="fixed-panel-heading">
            <p className="panel-kicker">Patient chart</p>
            <h1 id="patient-chart-title" tabIndex={-1}>
              {state.caseInstance.opening.title}
            </h1>
          </div>
          <div className="panel-scroll">
            <p className="chief-complaint chart-chief-complaint">
              <span>Chief complaint</span>“{state.caseInstance.opening.chiefComplaint}”
            </p>
            <p className="opening-summary">{state.caseInstance.opening.summary}</p>
            <p>{state.caseInstance.opening.context}</p>
            {state.caseInstance.opening.knownMedicationIds.length > 0 ? (
              <>
                <h2>Known medications</h2>
                <ul>
                  {state.caseInstance.opening.knownMedicationIds.map((id) => (
                    <li key={id}>{medicationLabel(id)}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {state.caseInstance.opening.knownHistory.length > 0 ? (
              <>
                <h2>Known history</h2>
                <ul>
                  {state.caseInstance.opening.knownHistory.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <h2>Basic vital signs</h2>
            <ul className="vitals-list">
              {state.caseInstance.opening.basicVitals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="mobile-panel-revealed"
          className="revealed-panel panel"
          data-mobile-pane="revealed"
          role="tabpanel"
          aria-labelledby="mobile-tab-revealed revealed-title"
          aria-live="polite"
        >
          <div className="fixed-panel-heading panel-heading-row">
            <div>
              <p className="panel-kicker">Chart additions</p>
              <h2 id="revealed-title">Revealed information</h2>
            </div>
            <div className="revealed-heading-actions">
              <span className="count-badge">{state.purchases.length}</span>
              {state.purchases.length > 1 ? (
                <button
                  className="text-button result-order-button"
                  type="button"
                  onClick={() => setNewestResultsFirst((current) => !current)}
                  aria-label={`Show ${newestResultsFirst ? 'oldest' : 'newest'} purchased result first`}
                >
                  {newestResultsFirst ? 'Newest first ↓' : 'Oldest first ↑'}
                </button>
              ) : null}
            </div>
          </div>
          <div className="panel-scroll">
            {state.purchases.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <span aria-hidden="true">＋</span>
                <p>Purchased history, examinations, and tests appear here immediately.</p>
              </div>
            ) : (
              <ol className="result-list">
                {displayedPurchases.map((purchase) => {
                  const action = catalogs.informationActions.find(
                    (candidate) => candidate.id === purchase.actionId,
                  );
                  return (
                    <li key={purchase.actionId}>
                      <ResultCard
                        purchase={purchase}
                        actionLabel={action?.label ?? purchase.actionId}
                      />
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        <section
          id="mobile-panel-investigate"
          className="action-panel panel"
          data-mobile-pane="investigate"
          role="tabpanel"
          aria-labelledby="mobile-tab-investigate action-menu-title"
        >
          <div className="fixed-panel-heading">
            <p className="panel-kicker">Investigate</p>
            <div className="panel-title-line">
              <h2 id="action-menu-title">Information</h2>
              <span>{catalogs.informationActions.length} available</span>
            </div>
            <label className="visually-hidden" htmlFor="action-search">
              Search information and tests
            </label>
            <input
              id="action-search"
              className="search-input compact-search"
              type="search"
              value={informationSearch}
              onChange={(event) => setInformationSearch(event.target.value)}
              placeholder="Search information and tests…"
            />
            <div className="segmented-tabs" role="tablist" aria-label="Information category">
              {INFORMATION_CATEGORIES.map((item) => {
                const count = catalogs.informationActions.filter(
                  (action) => caseActionIds.has(action.id) && action.category === item.id,
                ).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={informationCategory === item.id}
                    className={informationCategory === item.id ? 'active' : undefined}
                    onClick={() => setInformationCategory(item.id)}
                  >
                    {item.label} <small>{count}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="panel-scroll compact-option-list" role="tabpanel">
            {actions.map((action) => {
              const purchased = state.purchases.some((purchase) => purchase.actionId === action.id);
              const quote = getInformationActionQuote(state, action.id, catalogs);
              const cost = quote.ok ? quote.value.method.operatingCost : null;
              const isSendout = quote.ok && quote.value.method.kind !== 'in_house';
              return (
                <button
                  key={action.id}
                  type="button"
                  className="compact-option-row"
                  onClick={() => buy(action.id)}
                  disabled={readOnly || purchased || cost === null}
                  aria-label={`${action.label}, ${cost ?? 'unavailable'} points${isSendout ? ', sendout' : ', in house'}${purchased ? ', revealed' : ''}`}
                >
                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <span className="service-quote">
                    {isSendout ? <em className="service-badge">Sendout</em> : null}
                    <b>{purchased ? 'Revealed' : cost === null ? '—' : `${cost} pts`}</b>
                  </span>
                </button>
              );
            })}
            {actions.length === 0 ? <p className="no-results">No matching options.</p> : null}
          </div>
        </section>

        <aside
          id="mobile-panel-treatment"
          className="treatment-panel panel"
          data-mobile-pane="treatment"
          role="tabpanel"
          aria-labelledby="mobile-tab-treatment treatment-title"
        >
          <div className="fixed-panel-heading treatment-compact-heading">
            <div className="panel-title-line">
              <div>
                <p className="panel-kicker">Final combination</p>
                <h2 id="treatment-title">Treatment</h2>
              </div>
              <span className="count-badge">{selectedTreatmentCount}</span>
            </div>
            <p className="edit-note">Editable until submission. Scoring appears afterward.</p>
            <label className="visually-hidden" htmlFor="treatment-search">
              Search medications, non-medication interventions, and dispositions
            </label>
            <input
              id="treatment-search"
              className="search-input compact-search"
              type="search"
              value={treatmentSearch}
              onChange={(event) => setTreatmentSearch(event.target.value)}
              placeholder="Search all treatment options…"
            />
          </div>

          <div className="panel-scroll treatment-scroll">
            <section className="treatment-picker" aria-labelledby="medication-picker-title">
              <h3 id="medication-picker-title">Medication</h3>
              <div className="segmented-tabs medication-tabs" aria-label="Medication action">
                {MEDICATION_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={medicationMode === mode.id ? 'active' : undefined}
                    aria-pressed={medicationMode === mode.id}
                    onClick={() => setMedicationMode(mode.id)}
                  >
                    {mode.label} <small>{state.selections[mode.id].length || ''}</small>
                  </button>
                ))}
              </div>
              <div className="picker-options">
                {medications.map((medication) => {
                  const selected = state.selections[medicationMode].includes(medication.id);
                  return (
                    <button
                      key={medication.id}
                      type="button"
                      className={`picker-option${selected ? ' selected' : ''}`}
                      aria-pressed={selected}
                      disabled={readOnly}
                      onClick={() => toggle(medicationMode, medication.id)}
                    >
                      <span>
                        <strong>{medication.label}</strong>
                        <small>{medication.classes.join(' · ')}</small>
                      </span>
                      <b>{selected ? '✓' : '+'}</b>
                    </button>
                  );
                })}
                {medications.length === 0 ? (
                  <p className="no-results">No matching medications.</p>
                ) : null}
              </div>
            </section>

            <section className="treatment-picker" aria-labelledby="nonmedication-picker-title">
              <h3 id="nonmedication-picker-title">Non-medication</h3>
              <div className="picker-options">
                {interventions.map((intervention) => {
                  const selected = state.selections.interventionIds.includes(intervention.id);
                  return (
                    <button
                      key={intervention.id}
                      type="button"
                      className={`picker-option${selected ? ' selected' : ''}`}
                      aria-pressed={selected}
                      disabled={readOnly}
                      onClick={() => toggle('interventionIds', intervention.id)}
                    >
                      <span>
                        <strong>{intervention.label}</strong>
                      </span>
                      <b>{selected ? '✓' : '+'}</b>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              className="treatment-picker disposition-picker"
              aria-labelledby="disposition-picker-title"
            >
              <h3 id="disposition-picker-title">Disposition</h3>
              <div className="picker-options">
                {dispositions.map((disposition) => {
                  const selected = state.selections.dispositionId === disposition.id;
                  return (
                    <button
                      key={disposition.id}
                      type="button"
                      className={`picker-option${selected ? ' selected' : ''}`}
                      aria-pressed={selected}
                      disabled={readOnly}
                      onClick={() =>
                        update({
                          ...state.selections,
                          dispositionId: selected ? null : disposition.id,
                        })
                      }
                    >
                      <span>
                        <strong>{disposition.label}</strong>
                      </span>
                      <b>{selected ? '●' : '○'}</b>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {readOnly ? (
            <div className="lock-row compact-lock-row locked-treatment-note">
              Treatment locked · review context only
            </div>
          ) : (
            <div className="lock-row compact-lock-row">
              <button
                className="primary-button large-button"
                type="button"
                onClick={onSubmit}
                disabled={state.selections.dispositionId === null}
              >
                Lock in treatment
              </button>
            </div>
          )}
        </aside>
      </div>

      {latestPurchase ? (
        <dialog
          ref={purchaseDialogRef}
          className="mobile-purchase-dialog"
          aria-labelledby="mobile-purchase-title"
          onCancel={(event) => {
            event.preventDefault();
            dismissLatestPurchase();
          }}
        >
          <div className="mobile-purchase-dialog-card">
            <div className="mobile-purchase-dialog-heading">
              <div>
                <p className="panel-kicker">Result added</p>
                <h2 id="mobile-purchase-title">{latestAction?.label ?? latestPurchase.actionId}</h2>
              </div>
              <button
                className="text-button"
                type="button"
                autoFocus
                onClick={() => dismissLatestPurchase()}
                aria-label="Dismiss purchased result"
              >
                Close
              </button>
            </div>
            <ResultCard
              purchase={latestPurchase}
              actionLabel={latestAction?.label ?? latestPurchase.actionId}
            />
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                dismissLatestPurchase(false);
                onMobilePaneChange('revealed');
                window.requestAnimationFrame(() => {
                  document.getElementById('mobile-tab-revealed')?.focus();
                });
              }}
            >
              View revealed information
            </button>
          </div>
        </dialog>
      ) : null}
    </main>
  );
}
