import { createHash } from 'node:crypto';

import type { TicketLiteratureScoutProfile } from '@psychsim/schemas';

export const EUROPE_PMC_SEARCH_ENDPOINT = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

export interface EuropePmcLiteResult {
  pmid?: string;
  doi?: string;
  title?: string;
  pubYear?: string;
  firstPublicationDate?: string;
  citedByCount?: number;
  pubTypeList?: { pubType?: string[] };
  isRetracted?: string;
}

interface EuropePmcSearchResponse {
  version?: string;
  hitCount?: number;
  resultList?: { result?: EuropePmcLiteResult[] };
}

export interface LiteratureSearchSnapshot {
  exactQuery: string;
  requestUrl: string;
  providerApiVersion: string;
  resultCount: number;
  candidates: EuropePmcLiteResult[];
  responseSha256: string;
  candidateSetSha256: string;
  rawResponse: string;
}

const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

const canonicalCandidateSet = (candidates: readonly EuropePmcLiteResult[]): string =>
  JSON.stringify(
    candidates.map((candidate) => ({
      pmid: candidate.pmid ?? null,
      doi: candidate.doi?.toLowerCase() ?? null,
      title: candidate.title ?? null,
      pubYear: candidate.pubYear ?? null,
      firstPublicationDate: candidate.firstPublicationDate ?? null,
      citedByCount: candidate.citedByCount ?? 0,
      publicationTypes: candidate.pubTypeList?.pubType ?? [],
      isRetracted: candidate.isRetracted ?? 'N',
    })),
  );

export const buildEuropePmcMetaAnalysisQuery = (profile: TicketLiteratureScoutProfile): string => {
  const plan = profile.searchPlan;
  if (!plan) throw new Error(`${profile.id} does not define a literature search plan.`);
  return [
    'SRC:MED',
    `(${plan.topicQuery})`,
    '(PUB_TYPE:"Meta-Analysis" OR TITLE:"meta-analysis" OR TITLE:"meta analysis")',
    `FIRST_PDATE:[${plan.windowStart} TO ${plan.windowEnd}]`,
    'HAS_ABSTRACT:Y',
  ].join(' AND ');
};

export const buildEuropePmcSearchUrl = (profile: TicketLiteratureScoutProfile): URL => {
  const url = new URL(EUROPE_PMC_SEARCH_ENDPOINT);
  url.searchParams.set('query', buildEuropePmcMetaAnalysisQuery(profile));
  url.searchParams.set('format', 'json');
  url.searchParams.set('resultType', 'lite');
  url.searchParams.set('pageSize', '1000');
  url.searchParams.set('sort', 'CITED desc');
  url.searchParams.set('synonym', 'false');
  return url;
};

export const searchEuropePmcMetaAnalyses = async (
  profile: TicketLiteratureScoutProfile,
  fetcher: typeof fetch = fetch,
): Promise<LiteratureSearchSnapshot> => {
  const url = buildEuropePmcSearchUrl(profile);
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Europe PMC search failed (${response.status} ${response.statusText}).`);
  }
  const rawResponse = await response.text();
  const parsed = JSON.parse(rawResponse) as EuropePmcSearchResponse;
  if ((parsed.hitCount ?? 0) > 1000) {
    throw new Error(
      `Europe PMC returned ${parsed.hitCount} hits; narrow the tracked topic query before ranking candidates.`,
    );
  }
  const candidates = [...(parsed.resultList?.result ?? [])]
    .filter(
      (candidate) =>
        candidate.pmid &&
        candidate.title &&
        candidate.isRetracted !== 'Y' &&
        (candidate.pubTypeList?.pubType?.some((type) => type === 'Meta-Analysis') ||
          /\bmeta[- ]analysis\b/i.test(candidate.title)),
    )
    .sort(
      (left, right) =>
        (right.citedByCount ?? 0) - (left.citedByCount ?? 0) ||
        (left.pmid ?? '').localeCompare(right.pmid ?? ''),
    );
  return {
    exactQuery: url.searchParams.get('query')!,
    requestUrl: url.toString(),
    providerApiVersion: parsed.version ?? 'unknown',
    resultCount: parsed.hitCount ?? candidates.length,
    candidates,
    responseSha256: sha256(rawResponse),
    candidateSetSha256: sha256(canonicalCandidateSet(candidates)),
    rawResponse,
  };
};
