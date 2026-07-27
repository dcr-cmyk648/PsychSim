import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CatalogBundle,
  EncounterState,
  InformationActionCategory,
  InformationPurchase,
  PlayerDiagnosisSelection,
  TreatmentSelection,
} from '@psychsim/schemas';
import {
  getInformationActionQuote,
  getAvailableStartMedicationIds,
  purchaseInformationAction,
  quoteTreatmentOperatingCosts,
  quoteTreatmentService,
  updateDiagnosisSelections,
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
type PlanTab = 'diagnosis' | 'medication' | 'nonmedication' | 'disposition';

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

const PLAN_TABS: ReadonlyArray<{ id: PlanTab; label: string }> = [
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'medication', label: 'Medication' },
  { id: 'nonmedication', label: 'Non-medication' },
  { id: 'disposition', label: 'Disposition' },
];

const normalizeSearch = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim();

const includesSearch = (search: string, ...values: Array<string | undefined>): boolean => {
  const tokens = normalizeSearch(search).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const searchable = normalizeSearch(values.filter(Boolean).join(' '));
  return tokens.every((token) => searchable.includes(token));
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
  const narrativeGroups = narrativeFindings.reduce<
    Array<{ label: string | null; findings: typeof narrativeFindings }>
  >((groups, finding) => {
    const label = finding.groupLabel ?? null;
    const existing = groups.find((group) => group.label === label);
    if (existing) existing.findings.push(finding);
    else groups.push({ label, findings: [finding] });
    return groups;
  }, []);

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
        <div className="finding-groups">
          {narrativeGroups.map((group, groupIndex) => {
            const headingId = group.label
              ? `${purchase.actionId.replaceAll('.', '-')}-group-${groupIndex + 1}`
              : undefined;
            return (
              <section className="finding-group" key={group.label ?? 'ungrouped'}>
                {group.label ? (
                  <h4 className="finding-group-title" id={headingId}>
                    {group.label}
                  </h4>
                ) : null}
                <ul className="finding-list" aria-labelledby={headingId}>
                  {group.findings.map((finding) => (
                    <li
                      key={finding.id}
                      className={`finding-row ${
                        finding.outcomeDisplay === 'value_only'
                          ? 'outcome-value-only'
                          : `outcome-${finding.outcome}`
                      }`}
                    >
                      <span className="finding-content">
                        {finding.outcomeDisplay !== 'value_only' ? (
                          <span className={`finding-outcome-chip outcome-${finding.outcome}`}>
                            {findingOutcomeLabel(finding.outcome)}
                          </span>
                        ) : null}
                        <span>{finding.label}</span>
                        {finding.valueText ? <small>{finding.valueText}</small> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
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
  const [planTab, setPlanTab] = useState<PlanTab>('diagnosis');
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
          includesSearch(
            informationSearch,
            action.label,
            action.description,
            ...action.searchAliases,
          ),
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
      includesSearch(
        treatmentSearch,
        medication.label,
        ...medication.searchAliases,
        ...medication.classes,
      ),
    );
  const diagnoses = catalogs.diagnoses
    .filter((diagnosis) => diagnosis.selectableInGameplay)
    .filter((diagnosis) =>
      includesSearch(treatmentSearch, diagnosis.label, ...diagnosis.searchAliases),
    );
  const interventions = state.caseInstance.availableTreatments.interventionIds
    .map((id) => catalogs.treatments.find((treatment) => treatment.id === id))
    .filter((treatment) => treatment !== undefined)
    .filter((treatment) =>
      includesSearch(
        treatmentSearch,
        treatment.label,
        treatment.category,
        ...treatment.searchAliases,
      ),
    );
  const dispositions = state.caseInstance.availableTreatments.dispositionIds
    .map((id) => catalogs.treatments.find((treatment) => treatment.id === id))
    .filter((treatment) => treatment !== undefined)
    .filter((treatment) =>
      includesSearch(
        treatmentSearch,
        treatment.label,
        treatment.category,
        ...treatment.searchAliases,
      ),
    );

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

  const reopenPurchase = (actionId: string): void => {
    if (!state.purchases.some((purchase) => purchase.actionId === actionId)) return;
    purchaseTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setLatestPurchaseActionId(actionId);
    setMessage(null);
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

  const updateDiagnoses = (next: readonly PlayerDiagnosisSelection[]): void => {
    if (readOnly) return;
    const result = updateDiagnosisSelections(state, next, catalogs);
    if (result.ok) {
      onStateChange(result.value);
      setMessage(null);
    } else {
      setMessage(result.error.message);
    }
  };

  const toggleDiagnosis = (diagnosisId: string): void => {
    const selected = state.diagnosisSelections.some(
      (selection) => selection.diagnosisId === diagnosisId,
    );
    updateDiagnoses(
      selected
        ? state.diagnosisSelections.filter((selection) => selection.diagnosisId !== diagnosisId)
        : [...state.diagnosisSelections, { diagnosisId, severityId: null, specifierIds: [] }],
    );
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
  const selectedPlanCount = state.diagnosisSelections.length + selectedTreatmentCount;
  const planTabSelectedCount: Record<PlanTab, number> = {
    diagnosis: state.diagnosisSelections.length,
    medication:
      state.selections.startMedicationIds.length +
      state.selections.stopMedicationIds.length +
      state.selections.continueMedicationIds.length,
    nonmedication: state.selections.interventionIds.length,
    disposition: state.selections.dispositionId ? 1 : 0,
  };
  const movePlanTabFocus = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: PlanTab,
  ): void => {
    const currentIndex = PLAN_TABS.findIndex((tab) => tab.id === currentTab);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? PLAN_TABS.length - 1
          : event.key === 'ArrowRight'
            ? (currentIndex + 1) % PLAN_TABS.length
            : event.key === 'ArrowLeft'
              ? (currentIndex - 1 + PLAN_TABS.length) % PLAN_TABS.length
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const nextTab = PLAN_TABS[nextIndex]!;
    setPlanTab(nextTab.id);
    setTreatmentSearch('');
    document.getElementById(`plan-tab-${nextTab.id}`)?.focus();
  };
  const moveInformationCategoryFocus = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentCategory: InformationActionCategory,
  ): void => {
    const currentIndex = INFORMATION_CATEGORIES.findIndex(
      (category) => category.id === currentCategory,
    );
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? INFORMATION_CATEGORIES.length - 1
          : event.key === 'ArrowRight'
            ? (currentIndex + 1) % INFORMATION_CATEGORIES.length
            : event.key === 'ArrowLeft'
              ? (currentIndex - 1 + INFORMATION_CATEGORIES.length) % INFORMATION_CATEGORIES.length
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const nextCategory = INFORMATION_CATEGORIES[nextIndex]!;
    setInformationCategory(nextCategory.id);
    document.getElementById(`information-tab-${nextCategory.id}`)?.focus();
  };
  const treatmentCostQuote = quoteTreatmentOperatingCosts(state, catalogs);
  const selectedTreatmentExpense = treatmentCostQuote.ok
    ? treatmentCostQuote.value.totalOperatingCost
    : 0;
  const visibleOperatingExpense = state.expenseTotal + selectedTreatmentExpense;
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
            <dt>Operating cost</dt>
            <dd>{visibleOperatingExpense.toLocaleString()} pts</dd>
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
            <>
              <h2>Known medications</h2>
              {state.caseInstance.opening.medicationListStatus === 'provided' ? (
                <ul>
                  {state.caseInstance.opening.knownMedicationIds.map((id) => (
                    <li key={id}>{medicationLabel(id)}</li>
                  ))}
                </ul>
              ) : state.caseInstance.opening.medicationListStatus === 'verified_none' ? (
                <p>No current medications reported after reconciliation.</p>
              ) : (
                <p>Medication list not yet reconciled.</p>
              )}
            </>
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
                    id={`information-tab-${item.id}`}
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={informationCategory === item.id}
                    aria-controls="information-options-panel"
                    tabIndex={informationCategory === item.id ? 0 : -1}
                    className={informationCategory === item.id ? 'active' : undefined}
                    onClick={() => setInformationCategory(item.id)}
                    onKeyDown={(event) => moveInformationCategoryFocus(event, item.id)}
                  >
                    {item.label} <small>{count}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div
            id="information-options-panel"
            className="panel-scroll compact-option-list"
            role="tabpanel"
            aria-labelledby={`information-tab-${informationCategory}`}
          >
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
                  onClick={() => (purchased ? reopenPurchase(action.id) : buy(action.id))}
                  disabled={(!purchased && readOnly) || (!purchased && cost === null)}
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
                <p className="panel-kicker">Final answer</p>
                <h2 id="treatment-title">Plan</h2>
              </div>
              <span className="count-badge">{selectedPlanCount}</span>
            </div>
            <p className="edit-note">Editable until submission. Scoring appears afterward.</p>
            <label className="visually-hidden" htmlFor="treatment-search">
              Search the active diagnosis or treatment section
            </label>
            <input
              id="treatment-search"
              className="search-input compact-search"
              type="search"
              value={treatmentSearch}
              onChange={(event) => setTreatmentSearch(event.target.value)}
              placeholder={`Search ${PLAN_TABS.find((tab) => tab.id === planTab)?.label.toLowerCase()}…`}
            />
            <div
              className="segmented-tabs plan-tabs"
              role="tablist"
              aria-label="Final answer section"
            >
              {PLAN_TABS.map((tab) => (
                <button
                  id={`plan-tab-${tab.id}`}
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={planTab === tab.id}
                  aria-controls={planTab === tab.id ? `plan-panel-${tab.id}` : undefined}
                  tabIndex={planTab === tab.id ? 0 : -1}
                  className={planTab === tab.id ? 'active' : undefined}
                  onClick={() => {
                    setPlanTab(tab.id);
                    setTreatmentSearch('');
                  }}
                  onKeyDown={(event) => movePlanTabFocus(event, tab.id)}
                >
                  {tab.label} <small>{planTabSelectedCount[tab.id] || ''}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-scroll treatment-scroll">
            {planTab === 'diagnosis' ? (
              <section
                id="plan-panel-diagnosis"
                className="treatment-picker"
                role="tabpanel"
                aria-labelledby="plan-tab-diagnosis"
              >
                <p className="search-result-count" role="status">
                  {diagnoses.length} matching {diagnoses.length === 1 ? 'diagnosis' : 'diagnoses'}
                </p>
                <div className="picker-options">
                  {diagnoses.map((diagnosis) => {
                    const selected = state.diagnosisSelections.some(
                      (selection) => selection.diagnosisId === diagnosis.id,
                    );
                    return (
                      <button
                        key={diagnosis.id}
                        type="button"
                        className={`picker-option${selected ? ' selected' : ''}`}
                        aria-pressed={selected}
                        disabled={readOnly}
                        onClick={() => toggleDiagnosis(diagnosis.id)}
                      >
                        <span>
                          <strong>{diagnosis.label}</strong>
                        </span>
                        <b aria-hidden="true">{selected ? '✓' : '+'}</b>
                      </button>
                    );
                  })}
                  {diagnoses.length === 0 ? (
                    <p className="no-results">No matching diagnoses.</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {planTab === 'medication' ? (
              <section
                id="plan-panel-medication"
                className="treatment-picker"
                role="tabpanel"
                aria-labelledby="plan-tab-medication"
              >
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
                <p className="search-result-count" role="status">
                  {medications.length} matching{' '}
                  {medications.length === 1 ? 'medication' : 'medications'}
                </p>
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
                        <b aria-hidden="true">{selected ? '✓' : '+'}</b>
                      </button>
                    );
                  })}
                  {medications.length === 0 ? (
                    <p className="no-results">No matching medications.</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {planTab === 'nonmedication' ? (
              <section
                id="plan-panel-nonmedication"
                className="treatment-picker"
                role="tabpanel"
                aria-labelledby="plan-tab-nonmedication"
              >
                <p className="search-result-count" role="status">
                  {interventions.length} matching{' '}
                  {interventions.length === 1 ? 'intervention' : 'interventions'}
                </p>
                <div className="picker-options">
                  {interventions.map((intervention) => {
                    const selected = state.selections.interventionIds.includes(intervention.id);
                    const quote = quoteTreatmentService(intervention.id, state, catalogs);
                    const serviceQuote = quote.ok ? quote.value : null;
                    const unavailable = !quote.ok;
                    return (
                      <button
                        key={intervention.id}
                        type="button"
                        className={`picker-option${selected ? ' selected' : ''}`}
                        aria-pressed={selected}
                        disabled={readOnly || unavailable}
                        onClick={() => toggle('interventionIds', intervention.id)}
                      >
                        <span>
                          <strong>{intervention.label}</strong>
                          {serviceQuote ? (
                            <small>
                              {serviceQuote.operatingCost} pts · {serviceQuote.fulfillmentLabel}
                            </small>
                          ) : unavailable ? (
                            <small>Unavailable in this setting</small>
                          ) : null}
                        </span>
                        <b aria-hidden="true">{selected ? '✓' : '+'}</b>
                      </button>
                    );
                  })}
                  {interventions.length === 0 ? (
                    <p className="no-results">No matching interventions.</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {planTab === 'disposition' ? (
              <section
                id="plan-panel-disposition"
                className="treatment-picker disposition-picker"
                role="tabpanel"
                aria-labelledby="plan-tab-disposition"
              >
                <p className="search-result-count" role="status">
                  {dispositions.length} matching{' '}
                  {dispositions.length === 1 ? 'disposition' : 'dispositions'}
                </p>
                <div className="picker-options">
                  {dispositions.map((disposition) => {
                    const selected = state.selections.dispositionId === disposition.id;
                    const quote = quoteTreatmentService(disposition.id, state, catalogs);
                    const serviceQuote = quote.ok ? quote.value : null;
                    const unavailable = !quote.ok;
                    return (
                      <button
                        key={disposition.id}
                        type="button"
                        className={`picker-option${selected ? ' selected' : ''}`}
                        aria-pressed={selected}
                        disabled={readOnly || unavailable}
                        onClick={() =>
                          update({
                            ...state.selections,
                            dispositionId: selected ? null : disposition.id,
                          })
                        }
                      >
                        <span>
                          <strong>{disposition.label}</strong>
                          {serviceQuote ? (
                            <small>
                              {serviceQuote.operatingCost} pts · {serviceQuote.fulfillmentLabel}
                            </small>
                          ) : unavailable ? (
                            <small>Unavailable in this setting</small>
                          ) : null}
                        </span>
                        <b aria-hidden="true">{selected ? '●' : '○'}</b>
                      </button>
                    );
                  })}
                  {dispositions.length === 0 ? (
                    <p className="no-results">No matching dispositions.</p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          {readOnly ? (
            <div className="lock-row compact-lock-row locked-treatment-note">
              Final answer locked · review context only
            </div>
          ) : (
            <div className="lock-row compact-lock-row">
              <button
                className="primary-button large-button"
                type="button"
                onClick={onSubmit}
                disabled={state.selections.dispositionId === null}
              >
                Lock in final answer
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
                onClick={() => {
                  dismissLatestPurchase(false);
                  onMobilePaneChange('revealed');
                  window.requestAnimationFrame(() => {
                    document.getElementById('mobile-tab-revealed')?.focus();
                  });
                }}
              >
                View in Revealed information
              </button>
            </div>
            <ResultCard
              purchase={latestPurchase}
              actionLabel={latestAction?.label ?? latestPurchase.actionId}
            />
            <button
              className="primary-button"
              type="button"
              autoFocus
              onClick={() => dismissLatestPurchase()}
            >
              Close
            </button>
          </div>
        </dialog>
      ) : null}
    </main>
  );
}
