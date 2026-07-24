// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';

import { ScoreComparisonBar } from './ReceiptView';

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
        'You exceeded the database plan by 50 points, so the bar expands to your score and marks the database value inside it.',
      ),
    ).toBeVisible();
  });
});
