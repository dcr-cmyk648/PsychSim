import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  DiagnosisClassificationReleaseSchema,
  DiagnosisClassificationTermsSchema,
} from '@psychsim/schemas';
import { catalogs } from '@psychsim/content-runtime';
import { describe, expect, it } from 'vitest';

import {
  diagnosisClassificationTermId,
  normalizedDiagnosisTermsSha256,
  parseIcd10CmOrderText,
  searchDiagnosisClassification,
  validateDiagnosisClassification,
  validateDiagnosisClassificationBindings,
  verifyClassificationSourceMember,
} from './diagnosis-classification';

const classificationDirectory = resolve(
  'content/catalogs/diagnoses/classifications/icd-10-cm/2026',
);

const orderLine = (
  sourceOrder: number,
  code: string,
  billable: boolean,
  shortDescription: string,
  longDescription = shortDescription,
): string =>
  `${String(sourceOrder).padStart(5, '0')} ${code.replace('.', '').padEnd(7)} ${billable ? '1' : '0'} ${shortDescription.padEnd(61)}${longDescription}`;

const readReleaseManifest = async () =>
  DiagnosisClassificationReleaseSchema.parse(
    JSON.parse(await readFile(resolve(classificationDirectory, 'release.json'), 'utf8')) as unknown,
  );

const createFixtureClassification = async () => {
  const source = [
    orderLine(1, 'F32', false, 'Depressive episode'),
    orderLine(
      2,
      'F320',
      true,
      'MDD single episode mild',
      'Major depressive disorder, single episode, mild',
    ),
    orderLine(
      3,
      'F603',
      true,
      'Borderline personality disorder',
      'Borderline personality disorder',
    ),
    orderLine(
      4,
      'F902',
      true,
      'ADHD combined type',
      'Attention-deficit hyperactivity disorder, combined type',
    ),
  ].join('\n');
  const catalog = parseIcd10CmOrderText(source, 'classification.icd10cm.fixture', ['F']);
  const release = DiagnosisClassificationReleaseSchema.parse({
    ...(await readReleaseManifest()),
    id: 'classification.icd10cm.fixture',
    versionLabel: 'Fixture',
    scopeLabel: 'Test fixture',
    termCount: catalog.terms.length,
    normalizedTermsSha256: normalizedDiagnosisTermsSha256(catalog),
  });
  return { catalog, release };
};

describe('diagnosis classification catalog', () => {
  it('pins the FY 2026 local-cache release manifest', async () => {
    const release = await readReleaseManifest();
    expect(release).toMatchObject({
      id: 'classification.icd10cm.2026',
      termCount: 1112,
      normalizedTermsSha256: 'f13efd1ce8e5a1134129cd3b511f56913c5a41d10577e22ae3e1fb286ffb3e97',
      medicalReviewStatus: 'unreviewed',
    });
    expect(release.sourceArtifact.memberSha256).toBe(
      '6dc95c9c7e96c734806e1682f4bf9df76251d60e99199bba0d375ba3dd11026b',
    );
  });

  it('deterministically imports fixed-width order rows and derives their hierarchy', () => {
    const source = [
      orderLine(1, 'F32', false, 'Depressive episode'),
      orderLine(2, 'F320', true, 'MDD single episode mild'),
      orderLine(3, 'F321', true, 'MDD single episode moderate'),
    ].join('\n');
    const first = parseIcd10CmOrderText(source, 'classification.icd10cm.fixture', ['F']);
    const second = parseIcd10CmOrderText(source, 'classification.icd10cm.fixture', ['F']);
    expect(second).toEqual(first);
    expect(first.terms.map((term) => [term.code, term.parentCode])).toEqual([
      ['F32', null],
      ['F32.0', 'F32'],
      ['F32.1', 'F32'],
    ]);
    expect(first.terms[1]?.id).toBe(diagnosisClassificationTermId('F32.0'));
    expect(normalizedDiagnosisTermsSha256(second)).toBe(normalizedDiagnosisTermsSha256(first));
  });

  it('rejects catalog drift, invalid parent links, and an unpinned source member', async () => {
    const { release, catalog } = await createFixtureClassification();
    const drifted = DiagnosisClassificationTermsSchema.parse(structuredClone(catalog));
    drifted.terms[1]!.parentCode = 'F99';
    const report = validateDiagnosisClassification(release, drifted);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'CLASSIFICATION_TERMS_HASH_MISMATCH',
        'INVALID_CLASSIFICATION_PARENT',
      ]),
    );
    expect(() => verifyClassificationSourceMember(Buffer.from('wrong bytes'), release)).toThrow(
      /SHA-256 mismatch/,
    );
  });

  it('searches standardized codes and descriptions without turning them into rules', async () => {
    const { catalog } = await createFixtureClassification();
    expect(searchDiagnosisClassification(catalog, 'borderline personality')[0]?.code).toBe('F60.3');
    const allowedKeys = [
      'billable',
      'code',
      'id',
      'longDescription',
      'parentCode',
      'releaseId',
      'schemaVersion',
      'shortDescription',
      'sourceOrder',
    ];
    for (const term of catalog.terms) {
      expect(Object.keys(term).sort()).toEqual(allowedKeys);
    }
  });

  it('requires the release manifest to pin the normalized catalog hash', async () => {
    const { release, catalog } = await createFixtureClassification();
    const invalidRelease = DiagnosisClassificationReleaseSchema.parse({
      ...release,
      normalizedTermsSha256: createHash('sha256').update('wrong').digest('hex'),
    });
    expect(validateDiagnosisClassification(invalidRelease, catalog).valid).toBe(false);
  });

  it('validates compact diagnosis bindings against the materialized release and code set', async () => {
    const { release, catalog } = await createFixtureClassification();
    const diagnosis = structuredClone(catalogs.diagnoses[0]!);
    diagnosis.classificationBindings = [
      {
        id: 'classification-binding.fixture.mdd',
        classificationReleaseId: release.id,
        code: 'F32.0',
        relation: 'related',
        note: 'Fixture-only mapping.',
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      },
    ];
    expect(validateDiagnosisClassificationBindings([diagnosis], release, catalog)).toEqual({
      valid: true,
      issues: [],
    });

    diagnosis.classificationBindings[0]!.code = 'F99.9';
    expect(
      validateDiagnosisClassificationBindings([diagnosis], release, catalog).issues.map(
        (issue) => issue.code,
      ),
    ).toContain('INVALID_DIAGNOSIS_CLASSIFICATION_CODE_REF');
    expect(
      validateDiagnosisClassificationBindings([diagnosis], release, null).issues.map(
        (issue) => issue.code,
      ),
    ).toContain('CLASSIFICATION_CACHE_REQUIRED_FOR_BINDINGS');
  });
});
