// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';

import { LazyDisclosure } from './LazyDisclosure';

afterEach(cleanup);

const toggle = (details: HTMLDetailsElement, open: boolean): void => {
  details.open = open;
  fireEvent(details, new Event('toggle'));
};

describe('LazyDisclosure', () => {
  it('mounts lazily and preserves unsaved child state after collapse and reopen', () => {
    render(
      <LazyDisclosure summary="Review question">
        {() => (
          <label>
            Draft response
            <textarea />
          </label>
        )}
      </LazyDisclosure>,
    );

    expect(screen.queryByLabelText('Draft response')).not.toBeInTheDocument();
    const details = screen.getByText('Review question').closest('details')!;
    toggle(details, true);
    const response = screen.getByLabelText('Draft response');
    fireEvent.change(response, { target: { value: 'Unsaved clinical judgment' } });
    toggle(details, false);
    expect(response).not.toBeVisible();
    toggle(details, true);
    expect(screen.getByLabelText('Draft response')).toHaveValue('Unsaved clinical judgment');
  });
});
