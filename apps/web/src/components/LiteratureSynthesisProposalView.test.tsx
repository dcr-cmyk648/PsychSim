// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';

import { developerLiteratureSynthesisProposals } from '@psychsim/content-runtime/developer';

import { LiteratureSynthesisProposalView } from './LiteratureSynthesisProposalView';

afterEach(cleanup);

describe('LiteratureSynthesisProposalView', () => {
  it('separates source-cleared support from context that cannot support a rule', () => {
    render(
      <LiteratureSynthesisProposalView proposal={developerLiteratureSynthesisProposals[0]!} />,
    );

    expect(screen.getByRole('heading', { name: 'Proposed evidence answer' })).toBeVisible();
    expect(screen.getByText('Eligible support')).toBeVisible();
    expect(screen.getByText('Opposing or qualifying context')).toBeVisible();
    expect(screen.getAllByText(/Cannot support an executable rule/)).toHaveLength(2);
    expect(screen.getByText(/This proposal authorizes no rule or point change/)).toBeVisible();
  });
});
