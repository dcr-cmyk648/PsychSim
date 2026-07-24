// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { catalogs, prototypeCaseBlueprint, startingClinic } from '@psychsim/content-runtime';
import {
  instantiateCase,
  purchaseInformationAction,
  requireCompleted,
  startEncounter,
} from '@psychsim/engine';

import { EncounterView } from './EncounterView';

describe('EncounterView laboratory results', () => {
  it('shows numeric results with unit, reference interval, and an EMR-style flag', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'lab-display', catalogs);
    const started = startEncounter(instance, startingClinic, 'location.solo-office.outpatient');
    const purchased = purchaseInformationAction(started, 'info.labs.tsh', catalogs);
    if (!purchased.ok) throw new Error(purchased.error.message);
    const finding = purchased.value.purchases[0]!.result.findings[0]!;
    const measurement = finding.numericMeasurement!;

    render(
      <EncounterView
        state={purchased.value}
        catalogs={catalogs}
        onStateChange={vi.fn()}
        onSubmit={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Reference interval' })).toBeVisible();
    expect(within(table).getByText(measurement.referenceInterval.display)).toBeVisible();
    expect(
      within(table).getByText(`${measurement.displayValue} ${measurement.unit}`),
    ).toBeVisible();
    expect(
      within(table).getByLabelText(
        finding.outcome === 'high' ? 'High' : finding.outcome === 'low' ? 'Low' : 'Normal',
      ),
    ).toBeVisible();
  });

  it('uses directional glyphs and abnormal-result classes for high and low values', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'abnormal-lab-display', catalogs);
    const started = startEncounter(instance, startingClinic, 'location.solo-office.outpatient');
    const purchased = requireCompleted(
      purchaseInformationAction(started, 'info.labs.tsh', catalogs),
    );
    const scenarios = [
      { outcome: 'high' as const, label: 'High', glyph: '↑' },
      { outcome: 'low' as const, label: 'Low', glyph: '↓' },
    ];

    for (const scenario of scenarios) {
      const abnormalState = {
        ...purchased,
        purchases: purchased.purchases.map((purchase, purchaseIndex) =>
          purchaseIndex === 0
            ? {
                ...purchase,
                result: {
                  ...purchase.result,
                  findings: purchase.result.findings.map((finding, findingIndex) =>
                    findingIndex === 0 ? { ...finding, outcome: scenario.outcome } : finding,
                  ),
                },
              }
            : purchase,
        ),
      };
      const view = render(
        <EncounterView
          state={abnormalState}
          catalogs={catalogs}
          onStateChange={vi.fn()}
          onSubmit={vi.fn()}
          onExit={vi.fn()}
        />,
      );

      const flag = screen.getByLabelText(scenario.label);
      expect(flag).toHaveTextContent(scenario.glyph);
      expect(flag).toHaveClass('lab-flag', `outcome-${scenario.outcome}`);
      view.unmount();
    }
  });

  it('marks present symptoms with a plus and the positive-outcome class', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'symptom-marker-display', catalogs);
    const started = startEncounter(instance, startingClinic, 'location.solo-office.outpatient');
    const purchased = requireCompleted(
      purchaseInformationAction(started, 'info.history.depressive-symptoms', catalogs),
    );
    const presentFinding = purchased.purchases[0]!.result.findings.find(
      (finding) => finding.outcome === 'present' || finding.outcome === 'positive',
    );
    if (!presentFinding) throw new Error('Expected a present depressive symptom fixture.');

    render(
      <EncounterView
        state={purchased}
        catalogs={catalogs}
        onStateChange={vi.fn()}
        onSubmit={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const findingRow = screen.getByText(presentFinding.label).closest('li');
    if (!findingRow) throw new Error('Expected a rendered symptom row.');
    const marker = within(findingRow).getByLabelText(
      presentFinding.outcome === 'positive' ? 'Positive' : 'Present',
    );
    expect(marker).toHaveTextContent('+');
    expect(marker).toHaveClass(`outcome-${presentFinding.outcome}`);
  });
});
