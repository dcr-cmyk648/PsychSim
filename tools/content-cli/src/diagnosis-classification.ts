import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import {
  DiagnosisClassificationReleaseSchema,
  DiagnosisClassificationTermsSchema,
  type DiagnosisClassificationRelease,
  type DiagnosisClassificationTerm,
  type DiagnosisClassificationTerms,
  type DiagnosisDefinition,
  type ContentRegistry,
  type ContentRegistryEntry,
} from '@psychsim/schemas';

export const ICD10CM_IMPORTER_VERSION = 'psychsim-icd10cm-order-1';

export const getSingleDiagnosisClassificationRegistryEntry = (
  registry: ContentRegistry,
): ContentRegistryEntry => {
  const entries = registry.entries.filter(
    (entry) => entry.kind === 'diagnosis_classification_catalog',
  );
  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one registered diagnosis-classification catalog; found ${entries.length}. Add multi-release routing before registering another catalog.`,
    );
  }
  return entries[0]!;
};

export interface DiagnosisClassificationValidationIssue {
  code: string;
  message: string;
}

export interface DiagnosisClassificationValidationReport {
  valid: boolean;
  issues: DiagnosisClassificationValidationIssue[];
}

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const normalizeIcd10CmCode = (rawCode: string): string => {
  const compact = rawCode.trim().toUpperCase().replaceAll('.', '');
  return compact.length <= 3 ? compact : `${compact.slice(0, 3)}.${compact.slice(3)}`;
};

export const diagnosisClassificationTermId = (code: string): string =>
  `classification-term.icd10cm.${code.toLowerCase().replace('.', '-')}`;

const findParentCode = (code: string, allCodes: ReadonlySet<string>): string | null => {
  const compact = code.replace('.', '');
  for (let length = compact.length - 1; length >= 3; length -= 1) {
    const candidate = normalizeIcd10CmCode(compact.slice(0, length));
    if (allCodes.has(candidate)) return candidate;
  }
  return null;
};

/**
 * Parse the fixed-width NCHS `icd10cm-order-*.txt` format.
 *
 * This importer deliberately takes already extracted official bytes. It does not
 * download, unzip, or infer a release, so the caller can verify the pinned
 * archive/member hashes before any generated catalog is accepted.
 */
export const parseIcd10CmOrderText = (
  text: string,
  releaseId: string,
  includedCodePrefixes: readonly string[],
): DiagnosisClassificationTerms => {
  const parsed = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      if (line.length < 78) {
        throw new Error(`Malformed ICD-10-CM order line: ${line.slice(0, 80)}`);
      }
      const sourceOrder = Number.parseInt(line.slice(0, 5), 10);
      const code = normalizeIcd10CmCode(line.slice(6, 13));
      const billableIndicator = line.slice(14, 15);
      const shortDescription = line.slice(16, 77).trim();
      const longDescription = line.slice(77).trim();
      if (
        !Number.isInteger(sourceOrder) ||
        !/^[A-Z][0-9A-Z]{2}(?:\.[0-9A-Z]{1,4})?$/.test(code) ||
        !['0', '1'].includes(billableIndicator) ||
        shortDescription.length === 0 ||
        longDescription.length === 0
      ) {
        throw new Error(`Malformed ICD-10-CM order line: ${line.slice(0, 120)}`);
      }
      return {
        code,
        sourceOrder,
        billable: billableIndicator === '1',
        shortDescription,
        longDescription,
      };
    })
    .filter(({ code }) => includedCodePrefixes.some((prefix) => code.startsWith(prefix)));

  const allCodes = new Set(parsed.map(({ code }) => code));
  const terms: DiagnosisClassificationTerm[] = parsed.map((term) => ({
    schemaVersion: 1,
    id: diagnosisClassificationTermId(term.code),
    releaseId,
    code: term.code,
    parentCode: findParentCode(term.code, allCodes),
    shortDescription: term.shortDescription,
    longDescription: term.longDescription,
    billable: term.billable,
    sourceOrder: term.sourceOrder,
  }));

  return DiagnosisClassificationTermsSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    releaseId,
    terms,
  });
};

export const normalizedDiagnosisTermsSha256 = (terms: DiagnosisClassificationTerms): string =>
  sha256(JSON.stringify(terms.terms));

export const validateDiagnosisClassification = (
  release: DiagnosisClassificationRelease,
  catalog: DiagnosisClassificationTerms,
): DiagnosisClassificationValidationReport => {
  const issues: DiagnosisClassificationValidationIssue[] = [];
  if (catalog.releaseId !== release.id) {
    issues.push({
      code: 'CLASSIFICATION_RELEASE_MISMATCH',
      message: `${catalog.releaseId} does not match ${release.id}.`,
    });
  }
  if (catalog.terms.length !== release.termCount) {
    issues.push({
      code: 'CLASSIFICATION_TERM_COUNT_MISMATCH',
      message: `Expected ${release.termCount} terms; found ${catalog.terms.length}.`,
    });
  }
  const actualHash = normalizedDiagnosisTermsSha256(catalog);
  if (actualHash !== release.normalizedTermsSha256) {
    issues.push({
      code: 'CLASSIFICATION_TERMS_HASH_MISMATCH',
      message: `Expected ${release.normalizedTermsSha256}; found ${actualHash}.`,
    });
  }

  const byCode = new Map<string, DiagnosisClassificationTerm>();
  const ids = new Set<string>();
  const sourceOrders = new Set<number>();
  let priorSourceOrder = -1;
  for (const term of catalog.terms) {
    if (byCode.has(term.code)) {
      issues.push({ code: 'DUPLICATE_CLASSIFICATION_CODE', message: term.code });
    }
    if (ids.has(term.id)) {
      issues.push({ code: 'DUPLICATE_CLASSIFICATION_TERM_ID', message: term.id });
    }
    if (sourceOrders.has(term.sourceOrder)) {
      issues.push({
        code: 'DUPLICATE_CLASSIFICATION_SOURCE_ORDER',
        message: String(term.sourceOrder),
      });
    }
    if (term.sourceOrder <= priorSourceOrder) {
      issues.push({
        code: 'UNSORTED_CLASSIFICATION_TERMS',
        message: `${term.code} is out of source order.`,
      });
    }
    if (term.id !== diagnosisClassificationTermId(term.code)) {
      issues.push({
        code: 'INVALID_CLASSIFICATION_TERM_ID',
        message: `${term.code}: ${term.id}`,
      });
    }
    if (!release.includedCodePrefixes.some((prefix) => term.code.startsWith(prefix))) {
      issues.push({
        code: 'CLASSIFICATION_TERM_OUTSIDE_SCOPE',
        message: term.code,
      });
    }
    if (term.releaseId !== release.id) {
      issues.push({
        code: 'CLASSIFICATION_TERM_RELEASE_MISMATCH',
        message: `${term.code}: ${term.releaseId}`,
      });
    }
    byCode.set(term.code, term);
    ids.add(term.id);
    sourceOrders.add(term.sourceOrder);
    priorSourceOrder = term.sourceOrder;
  }

  for (const term of catalog.terms) {
    if (term.parentCode && !byCode.has(term.parentCode)) {
      issues.push({
        code: 'MISSING_CLASSIFICATION_PARENT',
        message: `${term.code}: ${term.parentCode}`,
      });
    }
    if (term.parentCode && !term.code.startsWith(term.parentCode)) {
      issues.push({
        code: 'INVALID_CLASSIFICATION_PARENT',
        message: `${term.code}: ${term.parentCode}`,
      });
    }
    const visited = new Set<string>();
    let cursor: DiagnosisClassificationTerm | undefined = term;
    while (cursor?.parentCode) {
      if (visited.has(cursor.parentCode)) {
        issues.push({ code: 'CYCLIC_CLASSIFICATION_HIERARCHY', message: term.code });
        break;
      }
      visited.add(cursor.parentCode);
      cursor = byCode.get(cursor.parentCode);
    }
  }

  return { valid: issues.length === 0, issues };
};

export const validateDiagnosisClassificationBindings = (
  diagnoses: readonly DiagnosisDefinition[],
  release: DiagnosisClassificationRelease,
  catalog: DiagnosisClassificationTerms | null,
): DiagnosisClassificationValidationReport => {
  const issues: DiagnosisClassificationValidationIssue[] = [];
  const classificationCodes = new Set(catalog?.terms.map((term) => term.code) ?? []);
  for (const diagnosis of diagnoses) {
    for (const binding of diagnosis.classificationBindings) {
      if (binding.classificationReleaseId !== release.id) {
        issues.push({
          code: 'INVALID_DIAGNOSIS_CLASSIFICATION_RELEASE_REF',
          message: `${diagnosis.id}: ${binding.classificationReleaseId}`,
        });
      } else if (!catalog) {
        issues.push({
          code: 'CLASSIFICATION_CACHE_REQUIRED_FOR_BINDINGS',
          message: diagnosis.id,
        });
      } else if (!classificationCodes.has(binding.code)) {
        issues.push({
          code: 'INVALID_DIAGNOSIS_CLASSIFICATION_CODE_REF',
          message: `${diagnosis.id}: ${binding.code}`,
        });
      }
    }
  }
  return { valid: issues.length === 0, issues };
};

export const searchDiagnosisClassification = (
  catalog: DiagnosisClassificationTerms,
  query: string,
  limit = 25,
): DiagnosisClassificationTerm[] => {
  const normalized = query.trim().toLocaleLowerCase();
  if (normalized.length === 0) return [];
  return catalog.terms
    .filter((term) =>
      [term.code, term.shortDescription, term.longDescription].some((candidate) =>
        candidate.toLocaleLowerCase().includes(normalized),
      ),
    )
    .slice(0, limit);
};

export const readDiagnosisClassification = async (
  releasePath: string,
  termsPath: string,
): Promise<{
  release: DiagnosisClassificationRelease;
  catalog: DiagnosisClassificationTerms;
}> => {
  const [releaseText, termsText] = await Promise.all([
    readFile(releasePath, 'utf8'),
    readFile(termsPath, 'utf8'),
  ]);
  return {
    release: DiagnosisClassificationReleaseSchema.parse(JSON.parse(releaseText) as unknown),
    catalog: DiagnosisClassificationTermsSchema.parse(JSON.parse(termsText) as unknown),
  };
};

export const verifyClassificationSourceMember = (
  sourceBytes: Uint8Array,
  release: DiagnosisClassificationRelease,
): void => {
  const expected = release.sourceArtifact.memberSha256;
  if (!expected) throw new Error(`${release.id} does not declare a source-member SHA-256.`);
  const actual = sha256(sourceBytes);
  if (actual !== expected) {
    throw new Error(`Source member SHA-256 mismatch: expected ${expected}; found ${actual}.`);
  }
};
