import { describe, expect, it } from 'vitest';

import { PublicClinicalCatalogProjectionSchema } from '@psychsim/schemas';

import { catalogs } from './content';
import { buildPublicClinicalCatalog, publicClinicalCatalog } from './public-clinical-catalog';

const sorted = (values: readonly string[]): string[] =>
  [...values].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

describe('public clinical catalog projection', () => {
  it('projects the exact safe runtime inventory with deterministic counts', () => {
    expect(PublicClinicalCatalogProjectionSchema.parse(publicClinicalCatalog)).toEqual(
      publicClinicalCatalog,
    );
    expect(
      Object.fromEntries(
        publicClinicalCatalog.categories.map((category) => [category.id, category.entryCount]),
      ),
    ).toEqual({
      conditions: 8,
      medications: 13,
      interventions: 13,
      dispositions: 3,
      investigations: 40,
      tests: 14,
      references: 11,
    });
    expect(publicClinicalCatalog.totalEntryCount).toBe(102);

    expect(
      sorted(
        publicClinicalCatalog.entries
          .filter((entry) => entry.kind === 'condition')
          .map((entry) => entry.id),
      ),
    ).toEqual(sorted(catalogs.diagnoses.map((entry) => entry.id)));
    expect(
      sorted(
        publicClinicalCatalog.entries
          .filter((entry) => entry.kind === 'medication')
          .map((entry) => entry.id),
      ),
    ).toEqual(sorted(catalogs.medications.map((entry) => entry.id)));
    expect(
      sorted(
        publicClinicalCatalog.entries
          .filter((entry) => entry.categoryId === 'interventions')
          .map((entry) => entry.id),
      ),
    ).toEqual(
      sorted(
        catalogs.treatments
          .filter((entry) => entry.kind !== 'disposition')
          .map((entry) => entry.id),
      ),
    );
    expect(
      sorted(
        publicClinicalCatalog.entries
          .filter((entry) => entry.categoryId === 'dispositions')
          .map((entry) => entry.id),
      ),
    ).toEqual(
      sorted(
        catalogs.treatments
          .filter((entry) => entry.kind === 'disposition')
          .map((entry) => entry.id),
      ),
    );
    expect(
      sorted(
        publicClinicalCatalog.entries
          .filter((entry) => entry.kind === 'investigation')
          .map((entry) => entry.id),
      ),
    ).toEqual(sorted(catalogs.informationActions.map((entry) => entry.id)));
    expect(
      sorted(
        publicClinicalCatalog.entries
          .filter((entry) => entry.kind === 'test')
          .map((entry) => entry.id),
      ),
    ).toEqual(sorted(catalogs.tests.map((entry) => entry.id)));
    expect(
      sorted(
        publicClinicalCatalog.entries
          .filter((entry) => entry.kind === 'reference')
          .map((entry) => entry.id),
      ),
    ).toEqual(sorted(catalogs.evidenceSources.map((entry) => entry.id)));
  });

  it('is stable, uniquely keyed, and detached from mutable input objects', () => {
    const rebuilt = buildPublicClinicalCatalog(structuredClone(catalogs));
    expect(rebuilt).toEqual(publicClinicalCatalog);
    expect(new Set(rebuilt.entries.map((entry) => entry.id)).size).toBe(rebuilt.entries.length);

    for (const category of rebuilt.categories) {
      const labels = rebuilt.entries
        .filter((entry) => entry.categoryId === category.id)
        .map((entry) => `${entry.label}\u0000${entry.id}`);
      expect(labels).toEqual(sorted(labels));
    }

    const reorderedCatalogs = structuredClone(catalogs);
    reorderedCatalogs.diagnoses.reverse();
    reorderedCatalogs.medications.reverse();
    reorderedCatalogs.treatments.reverse();
    reorderedCatalogs.informationActions.reverse();
    reorderedCatalogs.tests.reverse();
    reorderedCatalogs.evidenceSources.reverse();
    for (const source of reorderedCatalogs.evidenceSources) source.sourceRelations.reverse();
    expect(buildPublicClinicalCatalog(reorderedCatalogs)).toEqual(publicClinicalCatalog);
  });

  it('uses a strict display allowlist and excludes answer keys and authoring records', () => {
    const commonKeys = [
      'categoryId',
      'contentVersion',
      'id',
      'kind',
      'label',
      'logicalPath',
      'medicalReviewStatus',
    ];
    const keysByKind = {
      condition: [...commonKeys, 'description', 'severityLevels', 'specifierLabels'],
      medication: [...commonKeys, 'classes'],
      intervention: [...commonKeys, 'requiredCapabilityCount', 'treatmentCategory'],
      disposition: [...commonKeys, 'requiredCapabilityCount', 'treatmentCategory'],
      investigation: [
        ...commonKeys,
        'description',
        'investigationCategory',
        'repeatable',
        'resultSource',
        'soapSection',
      ],
      test: [
        ...commonKeys,
        'componentCount',
        'components',
        'generatorKind',
        'relatedActionId',
        'testCategory',
      ],
      reference: [
        ...commonKeys,
        'authors',
        'bibliographicStatus',
        'citation',
        'containerTitle',
        'doi',
        'jurisdictions',
        'organization',
        'pmid',
        'populations',
        'publicationDate',
        'settings',
        'sourceRelations',
        'sourceType',
        'url',
        'versionLabel',
      ],
    } as const;

    for (const entry of publicClinicalCatalog.entries) {
      expect(Object.keys(entry).sort()).toEqual([...keysByKind[entry.kind]].sort());
      expect(entry.logicalPath).toBe(`catalogs.${entry.categoryId}.${entry.id}`);
      if (entry.kind === 'reference') {
        for (const relation of entry.sourceRelations) {
          expect(Object.keys(relation).sort()).toEqual(['relationType', 'sourceId']);
        }
      }
    }

    const serialized = JSON.stringify(publicClinicalCatalog);
    for (const forbidden of [
      '"pointDelta":',
      '"predicate":',
      '"activeModifierCount":',
      '"activeRuleCount":',
      '"generationStatus":',
      '"fitModifiers":',
      '"authorOverrides":',
      '"tags":',
      '"sourceUseNotes":',
      '"sourceUseNoteIds":',
      '"sourceDocumentId":',
      '"sourceChunkIds":',
      '"classificationBindings":',
      '"baseRules":',
      '"generator":',
      '"accessPolicy":',
      '"knownContentHashes":',
      '"note":',
      'classification-term.icd10cm.',
      'source-document.',
      'source-chunk.',
      'ticket.',
      'case.',
      'content/source-docs',
      'Personal knowledge workbench',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('rejects malformed categories, duplicate records, unsafe links, and private relation fields', () => {
    const missingCategory = structuredClone(publicClinicalCatalog);
    missingCategory.categories.shift();
    expect(PublicClinicalCatalogProjectionSchema.safeParse(missingCategory).success).toBe(false);

    const duplicateEntry = structuredClone(publicClinicalCatalog);
    const repeatedEntry = structuredClone(duplicateEntry.entries[0]!);
    duplicateEntry.entries.push(repeatedEntry);
    duplicateEntry.totalEntryCount += 1;
    duplicateEntry.categories.find(
      (category) => category.id === repeatedEntry.categoryId,
    )!.entryCount += 1;
    expect(PublicClinicalCatalogProjectionSchema.safeParse(duplicateEntry).success).toBe(false);

    const invalidPath = structuredClone(publicClinicalCatalog);
    invalidPath.entries[0]!.logicalPath = 'catalogs.conditions.wrong-id';
    expect(PublicClinicalCatalogProjectionSchema.safeParse(invalidPath).success).toBe(false);

    const unsafeLink = structuredClone(publicClinicalCatalog);
    const unsafeReference = unsafeLink.entries.find((entry) => entry.kind === 'reference');
    if (!unsafeReference || unsafeReference.kind !== 'reference') {
      throw new Error('Expected a public reference fixture.');
    }
    unsafeReference.url = 'javascript:alert(1)';
    expect(PublicClinicalCatalogProjectionSchema.safeParse(unsafeLink).success).toBe(false);

    const privateRelation = structuredClone(publicClinicalCatalog) as {
      entries: Array<{
        kind: string;
        sourceRelations?: Array<Record<string, unknown>>;
      }>;
    };
    const relatedReference = privateRelation.entries.find(
      (entry) => entry.kind === 'reference' && entry.sourceRelations?.length,
    );
    if (!relatedReference?.sourceRelations?.[0]) {
      throw new Error('Expected a public source-relation fixture.');
    }
    relatedReference.sourceRelations[0].note = 'Internal authoring note';
    expect(PublicClinicalCatalogProjectionSchema.safeParse(privateRelation).success).toBe(false);
  });
});
