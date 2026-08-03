import { useEffect, useMemo, useState } from 'react';

import { LazyDisclosure } from './LazyDisclosure';

export interface DeveloperPatientMakerCaseOption {
  readonly blueprintId: string;
  readonly contentVersion: string;
  readonly label: string;
  readonly authoredComplexityBudget: number;
  readonly maximumSelectedModules: number;
  readonly settingLabels: readonly string[];
}

export type DeveloperPatientMakerGenerateResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

interface DeveloperPatientMakerProps {
  cases: readonly DeveloperPatientMakerCaseOption[];
  onGenerate: (
    blueprintId: string,
    authoredComplexityBudget: number,
  ) => Promise<DeveloperPatientMakerGenerateResult>;
}

export function DeveloperPatientMaker({ cases, onGenerate }: DeveloperPatientMakerProps) {
  const budgets = useMemo(
    () =>
      [...new Set(cases.map((candidate) => candidate.authoredComplexityBudget))].sort(
        (left, right) => left - right,
      ),
    [cases],
  );
  const [selectedBudget, setSelectedBudget] = useState(budgets[0] ?? 0);
  const eligibleCases = useMemo(
    () =>
      cases
        .filter((candidate) => candidate.authoredComplexityBudget === selectedBudget)
        .sort(
          (left, right) =>
            left.label.localeCompare(right.label) ||
            left.contentVersion.localeCompare(right.contentVersion),
        ),
    [cases, selectedBudget],
  );
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(
    eligibleCases[0]?.blueprintId ?? '',
  );
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!budgets.includes(selectedBudget)) setSelectedBudget(budgets[0] ?? 0);
  }, [budgets, selectedBudget]);

  useEffect(() => {
    if (!eligibleCases.some((candidate) => candidate.blueprintId === selectedBlueprintId)) {
      setSelectedBlueprintId(eligibleCases[0]?.blueprintId ?? '');
    }
    setStatus(null);
  }, [eligibleCases, selectedBlueprintId]);

  const selectedCase =
    eligibleCases.find((candidate) => candidate.blueprintId === selectedBlueprintId) ?? null;

  const generate = async (): Promise<void> => {
    if (!selectedCase || generating) return;
    setGenerating(true);
    setStatus(null);
    try {
      const result = await onGenerate(selectedCase.blueprintId, selectedBudget);
      if (!result.ok) setStatus(result.message);
    } catch (caught) {
      setStatus(
        caught instanceof Error ? caught.message : 'The selected patient could not be generated.',
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <LazyDisclosure
      className="developer-patient-maker developer-major-disclosure"
      summary={
        <>
          <span>
            <small>Local deterministic tool</small>
            <strong id="developer-patient-maker-title">Patient Maker</strong>
          </span>
          <span className="count-badge">{cases.length} playable</span>
        </>
      }
    >
      {() => (
        <div className="developer-patient-maker-body">
          <p>
            Generate one new patient from an end-to-end validated case. The budget is the case’s
            authored optional-complexity envelope; this checkpoint filters cases by that exact value
            and does not invent unsupported complications.
          </p>
          <div className="developer-patient-maker-controls">
            <label htmlFor="developer-patient-maker-budget">
              Complexity budget
              <select
                id="developer-patient-maker-budget"
                value={selectedBudget}
                onChange={(event) => setSelectedBudget(Number(event.target.value))}
              >
                {budgets.map((budget) => (
                  <option key={budget} value={budget}>
                    {budget} optional-complexity point{budget === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="developer-patient-maker-case">
              Playable case
              <select
                id="developer-patient-maker-case"
                value={selectedBlueprintId}
                onChange={(event) => setSelectedBlueprintId(event.target.value)}
              >
                {eligibleCases.map((candidate) => (
                  <option key={candidate.blueprintId} value={candidate.blueprintId}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedCase ? (
            <dl className="developer-patient-maker-summary">
              <div>
                <dt>Case version</dt>
                <dd>{selectedCase.contentVersion}</dd>
              </div>
              <div>
                <dt>Optional modules</dt>
                <dd>Up to {selectedCase.maximumSelectedModules}</dd>
              </div>
              <div>
                <dt>Compatible settings</dt>
                <dd>{selectedCase.settingLabels.join(', ')}</dd>
              </div>
            </dl>
          ) : (
            <p role="status">No validated playable case owns this complexity budget.</p>
          )}
          <div className="developer-patient-maker-actions">
            <button
              className="primary-button"
              type="button"
              disabled={!selectedCase || generating}
              onClick={() => void generate()}
            >
              {generating ? 'Generating…' : 'Generate and open patient'}
            </button>
            <small>
              The generated patient is frozen into the Developer queue before the chart opens.
            </small>
          </div>
          {status ? (
            <p className="ticket-tool-status" role="alert">
              {status}
            </p>
          ) : null}
        </div>
      )}
    </LazyDisclosure>
  );
}
