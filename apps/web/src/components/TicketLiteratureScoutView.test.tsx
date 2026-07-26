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

    expect(screen.getAllByText('Abstract-only summary')).toHaveLength(6);
    expect(screen.getAllByText(/Across 522 trials and 116,477 adults/)).toHaveLength(2);
    expect(screen.getByText(/151 trials and 17 FDA reports/)).toBeInTheDocument();
    expect(screen.getByText(/216 acute depression trials/)).toBeInTheDocument();
    expect(screen.getByText(/91 placebo-controlled trials/)).toBeInTheDocument();
    expect(screen.getAllByText(/Europe PMC cited by 2,220/)).toHaveLength(2);
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
        ticketId="ticket.source.canmat-mdd.2025-corrigendum"
      />,
    );

    expect(screen.getByText('Meta-analysis not applicable to this ticket')).toBeInTheDocument();
    expect(screen.getByText(/bibliographic correction-impact check/)).toBeInTheDocument();
  });
});
