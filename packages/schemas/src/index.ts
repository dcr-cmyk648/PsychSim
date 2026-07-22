import { z } from 'zod';

export const SchemaVersionSchema = z.literal(1);
export const StableIdSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/, 'Expected a stable namespaced ID');
export const ContentVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
export const CapabilitySchema = StableIdSchema;
export type Capability = z.infer<typeof CapabilitySchema>;

export const TreatmentGradeSchema = z.enum([
  'optimal',
  'strong_alternative',
  'acceptable',
  'weak',
  'ineffective',
  'harmful',
]);
export type TreatmentGrade = z.infer<typeof TreatmentGradeSchema>;

export const MedicalReviewStatusSchema = z.enum([
  'unreviewed',
  'in_review',
  'approved',
  'rejected',
]);
export type MedicalReviewStatus = z.infer<typeof MedicalReviewStatusSchema>;

export const ClinicalRuleReviewSchema = z
  .object({
    status: MedicalReviewStatusSchema,
    reviewerId: StableIdSchema.nullable(),
    reviewedAt: z.string().datetime().nullable(),
    sourceUseNoteIds: z.array(StableIdSchema),
  })
  .strict()
  .superRefine((review, context) => {
    if (review.status === 'approved' && (!review.reviewerId || !review.reviewedAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An approved clinical rule requires a reviewer ID and review timestamp.',
      });
    }
  });
export type ClinicalRuleReview = z.infer<typeof ClinicalRuleReviewSchema>;

const UnreviewedClinicalRuleSchema = ClinicalRuleReviewSchema.default({
  status: 'unreviewed',
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
});

export const ContentLifecycleSchema = z.enum([
  'blueprint',
  'draft',
  'review',
  'approved',
  'deprecated',
]);

export const FacilityTierSchema = z.enum([
  'solo_office',
  'outpatient_clinic',
  'multidisciplinary_center',
  'psychopharmacology_center',
  'psychiatric_hospital',
  'integrated_medical_center',
  'behavioral_health_system',
]);
export type FacilityTier = z.infer<typeof FacilityTierSchema>;

export const ProgressionModeSchema = z.enum(['standard', 'endgame', 'developer']);
export type ProgressionMode = z.infer<typeof ProgressionModeSchema>;

export const LocationDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    facilityTier: FacilityTierSchema,
    departmentId: StableIdSchema.optional(),
    capabilities: z.array(CapabilitySchema),
    formularyId: StableIdSchema,
    dispositionIds: z.array(StableIdSchema),
  })
  .strict();
export type LocationDefinition = z.infer<typeof LocationDefinitionSchema>;

export const FacilityDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    tier: FacilityTierSchema,
    minimumLifetimePoints: z.number().int().nonnegative(),
    patientSlotCount: z.number().int().min(1).max(12),
    allowedDepartmentIds: z.array(StableIdSchema),
    allowedUpgradeIds: z.array(StableIdSchema),
  })
  .strict();
export type FacilityDefinition = z.infer<typeof FacilityDefinitionSchema>;

export const DepartmentDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    allowedFacilityTiers: z.array(FacilityTierSchema).min(1),
    capabilities: z.array(CapabilitySchema),
    formularyIds: z.array(StableIdSchema),
    dispositionIds: z.array(StableIdSchema),
  })
  .strict();
export type DepartmentDefinition = z.infer<typeof DepartmentDefinitionSchema>;

export const ServiceFulfillmentMethodSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    kind: z.enum(['outside_referral', 'contracted_partner', 'shared_service', 'in_house']),
    operatingCost: z.number().int().nonnegative(),
    requiredCapabilities: z.array(CapabilitySchema),
    allowedLocationIds: z.array(StableIdSchema).optional(),
    qualityModifier: z.number().min(0).default(1),
  })
  .strict();
export type ServiceFulfillmentMethod = z.infer<typeof ServiceFulfillmentMethodSchema>;

export const ServiceDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    fulfillmentMethods: z.array(ServiceFulfillmentMethodSchema).min(1),
  })
  .strict();
export type ServiceDefinition = z.infer<typeof ServiceDefinitionSchema>;

export const MedicationDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    classes: z.array(z.string().min(1)).min(1),
    tags: z.array(z.string().min(1)),
    fitModifiers: z.array(
      z
        .object({
          id: StableIdSchema,
          patientTagIds: z.array(StableIdSchema).min(1),
          effect: z.enum(['bonus', 'penalty', 'contraindication']),
          pointDelta: z.number().int().min(-100).max(100),
          explanation: z.string().min(1),
          sourceUseNoteIds: z.array(StableIdSchema),
          medicalReviewStatus: MedicalReviewStatusSchema,
          review: UnreviewedClinicalRuleSchema,
        })
        .strict(),
    ),
    authorOverrides: z.array(
      z
        .object({
          id: StableIdSchema,
          patientTagIds: z.array(StableIdSchema).min(1),
          pointDelta: z.number().int().min(-100).max(100),
          explanation: z.string().min(1),
          sourceUseNoteIds: z.array(StableIdSchema),
          medicalReviewStatus: MedicalReviewStatusSchema,
          review: UnreviewedClinicalRuleSchema,
        })
        .strict(),
    ),
  })
  .strict();
export type MedicationDefinition = z.infer<typeof MedicationDefinitionSchema>;

export const FormularyDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    medicationIds: z.array(StableIdSchema),
  })
  .strict();
export type FormularyDefinition = z.infer<typeof FormularyDefinitionSchema>;

export const TreatmentOptionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    kind: z.enum(['nonmedication', 'disposition']),
    category: z.enum([
      'psychotherapy',
      'behavioral',
      'education',
      'coping',
      'sleep',
      'disposition',
    ]),
    safeReferral: z.boolean().default(false),
    requiredCapabilities: z.array(CapabilitySchema),
  })
  .strict();
export type TreatmentOption = z.infer<typeof TreatmentOptionSchema>;

export const VariantPoolDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    kind: z.enum(['fictional_name', 'occupation', 'education', 'location', 'neutral_social']),
    values: z.array(z.union([z.string().min(1), z.number()])).min(2),
  })
  .strict();
export type VariantPoolDefinition = z.infer<typeof VariantPoolDefinitionSchema>;

export const NumericRangeSchema = z
  .object({ minimum: z.number(), maximum: z.number() })
  .strict()
  .refine((range) => range.minimum <= range.maximum, {
    message: 'Range minimum must not exceed its maximum.',
  });

export const LabMildAbnormalRangeSchema = z
  .object({
    flag: z.enum(['low', 'high']),
    minimum: z.number(),
    maximum: z.number(),
    weight: z.number().positive(),
  })
  .strict()
  .refine((range) => range.minimum <= range.maximum, {
    message: 'Mild-abnormal minimum must not exceed its maximum.',
  });
export type LabMildAbnormalRange = z.infer<typeof LabMildAbnormalRangeSchema>;

export const LabComponentDefinitionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    unit: z.string().min(1),
    ucumCode: z.string().min(1),
    decimals: z.number().int().min(0).max(4),
    referenceRange: NumericRangeSchema,
    normalGenerationRange: NumericRangeSchema,
    mildAbnormalRanges: z.array(LabMildAbnormalRangeSchema),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type LabComponentDefinition = z.infer<typeof LabComponentDefinitionSchema>;

export const TestContextPredicateSchema = z
  .object({
    minimumAgeYears: z.number().int().nonnegative().optional(),
    maximumAgeYears: z.number().int().nonnegative().optional(),
    sexForReference: z.enum(['female', 'male', 'intersex', 'unspecified']).optional(),
    anyDiagnosisIds: z.array(StableIdSchema).default([]),
    allClinicalTagIds: z.array(StableIdSchema).default([]),
  })
  .strict()
  .refine(
    (predicate) =>
      predicate.minimumAgeYears === undefined ||
      predicate.maximumAgeYears === undefined ||
      predicate.minimumAgeYears <= predicate.maximumAgeYears,
    { message: 'Minimum age must not exceed maximum age.' },
  );

export const NumericTestGenerationProfileSchema = z
  .object({
    id: StableIdSchema,
    priority: z.number().int(),
    when: TestContextPredicateSchema,
    referenceIntervalSetId: StableIdSchema,
    referenceIntervalLabel: z.string().min(1).max(180),
    incidentalAbnormalProbability: z.number().min(0).max(0.5),
    components: z.array(LabComponentDefinitionSchema).min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type NumericTestGenerationProfile = z.infer<typeof NumericTestGenerationProfileSchema>;

export const TestGeneratorSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('numeric_panel'),
      profiles: z.array(NumericTestGenerationProfileSchema).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('patient_owned'),
      reason: z.string().min(1),
    })
    .strict(),
]);

export const TestDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    actionId: StableIdSchema,
    label: z.string().min(1),
    category: z.enum(['laboratory', 'diagnostic_study']),
    contextInputs: z.array(
      z.enum(['age_years', 'sex_for_reference', 'diagnosis_ids', 'clinical_tag_ids']),
    ),
    medicalReviewStatus: MedicalReviewStatusSchema,
    sourceUseNoteIds: z.array(StableIdSchema),
    generator: TestGeneratorSchema,
  })
  .strict();
export type TestDefinition = z.infer<typeof TestDefinitionSchema>;

export const ReferenceIntervalSetDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    jurisdiction: z.string().min(1),
    reportingConvention: z.string().min(1),
    unitConvention: z.string().min(1),
    referenceIntervalPolicy: z.string().min(1),
    numericRangeAuthority: z.enum([
      'prototype_unreviewed',
      'manufacturer_verified',
      'laboratory_verified',
      'published_verified',
    ]),
    medicalReviewStatus: MedicalReviewStatusSchema,
    sourceUrls: z.array(z.string().url()),
    sourceUseNoteIds: z.array(StableIdSchema),
  })
  .strict();
export type ReferenceIntervalSetDefinition = z.infer<typeof ReferenceIntervalSetDefinitionSchema>;

export const CatalogBundleSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    services: z.array(ServiceDefinitionSchema),
    medications: z.array(MedicationDefinitionSchema),
    formularies: z.array(FormularyDefinitionSchema),
    treatments: z.array(TreatmentOptionSchema),
    locations: z.array(LocationDefinitionSchema),
    facilities: z.array(FacilityDefinitionSchema),
    informationActions: z.array(z.lazy(() => InformationActionDefinitionSchema)),
    variantPools: z.array(VariantPoolDefinitionSchema),
    tests: z.array(TestDefinitionSchema),
    referenceIntervalSets: z.array(ReferenceIntervalSetDefinitionSchema),
    upgrades: z.array(z.lazy(() => UpgradeDefinitionSchema)),
  })
  .strict();
export type CatalogBundle = z.infer<typeof CatalogBundleSchema>;

export const ContentRegistryEntrySchema = z
  .object({
    id: StableIdSchema,
    kind: z.enum([
      'information_catalog',
      'service_catalog',
      'treatment_catalog',
      'formulary_catalog',
      'location_catalog',
      'facility_catalog',
      'variant_pool_catalog',
      'test_catalog',
      'reference_interval_catalog',
      'upgrade_catalog',
      'medication',
      'patient',
    ]),
    path: z
      .string()
      .min(1)
      .regex(/^content\//),
    runtimeIncluded: z.boolean(),
    categoryIds: z.array(StableIdSchema).default([]),
    dependsOnIds: z.array(StableIdSchema).default([]),
  })
  .strict();

export const ContentRegistrySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    entries: z.array(ContentRegistryEntrySchema).min(1),
  })
  .strict();
export type ContentRegistry = z.infer<typeof ContentRegistrySchema>;

export type ScorePredicate =
  | { type: 'actionPurchased'; actionId: string }
  | { type: 'factKnown'; factId: string }
  | { type: 'treatmentStarted'; medicationId: string }
  | {
      type: 'treatmentStartedWithTag';
      medicationTagId: string;
      minimumCount: number;
      maximumCount: number;
    }
  | { type: 'treatmentStopped'; medicationId: string }
  | { type: 'treatmentContinued'; medicationId: string }
  | { type: 'interventionSelected'; interventionId: string }
  | { type: 'dispositionSelected'; dispositionId: string }
  | { type: 'serviceCapabilityAvailable'; capabilityId: string }
  | { type: 'any'; predicates: ScorePredicate[] }
  | { type: 'all'; predicates: ScorePredicate[] }
  | { type: 'not'; predicate: ScorePredicate };

export const ScorePredicateSchema: z.ZodType<ScorePredicate> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('actionPurchased'), actionId: StableIdSchema }).strict(),
    z.object({ type: z.literal('factKnown'), factId: StableIdSchema }).strict(),
    z.object({ type: z.literal('treatmentStarted'), medicationId: StableIdSchema }).strict(),
    z
      .object({
        type: z.literal('treatmentStartedWithTag'),
        medicationTagId: StableIdSchema,
        minimumCount: z.number().int().nonnegative(),
        maximumCount: z.number().int().nonnegative(),
      })
      .strict(),
    z.object({ type: z.literal('treatmentStopped'), medicationId: StableIdSchema }).strict(),
    z.object({ type: z.literal('treatmentContinued'), medicationId: StableIdSchema }).strict(),
    z.object({ type: z.literal('interventionSelected'), interventionId: StableIdSchema }).strict(),
    z.object({ type: z.literal('dispositionSelected'), dispositionId: StableIdSchema }).strict(),
    z
      .object({
        type: z.literal('serviceCapabilityAvailable'),
        capabilityId: CapabilitySchema,
      })
      .strict(),
    z.object({ type: z.literal('any'), predicates: z.array(ScorePredicateSchema).min(1) }).strict(),
    z.object({ type: z.literal('all'), predicates: z.array(ScorePredicateSchema).min(1) }).strict(),
    z.object({ type: z.literal('not'), predicate: ScorePredicateSchema }).strict(),
  ]),
);

export const VariantGeneratorSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('choice'),
    values: z.array(z.union([z.string(), z.number()])).min(1),
  }),
  z.object({
    type: z.literal('catalogChoice'),
    poolId: StableIdSchema,
  }),
  z.object({
    type: z.literal('weightedChoice'),
    options: z
      .array(
        z
          .object({ value: z.union([z.string(), z.number()]), weight: z.number().positive() })
          .strict(),
      )
      .min(1),
  }),
  z.object({ type: z.literal('integerRange'), min: z.number().int(), max: z.number().int() }),
  z.object({
    type: z.literal('decimalRange'),
    min: z.number(),
    max: z.number(),
    decimals: z.number().int().min(0).max(4),
  }),
  z.object({
    type: z.literal('textTemplate'),
    template: z.string().min(1),
    variables: z.record(z.array(z.string().min(1)).min(1)),
  }),
]);
export type VariantGenerator = z.infer<typeof VariantGeneratorSchema>;

export const VariantSpecificationSchema = z
  .object({
    id: StableIdSchema,
    target: z.string().regex(/^patient\.[a-z][a-zA-Z0-9]*$/),
    clinicallyCritical: z.literal(false),
    generator: VariantGeneratorSchema,
  })
  .strict();
export type VariantSpecification = z.infer<typeof VariantSpecificationSchema>;

export const PatientOpeningSchema = z
  .object({
    titleTemplate: z.string().min(1),
    chiefComplaintTemplate: z.string().min(1),
    summaryTemplate: z.string().min(1),
    contextTemplate: z.string().min(1),
    knownMedicationIds: z.array(StableIdSchema),
    knownHistory: z.array(z.string().min(1)),
    basicVitals: z.array(z.string().min(1)),
  })
  .strict();
export type PatientOpening = z.infer<typeof PatientOpeningSchema>;

export const ResolvedPatientOpeningSchema = z
  .object({
    title: z.string().min(1),
    chiefComplaint: z.string().min(1),
    summary: z.string().min(1),
    context: z.string().min(1),
    knownMedicationIds: z.array(StableIdSchema),
    knownHistory: z.array(z.string().min(1)),
    basicVitals: z.array(z.string().min(1)),
  })
  .strict();
export type ResolvedPatientOpening = z.infer<typeof ResolvedPatientOpeningSchema>;

export const FindingOutcomeSchema = z.enum([
  'present',
  'absent',
  'normal',
  'high',
  'low',
  'positive',
  'negative',
  'not_applicable',
]);
export type FindingOutcome = z.infer<typeof FindingOutcomeSchema>;

export const FindingBlueprintSchema = z
  .object({
    id: StableIdSchema,
    labelVariants: z.array(z.string().min(1).max(80)).min(1).max(12),
    outcome: z.union([FindingOutcomeSchema, z.literal('variable')]),
    valueTextVariants: z.array(z.string().min(1).max(120)).max(12).optional(),
  })
  .strict();
export type FindingBlueprint = z.infer<typeof FindingBlueprintSchema>;

export const FindingSelectionSchema = z
  .object({
    minimumPresent: z.number().int().nonnegative(),
    maximumPresent: z.number().int().nonnegative(),
    requiredPresentIds: z.array(StableIdSchema),
    requiredAbsentIds: z.array(StableIdSchema),
  })
  .strict()
  .refine((selection) => selection.minimumPresent <= selection.maximumPresent, {
    message: 'Minimum present findings must not exceed maximum present findings.',
  });

export const InformationResultBlueprintSchema = z
  .object({
    kind: z.literal('finding_set'),
    findings: z.array(FindingBlueprintSchema).min(1),
    selection: FindingSelectionSchema.optional(),
    shuffle: z.boolean().default(true),
    factsRevealed: z.array(StableIdSchema),
  })
  .strict();
export type InformationResultBlueprint = z.infer<typeof InformationResultBlueprintSchema>;

export const ObservationReferenceIntervalSchema = z
  .object({
    low: z.number().optional(),
    high: z.number().optional(),
    unit: z.string().min(1),
    ucumCode: z.string().min(1),
    display: z.string().min(1).max(120),
    applicablePopulation: z.string().min(1).max(180).optional(),
    sourceId: StableIdSchema,
  })
  .strict()
  .refine((interval) => interval.low !== undefined || interval.high !== undefined, {
    message: 'A reference interval requires at least one bound.',
  })
  .refine(
    (interval) =>
      interval.low === undefined || interval.high === undefined || interval.low <= interval.high,
    { message: 'Reference interval low bound must not exceed its high bound.' },
  );
export type ObservationReferenceInterval = z.infer<typeof ObservationReferenceIntervalSchema>;

export const ResolvedNumericMeasurementSchema = z
  .object({
    value: z.number(),
    displayValue: z.string().min(1),
    unit: z.string().min(1),
    ucumCode: z.string().min(1),
    referenceInterval: ObservationReferenceIntervalSchema,
  })
  .strict();
export type ResolvedNumericMeasurement = z.infer<typeof ResolvedNumericMeasurementSchema>;

export const ResolvedFindingSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(120),
    outcome: FindingOutcomeSchema,
    valueText: z.string().min(1).max(240).optional(),
    numericMeasurement: ResolvedNumericMeasurementSchema.optional(),
    origin: z.enum(['authored', 'generated_normal', 'generated_incidental']),
  })
  .strict();
export type ResolvedFinding = z.infer<typeof ResolvedFindingSchema>;

export const InformationResultSchema = z
  .object({
    kind: z.literal('finding_set'),
    findings: z.array(ResolvedFindingSchema).min(1),
    factsRevealed: z.array(StableIdSchema),
  })
  .strict();
export type InformationResult = z.infer<typeof InformationResultSchema>;

export const ActionClassificationSchema = z.enum([
  'essential',
  'high_yield',
  'appropriate_for_treatment',
  'defensible',
  'low_value',
  'wasteful',
]);

export const InformationActionCategorySchema = z.enum(['history', 'physical', 'labs', 'imaging']);
export type InformationActionCategory = z.infer<typeof InformationActionCategorySchema>;

export const InformationActionDefinitionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    category: InformationActionCategorySchema,
    soapSection: z.enum(['subjective', 'objective']),
    resultSource: z.enum([
      'patient_report',
      'collateral_report',
      'record_review',
      'clinician_observation',
      'measurement',
      'laboratory',
      'diagnostic_study',
    ]),
    description: z.string().min(1),
    serviceId: StableIdSchema,
    repeatable: z.boolean(),
  })
  .strict();
export type InformationActionDefinition = z.infer<typeof InformationActionDefinitionSchema>;

export const CaseInformationActionSchema = z
  .object({
    actionId: StableIdSchema,
    defaultClassification: ActionClassificationSchema,
    result: InformationResultSchema,
  })
  .strict();
export type CaseInformationAction = z.infer<typeof CaseInformationActionSchema>;

export const CaseInformationActionBlueprintSchema = z
  .object({
    actionId: StableIdSchema,
    defaultClassification: ActionClassificationSchema,
    result: InformationResultBlueprintSchema,
  })
  .strict();
export type CaseInformationActionBlueprint = z.infer<typeof CaseInformationActionBlueprintSchema>;

export const WorkupObjectiveSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    importance: z.enum(['essential', 'high_yield', 'optional']),
    requiredByDefault: z.boolean(),
    satisfaction: ScorePredicateSchema,
    points: z.number().min(0),
    omissionPenalty: z.number().max(0),
    explanationObtained: z.string().min(1),
    explanationOmitted: z.string().min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type WorkupObjective = z.infer<typeof WorkupObjectiveSchema>;

export const TreatmentSelectionSchema = z
  .object({
    startMedicationIds: z.array(StableIdSchema),
    stopMedicationIds: z.array(StableIdSchema),
    continueMedicationIds: z.array(StableIdSchema),
    interventionIds: z.array(StableIdSchema),
    dispositionId: StableIdSchema.nullable(),
  })
  .strict();
export type TreatmentSelection = z.infer<typeof TreatmentSelectionSchema>;

export const AvailableTreatmentsSchema = z
  .object({
    startMedicationIds: z.array(StableIdSchema),
    stopMedicationIds: z.array(StableIdSchema),
    continueMedicationIds: z.array(StableIdSchema),
    interventionIds: z.array(StableIdSchema),
    dispositionIds: z.array(StableIdSchema),
  })
  .strict();

export const TreatmentGradeDefinitionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    grade: TreatmentGradeSchema,
    priority: z.number().int(),
    predicate: ScorePredicateSchema,
    baseCarePoints: z.number().int(),
    explanation: z.string().min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type TreatmentGradeDefinition = z.infer<typeof TreatmentGradeDefinitionSchema>;

export const ConditionalRequirementSchema = z
  .object({
    objectiveId: StableIdSchema,
    pointsIfMet: z.number(),
    pointsIfMissing: z.number().max(0),
    safetyCritical: z.boolean(),
    explanationMet: z.string().min(1),
    explanationMissing: z.string().min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();

export const TreatmentPathwaySchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    grade: TreatmentGradeSchema,
    accepted: z.boolean(),
    priority: z.number().int(),
    match: ScorePredicateSchema,
    requiredWorkupObjectiveIds: z.array(StableIdSchema),
    conditionalRequirements: z.array(ConditionalRequirementSchema),
    workupCostPar: z.number().int().nonnegative(),
    explanation: z.string().min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type TreatmentPathway = z.infer<typeof TreatmentPathwaySchema>;

export const ScoreComponentSchema = z.enum([
  'workup',
  'medication_selection',
  'medication_discontinuation',
  'safety',
  'nonmedication',
  'disposition',
  'efficiency',
]);
export type ScoreComponent = z.infer<typeof ScoreComponentSchema>;

export const TraceClassificationSchema = z.enum([
  'essential_obtained',
  'high_yield_obtained',
  'appropriate_for_selected_treatment',
  'defensible_not_necessary',
  'low_value',
  'critical_omission',
  'optimal_treatment',
  'strong_alternative',
  'acceptable',
  'weak',
  'ineffective',
  'harmful',
  'safe',
  'dangerous_combination',
  'contributing_medication_stopped',
  'contributing_medication_not_stopped',
  'disposition',
  'nonmedication',
]);

export const ScoreRuleSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    component: ScoreComponentSchema,
    predicate: ScorePredicateSchema,
    pointsIfTrue: z.number(),
    pointsIfFalse: z.number(),
    classificationIfTrue: TraceClassificationSchema,
    classificationIfFalse: TraceClassificationSchema,
    explanationIfTrue: z.string().min(1),
    explanationIfFalse: z.string().min(1),
    safetyErrorIfTrue: z.string().min(1).optional(),
    safetyErrorIfFalse: z.string().min(1).optional(),
    carePointCapIfTrue: z.number().int().optional(),
    carePointCapIfFalse: z.number().int().optional(),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type ScoreRule = z.infer<typeof ScoreRuleSchema>;

export const ScoreConfigurationSchema = z
  .object({
    componentPointCaps: z.record(ScoreComponentSchema, z.number().int().nullable()),
    databasePlanWorkupCost: z.number().int().nonnegative(),
    databasePlanCarePoints: z.number().int(),
  })
  .strict();

export const EconomyConfigurationSchema = z
  .object({
    baseReimbursement: z.number().int().nonnegative(),
    complexityBonus: z.number().int().nonnegative(),
    challengeBonus: z.number().int().nonnegative(),
    satisfactionMultiplier: z.number().min(1),
  })
  .strict();

export const ReferenceSolutionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1),
    kind: z.enum(['database_plan', 'strong_alternative', 'shotgun', 'unsafe']),
    actionIds: z.array(StableIdSchema),
    selections: TreatmentSelectionSchema,
    explanation: z.string().min(1),
  })
  .strict();
export type ReferenceSolution = z.infer<typeof ReferenceSolutionSchema>;

export const CaseMetadataSchema = z
  .object({
    title: z.string().min(1),
    fictional: z.literal(true),
    synthetic: z.literal(true),
    medicalReviewStatus: MedicalReviewStatusSchema,
    lifecycle: ContentLifecycleSchema,
    prototype: z.boolean(),
    disclaimer: z.string().min(20),
    difficultyTier: z.number().int().min(1),
    minimumLifetimePoints: z.number().int().nonnegative(),
    tags: z.array(z.string().min(1)),
    compatibleLocationIds: z.array(StableIdSchema).min(1),
    sourceDocumentIds: z.array(StableIdSchema),
  })
  .strict();
export type CaseMetadata = z.infer<typeof CaseMetadataSchema>;

export const PatientDiagnosisSchema = z
  .object({
    id: StableIdSchema,
    role: z.enum(['primary', 'contributing', 'excluded', 'reference_only']),
    tagIds: z.array(StableIdSchema),
  })
  .strict();

export const PatientObservationSchema = z
  .object({
    id: StableIdSchema,
    actionId: StableIdSchema,
    label: z.string().min(1).max(120),
    dataType: z.enum(['scalar', 'categorical', 'panel', 'text']),
    value: z.union([z.string(), z.number(), z.boolean()]),
    displayValue: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    ucumCode: z.string().min(1).optional(),
    referenceInterval: ObservationReferenceIntervalSchema.optional(),
    /** Pre-v1 prototype compatibility. New numeric observations use referenceInterval. */
    referenceRangeText: z.string().min(1).optional(),
    flag: z.enum(['normal', 'high', 'low', 'positive', 'negative', 'not_applicable']),
    clinicallyCritical: z.boolean(),
    origin: z.enum(['authored', 'generated_normal', 'generated_incidental']).default('authored'),
    notCaseDefining: z.boolean().default(false),
  })
  .strict()
  .superRefine((observation, context) => {
    if (observation.dataType !== 'scalar' || typeof observation.value !== 'number') return;
    if (!observation.unit || (observation.referenceInterval && !observation.ucumCode)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A structured numeric scalar observation requires display and UCUM units.',
      });
    }
    if (!observation.referenceInterval && !observation.referenceRangeText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A numeric scalar observation requires a reference interval.',
      });
    }
    if (observation.referenceInterval) {
      const { low, high } = observation.referenceInterval;
      const expectedFlag =
        low !== undefined && observation.value < low
          ? 'low'
          : high !== undefined && observation.value > high
            ? 'high'
            : 'normal';
      if (observation.flag !== expectedFlag) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Numeric observation flag must be ${expectedFlag} for its reference interval.`,
        });
      }
    }
  });
export type PatientObservation = z.infer<typeof PatientObservationSchema>;

export const SourceUseNoteSchema = z
  .object({
    id: StableIdSchema,
    sourceDocumentId: StableIdSchema,
    sourceChunkIds: z.array(StableIdSchema),
    takeaway: z.string().min(1).max(800),
    generatedBy: z.enum(['human', 'ai']),
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict();

export const PatientTreatmentReferenceSchema = z
  .object({
    id: StableIdSchema,
    /** Pre-v1 prototype compatibility. New content declares one primary broad pathway. */
    authoredPathwayIds: z.array(StableIdSchema).min(1).optional(),
    primaryAuthoredPathwayId: StableIdSchema.optional(),
    additionalAuthoredPathwayIds: z.array(StableIdSchema).default([]),
    safetyFallbackPathwayIds: z.array(StableIdSchema).default([]),
    acceptedMedicationTagSets: z.array(
      z
        .object({
          id: StableIdSchema,
          allOfTagIds: z.array(StableIdSchema).min(1),
          baselineGrade: TreatmentGradeSchema,
          review: UnreviewedClinicalRuleSchema,
        })
        .strict(),
    ),
    alternativeEvaluation: z.enum(['engine_with_notice', 'authored_only']),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict()
  .refine(
    (reference) =>
      Boolean(reference.primaryAuthoredPathwayId || reference.authoredPathwayIds?.length),
    { message: 'A treatment reference requires a primary authored pathway.' },
  );

export const PatientGenerationPolicySchema = z
  .object({
    unspecifiedNoncriticalFacts: z.enum(['curated_only', 'reviewed_normal_values']),
    incidentalAbnormalities: z.enum([
      'disabled',
      'explicit_reviewed_variants_only',
      'bounded_by_test_catalog',
    ]),
    minimumPresentationVariants: z.number().int().min(1),
  })
  .strict();

export const PatientTestGenerationContextSchema = z
  .object({
    ageYearsVariantTarget: z.string().regex(/^patient\.[a-z][a-zA-Z0-9]*$/),
    sexForReference: z.enum(['female', 'male', 'intersex', 'unspecified']),
  })
  .strict();

export const PatientRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    categoryIds: z.array(StableIdSchema).min(1),
    diagnoses: z.array(PatientDiagnosisSchema),
    clinicalTagIds: z.array(StableIdSchema),
    observations: z.array(PatientObservationSchema),
    sourceUseNotes: z.array(SourceUseNoteSchema),
    treatmentReference: PatientTreatmentReferenceSchema,
    generationPolicy: PatientGenerationPolicySchema,
    testGenerationContext: PatientTestGenerationContextSchema,
  })
  .strict();
export type PatientRecord = z.infer<typeof PatientRecordSchema>;

const CaseCoreSchema = z.object({
  metadata: CaseMetadataSchema,
  patientRecord: PatientRecordSchema,
  criticalFacts: z.record(z.union([z.string(), z.number(), z.boolean()])),
  workupObjectives: z.array(WorkupObjectiveSchema).min(1),
  availableTreatments: AvailableTreatmentsSchema,
  treatmentGrades: z.array(TreatmentGradeDefinitionSchema).min(1),
  treatmentPathways: z.array(TreatmentPathwaySchema).min(1),
  scoreRules: z.array(ScoreRuleSchema),
  scoring: ScoreConfigurationSchema,
  economy: EconomyConfigurationSchema,
  referenceSolutions: z.array(ReferenceSolutionSchema).min(1),
});

export const CaseBlueprintSchema = CaseCoreSchema.extend({
  schemaVersion: SchemaVersionSchema,
  contentVersion: ContentVersionSchema,
  id: StableIdSchema,
  opening: PatientOpeningSchema,
  informationActions: z.array(CaseInformationActionBlueprintSchema).min(1),
  variants: z.array(VariantSpecificationSchema),
  protectedVariantTargets: z.array(z.string()),
}).strict();
export type CaseBlueprint = z.infer<typeof CaseBlueprintSchema>;

export const CaseInstanceSchema = CaseCoreSchema.extend({
  schemaVersion: SchemaVersionSchema,
  contentVersion: ContentVersionSchema,
  id: StableIdSchema,
  blueprintId: StableIdSchema,
  seed: z.string().min(1),
  resolvedVariants: z.record(z.union([z.string(), z.number()])),
  resolvedObservations: z.array(PatientObservationSchema),
  opening: ResolvedPatientOpeningSchema,
  informationActions: z.array(CaseInformationActionSchema).min(1),
}).strict();
export type CaseInstance = z.infer<typeof CaseInstanceSchema>;

export const ClinicStateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    facilityId: StableIdSchema,
    facilityTier: FacilityTierSchema,
    locationIds: z.array(StableIdSchema),
    activeLocationId: StableIdSchema,
    departmentIds: z.array(StableIdSchema),
    capabilities: z.array(CapabilitySchema),
    ownedUpgradeIds: z.array(StableIdSchema),
    ownedEquipmentIds: z.array(StableIdSchema),
    formularyIds: z.array(StableIdSchema),
    clinicPoints: z.number().int().nonnegative(),
    lifetimePointsEarned: z.number().int().nonnegative(),
    debugUnlocksAllProgression: z.boolean().default(false),
    satisfaction: z.number().min(0),
    satisfactionMultiplier: z.number().min(1),
  })
  .strict();
export type ClinicState = z.infer<typeof ClinicStateSchema>;

export const InformationPurchaseSchema = z
  .object({
    actionId: StableIdSchema,
    serviceId: StableIdSchema,
    fulfillmentMethodId: StableIdSchema,
    fulfillmentLabel: z.string().min(1),
    operatingCost: z.number().int().nonnegative(),
    externalCostAvoided: z.number().int().nonnegative(),
    result: InformationResultSchema,
  })
  .strict();
export type InformationPurchase = z.infer<typeof InformationPurchaseSchema>;

export const EncounterEventSchema = z.discriminatedUnion('type', [
  z
    .object({
      id: StableIdSchema,
      type: z.literal('EncounterStarted'),
      caseInstanceId: StableIdSchema,
      locationId: StableIdSchema,
    })
    .strict(),
  z
    .object({
      id: StableIdSchema,
      type: z.literal('InformationPurchased'),
      purchase: InformationPurchaseSchema,
    })
    .strict(),
  z
    .object({
      id: StableIdSchema,
      type: z.literal('TreatmentSelectionsChanged'),
      selections: TreatmentSelectionSchema,
    })
    .strict(),
  z.object({ id: StableIdSchema, type: z.literal('EncounterSubmitted') }).strict(),
  z
    .object({
      id: StableIdSchema,
      type: z.literal('CarePointsCalculated'),
      carePoints: z.number().int(),
    })
    .strict(),
  z
    .object({ id: StableIdSchema, type: z.literal('SettlementCalculated'), payout: z.number() })
    .strict(),
]);
export type EncounterEvent = z.infer<typeof EncounterEventSchema>;

export const EncounterStateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    status: z.enum(['in_progress', 'submitted']),
    caseInstance: CaseInstanceSchema,
    clinicState: ClinicStateSchema,
    locationId: StableIdSchema,
    purchases: z.array(InformationPurchaseSchema),
    knownFactIds: z.array(StableIdSchema),
    selections: TreatmentSelectionSchema,
    expenseTotal: z.number().int().nonnegative(),
    events: z.array(EncounterEventSchema),
  })
  .strict();
export type EncounterState = z.infer<typeof EncounterStateSchema>;

export const RuleEvaluationSchema = z
  .object({
    ruleId: StableIdSchema,
    label: z.string().min(1),
    component: ScoreComponentSchema,
    matched: z.boolean(),
    points: z.number().int(),
    classification: TraceClassificationSchema,
    explanation: z.string().min(1),
    reviewStatus: MedicalReviewStatusSchema.default('unreviewed'),
    relatedActionIds: z.array(StableIdSchema),
    relatedTreatmentIds: z.array(StableIdSchema),
  })
  .strict();
export type RuleEvaluation = z.infer<typeof RuleEvaluationSchema>;

export const ClinicalPointReportSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    carePointsEarned: z.number().int(),
    databasePlanCarePoints: z.number().int(),
    differenceFromDatabasePlan: z.number().int(),
    treatmentGrade: TreatmentGradeSchema,
    treatmentEvaluationSource: z.enum(['authored_pathway', 'engine_inferred', 'unmatched']),
    treatmentEvaluationNotice: z.string().min(1),
    selectedPathwayId: StableIdSchema.nullable(),
    selectedPathwayLabel: z.string().nullable(),
    componentPoints: z.record(ScoreComponentSchema, z.number().int()),
    ruleTrace: z.array(RuleEvaluationSchema),
    safetyErrors: z.array(z.string().min(1)),
    carePointCapApplied: z.number().int().nullable(),
    databasePlanWorkupCost: z.number().int().nonnegative(),
    selectedPathWorkupCost: z.number().int().nonnegative(),
    actualWorkupExpense: z.number().int().nonnegative(),
  })
  .strict();
export type ClinicalPointReport = z.infer<typeof ClinicalPointReportSchema>;

export const ReceiptItemSchema = z
  .object({
    id: StableIdSchema,
    itemName: z.string().min(1),
    kind: z.enum(['information', 'treatment', 'nonmedication', 'disposition']),
    fulfillmentMethod: z.string().min(1),
    operatingCost: z.number().int().nonnegative(),
    pointDelta: z.number().int(),
    scoreCategory: z.enum([
      'workup',
      'base_treatment',
      'patient_fit_modifier',
      'interaction_modifier',
      'medication_change',
      'nonmedication',
      'disposition',
      'efficiency',
    ]),
    classification: z.string().min(1),
    explanation: z.string().min(1),
    acceptedPathwayMatch: z.boolean(),
    externalCostAvoided: z.number().int().nonnegative(),
  })
  .strict();
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

export const EconomySettlementSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    baseReimbursement: z.number().int().nonnegative(),
    carePoints: z.number().int(),
    complexityBonus: z.number().int().nonnegative(),
    challengeBonus: z.number().int().nonnegative(),
    satisfactionMultiplier: z.number().min(1),
    grossPayout: z.number().int().nonnegative(),
    operatingExpenses: z.number().int().nonnegative(),
    calculatedPayout: z.number().int(),
    netClinicPointsEarned: z.number().int().nonnegative(),
    bankedClinicPointsEarned: z.number().int().nonnegative(),
    practiceMode: z.boolean(),
    persistentPointsBefore: z.number().int().nonnegative(),
    persistentPointsAfter: z.number().int().nonnegative(),
    lifetimePointsBefore: z.number().int().nonnegative(),
    lifetimePointsAfter: z.number().int().nonnegative(),
  })
  .strict();
export type EconomySettlement = z.infer<typeof EconomySettlementSchema>;

export const CaseReceiptSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    pointReport: ClinicalPointReportSchema,
    settlement: EconomySettlementSchema,
    items: z.array(ReceiptItemSchema),
  })
  .strict();
export type CaseReceipt = z.infer<typeof CaseReceiptSchema>;

export const CompletedAttemptSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    caseId: StableIdSchema,
    blueprintId: StableIdSchema,
    caseContentVersion: ContentVersionSchema,
    seed: z.string().min(1),
    caseInstance: CaseInstanceSchema,
    clinicStateAtStart: ClinicStateSchema,
    events: z.array(EncounterEventSchema),
    purchases: z.array(InformationPurchaseSchema),
    submittedTreatment: TreatmentSelectionSchema,
    receipt: CaseReceiptSchema,
    completedAt: z.string().datetime(),
  })
  .strict();
export type CompletedAttempt = z.infer<typeof CompletedAttemptSchema>;

export const PatientQueueSlotSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    mode: ProgressionModeSchema,
    locationId: StableIdSchema,
    caseInstance: CaseInstanceSchema,
  })
  .strict();
export type PatientQueueSlot = z.infer<typeof PatientQueueSlotSchema>;

export const PatientQueueStateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    generation: z.number().int().nonnegative(),
    standardSlots: z.array(PatientQueueSlotSchema),
    endgameSlots: z.array(PatientQueueSlotSchema),
    developerSlots: z.array(PatientQueueSlotSchema),
    developerRunBlueprintIds: z.array(StableIdSchema),
    recentChiefComplaints: z.array(z.string().min(1).max(120)).max(24),
  })
  .strict();
export type PatientQueueState = z.infer<typeof PatientQueueStateSchema>;

export const PlayerProfileSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    clinic: ClinicStateSchema,
    progressionMode: ProgressionModeSchema,
    completedAttemptIds: z.array(StableIdSchema),
  })
  .strict();
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

export const ContentFlagSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    caseId: StableIdSchema,
    blueprintId: StableIdSchema,
    caseContentVersion: ContentVersionSchema,
    generatedSeed: z.string(),
    engineVersion: z.string(),
    attemptId: StableIdSchema,
    eventHistory: z.array(EncounterEventSchema),
    treatmentSelections: TreatmentSelectionSchema,
    pointReport: ClinicalPointReportSchema,
    disputedItemId: StableIdSchema.nullable(),
    issueCategory: z.enum([
      'whole_encounter',
      'information_result',
      'workup_objective',
      'treatment_grade',
      'interaction_rule',
      'penalty',
      'rationale',
      'missing_alternative',
      'narrative_ambiguity',
      'ui_or_engine_bug',
    ]),
    requiresClinicalReview: z.boolean(),
    note: z.string().max(4000),
    reviewStatus: z.enum(['open', 'accepted', 'rejected', 'addressed']),
    createdAt: z.string().datetime(),
  })
  .strict();
export type ContentFlag = z.infer<typeof ContentFlagSchema>;

export const ClinicalTicketStatusSchema = z.enum([
  'proposed',
  'in_review',
  'accepted_for_workflow',
  'rejected',
  'deferred',
  'resolved',
]);
export type ClinicalTicketStatus = z.infer<typeof ClinicalTicketStatusSchema>;

export const ClinicalReviewTicketSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    title: z.string().min(1).max(180),
    sourceKind: z.enum(['receipt_guidance', 'content_flag', 'source_claim', 'engine_audit']),
    sourceAuthority: z.enum(['player_observation', 'developer_observation', 'source_document']),
    ticketType: z.enum([
      'technical',
      'case_construction',
      'test_generation',
      'medication_fit',
      'treatment_pathway',
      'scoring',
      'narrative',
      'clinical_conflict',
    ]),
    priority: z.enum(['low', 'medium', 'high', 'blocking']),
    status: ClinicalTicketStatusSchema,
    requiresClinicalAcumen: z.boolean(),
    attemptId: StableIdSchema.nullable(),
    blueprintId: StableIdSchema.nullable(),
    caseContentVersion: ContentVersionSchema.nullable(),
    receiptItemId: StableIdSchema.nullable(),
    receiptItemSnapshot: ReceiptItemSchema.nullable(),
    targetContentIds: z.array(StableIdSchema),
    dependencyTicketIds: z.array(StableIdSchema),
    conflictContentIds: z.array(StableIdSchema),
    proposedRouting: z.string().min(1).max(500),
    guidance: z.string().min(1).max(4000),
    resurfacingTrigger: z.string().max(500).nullable(),
    resolution: z
      .object({
        disposition: z.enum(['applied', 'rejected', 'deferred', 'no_change']),
        note: z.string().min(1).max(4000),
        resolvedBy: z.string().min(1).max(120),
        resolvedAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type ClinicalReviewTicket = z.infer<typeof ClinicalReviewTicketSchema>;

export const ClinicalTicketExportBundleSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    exportVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    engineVersion: z.string().min(1),
    profileId: StableIdSchema,
    tickets: z.array(ClinicalReviewTicketSchema),
  })
  .strict();
export type ClinicalTicketExportBundle = z.infer<typeof ClinicalTicketExportBundleSchema>;

export const LegacySaveArchiveEntrySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    sourceSaveDataVersion: z.number().int().nonnegative(),
    reason: z.string().min(1),
    archivedAt: z.string().datetime(),
    payload: z.unknown(),
  })
  .strict();
export type LegacySaveArchiveEntry = z.infer<typeof LegacySaveArchiveEntrySchema>;

export const SaveDataSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    saveDataVersion: z.literal(4),
    profile: PlayerProfileSchema,
    attempts: z.array(CompletedAttemptSchema),
    flags: z.array(ContentFlagSchema),
    patientQueues: PatientQueueStateSchema,
    clinicalTickets: z.array(ClinicalReviewTicketSchema),
    legacyArchive: z.array(LegacySaveArchiveEntrySchema),
  })
  .strict();
export type SaveData = z.infer<typeof SaveDataSchema>;

export const ProcessingStatusSchema = z.enum([
  'discovered',
  'duplicate',
  'extracting',
  'extracted',
  'quarantined',
  'archived',
]);
export type ProcessingStatus = z.infer<typeof ProcessingStatusSchema>;

export const RemoteSourceCandidateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    provider: z.literal('google_drive'),
    providerFileId: z.string().min(1),
    providerFolderId: z.string().min(1),
    filename: z.string().min(1),
    mediaType: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    sourceModifiedAt: z.string().datetime(),
    discoveredAt: z.string().datetime(),
    webViewUrl: z.string().url(),
    status: z.enum(['discovered', 'pulled', 'duplicate', 'queued_for_review', 'quarantined']),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    reviewOrder: z.number().int().positive(),
  })
  .strict();
export type RemoteSourceCandidate = z.infer<typeof RemoteSourceCandidateSchema>;

export const RemoteSourceDiscoveryManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    provider: z.literal('google_drive'),
    folderId: z.string().min(1),
    folderName: z.string().min(1),
    lastScannedAt: z.string().datetime(),
    candidates: z.array(RemoteSourceCandidateSchema),
  })
  .strict();
export type RemoteSourceDiscoveryManifest = z.infer<typeof RemoteSourceDiscoveryManifestSchema>;

export const SourceManifestEntrySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    filename: z.string().min(1),
    mediaType: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sizeBytes: z.number().int().nonnegative(),
    parserVersion: z.string().min(1),
    status: ProcessingStatusSchema,
    duplicateOfId: StableIdSchema.nullable().default(null),
    discoveredAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    error: z.string().optional(),
  })
  .strict();
export type SourceManifestEntry = z.infer<typeof SourceManifestEntrySchema>;

export const SourceManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    manifestVersion: z.literal(1),
    parserVersion: z.string().min(1),
    updatedAt: z.string().datetime(),
    entries: z.array(SourceManifestEntrySchema),
  })
  .strict();
export type SourceManifest = z.infer<typeof SourceManifestSchema>;

export const SourceDocumentSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    sourceManifestEntryId: StableIdSchema,
    mediaType: z.enum([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ]),
    extractedTextHash: z.string().regex(/^[a-f0-9]{64}$/),
    parserVersion: z.string().min(1),
    processedAt: z.string().datetime(),
  })
  .strict();
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;

export const SourceChunkSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    sourceDocumentId: StableIdSchema,
    ordinal: z.number().int().nonnegative(),
    page: z.number().int().positive().optional(),
    section: z.string().optional(),
    text: z.string().min(1),
    textHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type SourceChunk = z.infer<typeof SourceChunkSchema>;

export const SourceClaimSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    sourceDocumentId: StableIdSchema,
    sourceChunkIds: z.array(StableIdSchema).min(1),
    summary: z.string().min(1).max(800),
    topicTagIds: z.array(StableIdSchema),
    reviewStatus: z.enum(['proposed', 'in_review', 'accepted', 'rejected']),
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict();
export type SourceClaim = z.infer<typeof SourceClaimSchema>;

export const ContentChangeProposalSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    sourceClaimIds: z.array(StableIdSchema).min(1),
    targetContentIds: z.array(StableIdSchema).min(1),
    affectedContentIds: z.array(StableIdSchema),
    changeKind: z.enum(['add', 'modify', 'deprecate', 'no_change']),
    beforeSummary: z.string().max(1200),
    proposedSummary: z.string().min(1).max(1200),
    reviewStatus: z.enum(['proposed', 'in_review', 'accepted', 'rejected', 'deferred']),
    medicalReviewStatus: MedicalReviewStatusSchema,
    createdAt: z.string().datetime(),
  })
  .strict();
export type ContentChangeProposal = z.infer<typeof ContentChangeProposalSchema>;

export const GenerationProvenanceSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    modelIdentifier: z.string().min(1),
    promptVersion: z.string().min(1),
    generatedAt: z.string().datetime(),
    sourceDocumentIds: z.array(StableIdSchema),
    sourceChunkIds: z.array(StableIdSchema),
    blueprintId: StableIdSchema,
    generatorVersion: z.string().min(1),
    validationResults: z.array(z.string()),
    criticFindings: z.array(z.string()),
    repairHistory: z.array(z.string()),
    medicalReviewStatus: z.literal('unreviewed'),
  })
  .strict();
export type GenerationProvenance = z.infer<typeof GenerationProvenanceSchema>;

export const PatientScaffoldRequestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    requestVersion: z.literal(1),
    id: StableIdSchema,
    blueprintId: StableIdSchema,
    templateBlueprintId: StableIdSchema,
    internalTitle: z.string().min(1).max(180),
    sourceUses: z.array(
      z
        .object({
          sourceDocumentId: StableIdSchema,
          sourceChunkIds: z.array(StableIdSchema).min(1),
          summary: z.string().min(20).max(800),
        })
        .strict(),
    ),
    chiefComplaintChoices: z.array(z.string().min(2).max(40)).min(10),
    ageRange: z
      .object({
        minimum: z.number().int().min(18).max(89),
        maximum: z.number().int().min(19).max(90),
      })
      .strict()
      .refine((range) => range.minimum < range.maximum, {
        message: 'Age range minimum must be below maximum.',
      }),
    createdBy: z.enum(['human', 'codex', 'mock']),
  })
  .strict();
export type PatientScaffoldRequest = z.infer<typeof PatientScaffoldRequestSchema>;

export const UpgradeDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    description: z.string().min(1).max(500),
    kind: z.enum(['equipment', 'staff', 'formulary', 'program', 'department', 'facility', 'decor']),
    purchaseCost: z.number().int().nonnegative(),
    minimumLifetimePoints: z.number().int().nonnegative().default(0),
    prerequisiteUpgradeIds: z.array(StableIdSchema),
    allowedFacilityTiers: z.array(FacilityTierSchema),
    requiredDepartmentId: StableIdSchema.optional(),
    grantsCapabilities: z.array(CapabilitySchema),
    grantsFormularyIds: z.array(StableIdSchema).default([]),
    serviceIds: z.array(StableIdSchema).default([]),
    inHousePerUseCost: z.number().int().nonnegative().optional(),
    patientCategoryIdsUnlocked: z.array(StableIdSchema).default([]),
    clinicalCapabilityLabels: z.array(z.string().min(1).max(160)).default([]),
  })
  .strict();
export type UpgradeDefinition = z.infer<typeof UpgradeDefinitionSchema>;

export const DecorDefinitionSchema = UpgradeDefinitionSchema.extend({
  kind: z.literal('decor'),
  satisfactionPoints: z.number().nonnegative(),
  displaySlotType: z.string().min(1),
}).strict();
export type DecorDefinition = z.infer<typeof DecorDefinitionSchema>;

export const CaseEligibilitySchema = z
  .object({
    eligible: z.boolean(),
    reasons: z.array(z.string()),
    availablePathwayIds: z.array(StableIdSchema),
  })
  .strict();
export type CaseEligibility = z.infer<typeof CaseEligibilitySchema>;

// Planned-system schemas below establish stable boundaries without enabling later-milestone gameplay.
export const WorkupPathwaySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1),
    objectiveIds: z.array(StableIdSchema).min(1),
    completion: ScorePredicateSchema,
    par: z.number().int().nonnegative(),
  })
  .strict();
export type WorkupPathway = z.infer<typeof WorkupPathwaySchema>;

export const MedicationStartSelectionSchema = z
  .object({ medicationId: StableIdSchema, kind: z.literal('start') })
  .strict();
export type MedicationStartSelection = z.infer<typeof MedicationStartSelectionSchema>;

export const MedicationStopSelectionSchema = z
  .object({ medicationId: StableIdSchema, kind: z.literal('stop') })
  .strict();
export type MedicationStopSelection = z.infer<typeof MedicationStopSelectionSchema>;

export const MedicationContinueSelectionSchema = z
  .object({ medicationId: StableIdSchema, kind: z.literal('continue') })
  .strict();
export type MedicationContinueSelection = z.infer<typeof MedicationContinueSelectionSchema>;

export const NonMedicationSelectionSchema = z
  .object({ interventionId: StableIdSchema, kind: z.literal('nonmedication') })
  .strict();
export type NonMedicationSelection = z.infer<typeof NonMedicationSelectionSchema>;

export const DispositionSelectionSchema = z
  .object({ dispositionId: StableIdSchema, kind: z.literal('disposition') })
  .strict();
export type DispositionSelection = z.infer<typeof DispositionSelectionSchema>;

export const EquipmentDefinitionSchema = UpgradeDefinitionSchema.extend({
  kind: z.literal('equipment'),
  serviceIds: z.array(StableIdSchema),
  inHousePerUseCost: z.number().int().nonnegative(),
}).strict();
export type EquipmentDefinition = z.infer<typeof EquipmentDefinitionSchema>;

export const StaffDefinitionSchema = UpgradeDefinitionSchema.extend({
  kind: z.literal('staff'),
  role: z.string().min(1),
}).strict();
export type StaffDefinition = z.infer<typeof StaffDefinitionSchema>;

export const TreatmentProgramDefinitionSchema = UpgradeDefinitionSchema.extend({
  kind: z.literal('program'),
  formularyIds: z.array(StableIdSchema),
  permittedDepartmentIds: z.array(StableIdSchema),
}).strict();
export type TreatmentProgramDefinition = z.infer<typeof TreatmentProgramDefinitionSchema>;

export const LifetimePointsThresholdSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    facilityTier: FacilityTierSchema,
    requiredLifetimePoints: z.number().int().nonnegative(),
  })
  .strict();
export type LifetimePointsThreshold = z.infer<typeof LifetimePointsThresholdSchema>;

export const SatisfactionStateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    rawPoints: z.number().nonnegative(),
    diminishingReturnValue: z.number().nonnegative(),
    multiplier: z.number().min(1),
    configuredCap: z.number().min(1).nullable(),
  })
  .strict();
export type SatisfactionState = z.infer<typeof SatisfactionStateSchema>;

export const EncounterCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PurchaseInformationAction'), actionId: StableIdSchema }).strict(),
  z
    .object({ type: z.literal('UpdateTreatmentSelections'), selections: TreatmentSelectionSchema })
    .strict(),
  z.object({ type: z.literal('SubmitEncounter') }).strict(),
]);
export type EncounterCommand = z.infer<typeof EncounterCommandSchema>;

export const SaveDataVersionSchema = z.literal(4);
export type SaveDataVersion = z.infer<typeof SaveDataVersionSchema>;
