import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { approvedCaseBlueprints, catalogs } from '../packages/content-runtime/src/content';
import { medicationIdentities } from '../packages/content-runtime/src/medication-identities';
import { publicClinicalCatalog } from '../packages/content-runtime/src/public-clinical-catalog';
import { reviewerCaseBlueprints } from '../packages/content-runtime/src/reviewer-content';

const filesBelow = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const values = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(path) : Promise.resolve([path]);
    }),
  );
  return values.flat();
};

describe('runtime boundaries', () => {
  it('does not import an AI SDK in the web application', async () => {
    const webRoot = resolve('apps/web');
    const files = (await filesBelow(webRoot)).filter((file) => /\.(ts|tsx|json)$/.test(file));
    const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
    expect(source).not.toMatch(/from\s+['"]openai['"]|@openai\/|OPENAI_API_KEY/);
    const packageJson = JSON.parse(await readFile(resolve('apps/web/package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(
      Object.keys(packageJson.dependencies).some((name) =>
        /openai|anthropic|generative/i.test(name),
      ),
    ).toBe(false);
  });

  it('has no web import or public asset path to source documents', async () => {
    const files = (await filesBelow(resolve('apps/web'))).filter((file) =>
      /\.(ts|tsx|css|html|json)$/.test(file),
    );
    const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
    expect(source).not.toContain('content/source-docs');
    expect(source).not.toContain('source-docs/inbox');
  });

  it('keeps review patients out of the production content entry point', async () => {
    const runtimeEntry = await readFile(resolve('packages/content-runtime/src/content.ts'), 'utf8');
    expect(runtimeEntry).not.toContain('content/cases/review');
    expect(runtimeEntry).not.toContain('restless-after-augmentation');
    expect(runtimeEntry).not.toContain('review-basic-mdd-scaffold');
    expect(runtimeEntry).not.toContain('source-needed.requests');
  });

  it('keeps diagnosis classification and source-use records authoring-only', async () => {
    const [runtimeEntry, runtimeIndex, registryText] = await Promise.all([
      readFile(resolve('packages/content-runtime/src/content.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
      readFile(resolve('content/registry.json'), 'utf8'),
    ]);
    const runtimeSource = `${runtimeEntry}\n${runtimeIndex}`;
    for (const marker of [
      'content/catalogs/diagnoses/classifications',
      'content/catalogs/evidence/source-use-decisions.json',
      'evidence.cdc-nchs.icd10cm.2026',
      'evidence.who.icd11-cddr.2024',
      'evidence.nimh.mental-health-topics.current',
      'evidence.apa.dsm5tr.2022',
    ]) {
      expect(runtimeSource).not.toContain(marker);
    }
    expect(runtimeIndex).not.toContain("export * from './registry'");

    const registry = JSON.parse(registryText) as {
      entries: Array<{ id: string; kind: string; runtimeIncluded: boolean }>;
    };
    const authoringIds = [
      'registry.catalog.diagnosis-classifications.icd10cm-2026',
      'registry.catalog.source-use-decisions',
      'evidence.cdc-nchs.icd10cm.2026',
      'evidence.who.icd11-cddr.2024',
      'evidence.nimh.mental-health-topics.current',
      'evidence.apa.dsm5tr.2022',
    ];
    const authoringEntries = registry.entries.filter((entry) => authoringIds.includes(entry.id));
    expect(authoringEntries.map((entry) => entry.id).sort()).toEqual([...authoringIds].sort());
    expect(authoringEntries.every((entry) => entry.runtimeIncluded === false)).toBe(true);
  });

  it('keeps ticket literature scouting out of the Player runtime entry', async () => {
    const [runtimeEntry, runtimeIndex, registryText] = await Promise.all([
      readFile(resolve('packages/content-runtime/src/content.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
      readFile(resolve('content/registry.json'), 'utf8'),
    ]);
    expect(`${runtimeEntry}\n${runtimeIndex}`).not.toContain('ticket-literature-scout');

    const registry = JSON.parse(registryText) as {
      entries: Array<{ id: string; path: string; runtimeIncluded: boolean }>;
    };
    expect(
      registry.entries.find((entry) => entry.id === 'registry.review.ticket-literature-scout'),
    ).toEqual({
      id: 'registry.review.ticket-literature-scout',
      kind: 'ticket_literature_scout_catalog',
      path: 'content/cases/review/ticket-literature-scout.catalog.json',
      runtimeIncluded: false,
      dependsOnIds: ['registry.review.source-requests'],
    });
  });

  it('keeps the personal-knowledge workbench behind a local serve-only boundary', async () => {
    const [plugin, app, runtimeRoot, reviewer] = await Promise.all([
      readFile(resolve('apps/web/personal-knowledge-workbench-plugin.ts'), 'utf8'),
      readFile(resolve('apps/web/src/App.tsx'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/reviewer-content.ts'), 'utf8'),
    ]);
    expect(plugin).toContain("apply: 'serve'");
    expect(plugin).toContain("address === '127.0.0.1'");
    expect(app).toContain('import.meta.env.DEV && !REVIEWER_BUILD');
    expect(app).toContain("import('./components/PersonalKnowledgeWorkbench')");
    expect(runtimeRoot).not.toContain('personal-knowledge');
    expect(reviewer).not.toContain('personal-knowledge');
  });

  it('exposes only the minimized public catalog through the cross-device database browser', async () => {
    const [browser, app, projectionSource, runtimeIndex, registryText] = await Promise.all([
      readFile(resolve('apps/web/src/components/DatabaseBrowser.tsx'), 'utf8'),
      readFile(resolve('apps/web/src/App.tsx'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/public-clinical-catalog.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
      readFile(resolve('content/registry.json'), 'utf8'),
    ]);
    expect(app).toContain('publicClinicalCatalog');
    expect(app).toContain('<DatabaseBrowser');
    expect(runtimeIndex).toContain("export * from './public-clinical-catalog'");
    expect(projectionSource).not.toContain("from './registry'");
    expect(projectionSource).not.toContain('@psychsim/content-runtime/developer');
    expect(projectionSource).not.toContain('@psychsim/content-runtime/reviewer');
    for (const marker of ['import.meta.glob', 'content/source-docs', '/__psychsim/']) {
      expect(`${browser}\n${projectionSource}`).not.toContain(marker);
    }

    const registry = JSON.parse(registryText) as {
      entries: Array<{ id: string; path: string; runtimeIncluded: boolean }>;
    };
    const serializedProjection = JSON.stringify(publicClinicalCatalog);
    for (const entry of registry.entries.filter((candidate) => !candidate.runtimeIncluded)) {
      expect(serializedProjection).not.toContain(entry.id);
      expect(serializedProjection).not.toContain(entry.path);
    }
    for (const marker of [
      'case.',
      'ticket.',
      'source-request.',
      'source-document.',
      'source-chunk.',
      'classification-term.icd10cm.',
      'Personal knowledge workbench',
    ]) {
      expect(serializedProjection).not.toContain(marker);
    }
  });

  it('keeps identity-only medications out of gameplay catalogs and patient content', () => {
    expect(medicationIdentities).toHaveLength(33);
    expect(catalogs.medications).toHaveLength(13);
    const identityOnlyIds = medicationIdentities
      .filter((identity) => identity.authoringStatus === 'identity_only')
      .map((identity) => identity.id);
    expect(identityOnlyIds).toHaveLength(20);
    const gameplayMedicationIds = new Set([
      ...catalogs.medications.map((medication) => medication.id),
      ...catalogs.formularies.flatMap((formulary) => formulary.medicationIds),
    ]);
    const serializedPatients = JSON.stringify([
      ...approvedCaseBlueprints,
      ...reviewerCaseBlueprints,
    ]);
    for (const id of identityOnlyIds) {
      expect(gameplayMedicationIds.has(id)).toBe(false);
      expect(serializedPatients).not.toContain(id);
    }
  });

  it('gitignores every private source-document material directory', async () => {
    const ignore = await readFile(resolve('.gitignore'), 'utf8');
    for (const folder of [
      'inbox',
      'processed',
      'archive',
      'quarantine',
      'extracted',
      'manifests',
    ]) {
      expect(ignore).toContain(`content/source-docs/${folder}/*`);
    }
    expect(ignore).toContain('content/generated/*');
    expect(ignore).toContain('!content/generated/.gitkeep');
  });

  it('does not use nondeterministic randomness in domain logic', async () => {
    const files = (await filesBelow(resolve('packages/engine/src'))).filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.test.ts'),
    );
    const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
    expect(source).not.toContain('Math.random');
  });
});
