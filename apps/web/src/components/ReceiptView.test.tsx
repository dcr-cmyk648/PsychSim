// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';

import { formatTraceProvenanceLabel, ScoreComparisonBar } from './ReceiptView';

afterEach(cleanup);

describe('ScoreComparisonBar', () => {
  it('uses the database plan as the full scale when the player scores below it', () => {
    render(<ScoreComparisonBar playerScore={225} databaseScore={450} />);

    const meter = screen.getByRole('meter', {
      name: 'Player care points compared with the database plan',
    });
    expect(meter).toHaveAttribute('aria-valuemax', '450');
    expect(meter).toHaveAttribute(
      'aria-valuetext',
      '225 player care points; 450 database-plan care points',
    );
    expect(meter.querySelector<HTMLElement>('.score-player-fill')).toHaveStyle({ width: '50%' });
    expect(meter.querySelector<HTMLElement>('.score-database-marker')).toHaveStyle({
      left: '100%',
    });
  });

  it('expands to an above-plan player score and marks the database score inside the bar', () => {
    render(<ScoreComparisonBar playerScore={500} databaseScore={450} />);

    const meter = screen.getByRole('meter', {
      name: 'Player care points compared with the database plan',
    });
    expect(meter).toHaveAttribute('aria-valuemax', '500');
    expect(meter.querySelector<HTMLElement>('.score-player-fill')).toHaveStyle({ width: '100%' });
    expect(meter.querySelector<HTMLElement>('.score-database-marker')).toHaveStyle({ left: '90%' });
    expect(
      screen.getByText(
        'Above database plan by 50 points. The bar expands to your score and marks the database value inside it.',
      ),
    ).toBeVisible();
  });

  it('does not repeat a routine equal-score comparison in prose', () => {
    render(<ScoreComparisonBar playerScore={450} databaseScore={450} />);

    expect(
      screen.getByRole('meter', {
        name: 'Player care points compared with the database plan',
      }),
    ).toHaveAttribute('aria-valuetext', '450 player care points; 450 database-plan care points');
    expect(screen.queryByText(/above database plan|signed score/i)).not.toBeInTheDocument();
  });

  it('keeps a negative signed total explicit while using zero visual fill', () => {
    render(<ScoreComparisonBar playerScore={-80} databaseScore={450} />);

    const meter = screen.getByRole('meter', {
      name: 'Player care points compared with the database plan',
    });
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(meter.querySelector<HTMLElement>('.score-player-fill')).toHaveStyle({ width: '0%' });
    expect(screen.getByText(/Signed score: −80 points/)).toBeVisible();
  });
});

describe('formatTraceProvenanceLabel', () => {
  it('distinguishes a reviewer-supplied Developer opinion from generic expert opinion', () => {
    expect(
      formatTraceProvenanceLabel([
        {
          sourceUseNoteId: 'source-use.developer',
          authority: 'expert_opinion',
          evidenceSourceId: null,
          citation: null,
          url: null,
          contribution: 'Developer opinion: provisional outpatient combination rule.',
        },
      ]),
    ).toBe('Developer opinion');
    expect(
      formatTraceProvenanceLabel([
        {
          sourceUseNoteId: 'source-use.expert',
          authority: 'expert_opinion',
          evidenceSourceId: null,
          citation: null,
          url: null,
          contribution: 'Unlinked clinical judgment.',
        },
      ]),
    ).toBe('Expert opinion');
  });

  it('keeps formal and Developer contributions visibly separate when both apply', () => {
    expect(
      formatTraceProvenanceLabel([
        {
          sourceUseNoteId: 'source-use.formal',
          authority: 'formal_publication',
          evidenceSourceId: 'evidence.example',
          citation: 'Example citation.',
          url: 'https://example.test/',
          contribution: 'Formal treatment baseline.',
        },
        {
          sourceUseNoteId: 'source-use.developer',
          authority: 'expert_opinion',
          evidenceSourceId: null,
          citation: null,
          url: null,
          contribution: 'Developer opinion: provisional fit adjustment.',
        },
      ]),
    ).toBe('1 source + Developer opinion');
  });
});
