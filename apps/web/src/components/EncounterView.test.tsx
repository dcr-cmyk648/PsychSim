// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { catalogs, prototypeCaseBlueprint, startingClinic } from '@psychsim/content-runtime';
import {
  instantiateCase,
  purchaseInformationAction,
  requireCompleted,
  startEncounter,
} from '@psychsim/engine';

import { EncounterView } from './EncounterView';

afterEach(cleanup);

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

  it('marks present symptoms with one explicit outcome chip', () => {
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
    const marker = within(findingRow).getByText(
      presentFinding.outcome === 'positive' ? 'Positive' : 'Present',
      { selector: '.finding-outcome-chip' },
    );
    expect(marker).toHaveClass(`outcome-${presentFinding.outcome}`);
  });

  it('renders absent findings as explicit, visually grouped negative results', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'negative-marker-display', catalogs);
    const started = startEncounter(instance, startingClinic, 'location.solo-office.outpatient');
    const purchased = requireCompleted(
      purchaseInformationAction(started, 'info.history.mania', catalogs),
    );
    const absentFinding = purchased.purchases[0]!.result.findings.find(
      (finding) => finding.outcome === 'absent' || finding.outcome === 'negative',
    );
    if (!absentFinding) throw new Error('Expected an absent mania finding fixture.');

    render(
      <EncounterView
        state={purchased}
        catalogs={catalogs}
        onStateChange={vi.fn()}
        onSubmit={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const findingRow = screen.getByText(absentFinding.label).closest('li');
    if (!findingRow) throw new Error('Expected a rendered negative finding row.');
    expect(findingRow).toHaveClass('finding-row', `outcome-${absentFinding.outcome}`);
    expect(
      within(findingRow).getByText(absentFinding.outcome === 'negative' ? 'Negative' : 'Absent', {
        selector: '.finding-outcome-chip',
      }),
    ).toBeVisible();
    expect(within(findingRow).queryByText('−')).not.toBeInTheDocument();
  });

  it('searches the combined medication, therapy, and disposition menu', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'treatment-search', catalogs);
    const started = startEncounter(instance, startingClinic, 'location.solo-office.outpatient');

    render(
      <EncounterView
        state={started}
        catalogs={catalogs}
        onStateChange={vi.fn()}
        onSubmit={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const search = screen.getByRole('searchbox', {
      name: 'Search medications, non-medication interventions, and dispositions',
    });
    fireEvent.change(search, { target: { value: 'sertraline' } });
    expect(screen.getByRole('button', { name: /Sertraline/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Fluoxetine/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Cognitive behavioral therapy/ }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'therapy' } });
    expect(screen.getByRole('button', { name: /Cognitive behavioral therapy/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Sertraline/ })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'outpatient' } });
    expect(screen.getByRole('button', { name: /Close outpatient follow-up/i })).toBeVisible();
  });
});
