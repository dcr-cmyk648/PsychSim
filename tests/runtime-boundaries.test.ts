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

  it('keeps point-free decision-policy authoring outside Player and Reviewer runtimes', async () => {
    const [runtimeEntry, runtimeIndex, reviewerEntry, registryText] = await Promise.all([
      readFile(resolve('packages/content-runtime/src/content.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/reviewer-content.ts'), 'utf8'),
      readFile(resolve('content/registry.json'), 'utf8'),
    ]);
    const runtimeSource = `${runtimeEntry}\n${runtimeIndex}\n${reviewerEntry}`;
    expect(runtimeSource).not.toContain('content/catalogs/decision-policies');
    expect(runtimeSource).not.toContain('registry.catalog.decision-policies');
    expect(runtimeSource).not.toContain('registry.catalog.decision-balances');

    const registry = JSON.parse(registryText) as {
      entries: Array<{
        id: string;
        kind: string;
        path: string;
        runtimeIncluded: boolean;
        categoryIds?: string[];
      }>;
    };
    expect(
      registry.entries.find((entry) => entry.id === 'registry.catalog.decision-policies'),
    ).toMatchObject({
      kind: 'decision_policy_catalog',
      path: 'content/catalogs/decision-policies/catalog.json',
      runtimeIncluded: false,
      categoryIds: ['decision-policy.mdd-initial-medication'],
    });
    expect(
      registry.entries.find((entry) => entry.id === 'registry.catalog.decision-balances'),
    ).toMatchObject({
      kind: 'decision_balance_catalog',
      path: 'content/catalogs/decision-policies/balances.json',
      runtimeIncluded: false,
      categoryIds: [
        'balance.mdd-any-medication-reaction-history',
        'balance.mdd-any-medication-reconciliation',
        'balance.mdd-initial-depressive-syndrome-assessment',
        'balance.mdd-initial-episode-course-assessment',
        'balance.mdd-initial-one-first-line-antidepressant',
        'balance.mdd-substance-history',
      ],
    });
  });

  it('keeps finding wording content outside Player and Reviewer runtimes while exposing only the pure compiler', async () => {
    const [runtimeEntry, runtimeIndex, reviewerEntry, registryText, compilerSource] =
      await Promise.all([
        readFile(resolve('packages/content-runtime/src/content.ts'), 'utf8'),
        readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
        readFile(resolve('packages/content-runtime/src/reviewer-content.ts'), 'utf8'),
        readFile(resolve('content/registry.json'), 'utf8'),
        readFile(resolve('packages/engine/src/shared-finding-compiler.ts'), 'utf8'),
      ]);
    const runtimeSource = `${runtimeEntry}\n${runtimeIndex}\n${reviewerEntry}`;
    expect(runtimeSource).not.toContain('content/catalogs/findings/expression-banks.json');
    expect(runtimeSource).not.toContain('registry.catalog.finding-expression-banks');
    expect(compilerSource).not.toContain('content/catalogs/');
    expect(compilerSource).not.toContain('import.meta.glob');

    const registry = JSON.parse(registryText) as {
      entries: Array<{
        id: string;
        kind: string;
        path: string;
        runtimeIncluded: boolean;
      }>;
    };
    expect(
      registry.entries.find((entry) => entry.id === 'registry.catalog.finding-expression-banks'),
    ).toMatchObject({
      kind: 'finding_expression_bank_catalog',
      path: 'content/catalogs/findings/expression-banks.json',
      runtimeIncluded: false,
    });
  });

  it('keeps catalog-compiled patient instances synthetic and outside content runtimes', async () => {
    const [
      runtimeEntry,
      runtimeIndex,
      reviewerEntry,
      engineRoot,
      authoringEntry,
      admittedTemplateLocationBindingSource,
      locationOwnedPatientSlotSelectionSource,
      locationPatientSlotCapacitySource,
      locationTemplateSelectionSource,
      backgroundFindingSource,
      compilerSource,
      richnessSource,
      conditionFindingCardinalitySource,
      decisionBalanceSource,
      decisionSelectionSource,
      diagnosisInformationPrerequisiteAdapterSource,
      emptyAuthorizedPatientSlotFillSource,
      encounterOperationalAdmissionSource,
      facilityMoveWaitingSlotMigrationSource,
      findingPipelineAuditSource,
      generatedCompletedAttemptSource,
      generatedServiceQuoteSource,
      instrumentItemResponseSource,
      informationActionFingerprintSource,
      medicationRegimenRouteAdapterSource,
      optionalComorbidityBridgeSource,
      optionalExposureSource,
      optionalFeatureBudgetSource,
      optionalPriorTreatmentSource,
      optionalReactionHistorySource,
      modePatientTemplateHorizonSource,
      patientSlotFillSeedAuthoritySource,
      patientSlotPostEncounterLifecycleSource,
      patientTemplateLocationAdmissionSource,
      preFindingPatientStateSource,
      resolvedConditionSource,
      resolvedPatientStateNormalizerSource,
      resolvedPatientStateComposerSource,
      selectedLocationOperationalResourceSource,
      structuredSourceReportBehaviorSelectorSource,
      structuredSourceReportSource,
      targetScopedPatientValueProjectionSource,
      universalActionResultAttachmentSource,
      universalActionResultSource,
      weightedFindingTendencyApplicabilitySource,
      weightedFindingTendencySource,
    ] = await Promise.all([
      readFile(resolve('packages/content-runtime/src/content.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
      readFile(resolve('packages/content-runtime/src/reviewer-content.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/index.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/authoring.ts'), 'utf8'),
      readFile(
        resolve('packages/engine/src/admitted-template-location-binding-compiler.ts'),
        'utf8',
      ),
      readFile(
        resolve('packages/engine/src/location-owned-patient-slot-selection-compiler.ts'),
        'utf8',
      ),
      readFile(resolve('packages/engine/src/location-patient-slot-capacity-compiler.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/location-template-selector.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/background-finding-outcome-selector.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/catalog-instance-compiler.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/presentation-richness.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/condition-finding-cardinality-selector.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/decision-balance.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/decision-selection.ts'), 'utf8'),
      readFile(
        resolve('packages/engine/src/diagnosis-information-prerequisite-adapter.ts'),
        'utf8',
      ),
      readFile(
        resolve('packages/engine/src/empty-authorized-patient-slot-fill-compiler.ts'),
        'utf8',
      ),
      readFile(resolve('packages/engine/src/encounter-operational-admission-compiler.ts'), 'utf8'),
      readFile(
        resolve('packages/engine/src/facility-move-waiting-slot-migration-compiler.ts'),
        'utf8',
      ),
      readFile(resolve('packages/engine/src/finding-pipeline-audit-composer.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/generated-completed-attempt-compiler.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/generated-service-quote.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/instrument-item-response-compiler.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/information-action-fingerprint.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/medication-regimen-route-adapter.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/optional-comorbidity-budget-bridge.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/optional-exposure-budget-bridge.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/optional-feature-budget-selector.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/optional-prior-treatment-bridge.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/optional-reaction-history-bridge.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/mode-patient-template-horizon-compiler.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/patient-slot-fill-seed-authority.ts'), 'utf8'),
      readFile(
        resolve('packages/engine/src/patient-slot-post-encounter-lifecycle-compiler.ts'),
        'utf8',
      ),
      readFile(
        resolve('packages/engine/src/patient-template-location-admission-compiler.ts'),
        'utf8',
      ),
      readFile(resolve('packages/engine/src/pre-finding-patient-state-orchestrator.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/resolved-condition-source.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/resolved-patient-state-normalizer.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/resolved-patient-state-composer.ts'), 'utf8'),
      readFile(
        resolve('packages/engine/src/selected-location-operational-resource-compiler.ts'),
        'utf8',
      ),
      readFile(
        resolve('packages/engine/src/structured-source-report-behavior-selector.ts'),
        'utf8',
      ),
      readFile(resolve('packages/engine/src/structured-source-report-compiler.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/target-scoped-patient-value-projection.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/universal-action-result-attachment.ts'), 'utf8'),
      readFile(resolve('packages/engine/src/universal-action-result-compiler.ts'), 'utf8'),
      readFile(
        resolve('packages/engine/src/weighted-finding-tendency-applicability-compiler.ts'),
        'utf8',
      ),
      readFile(resolve('packages/engine/src/weighted-finding-tendency-aggregator.ts'), 'utf8'),
    ]);
    const runtimeSource = `${runtimeEntry}\n${runtimeIndex}\n${reviewerEntry}`;
    for (const authoringModule of [
      'admitted-template-location-binding-compiler',
      'background-finding-outcome-selector',
      'catalog-instance-compiler',
      'condition-finding-cardinality-selector',
      'decision-balance',
      'decision-selection',
      'decision-policy',
      'diagnosis-information-prerequisite-adapter',
      'empty-authorized-patient-slot-fill-compiler',
      'encounter-operational-admission-compiler',
      'facility-move-waiting-slot-migration-compiler',
      'finding-pipeline-audit-composer',
      'generated-completed-attempt-compiler',
      'generated-service-quote',
      'instrument-item-response-compiler',
      'information-action-fingerprint',
      'location-owned-patient-slot-selection-compiler',
      'location-patient-slot-capacity-compiler',
      'location-template-selector',
      'medication-regimen-route-adapter',
      'mode-patient-template-horizon-compiler',
      'optional-comorbidity-budget-bridge',
      'optional-exposure-budget-bridge',
      'optional-feature-budget-selector',
      'optional-prior-treatment-bridge',
      'optional-reaction-history-bridge',
      'patient-slot-fill-seed-authority',
      'patient-slot-post-encounter-lifecycle-compiler',
      'patient-template-location-admission-compiler',
      'pre-finding-patient-state-orchestrator',
      'presentation-richness',
      'resolved-condition-source',
      'resolved-patient-state-normalizer',
      'resolved-patient-state-composer',
      'selected-location-operational-resource-compiler',
      'shared-finding-compiler',
      'structured-source-report-behavior-selector',
      'structured-source-report-compiler',
      'target-scoped-patient-value-projection',
      'template-condition-selector',
      'universal-action-result-attachment',
      'universal-action-result-compiler',
      'weighted-finding-tendency-applicability-compiler',
      'weighted-finding-tendency-aggregator',
    ]) {
      expect(runtimeSource).not.toContain(authoringModule);
      expect(engineRoot).not.toContain(authoringModule);
      expect(authoringEntry).toContain(authoringModule);
    }
    expect(runtimeSource).not.toContain('patient-template.test');
    expect(runtimeSource).not.toContain('catalog-instance-snapshot');
    for (const source of [
      admittedTemplateLocationBindingSource,
      locationOwnedPatientSlotSelectionSource,
      locationPatientSlotCapacitySource,
      locationTemplateSelectionSource,
      backgroundFindingSource,
      compilerSource,
      richnessSource,
      conditionFindingCardinalitySource,
      decisionBalanceSource,
      decisionSelectionSource,
      diagnosisInformationPrerequisiteAdapterSource,
      emptyAuthorizedPatientSlotFillSource,
      encounterOperationalAdmissionSource,
      facilityMoveWaitingSlotMigrationSource,
      findingPipelineAuditSource,
      generatedCompletedAttemptSource,
      generatedServiceQuoteSource,
      informationActionFingerprintSource,
      instrumentItemResponseSource,
      medicationRegimenRouteAdapterSource,
      optionalComorbidityBridgeSource,
      optionalExposureSource,
      optionalFeatureBudgetSource,
      optionalPriorTreatmentSource,
      optionalReactionHistorySource,
      modePatientTemplateHorizonSource,
      patientSlotFillSeedAuthoritySource,
      patientSlotPostEncounterLifecycleSource,
      patientTemplateLocationAdmissionSource,
      preFindingPatientStateSource,
      resolvedConditionSource,
      resolvedPatientStateNormalizerSource,
      resolvedPatientStateComposerSource,
      selectedLocationOperationalResourceSource,
      structuredSourceReportBehaviorSelectorSource,
      structuredSourceReportSource,
      targetScopedPatientValueProjectionSource,
      universalActionResultAttachmentSource,
      universalActionResultSource,
      weightedFindingTendencyApplicabilitySource,
      weightedFindingTendencySource,
    ]) {
      expect(source).not.toContain('content/catalogs/');
      expect(source).not.toContain('content/cases/');
      expect(source).not.toContain('import.meta.glob');
      expect(source).not.toContain('Math.random');
      expect(source).not.toContain('Date.now');
      expect(source).not.toContain('new Date');
      expect(source).not.toMatch(/from\s+['"]react['"]/);
    }
    expect(admittedTemplateLocationBindingSource).toContain(
      'verifyPatientTemplateLocationAdmissionMatrixContext',
    );
    expect(admittedTemplateLocationBindingSource).not.toContain(
      'selectOptionalFeaturesWithinBudget',
    );
    expect(admittedTemplateLocationBindingSource).not.toMatch(
      /from\s+['"].*(scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(admittedTemplateLocationBindingSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(locationOwnedPatientSlotSelectionSource).toContain(
      'compileAdmittedTemplateLocationBinding',
    );
    expect(locationOwnedPatientSlotSelectionSource).toContain(
      'verifyPatientTemplateLocationAdmissionMatrixContext',
    );
    expect(locationOwnedPatientSlotSelectionSource).not.toContain(
      'selectOptionalFeaturesWithinBudget',
    );
    expect(locationOwnedPatientSlotSelectionSource).not.toMatch(
      /from\s+['"].*(scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(locationOwnedPatientSlotSelectionSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(locationPatientSlotCapacitySource).toContain('verifyLocationTemplateSelectionIntegrity');
    expect(locationPatientSlotCapacitySource).not.toMatch(
      /from\s+['"].*(queue|progression|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(locationPatientSlotCapacitySource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(locationTemplateSelectionSource).toContain('compileLocationOwnedPatientSlotSelection');
    expect(locationTemplateSelectionSource).toContain(
      'verifyPatientTemplateLocationAdmissionMatrixContext',
    );
    expect(locationTemplateSelectionSource).not.toContain('selectOptionalFeaturesWithinBudget');
    expect(locationTemplateSelectionSource).not.toMatch(
      /from\s+['"].*(scoring|economy|receipt|persistence|browser).*['"]/,
    );
    expect(locationTemplateSelectionSource).not.toMatch(
      /\b(?:Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(patientSlotFillSeedAuthoritySource).toContain('compileLocationTemplateSelection');
    expect(patientSlotFillSeedAuthoritySource).toContain(
      'compileCapacityBoundLocationTemplateSelectionCertificate',
    );
    expect(patientSlotFillSeedAuthoritySource).not.toContain('composeFindingPipelineAudit');
    expect(patientSlotFillSeedAuthoritySource).not.toMatch(
      /from\s+['"].*(queue|progression|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(patientSlotFillSeedAuthoritySource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(emptyAuthorizedPatientSlotFillSource).toContain('composeFindingPipelineAudit');
    expect(emptyAuthorizedPatientSlotFillSource).toContain(
      'verifyPatientSlotFillSeedAuthorityContext',
    );
    expect(emptyAuthorizedPatientSlotFillSource).toContain(
      'compileLocationPatientSlotOccupancySnapshot',
    );
    expect(emptyAuthorizedPatientSlotFillSource).not.toMatch(
      /from\s+['"].*(queue|progression|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(emptyAuthorizedPatientSlotFillSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(patientSlotPostEncounterLifecycleSource).toContain(
      'compileEmptyAuthorizedPatientSlotFill',
    );
    expect(patientSlotPostEncounterLifecycleSource).toContain(
      'compileLocationPatientSlotOccupancySnapshot',
    );
    expect(patientSlotPostEncounterLifecycleSource).toContain(
      'createLocationTemplateSelectionEligibilityOverlay',
    );
    expect(patientSlotPostEncounterLifecycleSource).not.toContain('composeFindingPipelineAudit');
    expect(patientSlotPostEncounterLifecycleSource).not.toMatch(
      /\b(?:CompletedAttemptSchema|SaveData|PatientQueueState|seededUnit)\b/,
    );
    expect(patientSlotPostEncounterLifecycleSource).not.toMatch(
      /from\s+['"].*(queue|progression|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(patientSlotPostEncounterLifecycleSource).not.toMatch(
      /\b(?:Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(generatedCompletedAttemptSource).toContain('verifyFindingPipelineAuditIntegrity');
    expect(generatedCompletedAttemptSource).not.toMatch(
      /\b(?:CaseInstance|EncounterState|CompletedAttemptSchema|SaveData|PatientQueueState)\b/,
    );
    expect(generatedCompletedAttemptSource).not.toMatch(
      /from\s+['"].*(queue|progression|receipt|persistence|browser|rng).*['"]/,
    );
    expect(generatedCompletedAttemptSource).not.toMatch(
      /\b(?:Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(modePatientTemplateHorizonSource).not.toMatch(
      /from\s+['"].*(queue|progression|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(modePatientTemplateHorizonSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(optionalComorbidityBridgeSource).not.toContain('seededUnit');
    expect(optionalExposureSource).not.toContain('seededUnit');
    expect(optionalExposureSource).not.toContain('AgentMisuseGenerationPrior');
    expect(optionalExposureSource).not.toMatch(/from\s+['"].*scoring.*['"]/);
    expect(optionalPriorTreatmentSource).not.toContain('seededUnit');
    expect(optionalPriorTreatmentSource).not.toMatch(/from\s+['"].*scoring.*['"]/);
    expect(optionalReactionHistorySource).not.toContain('seededUnit');
    expect(optionalReactionHistorySource).not.toContain('MedicationReactionSelectionPolicy');
    expect(optionalReactionHistorySource).not.toMatch(/from\s+['"].*scoring.*['"]/);
    expect(patientTemplateLocationAdmissionSource).toContain(
      'compileSelectedLocationOperationalResourceContext',
    );
    expect(patientTemplateLocationAdmissionSource).toContain(
      'compileEncounterOperationalAdmission',
    );
    expect(patientTemplateLocationAdmissionSource).not.toContain(
      'selectOptionalFeaturesWithinBudget',
    );
    expect(patientTemplateLocationAdmissionSource).not.toContain(
      'orchestratePreFindingPatientState',
    );
    expect(patientTemplateLocationAdmissionSource).not.toMatch(
      /from\s+['"].*(scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(patientTemplateLocationAdmissionSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(preFindingPatientStateSource).not.toMatch(
      /from\s+['"].*(catalog-instance-compiler|encounter-operational-admission-compiler|finding-pipeline-audit-composer|scoring|economy|receipt|persistence|browser).*['"]/,
    );
    expect(preFindingPatientStateSource).not.toMatch(
      /\b(?:Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(findingPipelineAuditSource).toContain(
      'verifyPreFindingPatientStateOrchestrationIntegrity',
    );
    expect(findingPipelineAuditSource).not.toContain(
      'verifyResolvedPatientStateCompositionIntegrity',
    );
    expect(findingPipelineAuditSource).not.toContain('composeResolvedPatientState');
    expect(findingPipelineAuditSource).not.toContain('selectOptionalFeaturesWithinBudget');
    expect(findingPipelineAuditSource).toContain(
      'verifyWeightedFindingTendencyApplicabilityIntegrity',
    );
    expect(findingPipelineAuditSource).toContain('aggregateWeightedFindingTendencies');
    expect(findingPipelineAuditSource).not.toContain('compileWeightedFindingTendencyApplicability');
    expect(findingPipelineAuditSource).not.toContain('matchDecisionPatientPredicateAgainstFacts');
    expect(findingPipelineAuditSource).toContain('verifyPatientSlotFillSeedAuthorityIntegrity');
    expect(findingPipelineAuditSource).not.toContain(
      'verifyCapacityBoundLocationTemplateSelectionCertificateIntegrity',
    );
    expect(findingPipelineAuditSource).not.toContain(
      'compileCapacityBoundLocationTemplateSelectionCertificate',
    );
    expect(findingPipelineAuditSource).not.toContain('compileLocationPatientSlotCapacity');
    expect(findingPipelineAuditSource).not.toContain('seededUnit');
    expect(findingPipelineAuditSource).not.toMatch(/from\s+['"].*scoring.*['"]/);
    expect(facilityMoveWaitingSlotMigrationSource).toContain('verifyFindingPipelineAuditIntegrity');
    expect(facilityMoveWaitingSlotMigrationSource).toContain(
      'verifyLocationPatientSlotCapacityContext',
    );
    expect(facilityMoveWaitingSlotMigrationSource).toContain(
      'verifyPatientTemplateLocationAdmissionMatrixContext',
    );
    expect(facilityMoveWaitingSlotMigrationSource).not.toMatch(
      /from\s+['"].*(queue|progression|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(facilityMoveWaitingSlotMigrationSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(instrumentItemResponseSource).not.toMatch(
      /from\s+['"].*(catalog-instance-compiler|optional-feature-budget-selector|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(instrumentItemResponseSource).not.toContain('selectOptionalFeaturesWithinBudget');
    expect(resolvedConditionSource).not.toContain('seededUnit');
    expect(resolvedPatientStateComposerSource).not.toContain('seededUnit');
    expect(resolvedPatientStateComposerSource).not.toMatch(/from\s+['"].*scoring.*['"]/);
    expect(resolvedPatientStateComposerSource).not.toContain('compileSharedFindings');
    expect(resolvedPatientStateComposerSource).not.toContain('compileCatalogInstances');
    expect(resolvedPatientStateComposerSource).not.toContain('composeFindingPipelineAudit');
    expect(selectedLocationOperationalResourceSource).not.toMatch(
      /from\s+['"].*(catalog-instance-compiler|encounter-operational-admission-compiler|finding-pipeline-audit-composer|optional-feature-budget-selector|scoring|economy|receipt|persistence|browser|rng).*['"]/,
    );
    expect(selectedLocationOperationalResourceSource).not.toContain(
      'selectOptionalFeaturesWithinBudget',
    );
    expect(selectedLocationOperationalResourceSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(structuredSourceReportSource).not.toMatch(
      /from\s+['"].*(catalog-instance-compiler|finding-pipeline-audit-composer|optional-feature-budget-selector|scoring|economy|receipt|rng).*['"]/,
    );
    expect(structuredSourceReportSource).not.toContain('selectOptionalFeaturesWithinBudget');
    expect(structuredSourceReportSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(structuredSourceReportBehaviorSelectorSource).not.toMatch(
      /from\s+['"].*(catalog-instance-compiler|finding-pipeline-audit-composer|scoring|economy|receipt).*['"]/,
    );
    expect(structuredSourceReportBehaviorSelectorSource).not.toContain(
      'selectOptionalFeaturesWithinBudget',
    );
    expect(structuredSourceReportBehaviorSelectorSource).not.toContain('ResolvedPatientState');
    expect(structuredSourceReportBehaviorSelectorSource).not.toMatch(
      /\b(?:Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(weightedFindingTendencyApplicabilitySource).not.toContain('seededUnit');
    expect(weightedFindingTendencyApplicabilitySource).not.toContain(
      'aggregateWeightedFindingTendencies',
    );
    expect(weightedFindingTendencyApplicabilitySource).not.toMatch(
      /from\s+['"].*(scoring|economy|receipt|rng)['"]/,
    );
    expect(universalActionResultSource).not.toMatch(
      /from\s+['"].*(catalog-instance-compiler|optional-feature-budget-selector|scoring|economy|receipt|rng).*['"]/,
    );
    expect(universalActionResultSource).not.toContain('compileCatalogInstances');
    expect(universalActionResultSource).not.toContain('selectOptionalFeaturesWithinBudget');
    expect(universalActionResultSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
    expect(universalActionResultAttachmentSource).not.toMatch(
      /from\s+['"].*(catalog-instance-compiler|finding-pipeline-audit-composer|optional-feature-budget-selector|scoring|economy|receipt|rng).*['"]/,
    );
    expect(universalActionResultAttachmentSource).not.toMatch(
      /\b(?:seededUnit|Math\.random|window|document|indexedDB|localStorage)\b/,
    );
  });

  it('rejects authoring-engine subpath imports anywhere in web or content-runtime source', async () => {
    const files = (
      await Promise.all(
        [resolve('apps/web'), resolve('packages/content-runtime/src')].map(filesBelow),
      )
    )
      .flat()
      .filter((file) => /\.(ts|tsx)$/.test(file));
    const importPattern =
      /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      const specifiers = [...source.matchAll(importPattern)].map((match) => match[1]!);
      for (const specifier of specifiers) {
        expect(
          specifier.startsWith('@psychsim/engine/') || specifier.includes('/engine/src/'),
          `${file} imports quarantined engine module ${specifier}`,
        ).toBe(false);
      }
    }
  });

  it('keeps the personal-knowledge workbench behind a local serve-only boundary', async () => {
    const [plugin, app, browser, developerView, classificationView, runtimeRoot, reviewer] =
      await Promise.all([
        readFile(resolve('apps/web/personal-knowledge-workbench-plugin.ts'), 'utf8'),
        readFile(resolve('apps/web/src/App.tsx'), 'utf8'),
        readFile(resolve('apps/web/src/components/DatabaseBrowser.tsx'), 'utf8'),
        readFile(resolve('apps/web/src/components/DeveloperDatabaseKnowledge.tsx'), 'utf8'),
        readFile(
          resolve('apps/web/src/components/DeveloperDiagnosisClassificationInspector.tsx'),
          'utf8',
        ),
        readFile(resolve('packages/content-runtime/src/index.ts'), 'utf8'),
        readFile(resolve('packages/content-runtime/src/reviewer-content.ts'), 'utf8'),
      ]);
    expect(plugin).toContain("apply: 'serve'");
    expect(plugin).toContain("address === '127.0.0.1'");
    expect(plugin).toContain('/__psychsim/developer-database-knowledge');
    expect(plugin).toContain('/__psychsim/developer-diagnosis-classification');
    expect(app).toContain('import.meta.env.DEV && !REVIEWER_BUILD');
    expect(app).toContain("import('./components/PersonalKnowledgeWorkbench')");
    expect(browser).not.toContain('Full personal-corpus cross-reference');
    expect(browser).not.toContain('Cross-referenced knowledge');
    expect(browser).not.toContain('Knowledge dossier brief');
    expect(browser).not.toContain('Potential patient/randomization inputs');
    expect(browser).not.toContain('ICD-10-CM authoring classification index');
    expect(developerView).toContain('Full personal-corpus cross-reference');
    expect(developerView).toContain('Knowledge dossier brief');
    expect(developerView).toContain('Potential patient/randomization inputs');
    expect(classificationView).toContain('ICD-10-CM authoring classification index');
    expect(classificationView).toContain('does not increase the');
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
    expect(medicationIdentities).toHaveLength(53);
    expect(catalogs.medications).toHaveLength(13);
    const identityOnlyIds = medicationIdentities
      .filter((identity) => identity.authoringStatus === 'identity_only')
      .map((identity) => identity.id);
    expect(identityOnlyIds).toHaveLength(40);
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
