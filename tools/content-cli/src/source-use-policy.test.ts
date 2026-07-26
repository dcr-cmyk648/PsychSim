import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  ContentRegistrySchema,
  EvidenceSourceDefinitionSchema,
  SourceUseDecisionCatalogSchema,
  SourceUseDecisionSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

const readCatalog = async () =>
  SourceUseDecisionCatalogSchema.parse(
    JSON.parse(
      await readFile(resolve('content/catalogs/evidence/source-use-decisions.json'), 'utf8'),
    ) as unknown,
  );

describe('source-use policy decisions', () => {
  it('keeps reusable, conditional, and blocked diagnostic sources distinct', async () => {
    const catalog = await readCatalog();
    const cdc = catalog.decisions.find(
      (decision) => decision.evidenceSourceId === 'evidence.cdc-nchs.icd10cm.2026',
    )!;
    const cddr = catalog.decisions.find(
      (decision) => decision.evidenceSourceId === 'evidence.who.icd11-cddr.2024',
    )!;
    const dsm = catalog.decisions.find(
      (decision) => decision.evidenceSourceId === 'evidence.apa.dsm5tr.2022',
    )!;

    expect(cdc.legalBasis).toBe('fair_use');
    expect(cdc.permissions.aiAssistedProcessing).toBe(false);
    expect(cdc.permissions.localStructuredIndexing).toBe(true);
    expect(cdc.permissions.derivedClinicalContent).toBe(false);
    expect(cdc.permissions.runtimeRedistribution).toBe(false);
    expect(cdc.permissions.commercialDistribution).toBe(false);
    expect(cdc.fairUseAssessment?.conclusion).toBe('proceed_narrowly');
    expect(cddr.legalBasis).toBe('open_license');
    expect(cddr.decisionStatus).toBe('blocked_pending_permission');
    expect(cddr.permissions.aiAssistedProcessing).toBe(false);
    expect(cddr.permissions.derivedClinicalContent).toBe(false);
    expect(cddr.nonCommercialOnly).toBe(true);
    expect(cddr.shareAlikeRequired).toBe(false);
    expect(dsm.decisionStatus).toBe('blocked_pending_permission');
    expect(dsm.permissions.aiAssistedProcessing).toBe(false);
    expect(dsm.permissions.derivedClinicalContent).toBe(false);
  });

  it('limits each current fair-use assessment to its recorded narrow use', async () => {
    const catalog = await readCatalog();
    const fairUseDecisions = catalog.decisions.filter(
      (decision) => decision.legalBasis === 'fair_use',
    );
    expect(fairUseDecisions.map((decision) => decision.evidenceSourceId).sort()).toEqual([
      'evidence.cdc-nchs.icd10cm.2026',
      'evidence.fda.citalopram-capsules-label.2023',
    ]);
    const cdc = fairUseDecisions.find(
      (decision) => decision.evidenceSourceId === 'evidence.cdc-nchs.icd10cm.2026',
    )!;
    const fda = fairUseDecisions.find(
      (decision) => decision.evidenceSourceId === 'evidence.fda.citalopram-capsules-label.2023',
    )!;
    expect(cdc.permissions.localStructuredIndexing).toBe(true);
    expect(cdc.permissions.runtimeRedistribution).toBe(false);
    expect(fda.permissions.localFullTextStorage).toBe(false);
    expect(fda.permissions.localTextExtraction).toBe(false);
    expect(fda.permissions.localStructuredIndexing).toBe(false);
    expect(fda.fairUseAssessment?.preciseUse).toContain('one original sentence');
  });

  it('keeps DrugCentral behind an authoring-only ShareAlike gate', async () => {
    const catalog = await readCatalog();
    const drugCentral = catalog.decisions.find(
      (decision) => decision.evidenceSourceId === 'evidence.drugcentral.database.2023-11-01',
    )!;
    const source = EvidenceSourceDefinitionSchema.parse(
      JSON.parse(
        await readFile(
          resolve('content/catalogs/evidence/formal/drugcentral-2023-database.evidence.json'),
          'utf8',
        ),
      ) as unknown,
    );
    const registry = ContentRegistrySchema.parse(
      JSON.parse(await readFile(resolve('content/registry.json'), 'utf8')) as unknown,
    );
    const registryEntry = registry.entries.find(
      (entry) => entry.id === 'evidence.drugcentral.database.2023-11-01',
    );

    expect(source).toMatchObject({
      sourceType: 'structured_database',
      publicationDate: '2023-11-01',
      medicalReviewStatus: 'unreviewed',
    });
    expect(drugCentral).toMatchObject({
      legalBasis: 'open_license',
      decisionStatus: 'permitted_with_conditions',
      shareAlikeRequired: true,
      permissions: {
        localStructuredIndexing: true,
        derivedClinicalContent: true,
        aiAssistedProcessing: false,
        runtimeRedistribution: false,
        commercialDistribution: false,
      },
    });
    expect(registryEntry).toMatchObject({
      kind: 'evidence_source',
      runtimeIncluded: false,
    });
  });

  it('keeps the Bostwick review metadata-only pending explicit full-text rights', async () => {
    const catalog = await readCatalog();
    const bostwick = catalog.decisions.find(
      (decision) => decision.evidenceSourceId === 'evidence.bostwick.mdd-antidepressant-fit.2010',
    )!;

    expect(bostwick).toMatchObject({
      decisionStatus: 'metadata_only',
      legalBasis: 'metadata_only',
      fairUseAssessment: null,
      permissionEvidence: null,
      permissions: {
        bibliographicMetadata: true,
        localFullTextStorage: false,
        localTextExtraction: false,
        localStructuredIndexing: false,
        aiAssistedProcessing: false,
        derivedClinicalContent: false,
        runtimeRedistribution: false,
        commercialDistribution: false,
      },
    });
  });

  it('keeps the verified CANMAT author-name correction metadata-only', async () => {
    const catalog = await readCatalog();
    const correction = catalog.decisions.find(
      (decision) =>
        decision.evidenceSourceId === 'evidence.canmat.mdd-adults.2023-update-corrigendum.2025',
    )!;

    expect(correction).toMatchObject({
      contentVersion: '1.1.0',
      decisionStatus: 'metadata_only',
      legalBasis: 'metadata_only',
      permissions: {
        bibliographicMetadata: true,
        localFullTextStorage: false,
        localTextExtraction: false,
        localStructuredIndexing: false,
        aiAssistedProcessing: false,
        derivedClinicalContent: false,
        runtimeRedistribution: false,
        commercialDistribution: false,
      },
    });
    expect(correction.notes).toContain('Lena S. Quilty became Lena C. Quilty');
  });

  it('keeps the item-audited VA/DoD sources out of AI-derived content', async () => {
    const catalog = await readCatalog();
    for (const evidenceSourceId of [
      'evidence.va-dod.suicide-risk.2024',
      'evidence.va-dod.bipolar.2023',
    ]) {
      const decision = catalog.decisions.find(
        (candidate) => candidate.evidenceSourceId === evidenceSourceId,
      )!;
      expect(decision).toMatchObject({
        decisionStatus: 'permitted_with_conditions',
        permissions: {
          localStructuredIndexing: false,
          aiAssistedProcessing: false,
          derivedClinicalContent: false,
          runtimeRedistribution: false,
          commercialDistribution: false,
        },
      });
    }
    expect(
      catalog.decisions.find(
        (decision) => decision.evidenceSourceId === 'evidence.va-dod.suicide-risk.2024',
      )?.notes,
    ).toContain('does not authorize either');
  });

  it('records exactly one source-use decision for every formal source', async () => {
    const catalog = await readCatalog();
    const formalDirectory = resolve('content/catalogs/evidence/formal');
    const formalIds = await Promise.all(
      (await readdir(formalDirectory))
        .filter((filename) => filename.endsWith('.evidence.json'))
        .map(async (filename) =>
          EvidenceSourceDefinitionSchema.parse(
            JSON.parse(await readFile(resolve(formalDirectory, filename), 'utf8')) as unknown,
          ),
        ),
    );
    expect(new Set(catalog.decisions.map((decision) => decision.evidenceSourceId)).size).toBe(
      catalog.decisions.length,
    );
    expect(catalog.decisions.map((decision) => decision.evidenceSourceId).sort()).toEqual(
      formalIds.map((source) => source.id).sort(),
    );
  });

  it('requires a written four-factor record for a future fair-use decision', async () => {
    const catalog = await readCatalog();
    const invalid = {
      ...structuredClone(catalog.decisions[0]!),
      id: 'source-use.invalid-fair-use',
      legalBasis: 'fair_use',
      fairUseAssessment: null,
    };
    expect(SourceUseDecisionSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects internally contradictory source-use decisions', async () => {
    const catalog = await readCatalog();
    const permitted = structuredClone(
      catalog.decisions.find(
        (decision) => decision.evidenceSourceId === 'evidence.cdc-nchs.icd10cm.2026',
      )!,
    );
    expect(
      SourceUseDecisionSchema.safeParse({
        ...permitted,
        nonCommercialOnly: true,
        permissions: {
          ...permitted.permissions,
          commercialDistribution: true,
        },
      }).success,
    ).toBe(false);
    expect(
      SourceUseDecisionSchema.safeParse({
        ...permitted,
        legalBasis: 'metadata_only',
        fairUseAssessment: null,
      }).success,
    ).toBe(false);
    expect(
      SourceUseDecisionSchema.safeParse({
        ...permitted,
        fairUseAssessment: {
          ...permitted.fairUseAssessment!,
          conclusion: 'do_not_proceed',
        },
      }).success,
    ).toBe(false);
    expect(
      SourceUseDecisionSchema.safeParse({
        ...permitted,
        legalBasis: 'written_permission',
        fairUseAssessment: null,
        permissionEvidence: null,
      }).success,
    ).toBe(false);
  });

  it('uses the source-specific NoDerivatives notice for the WHO CDDR', async () => {
    const source = EvidenceSourceDefinitionSchema.parse(
      JSON.parse(
        await readFile(
          resolve('content/catalogs/evidence/formal/who-icd11-cddr-2024.evidence.json'),
          'utf8',
        ),
      ) as unknown,
    );
    expect(source.accessPolicy.licenseLabel).toBe('CC BY-NC-ND 3.0 IGO');
    expect(source.accessPolicy.aiUseStatus).toBe('permission_required');
    expect(source.accessPolicy.localExtractionStatus).toBe('permission_required');
    expect(source.knownContentHashes).toContain(
      'b66e7a5d6ed764a1d39ed6ed37d581d25b5b9b79a6ee74b4935ff6677e8e709b',
    );
  });
});
