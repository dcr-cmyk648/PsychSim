// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeveloperPatientMaker } from './DeveloperPatientMaker';

afterEach(cleanup);

const toggle = (details: HTMLDetailsElement, open: boolean): void => {
  details.open = open;
  fireEvent(details, new Event('toggle'));
};

describe('DeveloperPatientMaker', () => {
  it('stays collapsed, filters by exact authored budget, and generates the selected playable case', async () => {
    const onGenerate = vi.fn().mockResolvedValue({ ok: true });
    render(
      <DeveloperPatientMaker
        cases={[
          {
            blueprintId: 'case.test.basic',
            contentVersion: '1.0.0',
            label: 'Basic case',
            authoredComplexityBudget: 1,
            maximumSelectedModules: 1,
            settingLabels: ['Outpatient'],
          },
          {
            blueprintId: 'case.test.complex',
            contentVersion: '2.0.0',
            label: 'Complex case',
            authoredComplexityBudget: 3,
            maximumSelectedModules: 2,
            settingLabels: ['Emergency department', 'Consultation-liaison'],
          },
        ]}
        onGenerate={onGenerate}
      />,
    );

    expect(screen.queryByLabelText('Complexity budget')).not.toBeInTheDocument();
    const details = screen.getByText('Patient Maker').closest('details')!;
    toggle(details, true);

    expect(screen.getByLabelText('Playable case')).toHaveValue('case.test.basic');
    fireEvent.change(screen.getByLabelText('Complexity budget'), { target: { value: '3' } });
    expect(screen.getByLabelText('Playable case')).toHaveValue('case.test.complex');
    expect(screen.getByText('Emergency department, Consultation-liaison')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Generate and open patient' }));
    await waitFor(() => expect(onGenerate).toHaveBeenCalledWith('case.test.complex', 3));
  });
});
