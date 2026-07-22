import { describe, expect, it } from 'vitest';

import { instantiateCase, resolveNumericTestProfile } from '@psychsim/engine';
import {
  CaseInstanceSchema,
  PatientObservationSchema,
  SourceUseNoteSchema,
  WorkupObjectiveSchema,
} from '@psychsim/schemas';

import {
  approvedCaseBlueprints,
  catalogs,
  medicationCheckPalpitationsBlueprint,
  prototypeCaseBlueprint,
  startingClinic,
} from './content';
import { findAffectedContentIds } from './impact';
import { contentRegistry } from './registry';
import { validateCaseBlueprint, validateCatalogs, validateContentRegistry } from './validation';

describe('prototype content', () => {
  it('parses and passes semantic validation', () => {
    expect(validateCatalogs(catalogs)).toEqual({ valid: true, issues: [] });
    for (const blueprint of approvedCaseBlueprints) {
      expect(validateCaseBlueprint(blueprint, catalogs, startingClinic)).toEqual({
        valid: true,
        issues: [],
      });
    }
  });

  it('defaults pre-pool saved case instances to the starter pool during parsing', () => {
    const legacyInstance = structuredClone(
      instantiateCase(prototypeCaseBlueprint, 'legacy-pool-default', catalogs),
    ) as unknown as { metadata: { patientPool?: string } };
    delete legacyInstance.metadata.patientPool;
    expect(CaseInstanceSchema.parse(legacyInstance).metadata.patientPool).toBe('starter');
  });

  it('catalogs formal publications independently from their rule contributions', () => {
    expect(catalogs.evidenceSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'evidence.canmat.mdd-adults.2023-update',
          doi: '10.1177/07067437241245384',
          medicalReviewStatus: 'unreviewed',
        }),
        expect.objectContaining({
          id: 'evidence.fda.citalopram-capsules-label.2023',
          sourceType: 'regulatory_document',
          medicalReviewStatus: 'unreviewed',
        }),
      ]),
    );
    const fdaContribution = medicationCheckPalpitationsBlueprint.patientRecord.sourceUseNotes[0];
    expect(fdaContribution).toMatchObject({
      authority: 'formal_publication',
      evidenceSourceIds: ['evidence.fda.citalopram-capsules-label.2023'],
      targetContentIds: ['objective.ecg-mdd-cardiac-monitoring'],
      contributionTypes: ['workup', 'safety'],
    });
    expect(
      approvedCaseBlueprints.flatMap((caseDefinition) =>
        caseDefinition.patientRecord.sourceUseNotes.flatMap((note) => note.evidenceSourceIds),
      ),
    ).not.toContain('evidence.canmat.mdd-adults.2023-update');
  });

  it('rejects formal contributions that cite an uncataloged publication', () => {
    const invalid = structuredClone(medicationCheckPalpitationsBlueprint);
    invalid.patientRecord.sourceUseNotes[0]!.evidenceSourceIds = ['evidence.missing'];
    invalid.metadata.evidenceSourceIds = ['evidence.missing'];
    expect(
      validateCaseBlueprint(invalid, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INVALID_EVIDENCE_SOURCE_REF',
      ),
    ).toBe(true);
  });

  it('does not let expert opinion borrow a formal citation', () => {
    expect(
      SourceUseNoteSchema.safeParse({
        id: 'source-use.invalid-expert-citation',
        authority: 'expert_opinion',
        evidenceSourceIds: ['evidence.canmat.mdd-adults.2023-update'],
        sourceDocumentId: null,
        sourceChunkIds: [],
        targetContentIds: ['case.first-visit-depression'],
        contributionTypes: ['context_only'],
        contribution: 'A personal note cannot borrow an article citation.',
        generatedBy: 'human',
        medicalReviewStatus: 'unreviewed',
      }).success,
    ).toBe(false);
  });

  it('keeps the ECG patient deterministic and its cardiac result authored across seeds', () => {
    const first = instantiateCase(medicationCheckPalpitationsBlueprint, 'ecg-repeatable', catalogs);
    expect(first).toEqual(
      instantiateCase(medicationCheckPalpitationsBlueprint, 'ecg-repeatable', catalogs),
    );
    const ecgResult = (seed: string) => {
      const result = instantiateCase(
        medicationCheckPalpitationsBlueprint,
        seed,
        catalogs,
      ).informationActions.find((action) => action.actionId === 'info.imaging.ecg')!.result;
      return {
        factsRevealed: result.factsRevealed,
        findings: result.findings
          .map(({ id, outcome, valueText }) => ({ id, outcome, valueText }))
          .sort((left, right) => left.id.localeCompare(right.id)),
      };
    };
    for (let index = 0; index < 50; index += 1) {
      expect(ecgResult(`ecg-protected-${index}`)).toEqual(ecgResult('ecg-protected-baseline'));
    }
  });

  it('rejects invalid structured patient content', () => {
    const invalid = structuredClone(prototypeCaseBlueprint);
    invalid.informationActions[0]!.result.findings = [];
    const report = validateCaseBlueprint(invalid, catalogs, startingClinic);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'SCHEMA_INVALID')).toBe(true);
  });

  it('tracks medical review at rule level and requires attribution for approval', () => {
    expect(
      prototypeCaseBlueprint.workupObjectives.every(
        (objective) => objective.review.status === 'unreviewed',
      ),
    ).toBe(true);
    const objective = structuredClone(prototypeCaseBlueprint.workupObjectives[0]!);
    objective.review = {
      status: 'approved',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    expect(WorkupObjectiveSchema.safeParse(objective).success).toBe(false);
  });

  it('owns one broad primary treatment pathway while retaining explicit future extensions', () => {
    const reference = prototypeCaseBlueprint.patientRecord.treatmentReference;
    expect(reference.primaryAuthoredPathwayId).toBe('path.mdd-single-antidepressant-outpatient');
    expect(reference.additionalAuthoredPathwayIds).toEqual([]);
    const primary = prototypeCaseBlueprint.treatmentPathways.find(
      (pathway) => pathway.id === reference.primaryAuthoredPathwayId,
    )!;
    expect(JSON.stringify(primary.match)).toContain('treatmentStartedWithTag');
    expect(JSON.stringify(primary.match)).toContain('antidepressant');
  });

  it('rejects unconstrained or impossible variable findings', () => {
    const unconstrained = structuredClone(prototypeCaseBlueprint);
    const symptoms = unconstrained.informationActions.find(
      (action) => action.actionId === 'info.history.depressive-symptoms',
    )!;
    delete symptoms.result.selection;
    expect(
      validateCaseBlueprint(unconstrained, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'UNCONSTRAINED_VARIABLE_FINDING',
      ),
    ).toBe(true);

    const impossible = structuredClone(prototypeCaseBlueprint);
    const impossibleSymptoms = impossible.informationActions.find(
      (action) => action.actionId === 'info.history.depressive-symptoms',
    )!;
    impossibleSymptoms.result.selection!.maximumPresent = 99;
    expect(
      validateCaseBlueprint(impossible, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'IMPOSSIBLE_FINDING_SELECTION',
      ),
    ).toBe(true);
  });

  it('rejects invalid catalog references', () => {
    const invalid = structuredClone(catalogs);
    invalid.informationActions[0]!.serviceId = 'service.missing';
    expect(
      validateCatalogs(invalid).issues.some((issue) => issue.code === 'INVALID_SERVICE_REF'),
    ).toBe(true);
  });

  it('rejects upgrade catalogs with unknown service or formulary relationships', () => {
    const invalid = structuredClone(catalogs);
    const ecgUpgrade = invalid.upgrades.find((upgrade) => upgrade.id === 'upgrade.equipment.ecg')!;
    ecgUpgrade.serviceIds = ['service.missing'];
    expect(
      validateCatalogs(invalid).issues.some(
        (issue) => issue.code === 'INVALID_UPGRADE_SERVICE_REF',
      ),
    ).toBe(true);
  });

  it('requires a separate test definition for every laboratory and imaging action', () => {
    const diagnosticActionIds = catalogs.informationActions
      .filter((action) => action.category === 'labs' || action.category === 'imaging')
      .map((action) => action.id)
      .sort();
    expect(catalogs.tests.map((test) => test.actionId).sort()).toEqual(diagnosticActionIds);

    const invalid = structuredClone(catalogs);
    invalid.tests.pop();
    expect(
      validateCatalogs(invalid).issues.some((issue) => issue.code === 'MISSING_TEST_DEFINITION'),
    ).toBe(true);
  });

  it('requires test profiles to reference a declared interval set', () => {
    const invalid = structuredClone(catalogs);
    const numericTest = invalid.tests.find((test) => test.generator.type === 'numeric_panel')!;
    if (numericTest.generator.type !== 'numeric_panel') throw new Error('Expected numeric test');
    numericTest.generator.profiles[0]!.referenceIntervalSetId = 'reference-interval.missing';
    expect(
      validateCatalogs(invalid).issues.some(
        (issue) => issue.code === 'INVALID_REFERENCE_INTERVAL_SET_REF',
      ),
    ).toBe(true);
  });

  it('rejects a numeric abnormal flag that disagrees with the displayed interval', () => {
    const parsed = PatientObservationSchema.safeParse({
      id: 'observation.test.sodium',
      actionId: 'info.labs.cmp',
      label: 'Sodium',
      dataType: 'scalar',
      value: 147,
      displayValue: '147',
      unit: 'mmol/L',
      ucumCode: 'mmol/L',
      referenceInterval: {
        low: 135,
        high: 145,
        unit: 'mmol/L',
        ucumCode: 'mmol/L',
        display: '135–145 mmol/L',
        sourceId: 'reference-interval.prototype-adult-general',
      },
      flag: 'normal',
      clinicallyCritical: false,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects incidental test ranges that could become clinically extreme', () => {
    const invalid = structuredClone(catalogs);
    const numericTest = invalid.tests.find((test) => test.generator.type === 'numeric_panel')!;
    if (numericTest.generator.type !== 'numeric_panel') throw new Error('Expected numeric test.');
    numericTest.generator.profiles[0]!.components[0]!.mildAbnormalRanges[0]!.minimum = -20;
    expect(
      validateCatalogs(invalid).issues.some(
        (issue) => issue.code === 'INCIDENTAL_TEST_RANGE_NOT_MILD',
      ),
    ).toBe(true);
  });

  it('requires indicated investigation rewards to exceed their point costs', () => {
    const invalid = structuredClone(prototypeCaseBlueprint);
    invalid.workupObjectives.find(
      (objective) => objective.id === 'objective.mdd-episode-course',
    )!.points = 5;
    expect(
      validateCaseBlueprint(invalid, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INDICATED_ACTION_REWARD_NOT_ABOVE_COST',
      ),
    ).toBe(true);
  });

  it('preserves author medication notes separately and keeps active fit rules unreviewed', () => {
    const mirtazapine = catalogs.medications.find(
      (medication) => medication.id === 'medication.mirtazapine',
    )!;
    expect(mirtazapine.authorOverrides.length).toBeGreaterThan(0);
    expect(mirtazapine.fitModifiers.map((modifier) => modifier.pointDelta)).toEqual(
      expect.arrayContaining([35, -50]),
    );
    expect(
      [...mirtazapine.authorOverrides, ...mirtazapine.fitModifiers].every(
        (modifier) => modifier.medicalReviewStatus === 'unreviewed',
      ),
    ).toBe(true);
  });

  it('keeps every runtime medication and approved patient in the content registry', () => {
    expect(validateContentRegistry(contentRegistry, catalogs, approvedCaseBlueprints)).toEqual({
      valid: true,
      issues: [],
    });
  });

  it('rejects a broken registry relationship and reports shared impact', () => {
    const invalid = structuredClone(contentRegistry);
    invalid.entries
      .find((entry) => entry.kind === 'patient')!
      .dependsOnIds.push('registry.missing');
    expect(
      validateContentRegistry(invalid, catalogs, approvedCaseBlueprints).issues.some(
        (issue) => issue.code === 'INVALID_REGISTRY_DEPENDENCY',
      ),
    ).toBe(true);
    expect(findAffectedContentIds(contentRegistry, ['medication.bupropion'])).toContain(
      'case.first-visit-depression',
    );
    expect(findAffectedContentIds(contentRegistry, ['registry.catalog.tests'])).toEqual(
      expect.arrayContaining(['case.first-visit-depression', 'case.restless-after-augmentation']),
    );
  });

  it('rejects assessment, plan, or scoring hints in pre-submission findings', () => {
    const invalid = structuredClone(prototypeCaseBlueprint);
    invalid.informationActions[0]!.result.findings[0]!.labelVariants[0] =
      'Defensible but redundant history';
    expect(
      validateCaseBlueprint(invalid, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'PRE_SUBMISSION_ACTION_CLASSIFICATION',
      ),
    ).toBe(true);
  });

  it('enforces SOAP-compatible source boundaries in the universal action catalog', () => {
    for (const action of catalogs.informationActions) {
      if (action.category === 'history' && action.resultSource !== 'record_review') {
        expect(action.soapSection).toBe('subjective');
      } else {
        expect(action.soapSection).toBe('objective');
      }
    }
  });

  it('rejects an unknown shared variant pool', () => {
    const invalid = structuredClone(prototypeCaseBlueprint);
    const pooledVariant = invalid.variants.find(
      (variant) => variant.generator.type === 'catalogChoice',
    );
    if (!pooledVariant || pooledVariant.generator.type !== 'catalogChoice') {
      throw new Error('Expected a catalog-backed variant.');
    }
    pooledVariant.generator.poolId = 'variant-pool.missing';
    expect(
      validateCaseBlueprint(invalid, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INVALID_VARIANT_POOL_REF',
      ),
    ).toBe(true);
  });

  it('requires a result for every universal information option', () => {
    const invalid = structuredClone(prototypeCaseBlueprint);
    invalid.informationActions.pop();
    expect(
      validateCaseBlueprint(invalid, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'MISSING_UNIVERSAL_ACTION_RESULT',
      ),
    ).toBe(true);
  });

  it('instantiates the same patient for the same blueprint and seed', () => {
    expect(instantiateCase(prototypeCaseBlueprint, 'repeatable-seed', catalogs)).toEqual(
      instantiateCase(prototypeCaseBlueprint, 'repeatable-seed', catalogs),
    );
  });

  it('varies short chief complaints and other declared noncritical fields across seeds', () => {
    const instances = Array.from({ length: 80 }, (_, index) =>
      instantiateCase(prototypeCaseBlueprint, `variety-${index}`, catalogs),
    );
    expect(
      new Set(instances.map((instance) => instance.opening.chiefComplaint)).size,
    ).toBeGreaterThan(8);
    expect(instances.every((instance) => instance.opening.chiefComplaint.length <= 40)).toBe(true);
    expect(
      new Set(instances.map((instance) => JSON.stringify(instance.resolvedVariants))).size,
    ).toBeGreaterThan(1);
  });

  it('generates a criteria-constrained but variable depressive symptom list', () => {
    const instances = Array.from({ length: 100 }, (_, index) =>
      instantiateCase(prototypeCaseBlueprint, `symptoms-${index}`, catalogs),
    );
    const signatures = new Set<string>();
    for (const instance of instances) {
      const result = instance.informationActions.find(
        (action) => action.actionId === 'info.history.depressive-symptoms',
      )!.result;
      const positive = result.findings.filter((finding) => finding.outcome === 'present');
      expect(positive.length).toBeGreaterThanOrEqual(5);
      expect(positive.length).toBeLessThanOrEqual(7);
      expect(positive.map((finding) => finding.id)).toEqual(
        expect.arrayContaining([
          'finding.depressive.depressed-mood',
          'finding.depressive.anhedonia',
        ]),
      );
      signatures.add(
        result.findings
          .map((finding) => `${finding.id}:${finding.outcome}`)
          .sort()
          .join('|'),
      );
    }
    expect(signatures.size).toBeGreaterThan(3);
  });

  it('keeps the suicide assessment concise and factual', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'safety-facts', catalogs);
    const findings = instance.informationActions.find(
      (action) => action.actionId === 'info.history.suicide-safety',
    )!.result.findings;
    expect(findings.map((finding) => [finding.id, finding.outcome])).toEqual(
      expect.arrayContaining([
        ['finding.suicide.attempt-history', 'absent'],
        ['finding.suicide.preparatory-behavior', 'absent'],
        ['finding.suicide.current-active-ideation', 'absent'],
        ['finding.suicide.passive-death-wish', 'present'],
      ]),
    );
    expect(findings).toHaveLength(4);
    expect(JSON.stringify(findings)).not.toMatch(/outpatient care|disposition|appropriate/i);
  });

  it('generates deterministic normal and bounded incidental values from per-test files', () => {
    const instances = Array.from({ length: 500 }, (_, index) =>
      instantiateCase(prototypeCaseBlueprint, `test-variation-${index}`, catalogs),
    );
    const generated = instances.flatMap((instance) =>
      instance.resolvedObservations.filter((observation) =>
        observation.origin.startsWith('generated_'),
      ),
    );
    expect(generated.some((observation) => observation.origin === 'generated_incidental')).toBe(
      true,
    );
    expect(generated.every((observation) => !observation.clinicallyCritical)).toBe(true);
    expect(generated.every((observation) => observation.notCaseDefining)).toBe(true);
    expect(
      generated.every(
        (observation) =>
          observation.ucumCode &&
          observation.referenceInterval?.display &&
          observation.referenceInterval.sourceId,
      ),
    ).toBe(true);

    const displayedCmp = instances[0]!.informationActions.find(
      (action) => action.actionId === 'info.labs.cmp',
    )!;
    expect(
      displayedCmp.result.findings.every(
        (finding) =>
          finding.numericMeasurement?.referenceInterval.display &&
          ['normal', 'high', 'low'].includes(finding.outcome),
      ),
    ).toBe(true);

    for (const instance of instances) {
      const abnormalCountByAction = new Map<string, number>();
      for (const observation of instance.resolvedObservations.filter((candidate) =>
        candidate.origin.startsWith('generated_'),
      )) {
        if (observation.flag !== 'normal') {
          abnormalCountByAction.set(
            observation.actionId,
            (abnormalCountByAction.get(observation.actionId) ?? 0) + 1,
          );
        }
      }
      expect([...abnormalCountByAction.values()].every((count) => count <= 1)).toBe(true);
    }

    for (const observation of generated) {
      const test = catalogs.tests.find((candidate) => candidate.actionId === observation.actionId)!;
      if (test.generator.type !== 'numeric_panel') continue;
      const profile = resolveNumericTestProfile(test, {
        ageYears: 32,
        sexForReference: prototypeCaseBlueprint.patientRecord.testGenerationContext.sexForReference,
        diagnosisIds: prototypeCaseBlueprint.patientRecord.diagnoses.map(
          (diagnosis) => diagnosis.id,
        ),
        clinicalTagIds: prototypeCaseBlueprint.patientRecord.clinicalTagIds,
      })!;
      const component = profile.components.find((candidate) =>
        observation.id.endsWith(candidate.id.replace('lab-component.', '')),
      )!;
      const value = observation.value as number;
      if (observation.flag === 'normal') {
        expect(value).toBeGreaterThanOrEqual(component.referenceRange.minimum);
        expect(value).toBeLessThanOrEqual(component.referenceRange.maximum);
      } else {
        const range = component.mildAbnormalRanges.find(
          (candidate) => candidate.flag === observation.flag,
        )!;
        expect(value).toBeGreaterThanOrEqual(range.minimum);
        expect(value).toBeLessThanOrEqual(range.maximum);
      }
    }
  });

  it('lets authored patient observations override generic test generation', () => {
    const instance = instantiateCase(prototypeCaseBlueprint, 'authored-test-override', catalogs);
    const pregnancy = instance.resolvedObservations.filter(
      (observation) => observation.actionId === 'info.labs.pregnancy',
    );
    expect(pregnancy).toHaveLength(1);
    expect(pregnancy[0]).toMatchObject({ origin: 'authored', clinicallyCritical: false });
  });

  it('produces at least 100 neutral presentations without changing protected logic', () => {
    const presentations = new Set(
      Array.from({ length: 220 }, (_, index) => {
        const instance = instantiateCase(prototypeCaseBlueprint, `presentation-${index}`, catalogs);
        return JSON.stringify({
          title: instance.opening.title,
          chiefComplaint: instance.opening.chiefComplaint,
          summary: instance.opening.summary,
        });
      }),
    );
    expect(presentations.size).toBeGreaterThanOrEqual(100);
  });

  it('keeps critical facts and scoring invariant across many seeds', () => {
    const protectedSnapshot = (seed: string) => {
      const instance = instantiateCase(prototypeCaseBlueprint, seed, catalogs);
      return {
        criticalFacts: instance.criticalFacts,
        facts: instance.informationActions.map((action) => ({
          actionId: action.actionId,
          classification: action.defaultClassification,
          factsRevealed: action.result.factsRevealed,
        })),
        workupObjectives: instance.workupObjectives,
        treatments: instance.availableTreatments,
        grades: instance.treatmentGrades,
        pathways: instance.treatmentPathways,
        rules: instance.scoreRules,
        scoring: instance.scoring,
        economy: instance.economy,
      };
    };
    const expected = protectedSnapshot('critical-baseline');
    for (let index = 0; index < 200; index += 1) {
      expect(protectedSnapshot(`critical-${index}`)).toEqual(expected);
    }
  });
});
