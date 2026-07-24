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
  const relativeFiles = new Set(
    files.map((file) => relative(directory, file).replaceAll('\\', '/')),
  );
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

  const requiredInstallAssets = [
    'manifest.webmanifest',
    'version.json',
    'icons/psychsim.svg',
    'icons/psychsim-180.png',
    'icons/psychsim-192.png',
    'icons/psychsim-512.png',
  ];
  for (const requiredAsset of requiredInstallAssets) {
    if (!relativeFiles.has(requiredAsset)) {
      violations.push(`Missing install/update asset: ${requiredAsset}`);
    }
  }

  if (relativeFiles.has('manifest.webmanifest')) {
    try {
      const manifest = JSON.parse(
        await readFile(join(directory, 'manifest.webmanifest'), 'utf8'),
      ) as Record<string, unknown>;
      if (manifest.id !== './' || manifest.start_url !== './' || manifest.scope !== './') {
        violations.push('Install manifest must keep a stable relative id, start_url, and scope.');
      }
      if (manifest.display !== 'standalone') {
        violations.push('Install manifest must use standalone display mode.');
      }
      const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
      for (const requiredIcon of [
        './icons/psychsim-192.png',
        './icons/psychsim-512.png',
        './icons/psychsim.svg',
      ]) {
        if (
          !icons.some(
            (icon) =>
              typeof icon === 'object' &&
              icon !== null &&
              (icon as Record<string, unknown>).src === requiredIcon,
          )
        ) {
          violations.push(`Install manifest does not reference ${requiredIcon}.`);
        }
      }
    } catch {
      violations.push('Install manifest is not valid JSON.');
    }
  }

  if (relativeFiles.has('version.json')) {
    try {
      const version = JSON.parse(await readFile(join(directory, 'version.json'), 'utf8')) as Record<
        string,
        unknown
      >;
      if (
        version.schemaVersion !== 1 ||
        typeof version.distributionId !== 'string' ||
        !/^(?:development|[0-9a-f]{7,64})$/.test(version.distributionId) ||
        (version.buildKind !== 'player' && version.buildKind !== 'portable_reviewer') ||
        typeof version.channel !== 'string'
      ) {
        violations.push('Distribution version manifest has an unsupported shape.');
      }
      if (
        version.channel === 'main' &&
        (typeof version.distributionId !== 'string' ||
          !/^[0-9a-f]{40}$/.test(version.distributionId))
      ) {
        violations.push('A main distribution must identify the exact 40-character commit SHA.');
      }
      if (
        process.env.VITE_PSYCHSIM_DISTRIBUTION_ID &&
        version.distributionId !== process.env.VITE_PSYCHSIM_DISTRIBUTION_ID.toLowerCase()
      ) {
        violations.push('Distribution version manifest does not match the supplied build ID.');
      }
      const expectedBuildKind = options.reviewerBuild ? 'portable_reviewer' : 'player';
      if (version.buildKind !== expectedBuildKind) {
        violations.push(
          `Distribution version manifest identifies ${String(version.buildKind)} instead of ${expectedBuildKind}.`,
        );
      }
    } catch {
      violations.push('Distribution version manifest is not valid JSON.');
    }
  }

  for (const file of files) {
    const relativePath = relative(directory, file);
    if (/source-docs|diagnoses[/\\]classifications|\.pdf$|\.docx$/i.test(relativePath)) {
      violations.push(`Forbidden source asset path: ${relativePath}`);
      continue;
    }
    if (['.js', '.css', '.html', '.map', '.json', '.webmanifest', '.svg'].includes(extname(file))) {
      const text = await readFile(file, 'utf8');
      for (const marker of forbiddenText) {
        if (text.includes(marker)) violations.push(`${relativePath} contains ${marker}`);
      }
    }
  }
  return { safe: violations.length === 0, filesScanned: files.length, violations };
};
