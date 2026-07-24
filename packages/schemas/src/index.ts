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

export const EvidenceAuthoritySchema = z.enum(['formal_publication', 'expert_opinion']);
export type EvidenceAuthority = z.infer<typeof EvidenceAuthoritySchema>;

export const FormalEvidenceSourceTypeSchema = z.enum([
  'journal_article',
  'clinical_guideline',
  'systematic_review',
  'structured_database',
  'regulatory_document',
  'classification_standard',
  'book_chapter',
  'professional_guidance',
  'correction_notice',
]);
export type FormalEvidenceSourceType = z.infer<typeof FormalEvidenceSourceTypeSchema>;

export const EvidenceSourceRelationTypeSchema = z.enum([
  'corrects',
  'supersedes',
  'updates',
  'companion_to',
  'executive_summary_of',
]);
export type EvidenceSourceRelationType = z.infer<typeof EvidenceSourceRelationTypeSchema>;

export const EvidenceSourceRelationSchema = z
  .object({
    sourceId: StableIdSchema,
    relationType: EvidenceSourceRelationTypeSchema,
    note: z.string().min(1).max(800),
  })
  .strict();
export type EvidenceSourceRelation = z.infer<typeof EvidenceSourceRelationSchema>;

const PartialPublicationDateSchema = z
  .string()
  .regex(
    /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/,
    'Expected YYYY, YYYY-MM, or YYYY-MM-DD',
  );

export const EvidenceSourceAccessPolicySchema = z
  .object({
    fullTextStatus: z.enum(['public', 'restricted', 'metadata_only', 'not_verified']),
    reuseStatus: z.enum([
      'public_domain',
      'open_license',
      'permission_required',
      'prohibited',
      'not_verified',
    ]),
    adaptationStatus: z.enum(['permitted', 'permission_required', 'prohibited', 'not_verified']),
    commercialUseStatus: z.enum(['permitted', 'permission_required', 'prohibited', 'not_verified']),
    aiUseStatus: z.enum(['permitted', 'permission_required', 'prohibited', 'not_verified']),
    localExtractionStatus: z.enum(['allowed', 'permission_required', 'prohibited', 'not_verified']),
    licenseLabel: z.string().min(1).max(200).nullable(),
    licenseUrl: z.string().url().nullable(),
    termsUrl: z.string().url().nullable(),
    note: z.string().min(1).max(1600),
  })
  .strict();
export type EvidenceSourceAccessPolicy = z.infer<typeof EvidenceSourceAccessPolicySchema>;

export const EvidenceSourceDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    authority: z.literal('formal_publication'),
    sourceType: FormalEvidenceSourceTypeSchema,
    title: z.string().min(1).max(600),
    authors: z.array(z.string().min(1).max(160)),
    organization: z.string().min(1).max(240).nullable(),
    publicationYear: z.number().int().min(1800).max(2100),
    publicationDate: PartialPublicationDateSchema,
    lastReviewedDate: PartialPublicationDateSchema.nullable(),
    versionLabel: z.string().min(1).max(240).nullable(),
    containerTitle: z.string().min(1).max(300).nullable(),
    volume: z.string().min(1).max(40).nullable(),
    issue: z.string().min(1).max(40).nullable(),
    pages: z.string().min(1).max(80).nullable(),
    doi: z
      .string()
      .regex(/^10\.\d{4,9}\/\S+$/i)
      .nullable(),
    pmid: z.string().regex(/^\d+$/).nullable(),
    url: z.string().url(),
    citation: z.string().min(1).max(1200),
    knownContentHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)),
    jurisdictions: z.array(z.string().min(1).max(160)),
    populations: z.array(z.string().min(1).max(240)),
    settings: z.array(z.string().min(1).max(240)),
    sourceRelations: z.array(EvidenceSourceRelationSchema),
    accessPolicy: EvidenceSourceAccessPolicySchema,
    metadataReviewedAt: z.string().datetime(),
    bibliographicStatus: z.enum(['unreviewed', 'verified']),
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict()
  .superRefine((source, context) => {
    if (source.authors.length === 0 && !source.organization) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A formal evidence source requires at least one author or an organization.',
      });
    }
    if (
      source.sourceType === 'correction_notice' &&
      !source.sourceRelations.some((relation) => relation.relationType === 'corrects')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceRelations'],
        message: 'A correction notice must identify the source it corrects.',
      });
    }
  });
export type EvidenceSourceDefinition = z.infer<typeof EvidenceSourceDefinitionSchema>;

export const SourceUsePermissionsSchema = z
  .object({
    bibliographicMetadata: z.boolean(),
    localFullTextStorage: z.boolean(),
    localTextExtraction: z.boolean(),
    localStructuredIndexing: z.boolean(),
    aiAssistedProcessing: z.boolean(),
    derivedClinicalContent: z.boolean(),
    runtimeRedistribution: z.boolean(),
    commercialDistribution: z.boolean(),
  })
  .strict();
export type SourceUsePermissions = z.infer<typeof SourceUsePermissionsSchema>;

export const FairUseAssessmentSchema = z
  .object({
    preciseUse: z.string().min(1).max(1200),
    purposeAndCharacter: z.string().min(1).max(1600),
    natureOfWork: z.string().min(1).max(1600),
    amountAndSubstantiality: z.string().min(1).max(1600),
    marketEffect: z.string().min(1).max(1600),
    conclusion: z.enum(['proceed_narrowly', 'do_not_proceed', 'seek_legal_review']),
    reviewerId: StableIdSchema,
    reviewedAt: z.string().datetime(),
  })
  .strict();
export type FairUseAssessment = z.infer<typeof FairUseAssessmentSchema>;

export const PermissionEvidenceSchema = z
  .object({
    id: StableIdSchema,
    issuedBy: z.string().min(1).max(300),
    scope: z.string().min(1).max(2000),
    artifactReference: z.string().min(1).max(500),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
  })
  .strict();
export type PermissionEvidence = z.infer<typeof PermissionEvidenceSchema>;

export const SourceUseDecisionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    evidenceSourceId: StableIdSchema,
    decisionStatus: z.enum([
      'permitted_with_conditions',
      'metadata_only',
      'blocked_pending_permission',
      'not_reviewed',
    ]),
    legalBasis: z.enum([
      'public_domain',
      'open_license',
      'written_permission',
      'fair_use',
      'metadata_only',
    ]),
    permissions: SourceUsePermissionsSchema,
    territories: z.array(z.string().min(1).max(160)).min(1),
    attributionStatement: z.string().min(1).max(1200).nullable(),
    requiredNotices: z.array(z.string().min(1).max(1200)),
    nonCommercialOnly: z.boolean(),
    shareAlikeRequired: z.boolean(),
    thirdPartyMaterialPolicy: z.enum([
      'excluded',
      'item_level_review_required',
      'included_by_permission',
      'not_applicable',
    ]),
    fairUseAssessment: FairUseAssessmentSchema.nullable(),
    permissionEvidence: PermissionEvidenceSchema.nullable().default(null),
    reviewBasis: z.enum(['engineering_risk_assessment', 'legal_counsel']),
    reviewedBy: StableIdSchema,
    reviewedAt: z.string().datetime(),
    notes: z.string().min(1).max(2400),
  })
  .strict()
  .superRefine((decision, context) => {
    const substantivePermissions = Object.entries(decision.permissions)
      .filter(([name]) => name !== 'bibliographicMetadata')
      .some(([, permitted]) => permitted);
    if (!decision.permissions.bibliographicMetadata) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissions', 'bibliographicMetadata'],
        message: 'A source-use record must at least permit its own bibliographic metadata.',
      });
    }
    if (decision.legalBasis === 'fair_use' && !decision.fairUseAssessment) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fairUseAssessment'],
        message: 'A fair-use decision requires a written four-factor assessment.',
      });
    }
    if (decision.legalBasis !== 'fair_use' && decision.fairUseAssessment) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fairUseAssessment'],
        message: 'A fair-use assessment belongs only on a fair-use decision.',
      });
    }
    if (
      decision.legalBasis === 'fair_use' &&
      decision.fairUseAssessment &&
      decision.fairUseAssessment.conclusion !== 'proceed_narrowly' &&
      (decision.decisionStatus === 'permitted_with_conditions' || substantivePermissions)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fairUseAssessment', 'conclusion'],
        message:
          'A fair-use assessment that does not conclude proceed_narrowly cannot permit substantive use.',
      });
    }
    if (decision.legalBasis === 'written_permission' && !decision.permissionEvidence) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissionEvidence'],
        message: 'Written permission requires a scoped permission artifact record.',
      });
    }
    if (decision.legalBasis !== 'written_permission' && decision.permissionEvidence) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissionEvidence'],
        message: 'Permission evidence belongs only on a written-permission decision.',
      });
    }
    if (decision.legalBasis === 'open_license' && decision.attributionStatement === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['attributionStatement'],
        message: 'Open-licensed use requires an attribution statement.',
      });
    }
    if (decision.decisionStatus !== 'permitted_with_conditions' && substantivePermissions) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissions'],
        message: 'A blocked or metadata-only decision may permit bibliographic metadata only.',
      });
    }
    if (
      decision.legalBasis === 'metadata_only' &&
      (decision.decisionStatus === 'permitted_with_conditions' || substantivePermissions)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legalBasis'],
        message: 'Metadata-only is not a basis for substantive source use.',
      });
    }
    if (decision.nonCommercialOnly && decision.permissions.commercialDistribution) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissions', 'commercialDistribution'],
        message: 'A NonCommercial-only decision cannot permit commercial distribution.',
      });
    }
    if (decision.permissions.localStructuredIndexing && !decision.permissions.localTextExtraction) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissions', 'localStructuredIndexing'],
        message: 'Local structured indexing requires local extraction permission.',
      });
    }
  });
export type SourceUseDecision = z.infer<typeof SourceUseDecisionSchema>;

export const SourceUseDecisionCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    decisions: z.array(SourceUseDecisionSchema),
  })
  .strict();
export type SourceUseDecisionCatalog = z.infer<typeof SourceUseDecisionCatalogSchema>;

export const EvidenceContributionTypeSchema = z.enum([
  'patient_fact',
  'diagnosis_logic',
  'workup',
  'treatment',
  'medication_fit',
  'safety',
  'scoring',
  'laboratory_reference',
  'classification_mapping',
  'teaching_point',
  'context_only',
]);

export const EvidenceContributionSchema = z
  .object({
    id: StableIdSchema,
    authority: EvidenceAuthoritySchema,
    evidenceSourceIds: z.array(StableIdSchema),
    sourceDocumentId: StableIdSchema.nullable(),
    sourceChunkIds: z.array(StableIdSchema),
    targetContentIds: z.array(StableIdSchema).min(1),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    contribution: z.string().min(1).max(800),
    generatedBy: z.enum(['human', 'ai']),
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict()
  .superRefine((note, context) => {
    if (note.authority === 'formal_publication' && note.evidenceSourceIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceSourceIds'],
        message: 'A formal-publication contribution requires a cataloged evidence source.',
      });
    }
    if (note.authority === 'expert_opinion' && note.evidenceSourceIds.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceSourceIds'],
        message: 'Expert opinion cannot cite a formal evidence source.',
      });
    }
    if (note.sourceChunkIds.length > 0 && !note.sourceDocumentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceDocumentId'],
        message: 'Chunk-level provenance requires a local source document ID.',
      });
    }
  });
export type EvidenceContribution = z.infer<typeof EvidenceContributionSchema>;

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

export const PatientPoolSchema = z.enum(['starter', 'transitional', 'advanced']);
export type PatientPool = z.infer<typeof PatientPoolSchema>;

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
    locationIds: z.array(StableIdSchema).min(1),
    defaultLocationId: StableIdSchema,
    allowedDepartmentIds: z.array(StableIdSchema),
    allowedUpgradeIds: z.array(StableIdSchema),
  })
  .strict()
  .superRefine((facility, context) => {
    if (!facility.locationIds.includes(facility.defaultLocationId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['defaultLocationId'],
        message: 'The default location must be included in the facility location list.',
      });
    }
  });
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
    sourceUseNotes: z.array(EvidenceContributionSchema).default([]),
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
    kind: z.enum([
      'fictional_name',
      'fictional_first_name',
      'fictional_last_name',
      'occupation',
      'education',
      'location',
      'neutral_social',
    ]),
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
    evidenceSources: z.array(EvidenceSourceDefinitionSchema),
    diagnoses: z.array(z.lazy(() => DiagnosisDefinitionSchema)),
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
    decor: z.lazy(() => DecorCatalogSchema),
  })
  .strict();
export type CatalogBundle = z.infer<typeof CatalogBundleSchema>;

export const DiagnosisClassificationCodeSchema = z
  .string()
  .regex(
    /^[A-Z][0-9A-Z]{2}(?:\.[0-9A-Z]{1,4})?$/,
    'Expected a normalized ICD-style classification code',
  );
export type DiagnosisClassificationCode = z.infer<typeof DiagnosisClassificationCodeSchema>;

export const DiagnosisClassificationSourceArtifactSchema = z
  .object({
    url: z.string().url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    memberPath: z.string().min(1).max(300).nullable(),
    memberSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
  })
  .strict();
export type DiagnosisClassificationSourceArtifact = z.infer<
  typeof DiagnosisClassificationSourceArtifactSchema
>;

export const DiagnosisClassificationReleaseSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    system: z.literal('ICD-10-CM'),
    versionLabel: z.string().min(1).max(160),
    publishedDate: PartialPublicationDateSchema,
    effectiveFrom: PartialPublicationDateSchema,
    effectiveThrough: PartialPublicationDateSchema,
    scopeLabel: z.string().min(1).max(240),
    includedCodePrefixes: z.array(z.string().regex(/^[A-Z][0-9A-Z]*$/)).min(1),
    evidenceSourceId: StableIdSchema,
    sourceArtifact: DiagnosisClassificationSourceArtifactSchema,
    verificationArtifacts: z.array(DiagnosisClassificationSourceArtifactSchema),
    importerVersion: z.string().min(1).max(120),
    termCount: z.number().int().positive(),
    normalizedTermsSha256: z.string().regex(/^[a-f0-9]{64}$/),
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict();
export type DiagnosisClassificationRelease = z.infer<typeof DiagnosisClassificationReleaseSchema>;

export const DiagnosisClassificationTermSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    releaseId: StableIdSchema,
    code: DiagnosisClassificationCodeSchema,
    parentCode: DiagnosisClassificationCodeSchema.nullable(),
    shortDescription: z.string().min(1).max(300),
    longDescription: z.string().min(1).max(600),
    billable: z.boolean(),
    sourceOrder: z.number().int().positive(),
  })
  .strict();
export type DiagnosisClassificationTerm = z.infer<typeof DiagnosisClassificationTermSchema>;

export const DiagnosisClassificationTermsSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    releaseId: StableIdSchema,
    terms: z.array(DiagnosisClassificationTermSchema).min(1),
  })
  .strict();
export type DiagnosisClassificationTerms = z.infer<typeof DiagnosisClassificationTermsSchema>;

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
      'decor_catalog',
      'diagnosis_catalog',
      'diagnosis_classification_catalog',
      'source_use_decision_catalog',
      'source_request_catalog',
      'evidence_source',
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
export type ContentRegistryEntry = z.infer<typeof ContentRegistryEntrySchema>;

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

export const PatientDiagnosisRoleSchema = z.enum([
  'primary',
  'contributing',
  'excluded',
  'reference_only',
]);
export type PatientDiagnosisRole = z.infer<typeof PatientDiagnosisRoleSchema>;

export type PatientContextPredicate =
  | {
      type: 'diagnosisPresent';
      diagnosisId: string;
      roles: PatientDiagnosisRole[];
    }
  | { type: 'diagnosisSeverity'; diagnosisId: string; severityId: string }
  | { type: 'diagnosisSpecifier'; diagnosisId: string; specifierId: string }
  | { type: 'clinicalTagPresent'; clinicalTagId: string }
  | { type: 'any'; predicates: PatientContextPredicate[] }
  | { type: 'all'; predicates: PatientContextPredicate[] }
  | { type: 'not'; predicate: PatientContextPredicate };

export const PatientContextPredicateSchema: z.ZodType<PatientContextPredicate> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z
      .object({
        type: z.literal('diagnosisPresent'),
        diagnosisId: StableIdSchema,
        roles: z.array(PatientDiagnosisRoleSchema).min(1),
      })
      .strict(),
    z
      .object({
        type: z.literal('diagnosisSeverity'),
        diagnosisId: StableIdSchema,
        severityId: StableIdSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal('diagnosisSpecifier'),
        diagnosisId: StableIdSchema,
        specifierId: StableIdSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal('clinicalTagPresent'),
        clinicalTagId: StableIdSchema,
      })
      .strict(),
    z
      .object({
        type: z.literal('any'),
        predicates: z.array(PatientContextPredicateSchema).min(1),
      })
      .strict(),
    z
      .object({
        type: z.literal('all'),
        predicates: z.array(PatientContextPredicateSchema).min(1),
      })
      .strict(),
    z.object({ type: z.literal('not'), predicate: PatientContextPredicateSchema }).strict(),
  ]),
);

export type DiagnosisSelectionPredicate =
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
  | { type: 'any'; predicates: DiagnosisSelectionPredicate[] }
  | { type: 'all'; predicates: DiagnosisSelectionPredicate[] }
  | { type: 'not'; predicate: DiagnosisSelectionPredicate };

/**
 * Reusable diagnosis guidance may depend on the proposed treatment, but not on
 * case-local fact IDs, purchased actions, service ownership, or arbitrary code.
 */
export const DiagnosisSelectionPredicateSchema: z.ZodType<DiagnosisSelectionPredicate> = z.lazy(
  () =>
    z.discriminatedUnion('type', [
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
      z
        .object({
          type: z.literal('interventionSelected'),
          interventionId: StableIdSchema,
        })
        .strict(),
      z
        .object({
          type: z.literal('dispositionSelected'),
          dispositionId: StableIdSchema,
        })
        .strict(),
      z
        .object({
          type: z.literal('any'),
          predicates: z.array(DiagnosisSelectionPredicateSchema).min(1),
        })
        .strict(),
      z
        .object({
          type: z.literal('all'),
          predicates: z.array(DiagnosisSelectionPredicateSchema).min(1),
        })
        .strict(),
      z
        .object({
          type: z.literal('not'),
          predicate: DiagnosisSelectionPredicateSchema,
        })
        .strict(),
    ]),
);

export const DiagnosisRuleTargetSchema = z
  .object({
    kind: z.enum([
      'medication',
      'medication_tag',
      'information_action',
      'intervention',
      'disposition',
    ]),
    id: StableIdSchema,
  })
  .strict();
export type DiagnosisRuleTarget = z.infer<typeof DiagnosisRuleTargetSchema>;

export const RecommendationStanceSchema = z.enum([
  'required',
  'preferred',
  'acceptable',
  'neutral',
  'discouraged',
  'avoid',
  'contraindicated',
]);
export type RecommendationStance = z.infer<typeof RecommendationStanceSchema>;

/**
 * Diagnosis-owned guidance is qualitative. A separately versioned balance
 * policy may later map these stances to points; source content never owns an
 * unexplained numeric payout.
 */
export const DiagnosisRecommendationRuleSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    domain: z.enum([
      'assessment',
      'workup',
      'medication_selection',
      'medication_discontinuation',
      'nonmedication',
      'monitoring',
      'disposition',
      'safety',
    ]),
    target: DiagnosisRuleTargetSchema,
    stance: RecommendationStanceSchema,
    patientWhen: PatientContextPredicateSchema.nullable(),
    selectionWhen: DiagnosisSelectionPredicateSchema.nullable(),
    rationale: z.string().min(1).max(1200),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type DiagnosisRecommendationRule = z.infer<typeof DiagnosisRecommendationRuleSchema>;

export const ComplexityDimensionSchema = z.enum([
  'diagnostic',
  'pharmacologic',
  'workup',
  'safety_disposition',
  'information',
]);
export type ComplexityDimension = z.infer<typeof ComplexityDimensionSchema>;

export const ComplexityContributionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    dimension: ComplexityDimensionSchema,
    weight: z.number().int().min(1).max(5),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type ComplexityContribution = z.infer<typeof ComplexityContributionSchema>;

export const DiagnosisSeverityConstraintsSchema = z
  .object({
    criteriaSetId: StableIdSchema.nullable(),
    minimumPositiveCriteria: z.number().int().nonnegative().nullable(),
    maximumPositiveCriteria: z.number().int().nonnegative().nullable(),
    requiredCriterionIds: z.array(StableIdSchema),
    forbiddenCriterionIds: z.array(StableIdSchema),
    minimumFunctionalImpairment: z.enum(['none', 'mild', 'moderate', 'severe']).nullable(),
  })
  .strict()
  .superRefine((constraints, context) => {
    if (
      constraints.minimumPositiveCriteria !== null &&
      constraints.maximumPositiveCriteria !== null &&
      constraints.minimumPositiveCriteria > constraints.maximumPositiveCriteria
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maximumPositiveCriteria'],
        message: 'A severity range minimum must not exceed its maximum.',
      });
    }
    if (
      constraints.requiredCriterionIds.some((id) => constraints.forbiddenCriterionIds.includes(id))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requiredCriterionIds'],
        message: 'A severity criterion cannot be both required and forbidden.',
      });
    }
  });
export type DiagnosisSeverityConstraints = z.infer<typeof DiagnosisSeverityConstraintsSchema>;

export const DiagnosisSeverityLevelSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(120),
    rank: z.number().int().nonnegative(),
    generationStatus: z.enum(['disabled_pending_source', 'enabled']),
    constraints: DiagnosisSeverityConstraintsSchema,
    addedClinicalTagIds: z.array(StableIdSchema),
    rules: z.array(DiagnosisRecommendationRuleSchema),
    complexityContributions: z.array(ComplexityContributionSchema),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict()
  .superRefine((level, context) => {
    const constraints = level.constraints;
    const hasOperationalConstraint =
      constraints.criteriaSetId !== null ||
      constraints.minimumPositiveCriteria !== null ||
      constraints.maximumPositiveCriteria !== null ||
      constraints.requiredCriterionIds.length > 0 ||
      constraints.forbiddenCriterionIds.length > 0 ||
      constraints.minimumFunctionalImpairment !== null;
    if (level.generationStatus === 'enabled' && !hasOperationalConstraint) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['constraints'],
        message: 'An enabled severity level requires at least one operational constraint.',
      });
    }
  });
export type DiagnosisSeverityLevel = z.infer<typeof DiagnosisSeverityLevelSchema>;

export const DiagnosisSpecifierSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    exclusiveGroupId: StableIdSchema.nullable(),
    addedClinicalTagIds: z.array(StableIdSchema),
    rules: z.array(DiagnosisRecommendationRuleSchema),
    complexityContributions: z.array(ComplexityContributionSchema),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type DiagnosisSpecifier = z.infer<typeof DiagnosisSpecifierSchema>;

export const DiagnosisComorbidityRelationshipSchema = z
  .object({
    diagnosisId: StableIdSchema,
    relationship: z.enum([
      'compatible',
      'commonly_comorbid',
      'mutually_exclusive',
      'diagnostic_overlap',
    ]),
    gameGenerationWeight: z.number().positive().nullable(),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type DiagnosisComorbidityRelationship = z.infer<
  typeof DiagnosisComorbidityRelationshipSchema
>;

export const DiagnosisClassificationBindingSchema = z
  .object({
    id: StableIdSchema,
    classificationReleaseId: StableIdSchema,
    code: DiagnosisClassificationCodeSchema,
    relation: z.enum(['exact_match', 'broader_than_code', 'narrower_than_code', 'related']),
    note: z.string().min(1).max(800),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type DiagnosisClassificationBinding = z.infer<typeof DiagnosisClassificationBindingSchema>;

export const DiagnosisDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    description: z.string().min(1).max(600),
    medicalReviewStatus: MedicalReviewStatusSchema,
    baseClinicalTagIds: z.array(StableIdSchema),
    baseRules: z.array(DiagnosisRecommendationRuleSchema),
    severityAxis: z
      .object({
        id: StableIdSchema,
        label: z.string().min(1).max(180),
        levels: z.array(DiagnosisSeverityLevelSchema).min(2),
      })
      .strict()
      .nullable(),
    specifiers: z.array(DiagnosisSpecifierSchema),
    comorbidityRelationships: z.array(DiagnosisComorbidityRelationshipSchema),
    complexityContributions: z.array(ComplexityContributionSchema),
    classificationBindings: z.array(DiagnosisClassificationBindingSchema).default([]),
    sourceUseNotes: z.array(EvidenceContributionSchema),
  })
  .strict();
export type DiagnosisDefinition = z.infer<typeof DiagnosisDefinitionSchema>;

export const OptionalComorbidDiagnosisSchema = z
  .object({
    id: StableIdSchema,
    diagnosisId: StableIdSchema,
    gameInclusionProbability: z.number().min(0).max(1),
    allowedSeverityIds: z.array(StableIdSchema),
    allowedSpecifierIds: z.array(StableIdSchema),
    role: z.literal('contributing'),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type OptionalComorbidDiagnosis = z.infer<typeof OptionalComorbidDiagnosisSchema>;

export const PatientDiagnosisCompositionSchema = z
  .object({
    optionalComorbidities: z.array(OptionalComorbidDiagnosisSchema).max(12),
    maximumActiveDiagnoses: z.number().int().min(1).max(12),
    conflictPolicy: z.literal('quarantine'),
  })
  .strict();
export type PatientDiagnosisComposition = z.infer<typeof PatientDiagnosisCompositionSchema>;

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
    type: z.literal('fictionalName'),
    firstNamePoolId: StableIdSchema,
    lastNamePoolId: StableIdSchema,
    middleInitialProbability: z.number().min(0).max(1).default(0.25),
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

export const PatientContextFindingBindingSchema = z
  .object({
    actionId: StableIdSchema,
    findingId: StableIdSchema,
    outcome: z.enum(['present', 'absent']),
  })
  .strict();
export type PatientContextFindingBinding = z.infer<typeof PatientContextFindingBindingSchema>;

export const PatientClinicalContextOptionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    /** A game-generation weight, never an epidemiologic prevalence claim. */
    gameSelectionWeight: z.number().positive(),
    addedClinicalTagIds: z.array(StableIdSchema),
    findingBindings: z.array(PatientContextFindingBindingSchema).min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type PatientClinicalContextOption = z.infer<typeof PatientClinicalContextOptionSchema>;

/**
 * A reviewed, gameplay-critical axis such as sleep pattern or body-habitus
 * category. Exactly one option is resolved per dimension, saved in the case
 * instance, materialized into short structured findings, and made available to
 * fit rules through its tags.
 */
export const PatientClinicalContextDimensionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    options: z.array(PatientClinicalContextOptionSchema).min(2).max(20),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type PatientClinicalContextDimension = z.infer<typeof PatientClinicalContextDimensionSchema>;

export const ResolvedPatientClinicalContextSchema = z
  .object({
    dimensionId: StableIdSchema,
    optionId: StableIdSchema,
    addedClinicalTagIds: z.array(StableIdSchema),
    findingBindings: z.array(PatientContextFindingBindingSchema),
  })
  .strict();
export type ResolvedPatientClinicalContext = z.infer<typeof ResolvedPatientClinicalContextSchema>;

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
    patientPool: PatientPoolSchema.default('starter'),
    minimumLifetimePoints: z.number().int().nonnegative(),
    tags: z.array(z.string().min(1)),
    compatibleLocationIds: z.array(StableIdSchema).min(1),
    sourceDocumentIds: z.array(StableIdSchema),
    evidenceSourceIds: z.array(StableIdSchema).default([]),
  })
  .strict();
export type CaseMetadata = z.infer<typeof CaseMetadataSchema>;

export const PatientDiagnosisSchema = z
  .object({
    id: StableIdSchema,
    role: PatientDiagnosisRoleSchema,
    tagIds: z.array(StableIdSchema),
    severityId: StableIdSchema.nullable().default(null),
    specifierIds: z.array(StableIdSchema).default([]),
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

export const SourceUseNoteSchema = EvidenceContributionSchema;

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

export const MedicationRegimenEntrySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    medicationId: StableIdSchema,
    status: z.enum(['active', 'prescribed_not_taking', 'self_discontinued']),
    adherence: z.enum(['consistent', 'intermittent', 'not_taking', 'unknown']),
    prescribedForDiagnosisId: StableIdSchema.nullable(),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    knownAtOpening: z.boolean(),
  })
  .strict();
export type MedicationRegimenEntry = z.infer<typeof MedicationRegimenEntrySchema>;

export const MedicationTrialRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    medicationId: StableIdSchema,
    adequacy: z.enum(['adequate', 'inadequate', 'unclear']),
    adherence: z.enum(['consistent', 'inconsistent', 'unknown']),
    response: z.enum(['remission', 'partial', 'none', 'worsened', 'unknown']),
    tolerability: z.enum(['tolerated', 'limited', 'stopped_adverse_effect', 'unknown']),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    summary: z.string().min(1).max(240),
  })
  .strict();
export type MedicationTrialRecord = z.infer<typeof MedicationTrialRecordSchema>;

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
    medicationRegimen: z.array(MedicationRegimenEntrySchema).default([]),
    priorMedicationTrials: z.array(MedicationTrialRecordSchema).default([]),
    diagnosisComposition: PatientDiagnosisCompositionSchema.nullable().default(null),
    clinicalContextDimensions: z.array(PatientClinicalContextDimensionSchema).max(20).default([]),
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

export const ReviewCaseSourceUseSchema = z
  .object({
    id: StableIdSchema,
    evidenceSourceIds: z.array(StableIdSchema).min(1),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    contribution: z.string().min(1).max(800),
    targetRuleIds: z.array(StableIdSchema).min(1),
  })
  .strict();
export type ReviewCaseSourceUse = z.infer<typeof ReviewCaseSourceUseSchema>;

export const ReviewDecisionPolicySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    workupObjectives: z.array(WorkupObjectiveSchema).min(1),
    availableTreatments: AvailableTreatmentsSchema,
    treatmentGrades: z.array(TreatmentGradeDefinitionSchema).min(1),
    treatmentPathways: z.array(TreatmentPathwaySchema).min(1),
    scoreRules: z.array(ScoreRuleSchema),
    databasePlanWorkupCost: z.number().int().positive(),
    databasePlanCarePoints: z.number().int(),
    baseReimbursement: z.number().int().nonnegative(),
    complexityBonus: z.number().int().nonnegative(),
    referenceSolutions: z.array(ReferenceSolutionSchema).min(4),
    primaryAuthoredPathwayId: StableIdSchema,
    safetyFallbackPathwayIds: z.array(StableIdSchema),
    sourceUses: z.array(ReviewCaseSourceUseSchema),
  })
  .strict();
export type ReviewDecisionPolicy = z.infer<typeof ReviewDecisionPolicySchema>;

/**
 * A compact, authoring-focused patient snapshot. It compiles into the existing
 * executable CaseBlueprint and never enters the encounter engine directly.
 */
export const ReviewCaseScenarioSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    internalTitle: z.string().min(1).max(180),
    difficultyTier: z.number().int().min(1),
    patientPool: PatientPoolSchema,
    tags: z.array(z.string().min(1)),
    compatibleLocationIds: z.array(StableIdSchema).min(1),
    categoryIds: z.array(StableIdSchema).min(1),
    diagnoses: z.array(PatientDiagnosisSchema).min(1),
    clinicalTagIds: z.array(StableIdSchema),
    criticalFacts: z.record(z.union([z.string(), z.number(), z.boolean()])),
    ageRange: z
      .object({
        minimum: z.number().int().min(18).max(100),
        maximum: z.number().int().min(18).max(100),
      })
      .strict()
      .refine((range) => range.minimum <= range.maximum, {
        message: 'Review-case age minimum must not exceed its maximum.',
      }),
    chiefComplaintChoices: z.array(z.string().min(1).max(120)).min(10),
    durationChoices: z.array(z.string().min(1).max(80)).min(2).max(20),
    bothersomeness: z.enum(['not_at_all', 'somewhat', 'very', 'extremely']).nullable(),
    settingText: z.string().min(1).max(180),
    knownHistory: z.array(z.string().min(1).max(180)),
    medicationRegimen: z.array(MedicationRegimenEntrySchema),
    priorMedicationTrials: z.array(MedicationTrialRecordSchema),
    informationOverrides: z.array(CaseInformationActionBlueprintSchema),
    decisionPolicyId: StableIdSchema,
  })
  .strict();
export type ReviewCaseScenario = z.infer<typeof ReviewCaseScenarioSchema>;

export const CaseInstanceSchema = CaseCoreSchema.extend({
  schemaVersion: SchemaVersionSchema,
  contentVersion: ContentVersionSchema,
  id: StableIdSchema,
  blueprintId: StableIdSchema,
  seed: z.string().min(1),
  resolvedVariants: z.record(z.union([z.string(), z.number()])),
  resolvedClinicalContext: z.array(ResolvedPatientClinicalContextSchema).default([]),
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
    evidenceAttributions: z
      .array(
        z
          .object({
            sourceUseNoteId: StableIdSchema.nullable(),
            authority: EvidenceAuthoritySchema,
            evidenceSourceId: StableIdSchema.nullable(),
            citation: z.string().min(1).nullable(),
            url: z.string().url().nullable(),
            contribution: z.string().min(1).max(800),
          })
          .strict(),
      )
      .default([]),
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

export const DeveloperAttemptReviewOptionSchema = z
  .object({
    kind: z.enum([
      'information',
      'start_medication',
      'stop_medication',
      'continue_medication',
      'nonmedication',
      'disposition',
    ]),
    optionId: StableIdSchema,
    label: z.string().min(1),
    category: z.string().min(1).nullable(),
    description: z.string().min(1).nullable(),
    serviceId: StableIdSchema.nullable(),
    fulfillmentMethodId: StableIdSchema.nullable(),
    fulfillmentLabel: z.string().min(1).nullable(),
    pointCost: z.number().int().nonnegative().nullable(),
    selected: z.boolean(),
  })
  .strict()
  .superRefine((option, context) => {
    const fulfillmentFields = [
      option.serviceId,
      option.fulfillmentMethodId,
      option.fulfillmentLabel,
      option.pointCost,
    ];
    if (option.kind === 'information' && fulfillmentFields.some((value) => value === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'An information-option snapshot requires its service, fulfillment, and point cost.',
      });
    }
    if (option.kind !== 'information' && fulfillmentFields.some((value) => value !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Treatment-option snapshots cannot contain information-service fulfillment data.',
      });
    }
  });
export type DeveloperAttemptReviewOption = z.infer<typeof DeveloperAttemptReviewOptionSchema>;

export const DeveloperAttemptReviewSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    attemptId: StableIdSchema,
    caseId: StableIdSchema,
    blueprintId: StableIdSchema,
    caseContentVersion: ContentVersionSchema,
    seed: z.string().min(1),
    engineVersion: z.string().min(1),
    encounterMode: z.literal('developer'),
    reviewerNote: z.string().min(1).max(8000),
    availableOptions: z.array(DeveloperAttemptReviewOptionSchema).min(1),
    attemptSnapshot: CompletedAttemptSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((review, context) => {
    const attempt = review.attemptSnapshot;
    const matchingFields: ReadonlyArray<
      [
        keyof Pick<
          typeof review,
          'attemptId' | 'caseId' | 'blueprintId' | 'caseContentVersion' | 'seed'
        >,
        string,
      ]
    > = [
      ['attemptId', attempt.id],
      ['caseId', attempt.caseId],
      ['blueprintId', attempt.blueprintId],
      ['caseContentVersion', attempt.caseContentVersion],
      ['seed', attempt.seed],
    ];
    for (const [field, expected] of matchingFields) {
      if (review[field] !== expected) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `Developer review ${field} must match its immutable attempt snapshot.`,
        });
      }
    }

    const expectedOptions = new Map<string, boolean>();
    const selections = attempt.submittedTreatment;
    const addExpected = (kind: DeveloperAttemptReviewOption['kind'], ids: readonly string[]) => {
      for (const id of ids) expectedOptions.set(`${kind}:${id}`, true);
    };
    for (const action of attempt.caseInstance.informationActions) {
      expectedOptions.set(
        `information:${action.actionId}`,
        attempt.purchases.some((purchase) => purchase.actionId === action.actionId),
      );
    }
    addExpected('start_medication', selections.startMedicationIds);
    addExpected('stop_medication', selections.stopMedicationIds);
    addExpected('continue_medication', selections.continueMedicationIds);
    addExpected('nonmedication', selections.interventionIds);
    if (selections.dispositionId) addExpected('disposition', [selections.dispositionId]);

    const available = attempt.caseInstance.availableTreatments;
    const expectedKeys = new Set<string>([
      ...attempt.caseInstance.informationActions.map((action) => `information:${action.actionId}`),
      ...available.startMedicationIds.map((id) => `start_medication:${id}`),
      ...available.stopMedicationIds.map((id) => `stop_medication:${id}`),
      ...available.continueMedicationIds.map((id) => `continue_medication:${id}`),
      ...available.interventionIds.map((id) => `nonmedication:${id}`),
      ...available.dispositionIds.map((id) => `disposition:${id}`),
    ]);
    const seen = new Set<string>();
    for (const [index, option] of review.availableOptions.entries()) {
      const key = `${option.kind}:${option.optionId}`;
      if (!expectedKeys.has(key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availableOptions', index],
          message: 'Developer review contains an option that was not available for this attempt.',
        });
      }
      if (seen.has(key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availableOptions', index],
          message: 'Developer review option snapshots must be unique by kind and ID.',
        });
      }
      seen.add(key);
      const shouldBeSelected = expectedOptions.get(key) ?? false;
      if (option.selected !== shouldBeSelected) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availableOptions', index, 'selected'],
          message: 'Developer review selection state must match the submitted attempt.',
        });
      }
    }
    for (const key of expectedKeys) {
      if (!seen.has(key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availableOptions'],
          message: `Developer review is missing the available option ${key}.`,
        });
      }
    }
  });
export type DeveloperAttemptReview = z.infer<typeof DeveloperAttemptReviewSchema>;

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
      'needs_additional_source',
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
      'source_gap',
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
    reviewerNotes: z.string().max(8000).default(''),
    reviewerNotesUpdatedAt: z.string().datetime().nullable().default(null),
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

export const SourceRequestStatusSchema = z.enum(['needs_source', 'source_received', 'resolved']);
export type SourceRequestStatus = z.infer<typeof SourceRequestStatusSchema>;

/**
 * Developer-side evidence gap. These records identify a clinical question that
 * needs primary or authoritative source material; they never change a rule by
 * themselves and are not included in the production runtime.
 */
export const SourceRequestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    title: z.string().min(1).max(180),
    question: z.string().min(1).max(1600),
    whyNeeded: z.string().min(1).max(1600),
    targetContentIds: z.array(StableIdSchema).min(1),
    linkedTicketIds: z.array(StableIdSchema).min(1),
    preferredSourceTypes: z.array(FormalEvidenceSourceTypeSchema).min(1),
    acceptanceCriteria: z.array(z.string().min(1).max(500)).min(1),
    destination: z
      .object({
        provider: z.literal('google_drive'),
        folderLabel: z.literal('PsychSim documents'),
      })
      .strict(),
    existingEvidenceSourceIds: z.array(StableIdSchema),
    receivedEvidenceSourceIds: z.array(StableIdSchema),
    sourceDocumentIds: z.array(StableIdSchema),
    sourceChunkIds: z.array(StableIdSchema),
    sourceUseNoteIds: z.array(StableIdSchema),
    status: SourceRequestStatusSchema,
    resolutionNote: z.string().min(1).max(2000).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((request, context) => {
    const hasReceivedSource =
      request.receivedEvidenceSourceIds.length > 0 ||
      request.sourceDocumentIds.length > 0 ||
      request.sourceChunkIds.length > 0;
    if (request.status === 'source_received' && !hasReceivedSource) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'A received source request must link evidence or a local source document.',
      });
    }
    if (request.status === 'resolved' && (!hasReceivedSource || !request.resolutionNote)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolutionNote'],
        message: 'A resolved source request requires linked evidence and a resolution note.',
      });
    }
    if (request.sourceChunkIds.length > 0 && request.sourceDocumentIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceDocumentIds'],
        message: 'Chunk-level source provenance requires a source document.',
      });
    }
  });
export type SourceRequest = z.infer<typeof SourceRequestSchema>;

export const ClinicalTicketExportBundleSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    exportVersion: z.literal(5),
    bundleId: StableIdSchema,
    buildKind: z.enum(['local_developer', 'portable_reviewer']),
    assignmentId: StableIdSchema.nullable(),
    exportedAt: z.string().datetime(),
    engineVersion: z.string().min(1),
    profileId: StableIdSchema,
    tickets: z.array(ClinicalReviewTicketSchema),
    attemptReviews: z.array(DeveloperAttemptReviewSchema),
    flags: z.array(ContentFlagSchema),
    completedAttempts: z.array(CompletedAttemptSchema),
  })
  .strict()
  .superRefine((bundle, context) => {
    if (bundle.buildKind === 'portable_reviewer' && bundle.assignmentId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['assignmentId'],
        message: 'A portable Reviewer export must identify its finite assignment.',
      });
    }
    const completedAttemptIds = new Set(bundle.completedAttempts.map((attempt) => attempt.id));
    for (const [index, review] of bundle.attemptReviews.entries()) {
      if (!completedAttemptIds.has(review.attemptId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['attemptReviews', index, 'attemptId'],
          message: 'Every attempt review must have its completed attempt in the export.',
        });
      }
    }
    for (const [index, flag] of bundle.flags.entries()) {
      if (!completedAttemptIds.has(flag.attemptId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['flags', index, 'attemptId'],
          message: 'Every content flag must have its completed attempt in the export.',
        });
      }
    }
    for (const [index, ticket] of bundle.tickets.entries()) {
      if (ticket.attemptId !== null && !completedAttemptIds.has(ticket.attemptId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tickets', index, 'attemptId'],
          message: 'Every attempt-linked ticket must have its completed attempt in the export.',
        });
      }
    }
  });
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
    saveDataVersion: z.literal(5),
    profile: PlayerProfileSchema,
    attempts: z.array(CompletedAttemptSchema),
    flags: z.array(ContentFlagSchema),
    patientQueues: PatientQueueStateSchema,
    clinicalTickets: z.array(ClinicalReviewTicketSchema),
    attemptReviews: z.array(DeveloperAttemptReviewSchema),
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
    evidenceSourceIds: z.array(StableIdSchema).default([]),
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
          authority: EvidenceAuthoritySchema,
          evidenceSourceIds: z.array(StableIdSchema),
          sourceDocumentId: StableIdSchema,
          sourceChunkIds: z.array(StableIdSchema).min(1),
          proposedImpactContentIds: z.array(StableIdSchema).default([]),
          contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
          summary: z.string().min(20).max(800),
        })
        .strict()
        .superRefine((sourceUse, context) => {
          if (
            sourceUse.authority === 'formal_publication' &&
            sourceUse.evidenceSourceIds.length === 0
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['evidenceSourceIds'],
              message: 'Formal source use requires at least one evidence-catalog ID.',
            });
          }
          if (sourceUse.authority === 'expert_opinion' && sourceUse.evidenceSourceIds.length > 0) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['evidenceSourceIds'],
              message: 'Expert opinion cannot cite a formal evidence-catalog ID.',
            });
          }
        }),
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
    targetFacilityId: StableIdSchema.optional(),
    satisfactionPoints: z.number().nonnegative().optional(),
    displaySlotType: z.string().min(1).optional(),
    visualToken: StableIdSchema.optional(),
  })
  .strict();
export type UpgradeDefinition = z.infer<typeof UpgradeDefinitionSchema>;

export const DecorDefinitionSchema = UpgradeDefinitionSchema.extend({
  kind: z.literal('decor'),
  satisfactionPoints: z.number().nonnegative(),
  displaySlotType: z.string().min(1),
  visualToken: StableIdSchema,
}).strict();
export type DecorDefinition = z.infer<typeof DecorDefinitionSchema>;

export const SatisfactionConfigurationSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    curve: z.literal('rational_half_saturation'),
    halfSaturationPoints: z.number().positive(),
    multiplierCap: z.number().min(1).max(2),
  })
  .strict();
export type SatisfactionConfiguration = z.infer<typeof SatisfactionConfigurationSchema>;

export const DecorCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    satisfaction: SatisfactionConfigurationSchema,
    items: z.array(DecorDefinitionSchema),
  })
  .strict();
export type DecorCatalog = z.infer<typeof DecorCatalogSchema>;

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

export const SaveDataVersionSchema = z.literal(5);
export type SaveDataVersion = z.infer<typeof SaveDataVersionSchema>;
