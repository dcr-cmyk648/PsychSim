import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

import { ContentRegistrySchema } from '@psychsim/schemas';
export interface BundleSafetyReport {
  safe: boolean;
  filesScanned: number;
  violations: string[];
}

interface BundleSafetyOptions {
  reviewerBuild?: boolean;
}

const PORTABLE_REVIEWER_ALLOWLIST = new Map<string, string>([
  [
    'case.review-cohort.mdd-initial',
    'content/cases/blueprints/reviewer-cohort/mdd-initial.scenario.json',
  ],
  [
    'case.review-cohort.mdd-adherence',
    'content/cases/blueprints/reviewer-cohort/mdd-adherence.scenario.json',
  ],
  [
    'case.review-cohort.mdd-adequate-nonresponse',
    'content/cases/blueprints/reviewer-cohort/mdd-adequate-nonresponse.scenario.json',
  ],
  [
    'case.review-cohort.mdd-prior-good-response',
    'content/cases/blueprints/reviewer-cohort/mdd-prior-good-response.scenario.json',
  ],
  [
    'case.review-cohort.mdd-prior-intolerance',
    'content/cases/blueprints/reviewer-cohort/mdd-prior-intolerance.scenario.json',
  ],
  [
    'case.review-cohort.gad-initial',
    'content/cases/blueprints/reviewer-cohort/gad-initial.scenario.json',
  ],
  [
    'case.review-cohort.bipolar-depression',
    'content/cases/blueprints/reviewer-cohort/bipolar-depression.scenario.json',
  ],
  [
    'case.review-cohort.acute-mania',
    'content/cases/blueprints/reviewer-cohort/acute-mania.scenario.json',
  ],
  [
    'case.review-cohort.schizophrenia-relapse',
    'content/cases/blueprints/reviewer-cohort/schizophrenia-relapse.scenario.json',
  ],
  [
    'case.review-cohort.ptsd-initial',
    'content/cases/blueprints/reviewer-cohort/ptsd-initial.scenario.json',
  ],
]);

const listFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
};

export const verifyProductionBundle = async (
  directory: string,
  options: BundleSafetyOptions = {},
): Promise<BundleSafetyReport> => {
  const files = await listFiles(directory);
  const violations: string[] = [];
  const contentRegistry = ContentRegistrySchema.parse(
    JSON.parse(await readFile(resolve('content/registry.json'), 'utf8')) as unknown,
  );
  const authoringOnlyRegistryMarkers = contentRegistry.entries
    .filter(
      (entry) =>
        !entry.runtimeIncluded &&
        !(options.reviewerBuild && PORTABLE_REVIEWER_ALLOWLIST.get(entry.id) === entry.path),
    )
    .flatMap((entry) => [entry.id, entry.path]);
  const forbiddenText = [
    'content/source-docs',
    'content/catalogs/diagnoses/classifications',
    'classification-term.icd10cm.',
    'evidence.cdc-nchs.icd10cm.2026',
    'evidence.who.icd11-cddr.2024',
    'evidence.nimh.mental-health-topics.current',
    'evidence.apa.dsm5tr.2022',
    'source-use-decisions.psychsim',
    'source-docs/inbox',
    'source-docs/extracted',
    'source-docs/manifests',
    'OPENAI_API_KEY',
    'from "openai"',
    "from 'openai'",
    'case.restless-after-augmentation',
    'case.review.basic-mdd-scaffold',
    'ticket.audit.review-basic-mdd-scaffold',
    'case.review.who-mhgap-mdd-initial',
    'ticket.audit.review-who-mhgap-mdd-initial',
    'ticket.source.who-mhgap',
    'source-document.90f1220536d6323b8d84',
    'source-chunk.90f1220536d6323b8d84',
    'source-request.mdd.tsh-workup',
    '/__psychsim/local-review-tickets',
    'content/generated/local-review-tickets',
    ...authoringOnlyRegistryMarkers,
  ];
  for (const file of files) {
    const relativePath = relative(directory, file);
    if (/source-docs|diagnoses[/\\]classifications|\.pdf$|\.docx$/i.test(relativePath)) {
      violations.push(`Forbidden source asset path: ${relativePath}`);
      continue;
    }
    if (['.js', '.css', '.html', '.map', '.json'].includes(extname(file))) {
      const text = await readFile(file, 'utf8');
      for (const marker of forbiddenText) {
        if (text.includes(marker)) violations.push(`${relativePath} contains ${marker}`);
      }
    }
  }
  return { safe: violations.length === 0, filesScanned: files.length, violations };
};
