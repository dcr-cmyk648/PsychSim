import { describe, expect, it } from 'vitest';
import { TicketLiteratureScoutProfileSchema } from '@psychsim/schemas';

import {
  buildEuropePmcMetaAnalysisQuery,
  buildEuropePmcSearchUrl,
  searchEuropePmcMetaAnalyses,
} from './literature-discovery';

const profile = TicketLiteratureScoutProfileSchema.parse({
  id: 'literature-profile.test',
  clinicalQuestion: 'Which intervention fits the test question?',
  metaAnalysisFit: 'strong',
  outcome: 'selected',
  linkedSourceRequestIds: [],
  searchPlan: {
    provider: 'europe_pmc',
    topicQuery: 'TITLE:"test condition" AND TITLE:treatment',
    windowStart: '2016-07-25',
    windowEnd: '2026-07-25',
    lookbackYears: 10,
    selectionPolicy: 'highest_cited_relevant_meta_analysis',
    selectionPolicyVersion: 'psychsim-literature-scout-v1',
  },
  searchRun: {
    searchedAt: '2026-07-25T12:00:00.000Z',
    resultCount: 1,
    screenedResultCount: 1,
    selectedRank: 1,
    responseSha256: 'a'.repeat(64),
    candidateSetSha256: 'b'.repeat(64),
    selectionNote: 'Test selection.',
  },
  selectedReferenceId: 'literature-reference.test',
  relevanceNote: 'Test relevance.',
  limitations: ['Test limitation.'],
  pointMagnitudeExcluded: true,
  supportsExecutableRule: false,
  medicalReviewStatus: 'unreviewed',
});

describe('Europe PMC literature discovery', () => {
  it('builds the fixed ten-year PubMed/meta-analysis query', () => {
    expect(buildEuropePmcMetaAnalysisQuery(profile)).toBe(
      'SRC:MED AND (TITLE:"test condition" AND TITLE:treatment) AND (PUB_TYPE:"Meta-Analysis" OR TITLE:"meta-analysis" OR TITLE:"meta analysis") AND FIRST_PDATE:[2016-07-25 TO 2026-07-25] AND HAS_ABSTRACT:Y',
    );
    const url = buildEuropePmcSearchUrl(profile);
    expect(url.searchParams.get('sort')).toBe('CITED desc');
    expect(url.searchParams.get('synonym')).toBe('false');
    expect(url.searchParams.get('pageSize')).toBe('1000');
  });

  it('sorts eligible results by one provider citation snapshot and rejects retractions', async () => {
    const payload = JSON.stringify({
      version: '6.9',
      hitCount: 3,
      resultList: {
        result: [
          {
            pmid: '2',
            title: 'Lower cited',
            citedByCount: 2,
            isRetracted: 'N',
            pubTypeList: { pubType: ['Meta-Analysis'] },
          },
          {
            pmid: '1',
            title: 'Higher cited',
            citedByCount: 8,
            isRetracted: 'N',
            pubTypeList: { pubType: ['Meta-Analysis'] },
          },
          {
            pmid: '3',
            title: 'Retracted',
            citedByCount: 100,
            isRetracted: 'Y',
            pubTypeList: { pubType: ['Meta-Analysis'] },
          },
        ],
      },
    });
    const result = await searchEuropePmcMetaAnalyses(
      profile,
      async () => new Response(payload, { status: 200 }),
    );
    expect(result.providerApiVersion).toBe('6.9');
    expect(result.resultCount).toBe(3);
    expect(result.candidates.map((candidate) => candidate.pmid)).toEqual(['1', '2']);
    expect(result.responseSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.candidateSetSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fails cleanly without printing or returning a partial abstract payload', async () => {
    await expect(
      searchEuropePmcMetaAnalyses(
        profile,
        async () => new Response('rate limited', { status: 429, statusText: 'Too Many Requests' }),
      ),
    ).rejects.toThrow('Europe PMC search failed (429 Too Many Requests).');
  });

  it('refuses to rank a truncated broad search', async () => {
    await expect(
      searchEuropePmcMetaAnalyses(
        profile,
        async () =>
          new Response(
            JSON.stringify({
              version: '6.9',
              hitCount: 1001,
              resultList: { result: [] },
            }),
            { status: 200 },
          ),
      ),
    ).rejects.toThrow('narrow the tracked topic query');
  });

  it('rejects a search plan that is not exactly ten calendar years', () => {
    expect(() =>
      TicketLiteratureScoutProfileSchema.parse({
        ...profile,
        searchPlan: {
          ...profile.searchPlan,
          windowStart: '2016-07-26',
        },
      }),
    ).toThrow('exactly 10 calendar years');
  });
});
