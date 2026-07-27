// @vitest-environment jsdom

import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EncounterScratchpad } from './EncounterScratchpad';

afterEach(cleanup);

function ControlledScratchpad({ onFlush }: { onFlush: () => Promise<string> }) {
  const [note, setNote] = useState('');
  return (
    <EncounterScratchpad
      patientLabel="Morgan Hale"
      note={note}
      status={note ? 'saved' : 'ready'}
      error={null}
      onChange={setNote}
      onFlush={onFlush}
    />
  );
}

describe('EncounterScratchpad', () => {
  it('opens from one accessible compact control and closes with Escape', async () => {
    const onFlush = vi.fn(async () => '');
    render(<ControlledScratchpad onFlush={onFlush} />);

    const toggle = screen.getByRole('button', { name: /case notes/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('textbox', {
        name: /record clinical, scoring, content, or general app observations/i,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const textarea = screen.getByRole('textbox', {
      name: /record clinical, scoring, content, or general app observations/i,
    });
    fireEvent.change(textarea, {
      target: { value: 'I expected the mania-history question to affect this choice.' },
    });

    expect(textarea).toHaveValue('I expected the mania-history question to affect this choice.');
    expect(screen.getByText('Saved locally')).toBeVisible();

    fireEvent.keyDown(textarea, { key: 'Escape' });
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it('flushes the current note when the editor loses focus', () => {
    const onFlush = vi.fn(async () => 'Draft');
    render(<ControlledScratchpad onFlush={onFlush} />);

    fireEvent.click(screen.getByRole('button', { name: /case notes/i }));
    const textarea = screen.getByRole('textbox', {
      name: /record clinical, scoring, content, or general app observations/i,
    });
    fireEvent.change(textarea, { target: { value: 'Draft' } });
    fireEvent.blur(textarea);

    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it('keeps the editor open when its final save fails', async () => {
    const onFlush = vi.fn(async () => {
      throw new Error('IndexedDB unavailable');
    });
    render(<ControlledScratchpad onFlush={onFlush} />);

    const toggle = screen.getByRole('button', { name: /case notes/i });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(onFlush).toHaveBeenCalled());
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', {
          name: /record clinical, scoring, content, or general app observations/i,
        }),
      ).toHaveFocus(),
    );
  });
});
