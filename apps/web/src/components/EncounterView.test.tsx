// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { catalogs, prototypeCaseBlueprint, startingClinic } from '@psychsim/content-runtime';
import { instantiateCase, purchaseInformationAction, startEncounter } from '@psychsim/engine';

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
});
