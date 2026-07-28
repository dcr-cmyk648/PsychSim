import { describe, expect, it } from 'vitest';

import { instantiateCase, resolveNumericTestProfile, resolveVariant } from '@psychsim/engine';
import {
  CatalogBundleSchema,
  CaseInstanceSchema,
  ClinicalDurationProfileSchema,
  DiagnosisDefinitionSchema,
  EvidenceSourceDefinitionSchema,
  FindingDefinitionSchema,
  MedicationIdentityDefinitionSchema,
  PatientComplexityProfileSchema,
  PatientObservationSchema,
  PatientReactionHistorySchema,
  SourceUseNoteSchema,
  SupplementIdentityDefinitionSchema,
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
import { medicationIdentities } from './medication-identities';
import { supplementIdentities } from './supplement-identities';
import { contentRegistry } from './registry';
import {
  validateCaseBlueprint,
  validateCatalogs,
  validateContentRegistry,
  validateMedicationIdentities,
} from './validation';

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

  it('keeps a class label on every medication and stable treatment tags on current SSRIs', () => {
    expect(catalogs.medications).toHaveLength(13);
    expect(catalogs.medications.every((medication) => medication.classes.length > 0)).toBe(true);
    const ssriIds = catalogs.medications
      .filter((medication) => medication.classes.includes('SSRI antidepressant'))
      .map((medication) => medication.id)
      .sort();
    expect(ssriIds).toEqual([
      'medication.citalopram',
      'medication.escitalopram',
      'medication.fluoxetine',
      'medication.sertraline',
    ]);
    expect(
      catalogs.medications
        .filter((medication) => ssriIds.includes(medication.id))
        .every((medication) => medication.tags.includes('antidepressant')),
    ).toBe(true);
    const availableAntidepressants =
      prototypeCaseBlueprint.availableTreatments.startMedicationIds.filter((medicationId) =>
        catalogs.medications
          .find((medication) => medication.id === medicationId)
          ?.tags.includes('antidepressant'),
      );
    expect(
      prototypeCaseBlueprint.treatmentGrades.find(
        (grade) => grade.id === 'grade.mdd-harmful-antidepressant-combination',
      )?.predicate,
    ).toMatchObject({
      type: 'treatmentStartedWithTag',
      minimumCount: 2,
      maximumCount: availableAntidepressants.length,
    });
  });

  it('keeps the broader medication identity catalog separate from gameplay compatibility', () => {
    expect(validateMedicationIdentities(medicationIdentities, catalogs)).toEqual({
      valid: true,
      issues: [],
    });
    expect(medicationIdentities).toHaveLength(53);
    const runtimeCompatible = medicationIdentities.filter(
      (identity) => identity.authoringStatus === 'runtime_compatibility',
    );
    const identityOnly = medicationIdentities.filter(
      (identity) => identity.authoringStatus === 'identity_only',
    );
    expect(runtimeCompatible).toHaveLength(13);
    expect(identityOnly).toHaveLength(40);
    expect(identityOnly.map((identity) => identity.id)).toContain('medication.memantine');
    expect(runtimeCompatible.map((identity) => identity.id).sort()).toEqual(
      catalogs.medications.map((medication) => medication.id).sort(),
    );
    const gameplayMedicationIds = new Set([
      ...catalogs.medications.map((medication) => medication.id),
      ...catalogs.formularies.flatMap((formulary) => formulary.medicationIds),
    ]);
    expect(identityOnly.every((identity) => !gameplayMedicationIds.has(identity.id))).toBe(true);

    const invalidIdentityLink = structuredClone(identityOnly[0]!);
    invalidIdentityLink.runtimeMedicationDefinitionId = runtimeCompatible[0]!.id;
    expect(MedicationIdentityDefinitionSchema.safeParse(invalidIdentityLink).success).toBe(false);

    const duplicateRxcui = structuredClone([...medicationIdentities]);
    duplicateRxcui[1]!.rxnorm.rxcui = duplicateRxcui[0]!.rxnorm.rxcui;
    expect(
      validateMedicationIdentities(duplicateRxcui, catalogs).issues.some(
        (issue) => issue.code === 'DUPLICATE_MEDICATION_IDENTITY_RXCUI',
      ),
    ).toBe(true);

    const missingRuntimeIdentity = medicationIdentities.filter(
      (identity) => identity.id !== catalogs.medications[0]!.id,
    );
    expect(
      validateMedicationIdentities(missingRuntimeIdentity, catalogs).issues.some(
        (issue) => issue.code === 'MISSING_RUNTIME_MEDICATION_IDENTITY',
      ),
    ).toBe(true);

    const leakedCatalogs = structuredClone(catalogs);
    leakedCatalogs.formularies[0]!.medicationIds.push(identityOnly[0]!.id);
    expect(
      validateMedicationIdentities(medicationIdentities, leakedCatalogs).issues.some(
        (issue) => issue.code === 'IDENTITY_ONLY_MEDICATION_LEAKED_TO_GAMEPLAY',
      ),
    ).toBe(true);
  });

  it('keeps supplement identities auditable and unavailable as treatment choices', () => {
    expect(supplementIdentities).toHaveLength(6);
    expect(
      SupplementIdentityDefinitionSchema.array().parse(structuredClone(supplementIdentities)),
    ).toEqual(supplementIdentities);
    expect(supplementIdentities.every((identity) => !identity.runtimeSelectable)).toBe(true);
    expect(supplementIdentities.some((identity) => identity.id === 'supplement.ashwagandha')).toBe(
      true,
    );
    const gameplayIds = new Set([
      ...catalogs.medications.map((medication) => medication.id),
      ...catalogs.formularies.flatMap((formulary) => formulary.medicationIds),
      ...catalogs.treatments.map((treatment) => treatment.id),
    ]);
    expect(supplementIdentities.every((identity) => !gameplayIds.has(identity.id))).toBe(true);
  });

  it('rejects authoring-only records from the strict runtime catalog while diagnoses parse', () => {
    const runtimeCatalog = CatalogBundleSchema.parse(structuredClone(catalogs));
    const parsedDiagnoses = DiagnosisDefinitionSchema.array().parse(runtimeCatalog.diagnoses);
    const parsedFindings = FindingDefinitionSchema.array().parse(runtimeCatalog.findings);
    expect(parsedDiagnoses.length).toBeGreaterThan(0);
    expect(parsedFindings).toEqual(runtimeCatalog.findings);
    expect(parsedFindings).toHaveLength(41);
    expect(
      parsedFindings.find((finding) => finding.id === 'finding.depressive.depressed-mood'),
    ).toEqual(
      expect.objectContaining({
        medicalReviewStatus: 'unreviewed',
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
      }),
    );
    expect(parsedDiagnoses.map((diagnosis) => diagnosis.id)).toEqual(
      catalogs.diagnoses.map((diagnosis) => diagnosis.id),
    );
    for (const key of ['diagnosisClassifications', 'sourceUseDecisions'] as const) {
      expect(
        CatalogBundleSchema.safeParse({
          ...structuredClone(catalogs),
          [key]: [],
        }).success,
      ).toBe(false);
    }
  });

  it('keeps the canonical finding seed identity-only and preserves case-local compatibility', () => {
    expect(catalogs.findings.map((finding) => finding.id)).toEqual([
      'finding.appetite.current-reduced',
      'finding.depressive.depressed-mood',
      'finding.function.self-reported-current-impact',
      'finding.history.current-anhedonia',
      'finding.history.current-concentration-difficulty',
      'finding.history.current-decreased-sleep-need',
      'finding.history.current-elevated-irritable-mood',
      'finding.history.current-excessive-guilt',
      'finding.history.current-fatigue-low-energy',
      'finding.history.current-grandiosity',
      'finding.history.current-high-risk-spending',
      'finding.history.current-increased-goal-directed-activity',
      'finding.history.current-pressured-speech',
      'finding.history.current-psychomotor-slowing',
      'finding.history.current-racing-thoughts',
      'finding.history.current-self-reported-ideas-of-reference',
      'finding.history.current-self-reported-impulsivity',
      'finding.history.current-self-reported-persecutory-ideation',
      'finding.history.current-self-reported-suspiciousness',
      'finding.history.current-self-reported-thought-disorganization',
      'finding.history.difficulty-controlling-worry',
      'finding.history.excessive-worry',
      'finding.history.muscle-tension',
      'finding.history.panic-attacks',
      'finding.history.past-episodic-grandiosity',
      'finding.history.reported-delusional-beliefs',
      'finding.history.reported-hallucinations',
      'finding.history.restlessness',
      'finding.mse.current-observed-grandiosity',
      'finding.mse.current-observed-thought-disorganization',
      'finding.safety.current-active-suicidal-ideation',
      'finding.safety.current-passive-death-wish',
      'finding.safety.current-self-reported-weapon-access',
      'finding.safety.current-suicide-preparatory-behavior',
      'finding.safety.current-violent-ideation',
      'finding.safety.current-violent-intent',
      'finding.safety.recent-violent-behavior',
      'finding.safety.suicide-attempt-history',
      'finding.safety.suicide-preparatory-behavior-history',
      'finding.sleep.current-hypersomnia',
      'finding.sleep.current-insomnia',
    ]);
    expect(catalogs.findings.every((finding) => finding.medicalReviewStatus === 'unreviewed')).toBe(
      true,
    );
    expect(JSON.stringify(catalogs.findings)).not.toMatch(
      /point|score|diagnosis|probability|prevalence|treatment/i,
    );
    const canonicalTerms = catalogs.findings.flatMap((finding) => [
      finding.label.toLocaleLowerCase('en-US'),
      ...finding.aliases.map((alias) => alias.toLocaleLowerCase('en-US')),
    ]);
    expect(canonicalTerms).not.toEqual(
      expect.arrayContaining([
        'paranoia',
        'subjective burden',
        'symptom duration',
        'weapon-access concern',
      ]),
    );
    expect(
      catalogs.findings.find((finding) => finding.id === 'finding.history.current-anhedonia'),
    ).toEqual(
      expect.objectContaining({
        label: 'Current anhedonia',
        aliases: [
          'Loss of interest',
          'Reduced interest',
          'Loss of pleasure',
          'Reduced pleasure',
          'Reduced enjoyment',
        ],
      }),
    );
    expect(
      catalogs.findings.find(
        (finding) => finding.id === 'finding.history.current-fatigue-low-energy',
      ),
    ).toEqual(
      expect.objectContaining({
        label: 'Current self-reported fatigue or low energy',
        aliases: ['Fatigue', 'Low energy', 'Tiredness'],
      }),
    );
    expect(
      catalogs.findings.find(
        (finding) => finding.id === 'finding.history.current-fatigue-low-energy',
      )?.aliases,
    ).not.toEqual(
      expect.arrayContaining([
        'Daytime sleepiness',
        'Somnolence',
        'Muscular weakness',
        'Psychomotor slowing',
        'Medication sedation',
        'Exertional intolerance',
      ]),
    );
    expect(
      catalogs.findings
        .filter((finding) => finding.id.includes('grandiosity'))
        .map(({ id, semanticKind, aliases, valueSpecification }) => ({
          id,
          semanticKind,
          aliases,
          valueSpecification,
        })),
    ).toEqual([
      {
        id: 'finding.history.current-grandiosity',
        semanticKind: 'history',
        aliases: [],
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
      },
      {
        id: 'finding.history.past-episodic-grandiosity',
        semanticKind: 'history',
        aliases: [],
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
      },
      {
        id: 'finding.mse.current-observed-grandiosity',
        semanticKind: 'mental_status_exam',
        aliases: [],
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
      },
    ]);
    expect(
      catalogs.findings
        .flatMap((finding) => finding.aliases)
        .map((alias) => alias.toLocaleLowerCase('en-US')),
    ).not.toEqual(expect.arrayContaining(['grandiosity', 'inflated self-esteem']));
    expect(
      catalogs.findings.find(
        (finding) => finding.id === 'finding.history.current-self-reported-impulsivity',
      ),
    ).toEqual(
      expect.objectContaining({
        label: 'Current self-reported impulsivity',
        aliases: [],
        semanticKind: 'history',
      }),
    );
    expect(
      catalogs.findings
        .filter((finding) =>
          [
            'finding.history.current-self-reported-ideas-of-reference',
            'finding.history.current-self-reported-persecutory-ideation',
            'finding.history.current-self-reported-suspiciousness',
          ].includes(finding.id),
        )
        .map(({ id, aliases, semanticKind, valueSpecification }) => ({
          id,
          aliases,
          semanticKind,
          valueSpecification,
        })),
    ).toEqual([
      {
        id: 'finding.history.current-self-reported-ideas-of-reference',
        aliases: [],
        semanticKind: 'history',
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
      },
      {
        id: 'finding.history.current-self-reported-persecutory-ideation',
        aliases: [],
        semanticKind: 'history',
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
      },
      {
        id: 'finding.history.current-self-reported-suspiciousness',
        aliases: [],
        semanticKind: 'history',
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'absent', 'subthreshold'],
        },
      },
    ]);
    expect(
      catalogs.findings
        .filter((finding) => finding.id.includes('thought-disorganization'))
        .map((finding) => [finding.id, finding.semanticKind]),
    ).toEqual([
      ['finding.history.current-self-reported-thought-disorganization', 'history'],
      ['finding.mse.current-observed-thought-disorganization', 'mental_status_exam'],
    ]);
    expect(
      catalogs.findings
        .filter((finding) => finding.id.includes('suicide-preparatory-behavior'))
        .map((finding) => finding.id),
    ).toEqual([
      'finding.safety.current-suicide-preparatory-behavior',
      'finding.safety.suicide-preparatory-behavior-history',
    ]);
    expect(
      catalogs.findings.find(
        (finding) => finding.id === 'finding.safety.current-self-reported-weapon-access',
      ),
    ).toEqual(
      expect.objectContaining({
        label: 'Current self-reported weapon access',
        aliases: [],
        semanticKind: 'safety',
      }),
    );
    const compatibilityFinding = prototypeCaseBlueprint.informationActions
      .flatMap((action) => action.result.findings)
      .find((finding) => finding.id === 'finding.depressive.depressed-mood');
    expect(compatibilityFinding).toEqual({
      id: 'finding.depressive.depressed-mood',
      labelVariants: ['Depressed mood', 'Low mood', 'Feeling down'],
      outcome: 'variable',
    });
    const compatibilityGrandiosity = prototypeCaseBlueprint.informationActions
      .flatMap((action) => action.result.findings)
      .find((finding) => finding.id === 'finding.mania.grandiosity');
    expect(compatibilityGrandiosity).toEqual({
      id: 'finding.mania.grandiosity',
      labelVariants: ['Grandiosity', 'Inflated self-esteem'],
      outcome: 'absent',
    });
  });

  it('rejects ambiguous canonical finding terms', () => {
    const invalid = structuredClone(catalogs);
    const duplicate = structuredClone(catalogs.findings[0]!);
    duplicate.id = 'finding.test.ambiguous-depressed-mood';
    duplicate.label = 'Sad mood';
    duplicate.aliases = ['FEELING DOWN'];
    invalid.findings.push(duplicate);

    expect(
      validateCatalogs(invalid).issues.some((issue) => issue.code === 'DUPLICATE_FINDING_TERM'),
    ).toBe(true);
  });

  it('includes only approved-lifecycle finding identities in the runtime catalog', () => {
    const invalid = structuredClone(catalogs);
    invalid.findings[0]!.lifecycle = 'review';
    expect(
      validateCatalogs(invalid).issues.some(
        (issue) => issue.code === 'NON_APPROVED_RUNTIME_FINDING',
      ),
    ).toBe(true);
  });

  it('defaults pre-pool saved case instances to the starter pool during parsing', () => {
    const legacyInstance = structuredClone(
      instantiateCase(prototypeCaseBlueprint, 'legacy-pool-default', catalogs),
    ) as unknown as { metadata: { patientPool?: string } };
    delete legacyInstance.metadata.patientPool;
    expect(CaseInstanceSchema.parse(legacyInstance).metadata.patientPool).toBe('starter');
  });

  it('keeps charted reaction category separate from any reviewed interpretation', () => {
    for (const blueprint of approvedCaseBlueprints) {
      expect(blueprint.patientRecord.reactionHistory.status).toBe('entries_present');
      expect(blueprint.patientRecord.reactionHistory.records.length).toBeGreaterThan(0);
      expect(
        blueprint.informationActions.some(
          (action) => action.actionId === 'info.history.allergies-adverse-reactions',
        ),
      ).toBe(true);
      for (const record of blueprint.patientRecord.reactionHistory.records) {
        expect(record.recordedAs).toBeTruthy();
        expect(record.interpretedAs).toBeNull();
      }
    }
  });

  it('rejects ambiguous reaction history, unknown reaction concepts, and over-budget extras', () => {
    expect(
      PatientReactionHistorySchema.safeParse({
        status: 'unassessed',
        medicationAssessmentStatus: 'unassessed',
        records: [],
      }).success,
    ).toBe(true);
    expect(
      PatientReactionHistorySchema.safeParse({
        status: 'documented_none',
        medicationAssessmentStatus: 'documented_none',
        records: prototypeCaseBlueprint.patientRecord.reactionHistory.records,
      }).success,
    ).toBe(false);
    expect(
      PatientReactionHistorySchema.safeParse({
        ...prototypeCaseBlueprint.patientRecord.reactionHistory,
        medicationAssessmentStatus: 'entries_present',
      }).success,
    ).toBe(false);
    expect(
      PatientReactionHistorySchema.safeParse({
        ...prototypeCaseBlueprint.patientRecord.reactionHistory,
        records: prototypeCaseBlueprint.patientRecord.reactionHistory.records.map((record) => ({
          ...record,
          interpretedAs: 'immune_allergy',
        })),
      }).success,
    ).toBe(false);

    const invalidReaction = structuredClone(prototypeCaseBlueprint);
    invalidReaction.patientRecord.reactionHistory.records[0]!.manifestationIds = [
      'reaction-manifestation.missing',
    ];
    expect(
      validateCaseBlueprint(invalidReaction, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INVALID_REACTION_MANIFESTATION_REF',
      ),
    ).toBe(true);
    const mismatchedReactionDisplay = structuredClone(prototypeCaseBlueprint);
    const reactionAction = mismatchedReactionDisplay.informationActions.find(
      (action) => action.actionId === 'info.history.allergies-adverse-reactions',
    );
    if (!reactionAction) throw new Error('Prototype reaction action missing.');
    reactionAction.result.findings = reactionAction.result.findings.filter(
      (finding) => !finding.labelVariants.includes('Seasonal/environmental allergens'),
    );
    expect(
      validateCaseBlueprint(mismatchedReactionDisplay, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'REACTION_HISTORY_DISPLAY_MISMATCH',
      ),
    ).toBe(true);
    const mismatchedSafetyPlanningDisplay = structuredClone(prototypeCaseBlueprint);
    const safetyPlanningAction = mismatchedSafetyPlanningDisplay.informationActions.find(
      (action) => action.actionId === 'info.history.existing-safety-plan',
    );
    if (!safetyPlanningAction) throw new Error('Prototype safety-planning action missing.');
    safetyPlanningAction.result.findings[0]!.outcome = 'absent';
    expect(
      validateCaseBlueprint(mismatchedSafetyPlanningDisplay, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'SAFETY_PLANNING_ABILITY_DISPLAY_MISMATCH',
      ),
    ).toBe(true);

    const module = {
      id: 'optional-feature.test.reaction',
      moduleKind: 'allergy_reaction' as const,
      moduleId: 'reaction.test',
      cost: 3,
      impact: 'fit_modifier' as const,
      complexityContributions: [
        {
          id: 'complexity.test.reaction',
          label: 'Synthetic test reaction',
          dimension: 'pharmacologic' as const,
          weight: 1,
          review: {
            status: 'unreviewed' as const,
            reviewerId: null,
            reviewedAt: null,
            sourceUseNoteIds: [],
          },
        },
      ],
    };
    expect(
      PatientComplexityProfileSchema.safeParse({
        modelVersion: 'additional-feature-budget.v1',
        measurementStatus: 'authored_envelope',
        additionalFeatureBudget: 2,
        maximumSelectedModules: 1,
        selectedModules: [module],
        targetEnvelope: {
          diagnostic: { min: 0, max: 5 },
          pharmacologic: { min: 0, max: 5 },
          workup: { min: 0, max: 5 },
          safety_disposition: { min: 0, max: 5 },
          information: { min: 0, max: 5 },
        },
      }).success,
    ).toBe(false);
    const unsupportedModule = structuredClone(prototypeCaseBlueprint);
    unsupportedModule.patientRecord.complexityProfile = {
      modelVersion: 'additional-feature-budget.v1',
      measurementStatus: 'budget_only',
      additionalFeatureBudget: 3,
      maximumSelectedModules: 1,
      selectedModules: [module],
      targetEnvelope: null,
    };
    expect(
      validateCaseBlueprint(unsupportedModule, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'OPTIONAL_FEATURE_MODULE_COMPILER_NOT_IMPLEMENTED',
      ),
    ).toBe(true);
  });

  it('migrates historical instances to truthful unknown reaction and complexity states', () => {
    const legacy = structuredClone(
      instantiateCase(prototypeCaseBlueprint, 'legacy-reaction-default', catalogs),
    ) as unknown as {
      patientRecord: {
        reactionHistory?: unknown;
        reportedSafetyPlanningAbility?: unknown;
        complexityProfile?: unknown;
      };
    };
    delete legacy.patientRecord.reactionHistory;
    delete legacy.patientRecord.reportedSafetyPlanningAbility;
    delete legacy.patientRecord.complexityProfile;
    const parsed = CaseInstanceSchema.parse(legacy);
    expect(parsed.patientRecord.reactionHistory).toEqual({
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    });
    expect(parsed.patientRecord.reportedSafetyPlanningAbility).toBe('unassessed');
    expect(parsed.patientRecord.complexityProfile.measurementStatus).toBe('legacy_unmeasured');
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
        expect.objectContaining({
          id: 'evidence.who.mhgap-mns.2023',
          organization: 'World Health Organization',
          publicationYear: 2023,
          medicalReviewStatus: 'unreviewed',
        }),
        expect.objectContaining({
          id: 'evidence.va-dod.suicide-risk.2024',
          versionLabel: 'Version 3.0',
          medicalReviewStatus: 'unreviewed',
        }),
        expect.objectContaining({
          id: 'evidence.bap.catatonia.2023',
          accessPolicy: expect.objectContaining({
            reuseStatus: 'open_license',
            localExtractionStatus: 'allowed',
          }),
        }),
        expect.objectContaining({
          id: 'evidence.bostwick.mdd-antidepressant-fit.2010',
          doi: '10.4065/mcp.2009.0565',
          accessPolicy: expect.objectContaining({
            fullTextStatus: 'public',
            reuseStatus: 'permission_required',
            aiUseStatus: 'permission_required',
            localExtractionStatus: 'permission_required',
          }),
          medicalReviewStatus: 'unreviewed',
        }),
        expect.objectContaining({
          id: 'evidence.apa.bpd-treatment.second-edition.2024',
          accessPolicy: expect.objectContaining({
            aiUseStatus: 'prohibited',
            localExtractionStatus: 'prohibited',
          }),
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
    ).toContain('evidence.canmat.mdd-adults.2023-update');
    expect(
      approvedCaseBlueprints.flatMap((caseDefinition) =>
        caseDefinition.patientRecord.sourceUseNotes.flatMap((note) => note.evidenceSourceIds),
      ),
    ).not.toContain('evidence.who.mhgap-mns.2023');
  });

  it('tracks a correction as a separate source with a validated relationship', () => {
    const correction = catalogs.evidenceSources.find(
      (source) => source.id === 'evidence.canmat.mdd-adults.2023-update-corrigendum.2025',
    )!;
    expect(correction).toMatchObject({
      contentVersion: '1.1.0',
      sourceType: 'correction_notice',
      sourceRelations: [
        {
          sourceId: 'evidence.canmat.mdd-adults.2023-update',
          relationType: 'corrects',
          note: expect.stringContaining('Lena S. Quilty to Lena C. Quilty'),
        },
      ],
    });
    const parent = catalogs.evidenceSources.find(
      (source) => source.id === 'evidence.canmat.mdd-adults.2023-update',
    )!;
    expect(parent.authors).toContain('Lena C. Quilty');
    expect(parent.authors).not.toContain('Lena S. Quilty');

    const invalid = structuredClone(catalogs);
    invalid.evidenceSources.find(
      (source) => source.id === correction.id,
    )!.sourceRelations[0]!.sourceId = 'evidence.missing';
    expect(
      validateCatalogs(invalid).issues.some(
        (issue) => issue.code === 'INVALID_EVIDENCE_SOURCE_RELATION',
      ),
    ).toBe(true);

    const missingCorrectedSource = structuredClone(correction);
    missingCorrectedSource.sourceRelations = [];
    expect(EvidenceSourceDefinitionSchema.safeParse(missingCorrectedSource).success).toBe(false);
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

  it('allows one evidence contribution to enrich other catalog entries but rejects unknown targets', () => {
    const aripiprazole = catalogs.medications.find(
      (medication) => medication.id === 'medication.aripiprazole',
    )!;
    expect(
      aripiprazole.sourceUseNotes.find(
        (note) =>
          note.id === 'source-use.medication-aripiprazole.tiihonen-2019-clozapine-combination',
      )?.targetContentIds,
    ).toEqual(
      expect.arrayContaining([
        'medication.aripiprazole',
        'medication.clozapine',
        'diagnosis.schizophrenia-spectrum-disorder',
      ]),
    );

    const invalid = structuredClone(catalogs);
    invalid.medications
      .find((medication) => medication.id === 'medication.aripiprazole')!
      .sourceUseNotes[0]!.targetContentIds.push('medication.not-cataloged');
    expect(
      validateCatalogs(invalid).issues.some(
        (issue) => issue.code === 'INVALID_MEDICATION_EVIDENCE_TARGET',
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
    const baseline = ecgResult('ecg-protected-baseline');
    for (let index = 0; index < 50; index += 1) {
      expect(ecgResult(`ecg-protected-${index}`)).toEqual(baseline);
    }
  });

  it('rejects invalid structured patient content', () => {
    const invalid = structuredClone(prototypeCaseBlueprint);
    invalid.informationActions[0]!.result.findings = [];
    const report = validateCaseBlueprint(invalid, catalogs, startingClinic);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'SCHEMA_INVALID')).toBe(true);
  });

  it('rejects ambiguous same-effect rules with equal specificity', () => {
    const invalid = structuredClone(prototypeCaseBlueprint);
    invalid.scoreRules[0]!.effectId = 'effect.test.ambiguous';
    invalid.scoreRules[0]!.specificityPriority = 20;
    invalid.scoreRules[1]!.effectId = 'effect.test.ambiguous';
    invalid.scoreRules[1]!.specificityPriority = 20;

    expect(
      validateCaseBlueprint(invalid, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'AMBIGUOUS_RULE_EFFECT_SPECIFICITY',
      ),
    ).toBe(true);
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
    expect(JSON.stringify(primary.match)).toContain('mdd-initial-first-line');
  });

  it('loads one top-down MDD family file while keeping unsourced severity disabled', () => {
    const mdd = catalogs.diagnoses.find(
      (diagnosis) => diagnosis.id === 'diagnosis.major-depressive-disorder',
    )!;
    expect(mdd.baseClinicalTagIds).toEqual(['diagnosis-tag.mood', 'diagnosis-tag.unipolar']);
    expect(mdd.severityAxis?.levels.map((level) => level.id)).toEqual([
      'severity.mdd.mild',
      'severity.mdd.moderate',
      'severity.mdd.severe',
    ]);
    expect(
      mdd.severityAxis?.levels.every(
        (level) => level.generationStatus === 'disabled_pending_source' && level.rules.length === 0,
      ),
    ).toBe(true);
    expect(mdd.sourceUseNotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'source-use.diagnosis-mdd.canmat-initial-first-line-antidepressants',
          evidenceSourceIds: ['evidence.canmat.mdd-adults.2023-update'],
          contributionTypes: ['treatment', 'medication_fit'],
          medicalReviewStatus: 'approved',
        }),
        expect.objectContaining({
          id: 'source-use.diagnosis-mdd.developer-initial-first-line-antidepressants',
          authority: 'expert_opinion',
          evidenceSourceIds: [],
          medicalReviewStatus: 'approved',
        }),
        expect.objectContaining({
          id: 'source-use.diagnosis-mdd.who-mhgap-dep1-4-context',
          evidenceSourceIds: ['evidence.who.mhgap-mns.2023'],
          contributionTypes: ['context_only'],
          medicalReviewStatus: 'unreviewed',
        }),
      ]),
    );
    expect(mdd.baseRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'rule.diagnosis-mdd.initial-first-line-antidepressant',
          target: {
            kind: 'medication_tag',
            id: 'mdd-initial-first-line',
          },
          stance: 'acceptable',
          review: expect.objectContaining({
            status: 'approved',
            reviewerId: 'reviewer.dustin-rowland',
          }),
        }),
        expect.objectContaining({
          id: 'rule.diagnosis-mdd.antidepressant-mania-history',
          concernLevel: 'major',
          certaintyLevel: 'strong',
          target: {
            kind: 'information_action',
            id: 'info.history.mania',
          },
          selectionWhen: expect.objectContaining({
            type: 'treatmentStartedWithTag',
            medicationTagId: 'antidepressant',
          }),
        }),
        expect.objectContaining({
          id: 'rule.diagnosis-mdd.any-medication-reaction-history',
          selectionWhen: { type: 'anyMedicationStarted' },
        }),
      ]),
    );
  });

  it('loads persistent depressive disorder as identity-only unreviewed scaffolding', () => {
    const persistentDepression = catalogs.diagnoses.find(
      (diagnosis) => diagnosis.id === 'diagnosis.persistent-depressive-disorder',
    )!;
    expect(persistentDepression).toMatchObject({
      label: 'Persistent depressive disorder (dysthymia)',
      medicalReviewStatus: 'unreviewed',
      baseClinicalTagIds: [],
      baseRules: [],
      severityAxis: null,
      specifiers: [],
      comorbidityRelationships: [],
      sourceUseNotes: [],
    });
  });

  it('rejects missing diagnosis files and invalid patient diagnosis qualifiers', () => {
    const missing = structuredClone(prototypeCaseBlueprint);
    missing.patientRecord.diagnoses[0]!.id = 'diagnosis.missing';
    expect(
      validateCaseBlueprint(missing, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INVALID_PATIENT_DIAGNOSIS_REF',
      ),
    ).toBe(true);

    const invalidSeverity = structuredClone(prototypeCaseBlueprint);
    invalidSeverity.patientRecord.diagnoses[0]!.severityId = 'severity.mdd.not-defined';
    expect(
      validateCaseBlueprint(invalidSeverity, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INVALID_PATIENT_DIAGNOSIS_SEVERITY',
      ),
    ).toBe(true);
  });

  it('rejects diagnosis guidance with unknown reusable catalog targets', () => {
    const invalid = structuredClone(catalogs);
    invalid.diagnoses[0]!.baseRules.push({
      id: 'rule.invalid-diagnosis-target',
      label: 'Invalid target fixture',
      domain: 'medication_selection',
      target: { kind: 'medication', id: 'medication.missing' },
      stance: 'preferred',
      concernLevel: 'moderate',
      certaintyLevel: 'tentative',
      patientWhen: null,
      selectionWhen: null,
      rationale: 'Synthetic invalid-reference fixture.',
      review: {
        status: 'unreviewed',
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    });
    expect(
      validateCatalogs(invalid).issues.some(
        (issue) => issue.code === 'INVALID_DIAGNOSIS_RULE_TARGET',
      ),
    ).toBe(true);
  });

  it('rejects a treatment-workup bridge that drifts from its qualitative source rule', () => {
    const invalidTrigger = structuredClone(prototypeCaseBlueprint);
    invalidTrigger.treatmentWorkupRequirements[0]!.appliesWhen = {
      type: 'anyMedicationStarted',
    };
    expect(
      validateCaseBlueprint(invalidTrigger, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'TREATMENT_WORKUP_SOURCE_TRIGGER_MISMATCH',
      ),
    ).toBe(true);

    const invalidConcern = structuredClone(prototypeCaseBlueprint);
    invalidConcern.treatmentWorkupRequirements[0]!.concernLevel = 'minor';
    expect(
      validateCaseBlueprint(invalidConcern, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'TREATMENT_WORKUP_SOURCE_WEIGHT_MISMATCH',
      ),
    ).toBe(true);
  });

  it('rejects unresolved optional-comorbidity and clinical-context references', () => {
    const invalidComorbidity = structuredClone(prototypeCaseBlueprint);
    invalidComorbidity.patientRecord.diagnosisComposition = {
      optionalComorbidities: [
        {
          id: 'optional-comorbidity.fixture-missing',
          diagnosisId: 'diagnosis.missing',
          gameInclusionProbability: 0.25,
          allowedSeverityIds: [],
          allowedSpecifierIds: [],
          role: 'contributing',
          review: {
            status: 'unreviewed',
            reviewerId: null,
            reviewedAt: null,
            sourceUseNoteIds: [],
          },
        },
      ],
      maximumActiveDiagnoses: 2,
      conflictPolicy: 'quarantine',
    };
    expect(
      validateCaseBlueprint(invalidComorbidity, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INVALID_OPTIONAL_COMORBIDITY_REF',
      ),
    ).toBe(true);

    const invalidContext = structuredClone(prototypeCaseBlueprint);
    invalidContext.patientRecord.clinicalContextDimensions = [
      {
        id: 'clinical-context.fixture.invalid',
        label: 'Invalid context fixture',
        options: [
          {
            id: 'clinical-context-option.fixture.invalid-present',
            label: 'Present',
            gameSelectionWeight: 1,
            addedClinicalTagIds: ['fixture.present'],
            findingBindings: [
              {
                actionId: 'info.history.depressive-symptoms',
                findingId: 'finding.missing',
                outcome: 'present',
              },
            ],
            review: {
              status: 'unreviewed',
              reviewerId: null,
              reviewedAt: null,
              sourceUseNoteIds: [],
            },
          },
          {
            id: 'clinical-context-option.fixture.invalid-absent',
            label: 'Absent',
            gameSelectionWeight: 1,
            addedClinicalTagIds: [],
            findingBindings: [
              {
                actionId: 'info.history.depressive-symptoms',
                findingId: 'finding.missing',
                outcome: 'absent',
              },
            ],
            review: {
              status: 'unreviewed',
              reviewerId: null,
              reviewedAt: null,
              sourceUseNoteIds: [],
            },
          },
        ],
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      },
    ];
    expect(
      validateCaseBlueprint(invalidContext, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'INVALID_CLINICAL_CONTEXT_BINDING',
      ),
    ).toBe(true);
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

    const mixedFixedAndVariable = structuredClone(prototypeCaseBlueprint);
    const mixedSymptoms = mixedFixedAndVariable.informationActions.find(
      (action) => action.actionId === 'info.history.depressive-symptoms',
    )!;
    const fixedId = mixedSymptoms.result.selection!.requiredPresentIds[0]!;
    mixedSymptoms.result.findings.find((finding) => finding.id === fixedId)!.outcome = 'present';
    mixedSymptoms.result.selection!.requiredPresentIds =
      mixedSymptoms.result.selection!.requiredPresentIds.filter((id) => id !== fixedId);
    expect(
      validateCaseBlueprint(mixedFixedAndVariable, catalogs, startingClinic).issues.some(
        (issue) => issue.code === 'IMPOSSIBLE_FINDING_SELECTION',
      ),
    ).toBe(false);
  });

  it('requires an explicit criterion for a duration-authored near miss', () => {
    expect(
      ClinicalDurationProfileSchema.safeParse({
        id: 'duration-profile.invalid-near-miss',
        relatedDiagnosisId: 'diagnosis.bipolar-spectrum-disorder',
        interpretation: 'designed_below_threshold',
        criterionId: null,
        options: [
          {
            id: 'duration.invalid.one-year',
            value: 1,
            unit: 'year',
            displayValueVariants: ['one year'],
          },
          {
            id: 'duration.invalid.eighteen-months',
            value: 18,
            unit: 'month',
            displayValueVariants: ['eighteen months'],
          },
        ],
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      }).success,
    ).toBe(false);
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

    const invalidStaff = structuredClone(catalogs);
    const staff = invalidStaff.upgrades.find(
      (upgrade) => upgrade.id === 'upgrade.staff.intake-assistant',
    )!;
    staff.staffAutomation!.eligibleInformationActionIds = ['info.history.not-real'];
    expect(
      validateCatalogs(invalidStaff).issues.some(
        (issue) => issue.code === 'INVALID_STAFF_AUTOMATION_ACTION',
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

  it('keeps the reviewed initial-MDD medication family explicit and bounded', () => {
    expect(
      catalogs.medications
        .filter((medication) => medication.tags.includes('mdd-initial-first-line'))
        .map((medication) => medication.id)
        .sort(),
    ).toEqual(
      [
        'medication.bupropion',
        'medication.escitalopram',
        'medication.fluoxetine',
        'medication.mirtazapine',
        'medication.sertraline',
      ].sort(),
    );
    expect(
      catalogs.medications
        .find((medication) => medication.id === 'medication.buspirone')
        ?.tags.includes('mdd-initial-first-line'),
    ).toBe(false);
    expect(prototypeCaseBlueprint.treatmentGrades.map((grade) => grade.id)).toContain(
      'grade.mdd-initial-first-line-antidepressant',
    );
    expect(prototypeCaseBlueprint.treatmentGrades.map((grade) => grade.id)).not.toEqual(
      expect.arrayContaining([
        'grade.mdd-optimal-sertraline',
        'grade.mdd-strong-escitalopram',
        'grade.mdd-acceptable-other-antidepressant',
      ]),
    );
  });

  it('keeps every runtime medication and approved patient in the content registry', () => {
    expect(validateContentRegistry(contentRegistry, catalogs, approvedCaseBlueprints)).toEqual({
      valid: true,
      issues: [],
    });
    expect(
      contentRegistry.entries.find((entry) => entry.kind === 'diagnosis_catalog')?.categoryIds,
    ).toEqual(catalogs.diagnoses.map((diagnosis) => diagnosis.id));
    expect(
      contentRegistry.entries.find((entry) => entry.kind === 'finding_catalog')?.categoryIds,
    ).toEqual(catalogs.findings.map((finding) => finding.id));
    expect(
      contentRegistry.entries.find((entry) => entry.kind === 'treatment_catalog')?.categoryIds,
    ).toEqual(catalogs.treatments.map((treatment) => treatment.id));
  });

  it('rejects stale canonical finding registry membership', () => {
    const invalid = structuredClone(contentRegistry);
    invalid.entries.find((entry) => entry.kind === 'finding_catalog')!.categoryIds = [];
    expect(
      validateContentRegistry(invalid, catalogs, approvedCaseBlueprints).issues.some(
        (issue) => issue.code === 'FINDING_CATALOG_MEMBERSHIP_MISMATCH',
      ),
    ).toBe(true);
  });

  it('rejects stale reusable treatment registry membership', () => {
    const invalid = structuredClone(contentRegistry);
    invalid.entries.find((entry) => entry.kind === 'treatment_catalog')!.categoryIds = [];
    expect(
      validateContentRegistry(invalid, catalogs, approvedCaseBlueprints).issues.some(
        (issue) => issue.code === 'TREATMENT_CATALOG_MEMBERSHIP_MISMATCH',
      ),
    ).toBe(true);
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
    expect(findAffectedContentIds(contentRegistry, ['evidence.who.mhgap-mns.2023'])).toEqual(
      expect.arrayContaining([
        'registry.catalog.diagnoses',
        'case.first-visit-depression',
        'case.medication-check-palpitations',
      ]),
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
    expect(
      catalogs.informationActions.find(
        (action) => action.id === 'info.history.existing-safety-plan',
      ),
    ).toMatchObject({
      label: 'Safety-planning ability',
      category: 'history',
      soapSection: 'subjective',
      resultSource: 'patient_report',
    });
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

  it('builds names from large independent pools with a deterministic 25% middle-initial chance', () => {
    const firstNames = catalogs.variantPools.find(
      (pool) => pool.id === 'variant-pool.fictional-first-names.general-adult',
    )!;
    const lastNames = catalogs.variantPools.find(
      (pool) => pool.id === 'variant-pool.fictional-last-names.general-adult',
    )!;
    expect(firstNames.kind).toBe('fictional_first_name');
    expect(lastNames.kind).toBe('fictional_last_name');
    expect(firstNames.values.length).toBeGreaterThanOrEqual(100);
    expect(lastNames.values.length).toBeGreaterThanOrEqual(100);

    const nameVariant = prototypeCaseBlueprint.variants.find(
      (variant) => variant.target === 'patient.name',
    );
    if (!nameVariant || nameVariant.generator.type !== 'fictionalName') {
      throw new Error('Expected the prototype patient to use the fictional-name generator.');
    }
    const names = Array.from({ length: 4_000 }, (_, index) =>
      String(
        resolveVariant(
          nameVariant.generator,
          `name-pool-${index}`,
          nameVariant.id,
          catalogs.variantPools,
        ),
      ),
    );
    const withMiddleInitial = names.filter((name) => / [A-Z]\. /.test(name));
    expect(withMiddleInitial.length / names.length).toBeGreaterThan(0.22);
    expect(withMiddleInitial.length / names.length).toBeLessThan(0.28);

    const withoutMiddle = names.map((name) => name.replace(/ [A-Z]\. /, ' '));
    const firstToLast = new Map<string, Set<string>>();
    const lastToFirst = new Map<string, Set<string>>();
    for (const name of withoutMiddle) {
      const firstSpace = name.indexOf(' ');
      const first = name.slice(0, firstSpace);
      const last = name.slice(firstSpace + 1);
      firstToLast.set(first, (firstToLast.get(first) ?? new Set()).add(last));
      lastToFirst.set(last, (lastToFirst.get(last) ?? new Set()).add(first));
    }
    expect([...firstToLast.values()].some((values) => values.size > 10)).toBe(true);
    expect([...lastToFirst.values()].some((values) => values.size > 10)).toBe(true);
    expect(new Set(names).size).toBeGreaterThan(2_500);
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
  }, 15_000);

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
