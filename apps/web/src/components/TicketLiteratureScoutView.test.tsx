// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';

import { developerTicketLiteratureScoutCatalog } from '@psychsim/content-runtime/developer';

import { TicketLiteratureScoutView } from './TicketLiteratureScoutView';

afterEach(cleanup);

describe('TicketLiteratureScoutView', () => {
  it('shows the bounded fit profiles with abstract-only summaries and citation snapshots', () => {
    render(
      <TicketLiteratureScoutView
        catalog={developerTicketLiteratureScoutCatalog}
        ticketId="ticket.source.canmat-mdd.antidepressant-baseline"
      />,
    );

    expect(screen.getAllByText('Abstract-only summary')).toHaveLength(2);
    expect(screen.getByText(/Across 522 trials and 116,477 adults/)).toBeInTheDocument();
    expect(screen.getByText(/91 placebo-controlled trials/)).toBeInTheDocument();
    expect(screen.getByText(/Europe PMC cited by 2,220/)).toBeInTheDocument();
    expect(screen.getByText('Unreviewed')).toBeInTheDocument();
    expect(screen.getByText(/cannot approve a clinical claim/)).toBeInTheDocument();
  });

  it('shows an explicit no-suitable result without claiming that no evidence exists', () => {
    render(
      <TicketLiteratureScoutView
        catalog={developerTicketLiteratureScoutCatalog}
        ticketId="ticket.source.bupropion.seizure-history-nuance"
      />,
    );

    expect(
      screen.getByText('No suitable recent meta-analysis found in the recorded 10-year search'),
    ).toBeInTheDocument();
    expect(screen.getByText(/regulatory, pharmacovigilance/)).toBeInTheDocument();
  });

  it('explains why a nonclinical ticket is exempt from meta-analysis discovery', () => {
    render(
      <TicketLiteratureScoutView
        catalog={developerTicketLiteratureScoutCatalog}
        ticketId="ticket.catalog.medications.psychiatry-allowlist"
      />,
    );

    expect(screen.getByText('Meta-analysis not applicable to this ticket')).toBeInTheDocument();
    expect(screen.getByText(/identity and product-scope curation decision/)).toBeInTheDocument();
  });
});
