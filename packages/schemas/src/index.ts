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

export const ClinicalConcernLevelSchema = z.enum(['minor', 'moderate', 'major', 'critical']);
export type ClinicalConcernLevel = z.infer<typeof ClinicalConcernLevelSchema>;

export const ClinicalCertaintyLevelSchema = z.enum(['tentative', 'moderate', 'strong']);
export type ClinicalCertaintyLevel = z.infer<typeof ClinicalCertaintyLevelSchema>;

const RuleCombinationSourceShape = {
  effectId: StableIdSchema.nullable().default(null),
  issueId: StableIdSchema.nullable().default(null),
  specificityPriority: z.number().int().nonnegative().default(0),
};

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
    allowedContributionTypes: z.array(EvidenceContributionTypeSchema).default([]),
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
    if (
      decision.permissions.derivedClinicalContent &&
      decision.allowedContributionTypes.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedContributionTypes'],
        message:
          'A source-use decision that permits derived clinical content must name its allowed contribution types.',
      });
    }
    if (
      !decision.permissions.derivedClinicalContent &&
      decision.allowedContributionTypes.length > 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedContributionTypes'],
        message:
          'A source-use decision cannot allow contribution types when derived clinical content is disabled.',
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
    requiredStaffUpgradeId: StableIdSchema.optional(),
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
    searchAliases: z.array(z.string().min(1).max(180)).default([]),
    classes: z.array(z.string().min(1)).min(1),
    tags: z.array(z.string().min(1)),
    sourceUseNotes: z.array(EvidenceContributionSchema).default([]),
    fitModifiers: z.array(
      z
        .object({
          id: StableIdSchema,
          ...RuleCombinationSourceShape,
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
          ...RuleCombinationSourceShape,
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

export const MedicationIdentityDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    normalizedIngredientName: z.string().min(1).max(180),
    aliases: z.array(z.string().min(1).max(180)),
    authoringStatus: z.enum(['identity_only', 'runtime_compatibility']),
    runtimeMedicationDefinitionId: StableIdSchema.nullable(),
    rxnorm: z
      .object({
        rxcui: z.string().regex(/^\d+$/),
        termType: z.literal('IN'),
        suppress: z.literal('N'),
        releaseDate: z.string().date(),
        evidenceSourceId: StableIdSchema,
        sourceUseDecisionId: StableIdSchema,
        verifiedAt: z.string().datetime(),
      })
      .strict(),
    medicalReviewStatus: z.literal('unreviewed'),
  })
  .strict()
  .superRefine((identity, context) => {
    if (
      (identity.authoringStatus === 'runtime_compatibility' &&
        identity.runtimeMedicationDefinitionId !== identity.id) ||
      (identity.authoringStatus === 'identity_only' &&
        identity.runtimeMedicationDefinitionId !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['runtimeMedicationDefinitionId'],
        message:
          'A runtime-compatible medication identity must link its same-ID compatibility record; identity-only records cannot.',
      });
    }
    const normalizedAliases = identity.aliases.map((alias) =>
      alias.normalize('NFKC').toLocaleLowerCase('en-US'),
    );
    if (
      new Set(normalizedAliases).size !== normalizedAliases.length ||
      normalizedAliases.includes(
        identity.normalizedIngredientName.normalize('NFKC').toLocaleLowerCase('en-US'),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['aliases'],
        message: 'Medication identity aliases must be unique and differ from the normalized name.',
      });
    }
  });
export type MedicationIdentityDefinition = z.infer<typeof MedicationIdentityDefinitionSchema>;

export const SupplementIdentityDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    normalizedName: z.string().min(1).max(180),
    aliases: z.array(z.string().min(1).max(180)),
    identityCategory: z.enum([
      'botanical',
      'mineral',
      'vitamin',
      'amino_acid_derivative',
      'fatty_acid',
      'other',
    ]),
    preparation: z.enum([
      'whole_botanical',
      'extract',
      'essential_oil',
      'element',
      'compound',
      'mixed_product',
    ]),
    identifiers: z
      .array(
        z
          .object({
            system: z.enum(['mesh', 'rxnorm', 'unii', 'cas']),
            value: z.string().min(1).max(80),
            relationship: z.enum(['exact', 'broader_botanical', 'preparation_specific']),
            sourceRelease: z.string().min(1).max(80),
            evidenceSourceId: StableIdSchema,
            sourceUseDecisionId: StableIdSchema,
            verifiedAt: z.string().datetime(),
          })
          .strict(),
      )
      .min(1),
    identityScopeNote: z.string().min(1).max(600),
    runtimeSelectable: z.literal(false),
    medicalReviewStatus: z.literal('unreviewed'),
  })
  .strict()
  .superRefine((identity, context) => {
    const normalizedTerms = [identity.normalizedName, ...identity.aliases].map((term) =>
      term.normalize('NFKC').toLocaleLowerCase('en-US'),
    );
    if (new Set(normalizedTerms).size !== normalizedTerms.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['aliases'],
        message: 'Supplement identity names and aliases must be unique.',
      });
    }
    const identifierKeys = identity.identifiers.map(
      (identifier) => `${identifier.system}:${identifier.value}`,
    );
    if (new Set(identifierKeys).size !== identifierKeys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identifiers'],
        message: 'Supplement identifiers must be unique by system and value.',
      });
    }
  });
export type SupplementIdentityDefinition = z.infer<typeof SupplementIdentityDefinitionSchema>;

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
    searchAliases: z.array(z.string().min(1).max(180)).default([]),
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
    fulfillmentServiceId: StableIdSchema.nullable().default(null),
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

export const StructuredTestResultContractSchema = z.union([
  z
    .object({
      kind: z.literal('numeric_panel'),
      componentPolicy: z.enum(['fixed', 'patient_defined']),
      componentDefinitionIds: z.array(StableIdSchema),
    })
    .strict()
    .superRefine((contract, context) => {
      if ((contract.componentPolicy === 'fixed') !== contract.componentDefinitionIds.length > 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['componentDefinitionIds'],
          message:
            'A fixed numeric panel requires components; a patient-defined panel defers them.',
        });
      }
      if (
        new Set(contract.componentDefinitionIds).size !== contract.componentDefinitionIds.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['componentDefinitionIds'],
          message: 'Numeric test-result component IDs must be unique.',
        });
      }
    }),
  z
    .object({
      kind: z.literal('categorical_panel'),
      componentPolicy: z.enum(['fixed', 'patient_defined']),
      componentDefinitionIds: z.array(StableIdSchema),
    })
    .strict()
    .superRefine((contract, context) => {
      if ((contract.componentPolicy === 'fixed') !== contract.componentDefinitionIds.length > 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['componentDefinitionIds'],
          message:
            'A fixed categorical panel requires components; a patient-defined panel defers them.',
        });
      }
      if (
        new Set(contract.componentDefinitionIds).size !== contract.componentDefinitionIds.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['componentDefinitionIds'],
          message: 'Categorical test-result component IDs must be unique.',
        });
      }
    }),
  z
    .object({
      kind: z.literal('binary'),
      allowedOutcomes: z.array(z.enum(['positive', 'negative', 'indeterminate'])).min(2),
    })
    .strict()
    .superRefine((contract, context) => {
      if (new Set(contract.allowedOutcomes).size !== contract.allowedOutcomes.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['allowedOutcomes'],
          message: 'Binary test-result outcomes must be unique.',
        });
      }
    }),
  z
    .object({
      kind: z.literal('structured_findings'),
      resultDomain: z.enum(['imaging', 'electrical_study']),
      findingPolicy: z.literal('patient_defined'),
    })
    .strict(),
]);
export type StructuredTestResultContract = z.infer<typeof StructuredTestResultContractSchema>;

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
    resultContract: StructuredTestResultContractSchema,
    generator: TestGeneratorSchema,
  })
  .strict()
  .superRefine((definition, context) => {
    if (
      definition.generator.type === 'numeric_panel' &&
      (definition.resultContract.kind !== 'numeric_panel' ||
        definition.resultContract.componentPolicy !== 'fixed')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resultContract'],
        message: 'A generated numeric panel requires a fixed numeric result contract.',
      });
      return;
    }
    if (
      definition.generator.type === 'numeric_panel' &&
      definition.resultContract.kind === 'numeric_panel'
    ) {
      const generatorComponentIds = [
        ...new Set(
          definition.generator.profiles.flatMap((profile) =>
            profile.components.map((component) => component.id),
          ),
        ),
      ].sort();
      const contractComponentIds = [...definition.resultContract.componentDefinitionIds].sort();
      if (JSON.stringify(generatorComponentIds) !== JSON.stringify(contractComponentIds)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resultContract', 'componentDefinitionIds'],
          message:
            'A numeric result contract must exactly match the generated component definitions.',
        });
      }
    }
  });
export type TestDefinition = z.infer<typeof TestDefinitionSchema>;

export const StructuredTestReferenceIntervalSchema = z
  .object({
    low: z.number().finite().optional(),
    high: z.number().finite().optional(),
    unit: z.string().trim().min(1).max(40),
    ucumCode: z.string().trim().min(1).max(40),
    display: z.string().trim().min(1).max(120),
    populationDefinitionId: StableIdSchema,
    sourceUseNoteIds: z.array(StableIdSchema),
  })
  .strict()
  .refine((interval) => interval.low !== undefined || interval.high !== undefined, {
    message: 'A structured test reference interval requires at least one bound.',
  })
  .refine(
    (interval) =>
      interval.low === undefined || interval.high === undefined || interval.low <= interval.high,
    { message: 'Reference interval low bound must not exceed its high bound.' },
  );
export type StructuredTestReferenceInterval = z.infer<typeof StructuredTestReferenceIntervalSchema>;

export const NumericStructuredTestResultComponentSchema = z
  .object({
    componentDefinitionId: StableIdSchema,
    value: z.number().finite(),
    displayValue: z.string().trim().min(1).max(80),
    unit: z.string().trim().min(1).max(40),
    ucumCode: z.string().trim().min(1).max(40),
    referenceInterval: StructuredTestReferenceIntervalSchema,
    interpretation: z.enum(['normal', 'high', 'low']),
  })
  .strict();
export type NumericStructuredTestResultComponent = z.infer<
  typeof NumericStructuredTestResultComponentSchema
>;

export const CategoricalStructuredTestResultComponentSchema = z
  .object({
    componentDefinitionId: StableIdSchema,
    valueId: StableIdSchema,
    displayValue: z.string().trim().min(1).max(160),
    interpretationIds: z.array(StableIdSchema),
  })
  .strict()
  .superRefine((component, context) => {
    if (new Set(component.interpretationIds).size !== component.interpretationIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interpretationIds'],
        message: 'Categorical test-result interpretation IDs must be unique.',
      });
    }
  });
export type CategoricalStructuredTestResultComponent = z.infer<
  typeof CategoricalStructuredTestResultComponentSchema
>;

const StructuredTestResultCommonShape = {
  schemaVersion: SchemaVersionSchema,
  id: StableIdSchema,
  testDefinitionId: StableIdSchema,
  testDefinitionContentVersion: ContentVersionSchema,
  sourceInstanceId: StableIdSchema,
  timeScopeId: StableIdSchema,
  resolution: z.lazy(() => PatientStateResolutionTraceSchema),
};

export const StructuredTestResultSchema = z.discriminatedUnion('kind', [
  z
    .object({
      ...StructuredTestResultCommonShape,
      kind: z.literal('numeric_panel'),
      components: z.array(NumericStructuredTestResultComponentSchema).min(1),
    })
    .strict(),
  z
    .object({
      ...StructuredTestResultCommonShape,
      kind: z.literal('categorical_panel'),
      components: z.array(CategoricalStructuredTestResultComponentSchema).min(1),
    })
    .strict(),
  z
    .object({
      ...StructuredTestResultCommonShape,
      kind: z.literal('binary'),
      outcome: z.enum(['positive', 'negative', 'indeterminate']),
      displayValue: z.string().trim().min(1).max(120),
      interpretationIds: z.array(StableIdSchema),
    })
    .strict(),
  z
    .object({
      ...StructuredTestResultCommonShape,
      kind: z.literal('structured_findings'),
      resultDomain: z.enum(['imaging', 'electrical_study']),
      findings: z
        .array(
          z
            .object({
              findingId: StableIdSchema,
              outcome: z.enum([
                'present',
                'absent',
                'normal',
                'high',
                'low',
                'positive',
                'negative',
                'indeterminate',
              ]),
              displayValue: z.string().trim().min(1).max(180),
            })
            .strict(),
        )
        .min(1),
      overallInterpretationId: StableIdSchema.nullable(),
    })
    .strict(),
]);
export type StructuredTestResult = z.infer<typeof StructuredTestResultSchema>;

export const StructuredTestResultEnvelopeSchema = z
  .object({
    definition: TestDefinitionSchema,
    result: StructuredTestResultSchema,
  })
  .strict()
  .superRefine((envelope, context) => {
    if (
      envelope.result.testDefinitionId !== envelope.definition.id ||
      envelope.result.testDefinitionContentVersion !== envelope.definition.contentVersion
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['result', 'testDefinitionId'],
        message: 'A structured test result must reference the supplied test definition version.',
      });
    }
    if (envelope.result.kind !== envelope.definition.resultContract.kind) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['result', 'kind'],
        message: 'A structured test result must use its definition result kind.',
      });
      return;
    }
    const contract = envelope.definition.resultContract;
    if (envelope.result.kind === 'numeric_panel' && contract.kind === 'numeric_panel') {
      const actualIds = envelope.result.components
        .map((component) => component.componentDefinitionId)
        .sort();
      if (new Set(actualIds).size !== actualIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['result', 'components'],
          message: 'Numeric structured-result component IDs must be unique.',
        });
      }
      if (
        contract.componentPolicy === 'fixed' &&
        JSON.stringify(actualIds) !== JSON.stringify([...contract.componentDefinitionIds].sort())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['result', 'components'],
          message: 'A fixed numeric result must contain every contracted component exactly once.',
        });
      }
    }
    if (envelope.result.kind === 'categorical_panel' && contract.kind === 'categorical_panel') {
      const actualIds = envelope.result.components
        .map((component) => component.componentDefinitionId)
        .sort();
      if (new Set(actualIds).size !== actualIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['result', 'components'],
          message: 'Categorical structured-result component IDs must be unique.',
        });
      }
      if (
        contract.componentPolicy === 'fixed' &&
        JSON.stringify(actualIds) !== JSON.stringify([...contract.componentDefinitionIds].sort())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['result', 'components'],
          message:
            'A fixed categorical result must contain every contracted component exactly once.',
        });
      }
    }
    if (
      envelope.result.kind === 'binary' &&
      contract.kind === 'binary' &&
      !contract.allowedOutcomes.includes(envelope.result.outcome)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['result', 'outcome'],
        message: 'A binary result outcome must be allowed by its definition.',
      });
    }
    if (
      envelope.result.kind === 'structured_findings' &&
      contract.kind === 'structured_findings' &&
      envelope.result.resultDomain !== contract.resultDomain
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['result', 'resultDomain'],
        message: 'A structured finding result must use its definition domain.',
      });
    }
  });
export type StructuredTestResultEnvelope = z.infer<typeof StructuredTestResultEnvelopeSchema>;

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

export const NonMedicationReactionTriggerDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    category: z.enum(['environmental', 'food', 'latex', 'other']),
  })
  .strict();
export type NonMedicationReactionTriggerDefinition = z.infer<
  typeof NonMedicationReactionTriggerDefinitionSchema
>;

export const ReactionManifestationDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
  })
  .strict();
export type ReactionManifestationDefinition = z.infer<typeof ReactionManifestationDefinitionSchema>;

export const MedicationReactionSelectionPolicySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    recordedAs: z
      .array(z.enum(['allergy', 'intolerance', 'adverse_reaction', 'unspecified']))
      .min(1),
    reportedSeverities: z.array(z.enum(['mild', 'moderate', 'severe', 'unknown'])).min(1),
    pointDelta: z.number().int().max(-1),
    classification: z.enum(['weak', 'harmful']),
    safetyCritical: z.boolean(),
    carePointCap: z.number().int().nullable(),
    concernLevel: ClinicalConcernLevelSchema,
    certaintyLevel: ClinicalCertaintyLevelSchema,
    explanation: z.string().min(1).max(800),
    developerOpinionId: StableIdSchema,
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type MedicationReactionSelectionPolicy = z.infer<
  typeof MedicationReactionSelectionPolicySchema
>;

export const ReactionConceptCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    nonMedicationTriggers: z.array(NonMedicationReactionTriggerDefinitionSchema),
    manifestations: z.array(ReactionManifestationDefinitionSchema),
    medicationSelectionPolicies: z.array(MedicationReactionSelectionPolicySchema).default([]),
  })
  .strict()
  .superRefine((catalog, context) => {
    const ids = catalog.medicationSelectionPolicies.map((policy) => policy.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['medicationSelectionPolicies'],
        message: 'Medication-reaction selection policy IDs must be unique.',
      });
    }
    const coveredPairs = new Set<string>();
    catalog.medicationSelectionPolicies.forEach((policy, policyIndex) => {
      for (const recordedAs of policy.recordedAs) {
        for (const severity of policy.reportedSeverities) {
          const key = `${recordedAs}:${severity}`;
          if (coveredPairs.has(key)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['medicationSelectionPolicies', policyIndex],
              message: `Medication-reaction policies overlap for ${key}.`,
            });
          }
          coveredPairs.add(key);
        }
      }
    });
  });
export type ReactionConceptCatalog = z.infer<typeof ReactionConceptCatalogSchema>;

export const CatalogBundleSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    evidenceSources: z.array(EvidenceSourceDefinitionSchema),
    diagnoses: z.array(z.lazy(() => DiagnosisDefinitionSchema)),
    findings: z.array(z.lazy(() => FindingDefinitionSchema)),
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
    reactionConcepts: ReactionConceptCatalogSchema,
    upgrades: z.array(z.lazy(() => UpgradeDefinitionSchema)),
    decor: z.lazy(() => DecorCatalogSchema),
  })
  .strict();
export type CatalogBundle = z.infer<typeof CatalogBundleSchema>;

export const PublicClinicalCatalogCategoryIdSchema = z.enum([
  'conditions',
  'medications',
  'supplements',
  'interventions',
  'dispositions',
  'investigations',
  'tests',
  'references',
]);
export type PublicClinicalCatalogCategoryId = z.infer<typeof PublicClinicalCatalogCategoryIdSchema>;

const PublicClinicalCatalogEntryBaseSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(600),
    logicalPath: z.string().min(1).max(800),
    contentVersion: ContentVersionSchema.nullable(),
    medicalReviewStatus: MedicalReviewStatusSchema.nullable(),
  })
  .strict();

export const PublicClinicalCatalogConditionEntrySchema =
  PublicClinicalCatalogEntryBaseSchema.extend({
    kind: z.literal('condition'),
    categoryId: z.literal('conditions'),
    description: z.string().min(1).max(600),
    aliases: z.array(z.string().min(1).max(180)).default([]),
    severityLevels: z.array(
      z
        .object({
          id: StableIdSchema,
          label: z.string().min(1).max(180),
        })
        .strict(),
    ),
    specifierLabels: z.array(z.string().min(1).max(180)),
  }).strict();

export const PublicClinicalCatalogMedicationEntrySchema =
  PublicClinicalCatalogEntryBaseSchema.extend({
    kind: z.literal('medication'),
    categoryId: z.literal('medications'),
    normalizedIngredientName: z.string().min(1).max(180),
    aliases: z.array(z.string().min(1).max(180)),
    authoringStatus: z.enum(['identity_only', 'runtime_compatibility']),
    rxnormRxcui: z.string().regex(/^\d+$/),
    identityEvidenceSourceId: StableIdSchema,
    identityReleaseDate: z.string().date(),
    identityAttribution: z.string().min(1).max(800),
    identityScopeNotice: z.string().min(1).max(800),
    classes: z.array(z.string().min(1).max(180)),
  }).strict();

export const PublicClinicalCatalogSupplementEntrySchema =
  PublicClinicalCatalogEntryBaseSchema.extend({
    kind: z.literal('supplement'),
    categoryId: z.literal('supplements'),
    normalizedName: z.string().min(1).max(180),
    aliases: z.array(z.string().min(1).max(180)),
    identityCategory: z.enum([
      'botanical',
      'mineral',
      'vitamin',
      'amino_acid_derivative',
      'fatty_acid',
      'other',
    ]),
    preparation: z.enum([
      'whole_botanical',
      'extract',
      'essential_oil',
      'element',
      'compound',
      'mixed_product',
    ]),
    identifiers: z.array(
      z
        .object({
          system: z.enum(['mesh', 'rxnorm', 'unii', 'cas']),
          value: z.string().min(1).max(80),
          relationship: z.enum(['exact', 'broader_botanical', 'preparation_specific']),
          sourceRelease: z.string().min(1).max(80),
        })
        .strict(),
    ),
    identityScopeNote: z.string().min(1).max(600),
    identityAttribution: z.string().min(1).max(800),
  }).strict();
export type PublicClinicalCatalogSupplementEntry = z.infer<
  typeof PublicClinicalCatalogSupplementEntrySchema
>;

export const PublicClinicalCatalogTreatmentEntrySchema =
  PublicClinicalCatalogEntryBaseSchema.extend({
    kind: z.enum(['intervention', 'disposition']),
    categoryId: z.enum(['interventions', 'dispositions']),
    treatmentCategory: z.enum([
      'psychotherapy',
      'behavioral',
      'education',
      'coping',
      'sleep',
      'disposition',
    ]),
    aliases: z.array(z.string().min(1).max(180)).default([]),
    requiredCapabilityCount: z.number().int().nonnegative(),
  })
    .strict()
    .superRefine((entry, context) => {
      if (
        (entry.kind === 'intervention' && entry.categoryId !== 'interventions') ||
        (entry.kind === 'disposition' && entry.categoryId !== 'dispositions')
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categoryId'],
          message: 'Treatment entry kind and public category must agree.',
        });
      }
    });

export const PublicClinicalCatalogInvestigationEntrySchema =
  PublicClinicalCatalogEntryBaseSchema.extend({
    kind: z.literal('investigation'),
    categoryId: z.literal('investigations'),
    description: z.string().min(1).max(600),
    aliases: z.array(z.string().min(1).max(180)).default([]),
    investigationCategory: z.enum(['history', 'physical', 'labs', 'imaging']),
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
    repeatable: z.boolean(),
  }).strict();

export const PublicClinicalCatalogTestEntrySchema = PublicClinicalCatalogEntryBaseSchema.extend({
  kind: z.literal('test'),
  categoryId: z.literal('tests'),
  testCategory: z.enum(['laboratory', 'diagnostic_study']),
  generatorKind: z.enum(['numeric_panel', 'patient_owned']),
  relatedActionId: StableIdSchema,
  componentCount: z.number().int().nonnegative(),
  components: z.array(
    z
      .object({
        id: StableIdSchema,
        label: z.string().min(1).max(180),
        unit: z.string().min(1).max(80),
      })
      .strict(),
  ),
})
  .strict()
  .superRefine((entry, context) => {
    if (entry.componentCount !== entry.components.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['componentCount'],
        message: 'Public test component count must equal its component summaries.',
      });
    }
  });

export const PublicClinicalCatalogReferenceEntrySchema =
  PublicClinicalCatalogEntryBaseSchema.extend({
    kind: z.literal('reference'),
    categoryId: z.literal('references'),
    sourceType: FormalEvidenceSourceTypeSchema,
    authors: z.array(z.string().min(1).max(160)),
    organization: z.string().min(1).max(240).nullable(),
    publicationDate: PartialPublicationDateSchema,
    versionLabel: z.string().min(1).max(240).nullable(),
    containerTitle: z.string().min(1).max(300).nullable(),
    doi: z
      .string()
      .regex(/^10\.\d{4,9}\/\S+$/i)
      .nullable(),
    pmid: z.string().regex(/^\d+$/).nullable(),
    citation: z.string().min(1).max(1200),
    url: z
      .string()
      .url()
      .refine((value) => /^https:\/\//i.test(value), 'Public source URLs must use HTTPS.'),
    bibliographicStatus: z.enum(['unreviewed', 'verified']),
    jurisdictions: z.array(z.string().min(1).max(160)),
    populations: z.array(z.string().min(1).max(240)),
    settings: z.array(z.string().min(1).max(240)),
    sourceRelations: z.array(
      z
        .object({
          sourceId: StableIdSchema,
          relationType: EvidenceSourceRelationTypeSchema,
        })
        .strict(),
    ),
  }).strict();

export const PublicClinicalCatalogEntrySchema = z.union([
  PublicClinicalCatalogConditionEntrySchema,
  PublicClinicalCatalogMedicationEntrySchema,
  PublicClinicalCatalogSupplementEntrySchema,
  PublicClinicalCatalogTreatmentEntrySchema,
  PublicClinicalCatalogInvestigationEntrySchema,
  PublicClinicalCatalogTestEntrySchema,
  PublicClinicalCatalogReferenceEntrySchema,
]);
export type PublicClinicalCatalogEntry = z.infer<typeof PublicClinicalCatalogEntrySchema>;

export const PublicClinicalCatalogProjectionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    projectionVersion: z.literal(1),
    catalogContentVersion: ContentVersionSchema,
    totalEntryCount: z.number().int().nonnegative(),
    categories: z.array(
      z
        .object({
          id: PublicClinicalCatalogCategoryIdSchema,
          label: z.string().min(1).max(120),
          description: z.string().min(1).max(600),
          entryCount: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    entries: z.array(PublicClinicalCatalogEntrySchema),
  })
  .strict()
  .superRefine((projection, context) => {
    const expectedCategoryIds = PublicClinicalCatalogCategoryIdSchema.options;
    const seenCategoryIds = new Set<PublicClinicalCatalogCategoryId>();
    projection.categories.forEach((category, index) => {
      if (seenCategoryIds.has(category.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categories', index, 'id'],
          message: `Public catalog category ${category.id} is duplicated.`,
        });
      }
      seenCategoryIds.add(category.id);
    });
    for (const expectedCategoryId of expectedCategoryIds) {
      if (!seenCategoryIds.has(expectedCategoryId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categories'],
          message: `Public catalog category ${expectedCategoryId} is missing.`,
        });
      }
    }

    if (projection.totalEntryCount !== projection.entries.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalEntryCount'],
        message: 'Public catalog total must equal its projected entry count.',
      });
    }
    projection.categories.forEach((category, index) => {
      const actualCount = projection.entries.filter(
        (entry) => entry.categoryId === category.id,
      ).length;
      if (category.entryCount !== actualCount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categories', index, 'entryCount'],
          message: `Public catalog category ${category.id} has an incorrect count.`,
        });
      }
    });

    const seenEntryIds = new Set<string>();
    const seenLogicalPaths = new Set<string>();
    projection.entries.forEach((entry, index) => {
      if (seenEntryIds.has(entry.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index, 'id'],
          message: `Public catalog entry ${entry.id} is duplicated.`,
        });
      }
      seenEntryIds.add(entry.id);

      const expectedLogicalPath = `catalogs.${entry.categoryId}.${entry.id}`;
      if (entry.logicalPath !== expectedLogicalPath) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index, 'logicalPath'],
          message: `Public catalog entry ${entry.id} has an invalid logical path.`,
        });
      }
      if (seenLogicalPaths.has(entry.logicalPath)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index, 'logicalPath'],
          message: `Public catalog logical path ${entry.logicalPath} is duplicated.`,
        });
      }
      seenLogicalPaths.add(entry.logicalPath);

      if (entry.kind === 'test') {
        const componentIds = new Set<string>();
        entry.components.forEach((component, componentIndex) => {
          if (componentIds.has(component.id)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['entries', index, 'components', componentIndex, 'id'],
              message: `Public test component ${component.id} is duplicated.`,
            });
          }
          componentIds.add(component.id);
        });
      }
    });
  });
export type PublicClinicalCatalogProjection = z.infer<typeof PublicClinicalCatalogProjectionSchema>;

export const DatabaseEntryReviewSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    entryId: StableIdSchema,
    categoryId: PublicClinicalCatalogCategoryIdSchema,
    catalogContentVersion: ContentVersionSchema,
    projectionVersion: z.literal(1),
    entrySnapshot: PublicClinicalCatalogEntrySchema,
    reviewerNote: z.string().min(1).max(8000),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((review, context) => {
    if (
      review.entrySnapshot.id !== review.entryId ||
      review.entrySnapshot.categoryId !== review.categoryId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entrySnapshot'],
        message: 'A database review snapshot must match its entry and category IDs.',
      });
    }
    if (review.id !== `database-review.${review.entryId}`) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['id'],
        message: 'A database review ID must be derived from its catalog entry ID.',
      });
    }
    if (review.updatedAt < review.createdAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['updatedAt'],
        message: 'A database review cannot be updated before it was created.',
      });
    }
  });
export type DatabaseEntryReview = z.infer<typeof DatabaseEntryReviewSchema>;

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

export const DeveloperDiagnosisClassificationSourceUseSchema = z
  .object({
    id: StableIdSchema,
    evidenceSourceId: StableIdSchema,
    decisionStatus: z.literal('permitted_with_conditions'),
    legalBasis: z.literal('fair_use'),
    permissions: SourceUsePermissionsSchema,
    territories: z.array(z.string().min(1).max(160)).min(1),
    attributionStatement: z.string().min(1).max(1200),
    requiredNotices: z.array(z.string().min(1).max(1200)).min(1),
    nonCommercialOnly: z.literal(true),
    reviewedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((sourceUse, context) => {
    if (
      !sourceUse.permissions.bibliographicMetadata ||
      !sourceUse.permissions.localFullTextStorage ||
      !sourceUse.permissions.localTextExtraction ||
      !sourceUse.permissions.localStructuredIndexing ||
      sourceUse.permissions.aiAssistedProcessing ||
      sourceUse.permissions.derivedClinicalContent ||
      sourceUse.permissions.runtimeRedistribution ||
      sourceUse.permissions.commercialDistribution
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissions'],
        message:
          'The local classification inspector requires indexing permission and forbids AI, derived-clinical, runtime, and commercial use.',
      });
    }
  });
export type DeveloperDiagnosisClassificationSourceUse = z.infer<
  typeof DeveloperDiagnosisClassificationSourceUseSchema
>;

export const DeveloperDiagnosisClassificationProjectionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    projectionVersion: z.literal(1),
    release: DiagnosisClassificationReleaseSchema,
    catalog: DiagnosisClassificationTermsSchema,
    sourceUse: DeveloperDiagnosisClassificationSourceUseSchema,
    warnings: z.array(z.string().min(1).max(600)).min(1),
  })
  .strict()
  .superRefine((projection, context) => {
    if (
      projection.release.id !== projection.catalog.releaseId ||
      projection.release.termCount !== projection.catalog.terms.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['catalog'],
        message: 'The Developer classification catalog must match its release and term count.',
      });
    }
    if (projection.release.evidenceSourceId !== projection.sourceUse.evidenceSourceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceUse', 'evidenceSourceId'],
        message: 'The classification release and source-use decision must name the same source.',
      });
    }
  });
export type DeveloperDiagnosisClassificationProjection = z.infer<
  typeof DeveloperDiagnosisClassificationProjectionSchema
>;

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
      'reaction_concept_catalog',
      'upgrade_catalog',
      'decor_catalog',
      'diagnosis_catalog',
      'finding_catalog',
      'finding_expression_bank_catalog',
      'measurement_catalog',
      'diagnosis_classification_catalog',
      'medication_identity_catalog',
      'supplement_identity_catalog',
      'personal_knowledge_pilot_profile',
      'personal_knowledge_alias_catalog',
      'personal_knowledge_source_catalog',
      'developer_opinion_catalog',
      'source_use_decision_catalog',
      'source_request_catalog',
      'ticket_literature_scout_catalog',
      'reviewer_assignment_ticket_catalog',
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
  | { type: 'anyMedicationStarted' }
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
    z.object({ type: z.literal('anyMedicationStarted') }).strict(),
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
  | { type: 'anyMedicationStarted' }
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
      z.object({ type: z.literal('anyMedicationStarted') }).strict(),
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
    concernLevel: ClinicalConcernLevelSchema.default('moderate'),
    certaintyLevel: ClinicalCertaintyLevelSchema.default('tentative'),
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
    searchAliases: z.array(z.string().min(1).max(180)).default([]),
    selectableInGameplay: z.boolean().default(false),
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
    medicationListStatus: z
      .enum(['unreconciled', 'verified_none', 'provided'])
      .default('unreconciled'),
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
    medicationListStatus: z
      .enum(['unreconciled', 'verified_none', 'provided'])
      .default('unreconciled'),
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

export const ClinicalDurationUnitSchema = z.enum(['day', 'week', 'month', 'year']);
export type ClinicalDurationUnit = z.infer<typeof ClinicalDurationUnitSchema>;

/**
 * Canonical finding outcomes are deliberately separate from the compatibility
 * FindingOutcome schema. `subthreshold` is a resolved patient truth, while
 * unknown/unassessed and encounter reveal state remain distinct concepts.
 */
export const CanonicalFindingOutcomeSchema = z.enum([
  'present',
  'absent',
  'subthreshold',
  'normal',
  'high',
  'low',
  'positive',
  'negative',
  'not_applicable',
]);
export type CanonicalFindingOutcome = z.infer<typeof CanonicalFindingOutcomeSchema>;

export const FindingSemanticKindSchema = z.enum([
  'symptom',
  'history',
  'functional_status',
  'safety',
  'exposure',
  'treatment_history',
  'reaction',
  'mental_status_exam',
  'physical_exam',
  'context',
]);
export type FindingSemanticKind = z.infer<typeof FindingSemanticKindSchema>;

export const FindingValueSpecificationSchema = z
  .object({
    kind: z.literal('outcome'),
    allowedValues: z.array(CanonicalFindingOutcomeSchema).min(1),
  })
  .strict()
  .superRefine((specification, context) => {
    if (new Set(specification.allowedValues).size !== specification.allowedValues.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedValues'],
        message: 'Canonical finding outcomes must be unique.',
      });
    }
  });
export type FindingValueSpecification = z.infer<typeof FindingValueSpecificationSchema>;

export const FindingPresentationProjectionSchema = z.enum([
  'status',
  'value_only',
  'status_and_value',
]);
export type FindingPresentationProjection = z.infer<typeof FindingPresentationProjectionSchema>;

export const FindingDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().trim().min(1).max(120),
    aliases: z.array(z.string().trim().min(1).max(120)),
    semanticKind: FindingSemanticKindSchema,
    valueSpecification: FindingValueSpecificationSchema,
    allowedPresentationProjections: z.array(FindingPresentationProjectionSchema).min(1),
    lifecycle: ContentLifecycleSchema,
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict()
  .superRefine((definition, context) => {
    const normalizedTerms = [definition.label, ...definition.aliases].map((term) =>
      term.normalize('NFKC').trim().toLocaleLowerCase('en-US'),
    );
    if (new Set(normalizedTerms).size !== normalizedTerms.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['aliases'],
        message: 'A canonical finding label and its aliases must be distinct.',
      });
    }
    if (
      new Set(definition.allowedPresentationProjections).size !==
      definition.allowedPresentationProjections.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedPresentationProjections'],
        message: 'Canonical finding presentation projections must be unique.',
      });
    }
  });
export type FindingDefinition = z.infer<typeof FindingDefinitionSchema>;

export const FindingContributionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    ownerKind: z.enum([
      'catalog_definition',
      'patient_template',
      'patient_state',
      'condition',
      'medication',
      'test_result',
      'generation_profile',
      'clinical_context',
      'author_override',
    ]),
    ownerId: StableIdSchema,
    ownerContentVersion: ContentVersionSchema.nullable(),
    role: z.enum([
      'identity',
      'constraint',
      'authored_value',
      'generated_value',
      'override',
      'derivation',
    ]),
    provenanceIds: z.array(StableIdSchema),
  })
  .strict()
  .superRefine((contribution, context) => {
    if (new Set(contribution.provenanceIds).size !== contribution.provenanceIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['provenanceIds'],
        message: 'Canonical finding provenance IDs must be unique.',
      });
    }
    if (
      [
        'catalog_definition',
        'patient_template',
        'condition',
        'medication',
        'generation_profile',
        'clinical_context',
      ].includes(contribution.ownerKind) &&
      contribution.ownerContentVersion === null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerContentVersion'],
        message: 'A versioned canonical finding contributor requires its content version.',
      });
    }
  });
export type FindingContribution = z.infer<typeof FindingContributionSchema>;

export const ResolvedCanonicalFindingValueSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('unresolved'),
      state: z.enum(['unknown', 'unassessed']),
    })
    .strict(),
  z
    .object({
      kind: z.literal('outcome'),
      value: CanonicalFindingOutcomeSchema,
    })
    .strict(),
]);
export type ResolvedCanonicalFindingValue = z.infer<typeof ResolvedCanonicalFindingValueSchema>;

export const ResolvedCanonicalFindingSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    definitionId: StableIdSchema,
    definitionContentVersion: ContentVersionSchema,
    value: ResolvedCanonicalFindingValueSchema,
    resolution: z
      .object({
        resolverVersion: ContentVersionSchema,
        origin: z.enum(['authored', 'deterministic_generation', 'compiled']),
        uncertainty: z.enum(['none', 'reported_uncertain', 'conflicting_sources']),
        appliedContributionIds: z.array(StableIdSchema).min(1),
      })
      .strict(),
    contributions: z.array(FindingContributionSchema).min(1),
  })
  .strict()
  .superRefine((finding, context) => {
    const contributionIds = finding.contributions.map((contribution) => contribution.id);
    if (new Set(contributionIds).size !== contributionIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contributions'],
        message: 'Canonical finding contribution IDs must be unique.',
      });
    }
    if (
      new Set(finding.resolution.appliedContributionIds).size !==
      finding.resolution.appliedContributionIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolution', 'appliedContributionIds'],
        message: 'Applied canonical finding contribution IDs must be unique.',
      });
    }
    const knownContributionIds = new Set(contributionIds);
    for (const contributionId of finding.resolution.appliedContributionIds) {
      if (!knownContributionIds.has(contributionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resolution', 'appliedContributionIds'],
          message: `Applied contribution ${contributionId} is not present in the contributor trace.`,
        });
      }
    }
    const appliedContributionIds = new Set(finding.resolution.appliedContributionIds);
    if (
      !finding.contributions.some(
        (contribution) =>
          appliedContributionIds.has(contribution.id) && contribution.role !== 'identity',
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolution', 'appliedContributionIds'],
        message: 'A resolved canonical finding requires an applied value-bearing contribution.',
      });
    }
  });
export type ResolvedCanonicalFinding = z.infer<typeof ResolvedCanonicalFindingSchema>;

export const CanonicalFindingResolutionEnvelopeSchema = z
  .object({
    definition: FindingDefinitionSchema,
    resolved: ResolvedCanonicalFindingSchema,
  })
  .strict()
  .superRefine((envelope, context) => {
    if (
      envelope.resolved.definitionId !== envelope.definition.id ||
      envelope.resolved.definitionContentVersion !== envelope.definition.contentVersion
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'definitionId'],
        message: 'A resolved canonical finding must reference the supplied definition version.',
      });
    }
    if (
      envelope.resolved.value.kind === 'outcome' &&
      !envelope.definition.valueSpecification.allowedValues.includes(envelope.resolved.value.value)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'value'],
        message: 'The resolved canonical finding value is not allowed by its definition.',
      });
    }
  });
export type CanonicalFindingResolutionEnvelope = z.infer<
  typeof CanonicalFindingResolutionEnvelopeSchema
>;

/**
 * Patient-scene evidence is encounter state, not formal literature evidence.
 * These source kinds identify who or what produced one frozen claim about an
 * explicitly modeled proposition.
 */
export const PatientSceneEvidenceSourceKindSchema = z.enum([
  'patient_report',
  'collateral_report',
  'record_review',
  'clinician_observation',
  'instrument_response',
  'measurement',
  'laboratory_result',
  'diagnostic_study_result',
]);
export type PatientSceneEvidenceSourceKind = z.infer<typeof PatientSceneEvidenceSourceKindSchema>;

export const PropositionEvidenceAssertionSchema = z.enum([
  'supports',
  'opposes',
  'uncertain',
  'unable_to_assess',
]);
export type PropositionEvidenceAssertion = z.infer<typeof PropositionEvidenceAssertionSchema>;

export const PropositionEvidenceTruthRelationSchema = z.enum([
  'aligned',
  'misaligned',
  'indeterminate',
]);
export type PropositionEvidenceTruthRelation = z.infer<
  typeof PropositionEvidenceTruthRelationSchema
>;

export const PatientStateResolutionTraceSchema = z.discriminatedUnion('origin', [
  z
    .object({
      origin: z.literal('authored'),
      ownerId: StableIdSchema,
      ownerContentVersion: ContentVersionSchema,
    })
    .strict(),
  z
    .object({
      origin: z.literal('deterministic_generation'),
      generationProfileId: StableIdSchema,
      generationProfileContentVersion: ContentVersionSchema,
      resolverVersion: ContentVersionSchema,
      stableDrawId: StableIdSchema,
    })
    .strict(),
]);
export type PatientStateResolutionTrace = z.infer<typeof PatientStateResolutionTraceSchema>;

/**
 * A latent proposition is reserved for an explicitly modeled adjudicable
 * statement. Symptoms, diagnoses, measurements, and subjective experiences
 * retain their native typed owners rather than being flattened to Booleans.
 */
export const LatentPatientPropositionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    definitionId: StableIdSchema,
    definitionContentVersion: ContentVersionSchema,
    auditStatement: z.string().trim().min(1).max(500),
    truth: z.boolean(),
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict();
export type LatentPatientProposition = z.infer<typeof LatentPatientPropositionSchema>;

/**
 * This profile establishes versioned ownership and lawful assertion kinds
 * without encoding reliability probabilities or credibility scores. A later
 * reviewed schema version may add calibrated conditional branches.
 */
export const PropositionEvidenceGenerationProfileSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    sourceKind: PatientSceneEvidenceSourceKindSchema,
    timeScopeId: StableIdSchema,
    propositionDefinitionIds: z.array(StableIdSchema).min(1),
    allowedAssertions: z.array(PropositionEvidenceAssertionSchema).min(1),
    review: ClinicalRuleReviewSchema,
  })
  .strict()
  .superRefine((profile, context) => {
    if (
      new Set(profile.propositionDefinitionIds).size !== profile.propositionDefinitionIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['propositionDefinitionIds'],
        message: 'Proposition evidence profile definition IDs must be unique.',
      });
    }
    if (new Set(profile.allowedAssertions).size !== profile.allowedAssertions.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedAssertions'],
        message: 'Proposition evidence profile assertion kinds must be unique.',
      });
    }
  });
export type PropositionEvidenceGenerationProfile = z.infer<
  typeof PropositionEvidenceGenerationProfileSchema
>;

export const PatientPropositionEvidenceSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    propositionId: StableIdSchema,
    assertion: PropositionEvidenceAssertionSchema,
    relationshipToTruth: PropositionEvidenceTruthRelationSchema,
    source: z
      .object({
        kind: PatientSceneEvidenceSourceKindSchema,
        sourceInstanceId: StableIdSchema,
      })
      .strict(),
    timeScopeId: StableIdSchema,
    claimOriginId: StableIdSchema,
    dependencyGroupIds: z.array(StableIdSchema),
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((evidence, context) => {
    if (new Set(evidence.dependencyGroupIds).size !== evidence.dependencyGroupIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dependencyGroupIds'],
        message: 'Patient-scene evidence dependency-group IDs must be unique.',
      });
    }
  });
export type PatientPropositionEvidence = z.infer<typeof PatientPropositionEvidenceSchema>;

export const EvidenceDependencyGroupSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    kind: z.enum(['shared_origin', 'known_correlated']),
    basisId: StableIdSchema,
    evidenceIds: z.array(StableIdSchema).min(2),
  })
  .strict()
  .superRefine((group, context) => {
    if (new Set(group.evidenceIds).size !== group.evidenceIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceIds'],
        message: 'Evidence dependency-group members must be unique.',
      });
    }
  });
export type EvidenceDependencyGroup = z.infer<typeof EvidenceDependencyGroupSchema>;

export const BeliefAppraisalDimensionValueSchema = z
  .object({
    id: StableIdSchema,
    dimensionId: StableIdSchema,
    valueId: StableIdSchema,
    evidenceIds: z.array(StableIdSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.evidenceIds).size !== value.evidenceIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceIds'],
        message: 'Belief-appraisal dimension evidence IDs must be unique.',
      });
    }
  });
export type BeliefAppraisalDimensionValue = z.infer<typeof BeliefAppraisalDimensionValueSchema>;

export const BeliefClinicalInterpretationSchema = z
  .object({
    id: StableIdSchema,
    interpretationId: StableIdSchema,
    ruleId: StableIdSchema,
    ruleContentVersion: ContentVersionSchema,
    evidenceIds: z.array(StableIdSchema),
  })
  .strict()
  .superRefine((interpretation, context) => {
    if (new Set(interpretation.evidenceIds).size !== interpretation.evidenceIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceIds'],
        message: 'Belief-appraisal interpretation evidence IDs must be unique.',
      });
    }
  });
export type BeliefClinicalInterpretation = z.infer<typeof BeliefClinicalInterpretationSchema>;

/**
 * Belief position, appraisal dimensions, and clinical interpretations remain
 * separate from world-state truth. An empty interpretation list is valid.
 */
export const BeliefAppraisalSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    propositionId: StableIdSchema,
    subjectId: StableIdSchema,
    beliefPosition: z.enum(['unassessed', 'unknown', 'does_not_hold', 'holds']),
    dimensionValues: z.array(BeliefAppraisalDimensionValueSchema),
    clinicalInterpretations: z.array(BeliefClinicalInterpretationSchema),
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((appraisal, context) => {
    for (const [path, ids] of [
      ['dimensionValues', appraisal.dimensionValues.map((value) => value.id)],
      [
        'clinicalInterpretations',
        appraisal.clinicalInterpretations.map((interpretation) => interpretation.id),
      ],
    ] as const) {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: 'Belief-appraisal child IDs must be unique.',
        });
      }
    }
  });
export type BeliefAppraisal = z.infer<typeof BeliefAppraisalSchema>;

const expectedTruthRelation = (
  propositionTruth: boolean,
  assertion: PropositionEvidenceAssertion,
): PropositionEvidenceTruthRelation => {
  if (assertion === 'uncertain' || assertion === 'unable_to_assess') return 'indeterminate';
  if (
    (propositionTruth && assertion === 'supports') ||
    (!propositionTruth && assertion === 'opposes')
  ) {
    return 'aligned';
  }
  return 'misaligned';
};

/**
 * A narrow resolved proposition/evidence envelope. The later resolved-record
 * foundation embeds this alongside findings, conditions, measurements,
 * regimens, and history; this is not a partial compatibility PatientRecord.
 */
export const ResolvedPatientPropositionStateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    propositions: z.array(LatentPatientPropositionSchema),
    evidence: z.array(PatientPropositionEvidenceSchema),
    dependencyGroups: z.array(EvidenceDependencyGroupSchema),
    beliefAppraisals: z.array(BeliefAppraisalSchema),
  })
  .strict()
  .superRefine((state, context) => {
    const assertUniqueIds = (path: string, ids: string[]) => {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: `Resolved proposition-state ${path} IDs must be unique.`,
        });
      }
    };
    assertUniqueIds(
      'propositions',
      state.propositions.map((proposition) => proposition.id),
    );
    assertUniqueIds(
      'evidence',
      state.evidence.map((evidence) => evidence.id),
    );
    assertUniqueIds(
      'dependencyGroups',
      state.dependencyGroups.map((group) => group.id),
    );
    assertUniqueIds(
      'beliefAppraisals',
      state.beliefAppraisals.map((appraisal) => appraisal.id),
    );

    const propositionById = new Map(
      state.propositions.map((proposition) => [proposition.id, proposition]),
    );
    const evidenceById = new Map(state.evidence.map((evidence) => [evidence.id, evidence]));
    const dependencyGroupById = new Map(state.dependencyGroups.map((group) => [group.id, group]));

    for (const [evidenceIndex, evidence] of state.evidence.entries()) {
      const proposition = propositionById.get(evidence.propositionId);
      if (!proposition) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['evidence', evidenceIndex, 'propositionId'],
          message: 'Patient-scene evidence must reference an included proposition.',
        });
      } else if (
        evidence.relationshipToTruth !==
        expectedTruthRelation(proposition.truth, evidence.assertion)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['evidence', evidenceIndex, 'relationshipToTruth'],
          message: 'The saved evidence-to-truth relation does not match the proposition and claim.',
        });
      }
      for (const groupId of evidence.dependencyGroupIds) {
        const group = dependencyGroupById.get(groupId);
        if (!group) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['evidence', evidenceIndex, 'dependencyGroupIds'],
            message: `Evidence dependency group ${groupId} is not included in the state.`,
          });
        } else if (!group.evidenceIds.includes(evidence.id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['evidence', evidenceIndex, 'dependencyGroupIds'],
            message: `Evidence dependency group ${groupId} does not list this evidence record.`,
          });
        }
      }
    }

    const evidenceByPropositionAndOrigin = new Map<string, PatientPropositionEvidence[]>();
    for (const evidence of state.evidence) {
      const key = `${evidence.propositionId}\u0000${evidence.claimOriginId}`;
      const records = evidenceByPropositionAndOrigin.get(key) ?? [];
      records.push(evidence);
      evidenceByPropositionAndOrigin.set(key, records);
    }
    for (const records of evidenceByPropositionAndOrigin.values()) {
      if (records.length < 2) continue;
      if (
        new Set(records.map((record) => record.assertion)).size > 1 ||
        new Set(records.map((record) => record.timeScopeId)).size > 1
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['evidence'],
          message:
            'Evidence copied from one origin for one proposition must preserve its assertion and time scope.',
        });
      }
      const memberIds = new Set(records.map((record) => record.id));
      const sharedOriginGroup = state.dependencyGroups.find(
        (group) =>
          group.kind === 'shared_origin' &&
          records.every((record) => group.evidenceIds.includes(record.id)) &&
          group.evidenceIds.every((evidenceId) => memberIds.has(evidenceId)),
      );
      if (!sharedOriginGroup) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dependencyGroups'],
          message:
            'Repeated evidence from one origin must be represented by one exact shared-origin group.',
        });
      }
    }

    for (const [groupIndex, group] of state.dependencyGroups.entries()) {
      const members = group.evidenceIds
        .map((evidenceId) => evidenceById.get(evidenceId))
        .filter((evidence): evidence is PatientPropositionEvidence => evidence !== undefined);
      if (members.length !== group.evidenceIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dependencyGroups', groupIndex, 'evidenceIds'],
          message: 'Every dependency-group member must be included patient-scene evidence.',
        });
        continue;
      }
      if (new Set(members.map((member) => member.propositionId)).size !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dependencyGroups', groupIndex, 'evidenceIds'],
          message: 'One evidence dependency group may concern only one proposition.',
        });
      }
      for (const member of members) {
        if (!member.dependencyGroupIds.includes(group.id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dependencyGroups', groupIndex, 'evidenceIds'],
            message: 'Evidence dependency-group membership must be bidirectional.',
          });
        }
      }
      if (
        group.kind === 'shared_origin' &&
        (new Set(members.map((member) => member.claimOriginId)).size !== 1 ||
          members[0]?.claimOriginId !== group.basisId)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dependencyGroups', groupIndex, 'basisId'],
          message:
            'A shared-origin group basis must equal the one claim origin shared by all members.',
        });
      }
    }

    for (const [appraisalIndex, appraisal] of state.beliefAppraisals.entries()) {
      if (!propositionById.has(appraisal.propositionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['beliefAppraisals', appraisalIndex, 'propositionId'],
          message: 'A belief appraisal must reference an included proposition.',
        });
      }
      const referencedEvidenceIds = [
        ...appraisal.dimensionValues.flatMap((value) => value.evidenceIds),
        ...appraisal.clinicalInterpretations.flatMap(
          (interpretation) => interpretation.evidenceIds,
        ),
      ];
      for (const evidenceId of referencedEvidenceIds) {
        const evidence = evidenceById.get(evidenceId);
        if (!evidence || evidence.propositionId !== appraisal.propositionId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['beliefAppraisals', appraisalIndex],
            message:
              'Belief-appraisal evidence must exist and concern the same latent proposition.',
          });
        }
      }
    }
  });
export type ResolvedPatientPropositionState = z.infer<typeof ResolvedPatientPropositionStateSchema>;

export const FindingExpressionDisplayChannelSchema = z.enum([
  'patient_history',
  'collateral_history',
  'record_summary',
  'observation_summary',
]);
export type FindingExpressionDisplayChannel = z.infer<typeof FindingExpressionDisplayChannelSchema>;

export const FindingExpressionVariantSchema = z
  .object({
    id: StableIdSchema,
    text: z.string().trim().min(1).max(180),
  })
  .strict();
export type FindingExpressionVariant = z.infer<typeof FindingExpressionVariantSchema>;

/**
 * Expression banks own display language only. They never own finding identity,
 * aliases, diagnosis meaning, clinical mappings, or points.
 */
export const FindingExpressionBankSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().trim().min(1).max(160),
    displayChannels: z.array(FindingExpressionDisplayChannelSchema).min(1),
    variants: z.array(FindingExpressionVariantSchema).min(2).max(120),
    lifecycle: ContentLifecycleSchema,
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict()
  .superRefine((bank, context) => {
    if (new Set(bank.displayChannels).size !== bank.displayChannels.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['displayChannels'],
        message: 'Finding expression-bank display channels must be unique.',
      });
    }
    if (new Set(bank.variants.map((variant) => variant.id)).size !== bank.variants.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['variants'],
        message: 'Finding expression-bank variant IDs must be unique.',
      });
    }
    const normalizedText = bank.variants.map((variant) =>
      variant.text.normalize('NFKC').trim().toLocaleLowerCase('en-US'),
    );
    if (new Set(normalizedText).size !== normalizedText.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['variants'],
        message: 'Finding expression-bank variant text must be unique within one bank.',
      });
    }
  });
export type FindingExpressionBank = z.infer<typeof FindingExpressionBankSchema>;

export const FindingExpressionBankCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    banks: z.array(FindingExpressionBankSchema).min(1),
  })
  .strict()
  .superRefine((catalog, context) => {
    if (new Set(catalog.banks.map((bank) => bank.id)).size !== catalog.banks.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['banks'],
        message: 'Finding expression-bank catalog IDs must be unique.',
      });
    }
  });
export type FindingExpressionBankCatalog = z.infer<typeof FindingExpressionBankCatalogSchema>;

export const FindingProjectionSourceStateSchema = z.union([
  CanonicalFindingOutcomeSchema,
  z.enum(['unknown', 'unassessed']),
]);
export type FindingProjectionSourceState = z.infer<typeof FindingProjectionSourceStateSchema>;

export const FindingProjectionSourceBindingSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('canonical_finding'),
      findingDefinitionId: StableIdSchema,
      allowedStates: z.array(FindingProjectionSourceStateSchema).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal('proposition_evidence'),
      propositionDefinitionId: StableIdSchema,
      allowedAssertions: z.array(PropositionEvidenceAssertionSchema).min(1),
    })
    .strict(),
]);
export type FindingProjectionSourceBinding = z.infer<typeof FindingProjectionSourceBindingSchema>;

export const FindingProjectionTargetSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('information_action'),
      actionId: StableIdSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('instrument_item'),
      instrumentDefinitionId: StableIdSchema,
      instrumentContentVersion: ContentVersionSchema,
      itemId: StableIdSchema,
    })
    .strict(),
]);
export type FindingProjectionTarget = z.infer<typeof FindingProjectionTargetSchema>;

export const FindingProjectionResponseValueSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('finding_outcome'),
      outcome: CanonicalFindingOutcomeSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('response_option'),
      responseOptionId: StableIdSchema,
    })
    .strict(),
]);
export type FindingProjectionResponseValue = z.infer<typeof FindingProjectionResponseValueSchema>;

/**
 * The mapping is explicit and many-to-many. Neither aliases nor phrase
 * similarity can create a source binding.
 */
export const FindingRevealProjectionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    sourceMatch: z.enum(['all', 'any']),
    sourceBindings: z.array(FindingProjectionSourceBindingSchema).min(1),
    target: FindingProjectionTargetSchema,
    response: FindingProjectionResponseValueSchema,
    expressionBankId: StableIdSchema.nullable(),
    review: ClinicalRuleReviewSchema,
  })
  .strict()
  .superRefine((projection, context) => {
    const bindingKeys = projection.sourceBindings.map((binding) =>
      binding.kind === 'canonical_finding'
        ? `finding:${binding.findingDefinitionId}`
        : `proposition:${binding.propositionDefinitionId}`,
    );
    if (new Set(bindingKeys).size !== bindingKeys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceBindings'],
        message: 'A reveal projection may bind each source definition only once.',
      });
    }
    for (const [index, binding] of projection.sourceBindings.entries()) {
      const values =
        binding.kind === 'canonical_finding' ? binding.allowedStates : binding.allowedAssertions;
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sourceBindings', index],
          message: 'Projection source states or assertions must be unique.',
        });
      }
    }
  });
export type FindingRevealProjection = z.infer<typeof FindingRevealProjectionSchema>;

export const ResolvedFindingProjectionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    projectionId: StableIdSchema,
    projectionContentVersion: ContentVersionSchema,
    target: FindingProjectionTargetSchema,
    response: FindingProjectionResponseValueSchema,
    selectedExpression: z
      .object({
        bankId: StableIdSchema,
        bankContentVersion: ContentVersionSchema,
        variantId: StableIdSchema,
      })
      .strict()
      .nullable(),
    contributingResolvedFindingIds: z.array(StableIdSchema),
    propositionIds: z.array(StableIdSchema),
    evidenceIds: z.array(StableIdSchema),
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((projection, context) => {
    const groups = [
      ['contributingResolvedFindingIds', projection.contributingResolvedFindingIds],
      ['propositionIds', projection.propositionIds],
      ['evidenceIds', projection.evidenceIds],
    ] as const;
    for (const [path, ids] of groups) {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: 'Resolved projection contributor IDs must be unique.',
        });
      }
    }
    if (groups.every(([, ids]) => ids.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A resolved finding projection requires at least one explicit source record.',
      });
    }
  });
export type ResolvedFindingProjection = z.infer<typeof ResolvedFindingProjectionSchema>;

export const InstrumentItemResponseSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    instrumentDefinitionId: StableIdSchema,
    instrumentContentVersion: ContentVersionSchema,
    itemId: StableIdSchema,
    responseScaleId: StableIdSchema,
    responseOptionId: StableIdSchema,
    timeScopeId: StableIdSchema,
    respondentSourceKind: z.enum(['patient_report', 'collateral_report', 'clinician_observation']),
    rightsBoundaryId: StableIdSchema,
    interpretationIds: z.array(StableIdSchema),
    contributingResolvedFindingIds: z.array(StableIdSchema),
    propositionIds: z.array(StableIdSchema),
    evidenceIds: z.array(StableIdSchema),
    projectionId: StableIdSchema,
    projectionContentVersion: ContentVersionSchema,
  })
  .strict()
  .superRefine((response, context) => {
    for (const [path, ids] of [
      ['interpretationIds', response.interpretationIds],
      ['contributingResolvedFindingIds', response.contributingResolvedFindingIds],
      ['propositionIds', response.propositionIds],
      ['evidenceIds', response.evidenceIds],
    ] as const) {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: 'Instrument response references must be unique.',
        });
      }
    }
    if (
      response.contributingResolvedFindingIds.length === 0 &&
      response.propositionIds.length === 0 &&
      response.evidenceIds.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An instrument response requires at least one explicit source record.',
      });
    }
  });
export type InstrumentItemResponse = z.infer<typeof InstrumentItemResponseSchema>;

export const FindingProjectionResolutionEnvelopeSchema = z
  .object({
    projection: FindingRevealProjectionSchema,
    resolved: ResolvedFindingProjectionSchema,
    expressionBank: FindingExpressionBankSchema.nullable(),
  })
  .strict()
  .superRefine((envelope, context) => {
    if (
      envelope.resolved.projectionId !== envelope.projection.id ||
      envelope.resolved.projectionContentVersion !== envelope.projection.contentVersion
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'projectionId'],
        message: 'A resolved projection must reference the supplied projection version.',
      });
    }
    if (JSON.stringify(envelope.resolved.target) !== JSON.stringify(envelope.projection.target)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'target'],
        message: 'A resolved projection target must match its definition.',
      });
    }
    if (
      JSON.stringify(envelope.resolved.response) !== JSON.stringify(envelope.projection.response)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'response'],
        message: 'A resolved projection response must match its definition.',
      });
    }
    if (envelope.projection.expressionBankId === null) {
      if (envelope.expressionBank || envelope.resolved.selectedExpression) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expressionBank'],
          message: 'A projection without a wording bank cannot select expression text.',
        });
      }
      return;
    }
    if (
      !envelope.expressionBank ||
      envelope.expressionBank.id !== envelope.projection.expressionBankId ||
      !envelope.resolved.selectedExpression ||
      envelope.resolved.selectedExpression.bankId !== envelope.expressionBank.id ||
      envelope.resolved.selectedExpression.bankContentVersion !==
        envelope.expressionBank.contentVersion ||
      !envelope.expressionBank.variants.some(
        (variant) => variant.id === envelope.resolved.selectedExpression?.variantId,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expressionBank'],
        message:
          'A wording projection must resolve one variant from its exact expression-bank version.',
      });
    }
  });
export type FindingProjectionResolutionEnvelope = z.infer<
  typeof FindingProjectionResolutionEnvelopeSchema
>;

export const MeasurementDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().trim().min(1).max(160),
    domain: z.enum(['vital_sign', 'anthropometric', 'physical_exam_measurement']),
    unit: z
      .object({
        display: z.string().trim().min(1).max(40),
        ucumCode: z.string().trim().min(1).max(40),
        displayPrecision: z.number().int().min(0).max(6),
      })
      .strict(),
    availableThroughActionIds: z.array(StableIdSchema),
    allowedContextDimensionIds: z.array(StableIdSchema),
    lifecycle: ContentLifecycleSchema,
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict()
  .superRefine((definition, context) => {
    for (const [path, ids] of [
      ['availableThroughActionIds', definition.availableThroughActionIds],
      ['allowedContextDimensionIds', definition.allowedContextDimensionIds],
    ] as const) {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: 'Measurement definition references must be unique.',
        });
      }
    }
  });
export type MeasurementDefinition = z.infer<typeof MeasurementDefinitionSchema>;

export const CategoricalObservationDefinitionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().trim().min(1).max(160),
    domain: z.enum(['mental_status_exam', 'physical_exam']),
    allowedValueIds: z.array(StableIdSchema).min(1),
    availableThroughActionIds: z.array(StableIdSchema).min(1),
    lifecycle: ContentLifecycleSchema,
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict()
  .superRefine((definition, context) => {
    if (new Set(definition.allowedValueIds).size !== definition.allowedValueIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedValueIds'],
        message: 'Categorical observation values must be unique.',
      });
    }
    if (
      new Set(definition.availableThroughActionIds).size !==
      definition.availableThroughActionIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['availableThroughActionIds'],
        message: 'Categorical observation action IDs must be unique.',
      });
    }
  });
export type CategoricalObservationDefinition = z.infer<
  typeof CategoricalObservationDefinitionSchema
>;

export const MeasurementContextValueSchema = z
  .object({
    dimensionId: StableIdSchema,
    valueId: StableIdSchema,
  })
  .strict();
export type MeasurementContextValue = z.infer<typeof MeasurementContextValueSchema>;

export const MeasurementInterpretationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('not_interpreted') }).strict(),
  z
    .object({
      kind: z.literal('interpreted'),
      interpretationId: StableIdSchema,
      referenceDefinitionId: StableIdSchema.nullable(),
    })
    .strict(),
]);
export type MeasurementInterpretation = z.infer<typeof MeasurementInterpretationSchema>;

export const ResolvedMeasurementSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    definitionId: StableIdSchema,
    definitionContentVersion: ContentVersionSchema,
    value: z.number().finite(),
    displayValue: z.string().trim().min(1).max(80),
    unit: z
      .object({
        display: z.string().trim().min(1).max(40),
        ucumCode: z.string().trim().min(1).max(40),
      })
      .strict(),
    contextValues: z.array(MeasurementContextValueSchema),
    timeScopeId: StableIdSchema,
    sourceInstanceId: StableIdSchema,
    interpretation: MeasurementInterpretationSchema,
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((measurement, context) => {
    const dimensionIds = measurement.contextValues.map((value) => value.dimensionId);
    if (new Set(dimensionIds).size !== dimensionIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contextValues'],
        message: 'A resolved measurement may specify each context dimension only once.',
      });
    }
  });
export type ResolvedMeasurement = z.infer<typeof ResolvedMeasurementSchema>;

export const ResolvedCategoricalObservationSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    definitionId: StableIdSchema,
    definitionContentVersion: ContentVersionSchema,
    valueId: StableIdSchema,
    displayValue: z.string().trim().min(1).max(180),
    timeScopeId: StableIdSchema,
    sourceInstanceId: StableIdSchema,
    interpretationIds: z.array(StableIdSchema),
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((observation, context) => {
    if (new Set(observation.interpretationIds).size !== observation.interpretationIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interpretationIds'],
        message: 'Categorical observation interpretation IDs must be unique.',
      });
    }
  });
export type ResolvedCategoricalObservation = z.infer<typeof ResolvedCategoricalObservationSchema>;

export const MeasurementCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    measurements: z.array(MeasurementDefinitionSchema).min(1),
    categoricalObservations: z.array(CategoricalObservationDefinitionSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    const allIds = [
      ...catalog.measurements.map((definition) => definition.id),
      ...catalog.categoricalObservations.map((definition) => definition.id),
    ];
    if (new Set(allIds).size !== allIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Measurement and observation definition IDs must be unique across the catalog.',
      });
    }
  });
export type MeasurementCatalog = z.infer<typeof MeasurementCatalogSchema>;

export const MeasurementResolutionEnvelopeSchema = z
  .object({
    definition: MeasurementDefinitionSchema,
    resolved: ResolvedMeasurementSchema,
  })
  .strict()
  .superRefine((envelope, context) => {
    if (
      envelope.resolved.definitionId !== envelope.definition.id ||
      envelope.resolved.definitionContentVersion !== envelope.definition.contentVersion
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'definitionId'],
        message: 'A resolved measurement must reference the supplied definition version.',
      });
    }
    if (
      envelope.resolved.unit.display !== envelope.definition.unit.display ||
      envelope.resolved.unit.ucumCode !== envelope.definition.unit.ucumCode
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'unit'],
        message: 'A resolved measurement must use its definition unit.',
      });
    }
    const allowedDimensions = new Set(envelope.definition.allowedContextDimensionIds);
    for (const [index, value] of envelope.resolved.contextValues.entries()) {
      if (!allowedDimensions.has(value.dimensionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resolved', 'contextValues', index, 'dimensionId'],
          message: 'A resolved measurement uses a context dimension not allowed by its definition.',
        });
      }
    }
  });
export type MeasurementResolutionEnvelope = z.infer<typeof MeasurementResolutionEnvelopeSchema>;

export const CategoricalObservationResolutionEnvelopeSchema = z
  .object({
    definition: CategoricalObservationDefinitionSchema,
    resolved: ResolvedCategoricalObservationSchema,
  })
  .strict()
  .superRefine((envelope, context) => {
    if (
      envelope.resolved.definitionId !== envelope.definition.id ||
      envelope.resolved.definitionContentVersion !== envelope.definition.contentVersion
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'definitionId'],
        message: 'A resolved observation must reference the supplied definition version.',
      });
    }
    if (!envelope.definition.allowedValueIds.includes(envelope.resolved.valueId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolved', 'valueId'],
        message: 'A resolved observation value must be allowed by its definition.',
      });
    }
  });
export type CategoricalObservationResolutionEnvelope = z.infer<
  typeof CategoricalObservationResolutionEnvelopeSchema
>;

export const ClinicalDurationOptionSchema = z
  .object({
    id: StableIdSchema,
    value: z.number().int().positive(),
    unit: ClinicalDurationUnitSchema,
    displayValueVariants: z.array(z.string().min(1).max(48)).min(1).max(12),
  })
  .strict();
export type ClinicalDurationOption = z.infer<typeof ClinicalDurationOptionSchema>;

export const ClinicalDurationProfileSchema = z
  .object({
    id: StableIdSchema,
    relatedDiagnosisId: StableIdSchema.nullable(),
    interpretation: z.enum(['supports_authored_state', 'designed_below_threshold', 'context_only']),
    criterionId: StableIdSchema.nullable(),
    options: z.array(ClinicalDurationOptionSchema).min(2).max(24),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict()
  .superRefine((profile, context) => {
    if (new Set(profile.options.map((option) => option.id)).size !== profile.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Clinical duration option IDs must be unique within a profile.',
      });
    }
    if (profile.interpretation === 'designed_below_threshold' && !profile.criterionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A below-threshold duration profile must name the reviewed criterion it misses.',
      });
    }
    if (profile.interpretation !== 'designed_below_threshold' && profile.criterionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only a designed-below-threshold duration profile may name a criterion.',
      });
    }
  });
export type ClinicalDurationProfile = z.infer<typeof ClinicalDurationProfileSchema>;

export const FindingBlueprintSchema = z
  .object({
    id: StableIdSchema,
    groupLabel: z.string().min(1).max(80).optional(),
    labelVariants: z.array(z.string().min(1).max(80)).min(1).max(12),
    outcome: z.union([FindingOutcomeSchema, z.literal('variable')]),
    outcomeDisplay: z.enum(['status', 'value_only']).optional(),
    valueTextVariants: z.array(z.string().min(1).max(120)).max(12).optional(),
    durationProfile: ClinicalDurationProfileSchema.optional(),
  })
  .strict()
  .superRefine((finding, context) => {
    if (
      finding.outcomeDisplay === 'value_only' &&
      !['present', 'normal'].includes(finding.outcome)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcomeDisplay'],
        message: 'Value-only findings may use only present or normal outcomes.',
      });
    }
    if (finding.outcomeDisplay === 'value_only' && !finding.valueTextVariants?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valueTextVariants'],
        message: 'A value-only finding requires visible value text.',
      });
    }
    if (!finding.durationProfile) return;
    if (finding.outcome !== 'present') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A structured duration finding must have a present outcome.',
      });
    }
    if (
      !finding.valueTextVariants?.length ||
      finding.valueTextVariants.some((template) => !template.includes('{{duration}}'))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A structured duration finding requires value text templates with {{duration}}.',
      });
    }
  });
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
    groupLabel: z.string().min(1).max(80).optional(),
    label: z.string().min(1).max(120),
    outcome: FindingOutcomeSchema,
    outcomeDisplay: z.enum(['status', 'value_only']).optional(),
    valueText: z.string().min(1).max(240).optional(),
    numericMeasurement: ResolvedNumericMeasurementSchema.optional(),
    durationMeasurement: z
      .object({
        profileId: StableIdSchema,
        optionId: StableIdSchema,
        value: z.number().int().positive(),
        unit: ClinicalDurationUnitSchema,
        relatedDiagnosisId: StableIdSchema.nullable(),
        interpretation: z.enum([
          'supports_authored_state',
          'designed_below_threshold',
          'context_only',
        ]),
        criterionId: StableIdSchema.nullable(),
      })
      .strict()
      .optional(),
    origin: z.enum(['authored', 'generated_normal', 'generated_incidental']),
  })
  .strict()
  .superRefine((finding, context) => {
    if (
      finding.outcomeDisplay === 'value_only' &&
      !['present', 'normal'].includes(finding.outcome)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcomeDisplay'],
        message: 'Value-only resolved findings may use only present or normal outcomes.',
      });
    }
    if (finding.outcomeDisplay === 'value_only' && !finding.valueText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valueText'],
        message: 'A value-only resolved finding requires visible value text.',
      });
    }
  });
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
    searchAliases: z.array(z.string().min(1).max(180)).default([]),
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
    ...RuleCombinationSourceShape,
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

/**
 * The diagnosis a player locks in is an answer, not patient truth and not a
 * treatment. Keeping this value separate prevents a submitted label from
 * changing treatment-fit, workup, or safety evaluation.
 */
export const PlayerDiagnosisSelectionSchema = z
  .object({
    diagnosisId: StableIdSchema,
    severityId: StableIdSchema.nullable().default(null),
    specifierIds: z.array(StableIdSchema).default([]),
  })
  .strict()
  .superRefine((selection, context) => {
    if (new Set(selection.specifierIds).size !== selection.specifierIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specifierIds'],
        message: 'A diagnosis selection cannot repeat a specifier.',
      });
    }
  });
export type PlayerDiagnosisSelection = z.infer<typeof PlayerDiagnosisSelectionSchema>;

export const PlayerDiagnosisSelectionsSchema = z
  .array(PlayerDiagnosisSelectionSchema)
  .superRefine((selections, context) => {
    const seen = new Set<string>();
    selections.forEach((selection, index) => {
      if (seen.has(selection.diagnosisId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'diagnosisId'],
          message: 'A final answer can contain a diagnosis family only once.',
        });
      }
      seen.add(selection.diagnosisId);
    });
  });
export type PlayerDiagnosisSelections = z.infer<typeof PlayerDiagnosisSelectionsSchema>;

export const DiagnosisSelectionMatchSchema = z
  .object({
    diagnosisId: StableIdSchema,
    qualifierMode: z.enum(['family', 'contains_qualifiers', 'exact']).default('family'),
    severityId: StableIdSchema.nullable().default(null),
    specifierIds: z.array(StableIdSchema).default([]),
  })
  .strict()
  .superRefine((match, context) => {
    if (new Set(match.specifierIds).size !== match.specifierIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specifierIds'],
        message: 'A diagnosis-match pattern cannot repeat a specifier.',
      });
    }
    if (
      match.qualifierMode === 'family' &&
      (match.severityId !== null || match.specifierIds.length > 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A family-level diagnosis match cannot declare qualifiers.',
      });
    }
    if (
      match.qualifierMode === 'contains_qualifiers' &&
      match.severityId === null &&
      match.specifierIds.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A qualifier match must declare a severity or at least one specifier.',
      });
    }
  });
export type DiagnosisSelectionMatch = z.infer<typeof DiagnosisSelectionMatchSchema>;

const diagnosisSelectionMatchesPattern = (
  selection: z.infer<typeof PlayerDiagnosisSelectionSchema>,
  match: z.infer<typeof DiagnosisSelectionMatchSchema>,
): boolean => {
  if (selection.diagnosisId !== match.diagnosisId) return false;
  if (match.qualifierMode === 'family') return true;
  const hasMatchingQualifiers =
    (match.severityId === null || selection.severityId === match.severityId) &&
    match.specifierIds.every((specifierId) => selection.specifierIds.includes(specifierId));
  if (match.qualifierMode === 'contains_qualifiers') return hasMatchingQualifiers;
  return (
    selection.severityId === match.severityId &&
    selection.specifierIds.length === match.specifierIds.length &&
    hasMatchingQualifiers
  );
};

export const DiagnosisAnswerOptionSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    match: DiagnosisSelectionMatchSchema,
    specificityPriority: z.number().int().nonnegative(),
    grade: z.enum(['canonical', 'reasonable_alternative', 'partial']),
    points: z.number().int().nonnegative(),
    issueId: StableIdSchema,
    explanation: z.string().min(1).max(800),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type DiagnosisAnswerOption = z.infer<typeof DiagnosisAnswerOptionSchema>;

export const DiagnosisAnswerGroupSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    canonicalSelection: PlayerDiagnosisSelectionSchema,
    options: z.array(DiagnosisAnswerOptionSchema).min(1),
    omission: z
      .object({
        id: StableIdSchema,
        label: z.string().min(1).max(180),
        points: z.number().int().max(0),
        issueId: StableIdSchema,
        explanation: z.string().min(1).max(800),
        review: UnreviewedClinicalRuleSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((group, context) => {
    const optionIds = group.options.map((option) => option.id);
    if (new Set(optionIds).size !== optionIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Diagnosis-answer option IDs must be unique within a group.',
      });
    }
    const canonicalOptions = group.options.filter((option) => option.grade === 'canonical');
    if (canonicalOptions.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'A diagnosis-answer group requires exactly one canonical option.',
      });
    }
    if (
      canonicalOptions[0] &&
      !diagnosisSelectionMatchesPattern(group.canonicalSelection, canonicalOptions[0].match)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['canonicalSelection'],
        message: 'The canonical selection must actually match the canonical answer option.',
      });
    }
  });
export type DiagnosisAnswerGroup = z.infer<typeof DiagnosisAnswerGroupSchema>;

export const DiagnosisMisclassificationRuleSchema = z
  .object({
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    match: DiagnosisSelectionMatchSchema,
    specificityPriority: z.number().int().nonnegative(),
    severity: z.enum(['minor', 'major', 'dangerous']),
    points: z.number().int().max(0),
    carePointCap: z.number().int().nullable().default(null),
    issueId: StableIdSchema,
    explanation: z.string().min(1).max(800),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type DiagnosisMisclassificationRule = z.infer<typeof DiagnosisMisclassificationRuleSchema>;

export const CaseDiagnosisRubricSchema = z
  .object({
    groups: z.array(DiagnosisAnswerGroupSchema).min(1),
    misclassificationRules: z.array(DiagnosisMisclassificationRuleSchema).default([]),
    additionalSelectionPolicy: z
      .object({
        id: StableIdSchema,
        label: z.string().min(1).max(180),
        pointsPerSelection: z.number().int().max(0),
        maximumDeduction: z.number().int().nonnegative(),
        explanation: z.string().min(1).max(800),
        review: UnreviewedClinicalRuleSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((rubric, context) => {
    const groupIds = rubric.groups.map((group) => group.id);
    if (new Set(groupIds).size !== groupIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['groups'],
        message: 'Diagnosis-answer group IDs must be unique.',
      });
    }
    const ruleIds = [
      ...rubric.groups.flatMap((group) => [
        ...group.options.map((option) => option.id),
        group.omission.id,
      ]),
      ...rubric.misclassificationRules.map((rule) => rule.id),
      rubric.additionalSelectionPolicy.id,
    ];
    if (new Set(ruleIds).size !== ruleIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Every diagnosis-answer rule ID must be unique within a case.',
      });
    }

    const acceptedDiagnosisOwners = new Map<string, string>();
    rubric.groups.forEach((group, groupIndex) => {
      group.options.forEach((option, optionIndex) => {
        const owner = acceptedDiagnosisOwners.get(option.match.diagnosisId);
        if (owner && owner !== group.id) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['groups', groupIndex, 'options', optionIndex, 'match', 'diagnosisId'],
            message:
              'One diagnosis family cannot satisfy multiple answer groups in the first rubric version.',
          });
        }
        acceptedDiagnosisOwners.set(option.match.diagnosisId, group.id);
      });
    });

    const priorityByDiagnosis = new Map<string, Set<number>>();
    const prioritized = [
      ...rubric.groups.flatMap((group) => group.options),
      ...rubric.misclassificationRules,
    ];
    prioritized.forEach((rule, index) => {
      const priorities = priorityByDiagnosis.get(rule.match.diagnosisId) ?? new Set<number>();
      if (priorities.has(rule.specificityPriority)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['misclassificationRules', index],
          message:
            'Overlapping diagnosis-answer rules for one family require distinct explicit specificity priorities.',
        });
      }
      priorities.add(rule.specificityPriority);
      priorityByDiagnosis.set(rule.match.diagnosisId, priorities);
    });

    for (const [groupIndex, group] of rubric.groups.entries()) {
      const canonicalOption = group.options.find((option) => option.grade === 'canonical');
      if (!canonicalOption) continue;
      const shadowingRule = [
        ...group.options.filter((option) => option.id !== canonicalOption.id),
        ...rubric.misclassificationRules,
      ].find(
        (rule) =>
          diagnosisSelectionMatchesPattern(group.canonicalSelection, rule.match) &&
          rule.specificityPriority > canonicalOption.specificityPriority,
      );
      if (shadowingRule) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['groups', groupIndex, 'canonicalSelection'],
          message: `The canonical answer is unreachable because ${shadowingRule.id} has a higher matching specificity priority.`,
        });
      }
    }
  });
export type CaseDiagnosisRubric = z.infer<typeof CaseDiagnosisRubricSchema>;

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
    ...RuleCombinationSourceShape,
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
    ...RuleCombinationSourceShape,
    objectiveId: StableIdSchema,
    pointsIfMet: z.number(),
    pointsIfMissing: z.number().max(0),
    safetyCritical: z.boolean(),
    explanationMet: z.string().min(1),
    explanationMissing: z.string().min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();

export const TreatmentWorkupRequirementSchema = z
  .object({
    id: StableIdSchema,
    ...RuleCombinationSourceShape,
    sourceRuleIds: z.array(StableIdSchema).min(1),
    objectiveId: StableIdSchema,
    appliesWhen: DiagnosisSelectionPredicateSchema,
    pointsIfMet: z.number().int(),
    pointsIfMissing: z.number().int().max(0),
    safetyCritical: z.boolean(),
    concernLevel: ClinicalConcernLevelSchema,
    certaintyLevel: ClinicalCertaintyLevelSchema,
    explanationMet: z.string().min(1),
    explanationMissing: z.string().min(1),
    review: UnreviewedClinicalRuleSchema,
  })
  .strict();
export type TreatmentWorkupRequirement = z.infer<typeof TreatmentWorkupRequirementSchema>;

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
  'diagnosis',
  'workup',
  'medication_selection',
  'medication_discontinuation',
  'safety',
  'nonmedication',
  'disposition',
  'efficiency',
]);
export type ScoreComponent = z.infer<typeof ScoreComponentSchema>;

export const NonDiagnosisScoreComponentSchema = z.enum([
  'workup',
  'medication_selection',
  'medication_discontinuation',
  'safety',
  'nonmedication',
  'disposition',
  'efficiency',
]);

export const TraceClassificationSchema = z.enum([
  'diagnosis_canonical',
  'diagnosis_reasonable_alternative',
  'diagnosis_partial',
  'diagnosis_omitted',
  'diagnosis_minor_mismatch',
  'diagnosis_major_mismatch',
  'diagnosis_dangerous_misclassification',
  'diagnosis_additional_selection',
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

export const NonDiagnosisTraceClassificationSchema = z.enum([
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
    ...RuleCombinationSourceShape,
    label: z.string().min(1),
    component: NonDiagnosisScoreComponentSchema,
    predicate: ScorePredicateSchema,
    pointsIfTrue: z.number(),
    pointsIfFalse: z.number(),
    classificationIfTrue: NonDiagnosisTraceClassificationSchema,
    classificationIfFalse: NonDiagnosisTraceClassificationSchema,
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
    componentPointCaps: z
      .object({
        diagnosis: z.number().int().nullable().default(null),
        workup: z.number().int().nullable(),
        medication_selection: z.number().int().nullable(),
        medication_discontinuation: z.number().int().nullable(),
        safety: z.number().int().nullable(),
        nonmedication: z.number().int().nullable(),
        disposition: z.number().int().nullable(),
        efficiency: z.number().int().nullable(),
      })
      .strict(),
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
    diagnosisSelections: PlayerDiagnosisSelectionsSchema.default([]),
    selections: TreatmentSelectionSchema,
    explanation: z.string().min(1),
  })
  .strict();
export type ReferenceSolution = z.infer<typeof ReferenceSolutionSchema>;

export const CaseMetadataSchema = z
  .object({
    title: z.string().min(1),
    debriefTitle: z.string().min(1).max(180).default('Case review'),
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
    origin: z.enum(['authored', 'generated_optional', 'derived_incidental']).default('authored'),
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

export const PatientReactionTriggerSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('medication'),
      medicationId: StableIdSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('nonmedication'),
      triggerId: StableIdSchema,
    })
    .strict(),
]);
export type PatientReactionTrigger = z.infer<typeof PatientReactionTriggerSchema>;

export const PatientReactionRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    trigger: PatientReactionTriggerSchema,
    recordedAs: z.enum(['allergy', 'intolerance', 'adverse_reaction', 'unspecified']),
    manifestationIds: z.array(StableIdSchema).min(1).max(8),
    reportedSeverity: z.enum(['mild', 'moderate', 'severe', 'unknown']),
    interpretedAs: z
      .enum(['immune_allergy', 'adverse_effect', 'intolerance', 'unclear'])
      .nullable(),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    status: z.enum(['active', 'historical']),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.interpretedAs !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interpretedAs'],
        message:
          'Reaction interpretation is disabled until rule-level review and provenance are represented.',
      });
    }
  });
export type PatientReactionRecord = z.infer<typeof PatientReactionRecordSchema>;

export const PatientReactionHistorySchema = z
  .object({
    status: z.enum(['unassessed', 'documented_none', 'entries_present']),
    medicationAssessmentStatus: z.enum(['unassessed', 'documented_none', 'entries_present']),
    records: z.array(PatientReactionRecordSchema).max(24),
  })
  .strict()
  .superRefine((history, context) => {
    if (history.status === 'entries_present' && history.records.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['records'],
        message: 'Reaction history marked entries_present requires at least one record.',
      });
    }
    if (history.status !== 'entries_present' && history.records.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['records'],
        message: 'Only entries_present reaction history may contain records.',
      });
    }
    const medicationRecordCount = history.records.filter(
      (record) => record.trigger.kind === 'medication',
    ).length;
    if (history.medicationAssessmentStatus === 'entries_present' && medicationRecordCount === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['medicationAssessmentStatus'],
        message: 'Medication reaction history marked entries_present requires a medication record.',
      });
    }
    if (history.medicationAssessmentStatus === 'documented_none' && medicationRecordCount > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['medicationAssessmentStatus'],
        message:
          'Medication reaction history marked documented_none cannot contain a medication record.',
      });
    }
    if (
      history.status === 'documented_none' &&
      history.medicationAssessmentStatus !== 'documented_none'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['medicationAssessmentStatus'],
        message:
          'A documented-none overall reaction history must also document no medication reactions.',
      });
    }
    if (new Set(history.records.map((record) => record.id)).size !== history.records.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['records'],
        message: 'Reaction record IDs must be unique within a patient.',
      });
    }
  });
export type PatientReactionHistory = z.infer<typeof PatientReactionHistorySchema>;

export const PatientOptionalFeatureModuleSchema = z
  .object({
    id: StableIdSchema,
    moduleKind: z.enum([
      'allergy_reaction',
      'prior_treatment',
      'comorbidity',
      'substance_use',
      'other',
    ]),
    moduleId: StableIdSchema,
    cost: z.number().int().min(1).max(3),
    impact: z.enum(['background', 'fit_modifier', 'companion_safety']),
    complexityContributions: z.array(ComplexityContributionSchema).min(1).max(5),
  })
  .strict();
export type PatientOptionalFeatureModule = z.infer<typeof PatientOptionalFeatureModuleSchema>;

const ComplexityRangeSchema = z
  .object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  })
  .strict()
  .refine((range) => range.min <= range.max, {
    message: 'Complexity range minimum must not exceed its maximum.',
  });

export const PatientComplexityProfileSchema = z
  .object({
    modelVersion: z.literal('additional-feature-budget.v1'),
    measurementStatus: z.enum(['legacy_unmeasured', 'budget_only', 'authored_envelope']),
    additionalFeatureBudget: z.number().int().min(0).max(6),
    maximumSelectedModules: z.number().int().min(0).max(3),
    selectedModules: z.array(PatientOptionalFeatureModuleSchema).max(3),
    targetEnvelope: z.record(ComplexityDimensionSchema, ComplexityRangeSchema).nullable(),
  })
  .strict()
  .superRefine((profile, context) => {
    const selectedIds = profile.selectedModules.map((module) => module.id);
    if (new Set(selectedIds).size !== selectedIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedModules'],
        message: 'Selected optional-feature IDs must be unique.',
      });
    }
    const selectedModuleIds = profile.selectedModules.map((module) => module.moduleId);
    if (new Set(selectedModuleIds).size !== selectedModuleIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedModules'],
        message: 'Selected optional-feature module references must be unique.',
      });
    }
    for (const [index, module] of profile.selectedModules.entries()) {
      const dimensions = module.complexityContributions.map(
        (contribution) => contribution.dimension,
      );
      if (new Set(dimensions).size !== dimensions.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['selectedModules', index, 'complexityContributions'],
          message: 'An optional feature may contribute to each complexity dimension at most once.',
        });
      }
    }
    if (profile.selectedModules.length > profile.maximumSelectedModules) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedModules'],
        message: 'Selected optional features exceed the configured module limit.',
      });
    }
    const spent = profile.selectedModules.reduce((total, module) => total + module.cost, 0);
    if (spent > profile.additionalFeatureBudget) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedModules'],
        message: 'Selected optional features exceed the additional-feature budget.',
      });
    }
    if (
      profile.measurementStatus === 'legacy_unmeasured' &&
      (profile.additionalFeatureBudget !== 0 ||
        profile.maximumSelectedModules !== 0 ||
        profile.selectedModules.length > 0 ||
        profile.targetEnvelope !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Legacy-unmeasured complexity cannot imply a zero or measured complexity plan.',
      });
    }
    if (profile.measurementStatus === 'budget_only' && profile.targetEnvelope !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetEnvelope'],
        message: 'A budget-only complexity profile cannot claim a measured target envelope.',
      });
    }
    if (profile.measurementStatus === 'authored_envelope' && profile.targetEnvelope === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetEnvelope'],
        message: 'Authored complexity requires a five-axis target envelope.',
      });
    }
  });
export type PatientComplexityProfile = z.infer<typeof PatientComplexityProfileSchema>;

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

export const ResolvedPatientDemographicsV2Schema = z
  .object({
    recordVersion: z.literal(2),
    ageYears: z.number().int().min(0).max(120),
    reviewedAgeBandId: StableIdSchema,
    sexForReference: z.enum(['female', 'male', 'intersex', 'unspecified']),
  })
  .strict();
export type ResolvedPatientDemographicsV2 = z.infer<typeof ResolvedPatientDemographicsV2Schema>;

export const MedicationRegimenEntryV2Schema = z
  .object({
    recordVersion: z.literal(2),
    id: StableIdSchema,
    medicationIdentityId: StableIdSchema,
    clinicalRole: z.enum(['psychiatric', 'nonpsychiatric', 'unknown']),
    status: z.enum(['active', 'prescribed_not_taking', 'self_discontinued']),
    adherence: z.enum(['consistent', 'intermittent', 'not_taking', 'unknown']),
    prescribedForDiagnosisId: StableIdSchema.nullable(),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    knownAtOpening: z.boolean(),
    impactClassification: z.enum([
      'neutral_background',
      'fit_relevant',
      'companion_safety',
      'case_defining',
    ]),
  })
  .strict();
export type MedicationRegimenEntryV2 = z.infer<typeof MedicationRegimenEntryV2Schema>;

export const SupplementUseEntrySchema = z
  .object({
    recordVersion: z.literal(2),
    id: StableIdSchema,
    supplementIdentityId: StableIdSchema,
    status: z.enum(['current', 'intermittent', 'recently_stopped']),
    reportedPreparation: z.string().min(1).max(120).nullable(),
    frequencyLabel: z.string().min(1).max(120).nullable(),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    knownAtOpening: z.boolean(),
    impactClassification: z.enum([
      'neutral_background',
      'fit_relevant',
      'companion_safety',
      'case_defining',
    ]),
  })
  .strict();
export type SupplementUseEntry = z.infer<typeof SupplementUseEntrySchema>;

export const PatientBackgroundExposureResolutionV2Schema = z
  .object({
    recordVersion: z.literal(2),
    generationProfileId: StableIdSchema,
    reviewedAgeBandId: StableIdSchema,
    supplementPattern: z.enum(['typical', 'enthusiast']),
    medicationRegimenEntries: z.array(MedicationRegimenEntryV2Schema),
    supplementUseEntries: z.array(SupplementUseEntrySchema),
  })
  .strict()
  .superRefine((resolution, context) => {
    const entryIds = [
      ...resolution.medicationRegimenEntries.map((entry) => entry.id),
      ...resolution.supplementUseEntries.map((entry) => entry.id),
    ];
    if (new Set(entryIds).size !== entryIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Resolved background medication and supplement entry IDs must be unique.',
      });
    }
    if (
      resolution.supplementPattern === 'enthusiast' &&
      new Set(resolution.supplementUseEntries.map((entry) => entry.supplementIdentityId)).size < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplementPattern'],
        message:
          'The enthusiast pattern must be derived from multiple distinct resolved supplements.',
      });
    }
  });
export type PatientBackgroundExposureResolutionV2 = z.infer<
  typeof PatientBackgroundExposureResolutionV2Schema
>;

export const MedicationTrialExposureSchema = z
  .object({
    duration: z
      .object({
        value: z.number().int().positive(),
        unit: ClinicalDurationUnitSchema,
      })
      .strict()
      .nullable(),
    maximumDose: z
      .object({
        amount: z.number().positive(),
        unit: z.string().min(1).max(24),
        frequency: z.string().min(1).max(48),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type MedicationTrialExposure = z.infer<typeof MedicationTrialExposureSchema>;

export const MedicationTrialRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    medicationId: StableIdSchema,
    exposure: MedicationTrialExposureSchema.optional(),
    adequacy: z.enum(['adequate', 'inadequate', 'unclear']),
    adherence: z.enum(['consistent', 'inconsistent', 'unknown']),
    response: z.enum(['remission', 'partial', 'none', 'worsened', 'unknown']),
    tolerability: z.enum(['tolerated', 'limited', 'stopped_adverse_effect', 'unknown']),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    summary: z.string().min(1).max(240),
  })
  .strict();
export type MedicationTrialRecord = z.infer<typeof MedicationTrialRecordSchema>;

/**
 * Planned medication-specific tolerability fact. Sexual effects live here,
 * not in allergy history, and remain unknown until actually assessed or
 * generated from a separately reviewed source-rate profile.
 */
export const MedicationTolerabilityFindingV2Schema = z
  .object({
    recordVersion: z.literal(2),
    id: StableIdSchema,
    subject: z.discriminatedUnion('kind', [
      z
        .object({
          kind: z.literal('current_regimen_entry'),
          regimenEntryId: StableIdSchema,
        })
        .strict(),
      z
        .object({
          kind: z.literal('prior_trial'),
          medicationTrialId: StableIdSchema,
        })
        .strict(),
    ]),
    domain: z.enum([
      'sexual_function',
      'sleep',
      'appetite_weight',
      'activation',
      'sedation',
      'gastrointestinal',
      'movement',
      'other',
    ]),
    findingStatus: z.enum(['unknown', 'absent', 'present']),
    manifestationIds: z.array(StableIdSchema).max(12),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    sourceRateProfileId: StableIdSchema.nullable(),
  })
  .strict()
  .superRefine((finding, context) => {
    if ((finding.findingStatus === 'present') !== finding.manifestationIds.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['manifestationIds'],
        message: 'Only a present tolerability finding may contain manifestations.',
      });
    }
  });
export type MedicationTolerabilityFindingV2 = z.infer<typeof MedicationTolerabilityFindingV2Schema>;

export const PsychotherapyTrialRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    interventionId: StableIdSchema,
    status: z.enum(['ongoing', 'completed', 'discontinued']),
    engagement: z.enum(['adequate', 'limited', 'unknown']),
    response: z.enum(['strong', 'partial', 'none', 'worsened', 'unknown']),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    summary: z.string().min(1).max(240),
  })
  .strict();
export type PsychotherapyTrialRecord = z.infer<typeof PsychotherapyTrialRecordSchema>;

export const TreatmentProviderRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    providerType: z.enum([
      'psychiatrist',
      'therapist',
      'primary_care',
      'case_manager',
      'substance_use_clinician',
      'other',
    ]),
    active: z.boolean(),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    summary: z.string().min(1).max(240),
  })
  .strict();
export type TreatmentProviderRecord = z.infer<typeof TreatmentProviderRecordSchema>;

export const PriorLevelOfCareRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    level: z.enum([
      'inpatient_psychiatry',
      'partial_hospitalization',
      'intensive_outpatient',
      'residential',
      'emergency_evaluation',
      'detoxification',
      'substance_use_rehabilitation',
      'other',
    ]),
    occurrenceCount: z.number().int().positive(),
    source: z.enum(['patient_report', 'collateral', 'outside_record', 'prescriber_record']),
    summary: z.string().min(1).max(240),
  })
  .strict();
export type PriorLevelOfCareRecord = z.infer<typeof PriorLevelOfCareRecordSchema>;

export const PatientTreatmentHistorySchema = z
  .object({
    medicationTrials: z.array(MedicationTrialRecordSchema).default([]),
    psychotherapyTrials: z.array(PsychotherapyTrialRecordSchema).default([]),
    currentProviders: z.array(TreatmentProviderRecordSchema).default([]),
    priorLevelsOfCare: z.array(PriorLevelOfCareRecordSchema).default([]),
  })
  .strict();
export type PatientTreatmentHistory = z.infer<typeof PatientTreatmentHistorySchema>;

/**
 * The patient's subjective answer when asked whether they feel able to
 * participate in safety planning. This is not a clinician-authored safety
 * assessment and does not determine disposition by itself.
 */
export const PatientReportedSafetyPlanningAbilitySchema = z.enum([
  'unassessed',
  'reports_able',
  'reports_unable',
  'uncertain',
]);
export type PatientReportedSafetyPlanningAbility = z.infer<
  typeof PatientReportedSafetyPlanningAbilitySchema
>;

export const ConditionStateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    diagnosisDefinitionId: StableIdSchema,
    diagnosisDefinitionContentVersion: ContentVersionSchema,
    clinicalStateId: StableIdSchema,
    timeScopeId: StableIdSchema,
    encounterRelevance: z.enum(['focus', 'contributing', 'background']),
    severityId: StableIdSchema.nullable(),
    specifierIds: z.array(StableIdSchema),
    origin: z.enum(['authored', 'generated_optional', 'derived_incidental']),
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((condition, context) => {
    if (new Set(condition.specifierIds).size !== condition.specifierIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specifierIds'],
        message: 'Condition-state specifier IDs must be unique.',
      });
    }
  });
export type ConditionState = z.infer<typeof ConditionStateSchema>;

export const DiagnosisRecordEntrySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    mappedDiagnosisDefinitionId: StableIdSchema.nullable(),
    mappedDiagnosisDefinitionContentVersion: ContentVersionSchema.nullable(),
    recordedLabel: z.string().trim().min(1).max(180),
    assertion: z.enum(['asserted', 'historical', 'rule_out', 'questioned', 'unspecified']),
    source: z
      .object({
        kind: PatientSceneEvidenceSourceKindSchema,
        sourceInstanceId: StableIdSchema,
      })
      .strict(),
    timeScopeId: StableIdSchema,
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((entry, context) => {
    if (
      (entry.mappedDiagnosisDefinitionId === null) !==
      (entry.mappedDiagnosisDefinitionContentVersion === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mappedDiagnosisDefinitionId'],
        message:
          'A chart diagnosis mapping must include both definition ID and content version, or neither.',
      });
    }
  });
export type DiagnosisRecordEntry = z.infer<typeof DiagnosisRecordEntrySchema>;

export const PatientStateTargetReferenceSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('condition_state'),
      conditionStateId: StableIdSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('canonical_finding'),
      canonicalFindingId: StableIdSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('latent_proposition'),
      propositionId: StableIdSchema,
    })
    .strict(),
]);
export type PatientStateTargetReference = z.infer<typeof PatientStateTargetReferenceSchema>;

export const PatientStateScopedSourceSchema = z
  .object({
    kind: PatientSceneEvidenceSourceKindSchema,
    sourceInstanceId: StableIdSchema,
  })
  .strict();
export type PatientStateScopedSource = z.infer<typeof PatientStateScopedSourceSchema>;

export const ResolvedClinicalDurationSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    target: PatientStateTargetReferenceSchema,
    value: z.number().int().positive(),
    unit: ClinicalDurationUnitSchema,
    durationProfileId: StableIdSchema,
    durationOptionId: StableIdSchema,
    relatedDiagnosisId: StableIdSchema.nullable(),
    interpretation: z.enum(['supports_authored_state', 'designed_below_threshold', 'context_only']),
    criterionId: StableIdSchema.nullable(),
    source: PatientStateScopedSourceSchema,
    timeScopeId: StableIdSchema,
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict()
  .superRefine((duration, context) => {
    if (duration.interpretation === 'designed_below_threshold' && duration.criterionId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['criterionId'],
        message: 'A below-threshold resolved duration must retain its reviewed criterion.',
      });
    }
    if (duration.interpretation !== 'designed_below_threshold' && duration.criterionId !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['criterionId'],
        message: 'Only a below-threshold resolved duration may name a criterion.',
      });
    }
  });
export type ResolvedClinicalDuration = z.infer<typeof ResolvedClinicalDurationSchema>;

export const SubjectiveBurdenRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    target: PatientStateTargetReferenceSchema,
    ordinalScaleId: StableIdSchema,
    ordinalScaleContentVersion: ContentVersionSchema,
    ordinalValueId: StableIdSchema,
    source: PatientStateScopedSourceSchema,
    timeScopeId: StableIdSchema,
    resolution: PatientStateResolutionTraceSchema,
  })
  .strict();
export type SubjectiveBurdenRecord = z.infer<typeof SubjectiveBurdenRecordSchema>;

/**
 * A complete, point-free patient snapshot for the future catalog compiler.
 * It composes already resolved values without replacing the compatibility
 * PatientRecord, CaseBlueprint, CaseInstance, or save schemas.
 */
export const ResolvedPatientStateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    demographics: ResolvedPatientDemographicsV2Schema,
    conditionStates: z.array(ConditionStateSchema),
    diagnosisRecordEntries: z.array(DiagnosisRecordEntrySchema),
    medicationRegimenEntries: z.array(MedicationRegimenEntryV2Schema),
    supplementUseEntries: z.array(SupplementUseEntrySchema),
    treatmentHistory: PatientTreatmentHistorySchema,
    medicationTolerabilityFindings: z.array(MedicationTolerabilityFindingV2Schema),
    reactionHistory: PatientReactionHistorySchema,
    canonicalFindings: z.array(ResolvedCanonicalFindingSchema),
    measurements: z.array(ResolvedMeasurementSchema),
    categoricalObservations: z.array(ResolvedCategoricalObservationSchema),
    structuredTestResults: z.array(StructuredTestResultSchema),
    clinicalContexts: z.array(ResolvedPatientClinicalContextSchema),
    clinicalDurations: z.array(ResolvedClinicalDurationSchema),
    subjectiveBurdenRecords: z.array(SubjectiveBurdenRecordSchema),
    propositionState: ResolvedPatientPropositionStateSchema,
    clinicalTagIds: z.array(StableIdSchema),
    reportedSafetyPlanningAbility: PatientReportedSafetyPlanningAbilitySchema,
  })
  .strict()
  .superRefine((state, context) => {
    const assertUniqueIds = (path: string, ids: string[]) => {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: `Resolved patient-state ${path} IDs must be unique.`,
        });
      }
    };
    assertUniqueIds(
      'conditionStates',
      state.conditionStates.map((entry) => entry.id),
    );
    assertUniqueIds(
      'diagnosisRecordEntries',
      state.diagnosisRecordEntries.map((entry) => entry.id),
    );
    assertUniqueIds(
      'medicationRegimenEntries',
      state.medicationRegimenEntries.map((entry) => entry.id),
    );
    assertUniqueIds(
      'supplementUseEntries',
      state.supplementUseEntries.map((entry) => entry.id),
    );
    assertUniqueIds(
      'medicationTrials',
      state.treatmentHistory.medicationTrials.map((entry) => entry.id),
    );
    assertUniqueIds(
      'psychotherapyTrials',
      state.treatmentHistory.psychotherapyTrials.map((entry) => entry.id),
    );
    assertUniqueIds(
      'currentProviders',
      state.treatmentHistory.currentProviders.map((entry) => entry.id),
    );
    assertUniqueIds(
      'priorLevelsOfCare',
      state.treatmentHistory.priorLevelsOfCare.map((entry) => entry.id),
    );
    assertUniqueIds(
      'medicationTolerabilityFindings',
      state.medicationTolerabilityFindings.map((entry) => entry.id),
    );
    assertUniqueIds(
      'canonicalFindings',
      state.canonicalFindings.map((entry) => entry.id),
    );
    assertUniqueIds(
      'measurements',
      state.measurements.map((entry) => entry.id),
    );
    assertUniqueIds(
      'categoricalObservations',
      state.categoricalObservations.map((entry) => entry.id),
    );
    assertUniqueIds(
      'structuredTestResults',
      state.structuredTestResults.map((entry) => entry.id),
    );
    assertUniqueIds(
      'clinicalDurations',
      state.clinicalDurations.map((entry) => entry.id),
    );
    assertUniqueIds(
      'subjectiveBurdenRecords',
      state.subjectiveBurdenRecords.map((entry) => entry.id),
    );
    assertUniqueIds('clinicalTagIds', state.clinicalTagIds);

    const globallyOwnedRecordIds = [
      ...state.conditionStates.map((entry) => entry.id),
      ...state.diagnosisRecordEntries.map((entry) => entry.id),
      ...state.medicationRegimenEntries.map((entry) => entry.id),
      ...state.supplementUseEntries.map((entry) => entry.id),
      ...state.treatmentHistory.medicationTrials.map((entry) => entry.id),
      ...state.treatmentHistory.psychotherapyTrials.map((entry) => entry.id),
      ...state.treatmentHistory.currentProviders.map((entry) => entry.id),
      ...state.treatmentHistory.priorLevelsOfCare.map((entry) => entry.id),
      ...state.medicationTolerabilityFindings.map((entry) => entry.id),
      ...state.reactionHistory.records.map((entry) => entry.id),
      ...state.canonicalFindings.map((entry) => entry.id),
      ...state.measurements.map((entry) => entry.id),
      ...state.categoricalObservations.map((entry) => entry.id),
      ...state.structuredTestResults.map((entry) => entry.id),
      ...state.clinicalDurations.map((entry) => entry.id),
      ...state.subjectiveBurdenRecords.map((entry) => entry.id),
      state.propositionState.id,
      ...state.propositionState.propositions.map((entry) => entry.id),
      ...state.propositionState.evidence.map((entry) => entry.id),
      ...state.propositionState.dependencyGroups.map((entry) => entry.id),
      ...state.propositionState.beliefAppraisals.map((entry) => entry.id),
    ];
    if (new Set(globallyOwnedRecordIds).size !== globallyOwnedRecordIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Resolved patient-state owned record IDs must be globally unique.',
      });
    }

    const canonicalFindingDefinitionIds = state.canonicalFindings.map(
      (finding) => finding.definitionId,
    );
    if (new Set(canonicalFindingDefinitionIds).size !== canonicalFindingDefinitionIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['canonicalFindings'],
        message: 'Each canonical finding definition may resolve only once per patient state.',
      });
    }

    const contextDimensionIds = state.clinicalContexts.map((entry) => entry.dimensionId);
    if (new Set(contextDimensionIds).size !== contextDimensionIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['clinicalContexts'],
        message: 'Resolved patient-state clinical-context dimensions must be unique.',
      });
    }

    const clinicalTagIds = new Set(state.clinicalTagIds);
    for (const tagId of state.clinicalContexts.flatMap(
      (clinicalContext) => clinicalContext.addedClinicalTagIds,
    )) {
      if (!clinicalTagIds.has(tagId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['clinicalTagIds'],
          message: `Resolved patient state is missing derived clinical tag ${tagId}.`,
        });
      }
    }

    const regimenEntryIds = new Set(state.medicationRegimenEntries.map((entry) => entry.id));
    const medicationTrialIds = new Set(
      state.treatmentHistory.medicationTrials.map((entry) => entry.id),
    );
    for (const [findingIndex, finding] of state.medicationTolerabilityFindings.entries()) {
      const subjectExists =
        finding.subject.kind === 'current_regimen_entry'
          ? regimenEntryIds.has(finding.subject.regimenEntryId)
          : medicationTrialIds.has(finding.subject.medicationTrialId);
      if (!subjectExists) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['medicationTolerabilityFindings', findingIndex, 'subject'],
          message: 'Medication tolerability must reference an included regimen entry or trial.',
        });
      }
    }

    const conditionStateIds = new Set(state.conditionStates.map((entry) => entry.id));
    const canonicalFindingIds = new Set(state.canonicalFindings.map((entry) => entry.id));
    const propositionIds = new Set(state.propositionState.propositions.map((entry) => entry.id));
    const targetExists = (target: PatientStateTargetReference) => {
      if (target.kind === 'condition_state') {
        return conditionStateIds.has(target.conditionStateId);
      }
      if (target.kind === 'canonical_finding') {
        return canonicalFindingIds.has(target.canonicalFindingId);
      }
      return propositionIds.has(target.propositionId);
    };
    for (const [path, records] of [
      ['clinicalDurations', state.clinicalDurations],
      ['subjectiveBurdenRecords', state.subjectiveBurdenRecords],
    ] as const) {
      for (const [recordIndex, record] of records.entries()) {
        if (!targetExists(record.target)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [path, recordIndex, 'target'],
            message: 'Target-scoped patient state must reference an included resolved record.',
          });
        }
      }
    }
  });
export type ResolvedPatientState = z.infer<typeof ResolvedPatientStateSchema>;

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
    treatmentHistory: PatientTreatmentHistorySchema.default({
      medicationTrials: [],
      psychotherapyTrials: [],
      currentProviders: [],
      priorLevelsOfCare: [],
    }),
    reactionHistory: PatientReactionHistorySchema.default({
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    }),
    reportedSafetyPlanningAbility: PatientReportedSafetyPlanningAbilitySchema.default('unassessed'),
    complexityProfile: PatientComplexityProfileSchema.default({
      modelVersion: 'additional-feature-budget.v1',
      measurementStatus: 'legacy_unmeasured',
      additionalFeatureBudget: 0,
      maximumSelectedModules: 0,
      selectedModules: [],
      targetEnvelope: null,
    }),
    diagnosisComposition: PatientDiagnosisCompositionSchema.nullable().default(null),
    clinicalContextDimensions: z.array(PatientClinicalContextDimensionSchema).max(20).default([]),
  })
  .strict();
export type PatientRecord = z.infer<typeof PatientRecordSchema>;

const CaseCoreSchema = z.object({
  metadata: CaseMetadataSchema,
  patientRecord: PatientRecordSchema,
  diagnosisRubric: CaseDiagnosisRubricSchema.nullable().default(null),
  criticalFacts: z.record(z.union([z.string(), z.number(), z.boolean()])),
  workupObjectives: z.array(WorkupObjectiveSchema).min(1),
  treatmentWorkupRequirements: z.array(TreatmentWorkupRequirementSchema).default([]),
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
    authority: EvidenceAuthoritySchema,
    evidenceSourceIds: z.array(StableIdSchema),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    contribution: z.string().min(1).max(800),
    targetRuleIds: z.array(StableIdSchema).min(1),
  })
  .strict()
  .superRefine((sourceUse, context) => {
    if (sourceUse.authority === 'formal_publication' && sourceUse.evidenceSourceIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceSourceIds'],
        message: 'A formal Reviewer-policy contribution requires a cataloged evidence source.',
      });
    }
    if (sourceUse.authority === 'expert_opinion' && sourceUse.evidenceSourceIds.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceSourceIds'],
        message: 'A Reviewer-policy expert opinion cannot cite a formal evidence source.',
      });
    }
  });
export type ReviewCaseSourceUse = z.infer<typeof ReviewCaseSourceUseSchema>;

export const ReviewDecisionPolicySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    diagnosisRubric: CaseDiagnosisRubricSchema.nullable().default(null),
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
    durationProfile: ClinicalDurationProfileSchema,
    bothersomeness: z.enum(['not_at_all', 'somewhat', 'very', 'extremely']).nullable(),
    settingText: z.string().min(1).max(180),
    knownHistory: z.array(z.string().min(1).max(180)),
    medicationListStatus: z
      .enum(['unreconciled', 'verified_none', 'provided'])
      .default('unreconciled'),
    medicationRegimen: z.array(MedicationRegimenEntrySchema),
    priorMedicationTrials: z.array(MedicationTrialRecordSchema),
    treatmentHistory: PatientTreatmentHistorySchema.default({
      medicationTrials: [],
      psychotherapyTrials: [],
      currentProviders: [],
      priorLevelsOfCare: [],
    }),
    reactionHistory: PatientReactionHistorySchema,
    reportedSafetyPlanningAbility: PatientReportedSafetyPlanningAbilitySchema.exclude([
      'unassessed',
    ]),
    complexityProfile: PatientComplexityProfileSchema,
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
    staffConfigurations: z
      .array(
        z
          .object({
            staffUpgradeId: StableIdSchema,
            automaticInformationActionIds: z.array(StableIdSchema),
          })
          .strict(),
      )
      .default([]),
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
    upgradeSavings: z.number().int().nonnegative().default(0),
    initiatedBy: z.enum(['player', 'automatic_intake']).default('player'),
    initiatingStaffUpgradeId: StableIdSchema.nullable().default(null),
    result: InformationResultSchema,
  })
  .strict()
  .superRefine((purchase, context) => {
    if (
      (purchase.initiatedBy === 'automatic_intake') !==
      (purchase.initiatingStaffUpgradeId !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Automatic intake purchases must name their initiating staff upgrade.',
      });
    }
  });
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
  z
    .object({
      id: StableIdSchema,
      type: z.literal('DiagnosisSelectionsChanged'),
      selections: PlayerDiagnosisSelectionsSchema,
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
    diagnosisSelections: PlayerDiagnosisSelectionsSchema.default([]),
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
    concernLevel: ClinicalConcernLevelSchema.nullable().optional(),
    certaintyLevel: ClinicalCertaintyLevelSchema.nullable().optional(),
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
    issueId: StableIdSchema.nullable().default(null),
    effectId: StableIdSchema.nullable().optional(),
    specificityPriority: z.number().int().nonnegative().optional(),
    combinationStatus: z.enum(['applied', 'replaced', 'deduplicated', 'suppressed']).optional(),
    pointsBeforeCombination: z.number().int().nullable().optional(),
    resolvedByRuleId: StableIdSchema.nullable().optional(),
    combinationExplanation: z.string().min(1).nullable().optional(),
    relatedActionIds: z.array(StableIdSchema),
    relatedDiagnosisIds: z.array(StableIdSchema).default([]),
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
    diagnosisEvaluationSource: z.enum(['case_rubric', 'not_scored']).default('not_scored'),
    diagnosisEvaluationNotice: z
      .string()
      .min(1)
      .default('This historical encounter did not include a diagnostic-answer rubric.'),
    componentPoints: z
      .object({
        diagnosis: z.number().int().default(0),
        workup: z.number().int(),
        medication_selection: z.number().int(),
        medication_discontinuation: z.number().int(),
        safety: z.number().int(),
        nonmedication: z.number().int(),
        disposition: z.number().int(),
        efficiency: z.number().int(),
      })
      .strict(),
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
    kind: z.enum(['diagnosis', 'information', 'treatment', 'nonmedication', 'disposition']),
    fulfillmentMethod: z.string().min(1),
    operatingCost: z.number().int().nonnegative(),
    pointDelta: z.number().int(),
    scoreCategory: z.enum([
      'workup',
      'diagnosis',
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
    upgradeSavings: z.number().int().nonnegative().default(0),
    relatedRuleIds: z.array(StableIdSchema).default([]),
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
    informationExpenses: z.number().int().nonnegative().default(0),
    treatmentExpenses: z.number().int().nonnegative().default(0),
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

export const DeveloperEncounterScratchpadSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    caseInstanceId: StableIdSchema,
    blueprintId: StableIdSchema,
    caseContentVersion: ContentVersionSchema,
    seed: z.string().min(1),
    reviewerNote: z
      .string()
      .max(8000)
      .refine((note) => note.trim().length > 0, {
        message: 'A persisted encounter scratchpad cannot be blank.',
      }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type DeveloperEncounterScratchpad = z.infer<typeof DeveloperEncounterScratchpadSchema>;

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
    submittedDiagnoses: PlayerDiagnosisSelectionsSchema.default([]),
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
      'diagnosis',
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
    if (
      ['diagnosis', 'start_medication', 'stop_medication', 'continue_medication'].includes(
        option.kind,
      ) &&
      fulfillmentFields.some((value) => value !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Diagnosis and medication snapshots cannot contain service-fulfillment data.',
      });
    }
    if (
      ['nonmedication', 'disposition'].includes(option.kind) &&
      fulfillmentFields.some((value) => value === null) &&
      fulfillmentFields.some((value) => value !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'A priced treatment-option snapshot requires the complete service, fulfillment, and point-cost tuple.',
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
    addExpected(
      'diagnosis',
      attempt.submittedDiagnoses.map((selection) => selection.diagnosisId),
    );
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
      ...review.availableOptions
        .filter((option) => option.kind === 'diagnosis')
        .map((option) => `diagnosis:${option.optionId}`),
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
    diagnosisSelections: PlayerDiagnosisSelectionsSchema.default([]),
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

const SourceReviewHashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const canonicalStableIds = (values: readonly string[]): string => [...values].sort().join('\0');

export const SourceReviewAtomicProposalSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    proposalType: z.enum([
      'catalog_identity',
      'bibliographic_candidate',
      'developer_opinion',
      'clinical_rule_candidate',
      'balance_question',
      'no_change',
    ]),
    summary: z.string().min(1).max(400),
    publicTargetContentIds: z.array(StableIdSchema).max(20),
    unresolvedTargetLabels: z.array(z.string().min(1).max(180)).max(20),
    uncertainty: z.array(z.string().min(1).max(300)).max(4),
  })
  .strict()
  .superRefine((proposal, context) => {
    if (new Set(proposal.publicTargetContentIds).size !== proposal.publicTargetContentIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publicTargetContentIds'],
        message: 'Source-review proposal targets must be unique.',
      });
    }
    if (
      proposal.publicTargetContentIds.length === 0 &&
      proposal.unresolvedTargetLabels.length === 0 &&
      proposal.proposalType !== 'no_change'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publicTargetContentIds'],
        message: 'A source-review proposal must identify a public target or unresolved label.',
      });
    }
  });
export type SourceReviewAtomicProposal = z.infer<typeof SourceReviewAtomicProposalSchema>;

export const SourceReviewSnapshotSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    packetVersion: z.literal(1),
    packetHash: SourceReviewHashSchema,
    sourceUnitFingerprint: SourceReviewHashSchema,
    projectionPolicy: z.literal('original_paraphrase_no_source_text'),
    derivedDisplayTitle: z.string().min(1).max(180),
    decisionQuestion: z.string().min(1).max(800),
    proposedRouting: z.string().min(1).max(500),
    reviewContext: z
      .object({
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
        requiresClinicalAcumen: z.boolean(),
        dependencyTicketIds: z.array(StableIdSchema).max(30),
        conflictContentIds: z.array(StableIdSchema).max(30),
        resurfacingTrigger: z.string().min(1).max(500).nullable(),
      })
      .strict(),
    originalSummary: z.string().min(1).max(700),
    atomicProposals: z.array(SourceReviewAtomicProposalSchema).min(1).max(8),
    publicTargetContentIds: z.array(StableIdSchema).max(30),
    unresolvedTargetLabels: z.array(z.string().min(1).max(180)).max(30),
    uncertainty: z.array(z.string().min(1).max(300)).max(10),
    conflicts: z.array(z.string().min(1).max(500)).max(10),
    currentness: z
      .object({
        status: z.enum(['needs_currentness_review', 'current', 'superseded', 'retired']),
        evaluatedThrough: z.string().date().nullable(),
        note: z.string().min(1).max(500),
      })
      .strict(),
    rightsState: z
      .object({
        status: z.enum([
          'not_assessed',
          'private_processing_only',
          'permission_required',
          'excluded',
          'source_use_decision',
        ]),
        sourceUseDecisionId: StableIdSchema.nullable(),
        portableReviewAllowed: z.boolean(),
        note: z.string().min(1).max(600),
      })
      .strict(),
    boundaryState: z.enum(['confirmed', 'uncertain']),
    boundaryQuestion: z.string().min(1).max(600).nullable(),
    medicalReviewStatus: z.literal('unreviewed'),
    runtimeEffect: z.literal(false),
  })
  .strict()
  .superRefine((snapshot, context) => {
    if (new Set(snapshot.publicTargetContentIds).size !== snapshot.publicTargetContentIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publicTargetContentIds'],
        message: 'Source-review snapshot targets must be unique.',
      });
    }
    if (
      new Set(snapshot.atomicProposals.map((proposal) => proposal.id)).size !==
      snapshot.atomicProposals.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['atomicProposals'],
        message: 'Source-review proposal IDs must be unique within a packet.',
      });
    }
    const snapshotTargets = new Set(snapshot.publicTargetContentIds);
    const unresolvedLabels = new Set(snapshot.unresolvedTargetLabels);
    snapshot.atomicProposals.forEach((proposal, proposalIndex) => {
      proposal.publicTargetContentIds.forEach((targetId) => {
        if (!snapshotTargets.has(targetId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['atomicProposals', proposalIndex, 'publicTargetContentIds'],
            message: 'Every proposal target must also appear in the packet target list.',
          });
        }
      });
      proposal.unresolvedTargetLabels.forEach((label) => {
        if (!unresolvedLabels.has(label)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['atomicProposals', proposalIndex, 'unresolvedTargetLabels'],
            message:
              'Every unresolved proposal label must also appear in the packet unresolved-label list.',
          });
        }
      });
    });
    if (snapshot.boundaryState === 'uncertain' && snapshot.boundaryQuestion === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['boundaryQuestion'],
        message: 'An uncertain source boundary requires an explicit reviewer question.',
      });
    }
    if (snapshot.boundaryState === 'confirmed' && snapshot.boundaryQuestion !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['boundaryQuestion'],
        message: 'A confirmed source boundary cannot retain an unresolved boundary question.',
      });
    }
    if (
      (snapshot.rightsState.status === 'source_use_decision') !==
      (snapshot.rightsState.sourceUseDecisionId !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rightsState', 'sourceUseDecisionId'],
        message:
          'A source-review rights projection names a source-use decision exactly when that decision governs it.',
      });
    }
    if (
      snapshot.rightsState.status !== 'source_use_decision' &&
      snapshot.rightsState.portableReviewAllowed
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rightsState', 'portableReviewAllowed'],
        message:
          'Only an explicit source-use decision can permit portable review of a source packet.',
      });
    }
    if (
      snapshot.rightsState.status === 'excluded' &&
      snapshot.atomicProposals.some((proposal) => proposal.proposalType !== 'no_change')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['atomicProposals'],
        message: 'An excluded source can record only a no-change proposal.',
      });
    }
    const locallyReviewablePrivateProposalTypes = new Set(['developer_opinion', 'no_change']);
    if (
      snapshot.rightsState.status === 'private_processing_only' &&
      snapshot.atomicProposals.some(
        (proposal) => !locallyReviewablePrivateProposalTypes.has(proposal.proposalType),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['atomicProposals'],
        message: 'Private-processing packets may review only local Developer-opinion candidates.',
      });
    }
    if (
      !['private_processing_only', 'source_use_decision'].includes(snapshot.rightsState.status) &&
      snapshot.atomicProposals.some((proposal) => proposal.proposalType !== 'no_change')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['atomicProposals'],
        message:
          'A source without private-review authorization or an explicit source-use decision can produce only a metadata no-change packet.',
      });
    }
  });
export type SourceReviewSnapshot = z.infer<typeof SourceReviewSnapshotSchema>;

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
    sourceReviewSnapshot: SourceReviewSnapshotSchema.nullable().default(null),
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
  .strict()
  .superRefine((ticket, context) => {
    const snapshot = ticket.sourceReviewSnapshot;
    if (!snapshot) return;
    if (ticket.sourceKind !== 'source_claim' || ticket.sourceAuthority !== 'source_document') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceReviewSnapshot'],
        message: 'A source-review snapshot must remain a source-document claim ticket.',
      });
    }
    if (
      ticket.attemptId !== null ||
      ticket.blueprintId !== null ||
      ticket.caseContentVersion !== null ||
      ticket.receiptItemId !== null ||
      ticket.receiptItemSnapshot !== null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceReviewSnapshot'],
        message: 'A source-review snapshot cannot be bound to a patient attempt or receipt.',
      });
    }
    const ticketTargets = [...ticket.targetContentIds].sort();
    const snapshotTargets = [...snapshot.publicTargetContentIds].sort();
    if (
      ticketTargets.length !== snapshotTargets.length ||
      ticketTargets.some((targetId, index) => targetId !== snapshotTargets[index])
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetContentIds'],
        message: 'Source-review ticket targets must exactly match its immutable snapshot targets.',
      });
    }
    if (
      ticket.title !== snapshot.derivedDisplayTitle ||
      ticket.guidance !== snapshot.decisionQuestion ||
      ticket.proposedRouting !== snapshot.proposedRouting
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceReviewSnapshot'],
        message:
          'Displayed source-review title, question, and routing must match the immutable snapshot.',
      });
    }
    if (
      ticket.ticketType !== snapshot.reviewContext.ticketType ||
      ticket.priority !== snapshot.reviewContext.priority ||
      ticket.requiresClinicalAcumen !== snapshot.reviewContext.requiresClinicalAcumen ||
      canonicalStableIds(ticket.dependencyTicketIds) !==
        canonicalStableIds(snapshot.reviewContext.dependencyTicketIds) ||
      canonicalStableIds(ticket.conflictContentIds) !==
        canonicalStableIds(snapshot.reviewContext.conflictContentIds) ||
      ticket.resurfacingTrigger !== snapshot.reviewContext.resurfacingTrigger
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceReviewSnapshot', 'reviewContext'],
        message: 'Source-review routing context must match the immutable snapshot.',
      });
    }
    if (ticket.id !== `ticket.source-review.${snapshot.packetHash.slice(0, 24)}`) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['id'],
        message: 'A source-review ticket ID must be derived from its immutable packet hash.',
      });
    }
  });
export type ClinicalReviewTicket = z.infer<typeof ClinicalReviewTicketSchema>;

export const SourceReviewTicketFeedSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    projectionVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    tickets: z.array(ClinicalReviewTicketSchema).max(100),
  })
  .strict()
  .superRefine((feed, context) => {
    const ticketIds = new Set<string>();
    const packetHashes = new Set<string>();
    feed.tickets.forEach((ticket, index) => {
      if (!ticket.sourceReviewSnapshot) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tickets', index, 'sourceReviewSnapshot'],
          message: 'Every local source-review feed ticket requires an immutable snapshot.',
        });
        return;
      }
      if (
        ticket.status !== 'proposed' ||
        ticket.reviewerNotes !== '' ||
        ticket.reviewerNotesUpdatedAt !== null ||
        ticket.resolution !== null
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tickets', index],
          message:
            'The local source-review feed contains seed packets only; browser review state belongs in SaveData.',
        });
      }
      if (ticketIds.has(ticket.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tickets', index, 'id'],
          message: 'Source-review feed ticket IDs must be unique.',
        });
      }
      ticketIds.add(ticket.id);
      if (packetHashes.has(ticket.sourceReviewSnapshot.packetHash)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tickets', index, 'sourceReviewSnapshot', 'packetHash'],
          message: 'Source-review feed packet hashes must be unique.',
        });
      }
      packetHashes.add(ticket.sourceReviewSnapshot.packetHash);
    });
  });
export type SourceReviewTicketFeed = z.infer<typeof SourceReviewTicketFeedSchema>;

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

export const LiteratureSynthesisSourceSchema = z
  .object({
    id: StableIdSchema,
    evidenceSourceId: StableIdSchema.nullable(),
    title: z.string().min(1).max(500),
    publicationYear: z.number().int().min(1900).max(2200),
    doi: z.string().min(1).nullable(),
    pmid: z.string().regex(/^\d+$/).nullable(),
    url: z.string().url(),
    sourceKind: z.enum([
      'systematic_review',
      'meta_analysis',
      'network_meta_analysis',
      'clinical_guideline',
      'regulatory_source',
      'primary_study',
    ]),
    accessStatus: z.enum(['cataloged_and_cleared', 'metadata_or_abstract_only', 'inaccessible']),
    findingRole: z.enum(['supports', 'opposes', 'qualifies', 'context']),
    conciseFinding: z.string().min(1).max(800),
    supportsProposedDirection: z.boolean(),
  })
  .strict()
  .superRefine((source, context) => {
    if (
      source.supportsProposedDirection &&
      (source.accessStatus !== 'cataloged_and_cleared' || source.evidenceSourceId === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supportsProposedDirection'],
        message:
          'A literature proposal may rely on a source only when its catalog and source-use review are cleared.',
      });
    }
  });
export type LiteratureSynthesisSource = z.infer<typeof LiteratureSynthesisSourceSchema>;

export const LiteratureSynthesisProposalSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    linkedTicketIds: z.array(StableIdSchema).min(1),
    linkedSourceRequestIds: z.array(StableIdSchema),
    blueprintIds: z.array(StableIdSchema),
    clinicalQuestion: z.string().min(1).max(800),
    focusedDecision: z.string().min(1).max(500),
    searchStrategy: z
      .object({
        searchedAt: z.string().datetime(),
        rollingWindowStartYear: z.number().int().min(1900).max(2200),
        databases: z.array(z.string().min(1)).min(1),
        queries: z.array(z.string().min(1)).min(1),
        resultCountReviewed: z.number().int().nonnegative(),
        selectionNote: z.string().min(1).max(800),
      })
      .strict(),
    sources: z.array(LiteratureSynthesisSourceSchema).min(1),
    supportingSummary: z.string().min(1).max(1200),
    opposingOrQualifyingSummary: z.string().min(1).max(1200),
    proposedDirection: z.string().min(1).max(1200),
    limitations: z.array(z.string().min(1).max(500)).min(1),
    unresolvedQuestions: z.array(z.string().min(1).max(500)),
    pointMagnitudeExcluded: z.literal(true),
    medicalReviewStatus: z.literal('unreviewed'),
  })
  .strict();
export type LiteratureSynthesisProposal = z.infer<typeof LiteratureSynthesisProposalSchema>;

export const TicketLiteratureScoutReferenceSchema = z
  .object({
    id: StableIdSchema,
    title: z.string().min(1).max(500),
    authorLabel: z.string().min(1).max(300),
    publicationDate: z.string().date(),
    publicationYear: z.number().int().min(1900).max(2200),
    doi: z.string().min(1).nullable(),
    pmid: z.string().regex(/^\d+$/),
    url: z.string().url(),
    synthesisKind: z.enum([
      'meta_analysis',
      'network_meta_analysis',
      'individual_participant_data_meta_analysis',
    ]),
    publicationTypes: z.array(z.string().min(1).max(120)).min(1),
    citationMetric: z
      .object({
        provider: z.literal('europe_pmc'),
        metric: z.literal('cited_by_count'),
        count: z.number().int().nonnegative(),
        asOf: z.string().datetime(),
        scope: z.literal('Europe PMC open-citation graph'),
      })
      .strict(),
    abstractSummary: z.string().min(1).max(1000),
    summaryBasis: z.literal('abstract_only'),
    summaryCreatedAt: z.string().datetime(),
    accessStatus: z.literal('metadata_or_abstract_only'),
    medicalReviewStatus: z.literal('unreviewed'),
  })
  .strict()
  .superRefine((reference, context) => {
    if (/<\/?[a-z][^>]*>/i.test(reference.abstractSummary)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['abstractSummary'],
        message: 'Tracked literature summaries must not contain copied abstract markup.',
      });
    }
  });
export type TicketLiteratureScoutReference = z.infer<typeof TicketLiteratureScoutReferenceSchema>;

export const TicketLiteratureScoutProfileSchema = z
  .object({
    id: StableIdSchema,
    clinicalQuestion: z.string().min(1).max(800),
    metaAnalysisFit: z.enum(['strong', 'partial', 'weak', 'not_applicable']),
    outcome: z.enum(['selected', 'no_suitable_recent_meta_analysis', 'requires_other_evidence']),
    linkedSourceRequestIds: z.array(StableIdSchema),
    searchPlan: z
      .object({
        provider: z.literal('europe_pmc'),
        topicQuery: z.string().min(1).max(1600),
        windowStart: z.string().date(),
        windowEnd: z.string().date(),
        lookbackYears: z.literal(10),
        selectionPolicy: z.literal('highest_cited_relevant_meta_analysis'),
        selectionPolicyVersion: z.literal('psychsim-literature-scout-v1'),
      })
      .strict()
      .nullable(),
    searchRun: z
      .object({
        searchedAt: z.string().datetime(),
        resultCount: z.number().int().nonnegative(),
        screenedResultCount: z.number().int().nonnegative(),
        selectedRank: z.number().int().positive().nullable(),
        responseSha256: z.string().regex(/^[a-f0-9]{64}$/),
        candidateSetSha256: z.string().regex(/^[a-f0-9]{64}$/),
        selectionNote: z.string().min(1).max(1000),
      })
      .strict()
      .nullable(),
    selectedReferenceId: StableIdSchema.nullable(),
    relevanceNote: z.string().min(1).max(1200),
    limitations: z.array(z.string().min(1).max(500)).min(1),
    pointMagnitudeExcluded: z.literal(true),
    supportsExecutableRule: z.literal(false),
    medicalReviewStatus: z.literal('unreviewed'),
  })
  .strict()
  .superRefine((profile, context) => {
    if (profile.searchPlan) {
      const end = new Date(`${profile.searchPlan.windowEnd}T00:00:00.000Z`);
      const expectedStartYear = end.getUTCFullYear() - profile.searchPlan.lookbackYears;
      const expectedStartDay = Math.min(
        end.getUTCDate(),
        new Date(Date.UTC(expectedStartYear, end.getUTCMonth() + 1, 0)).getUTCDate(),
      );
      const expectedStart = new Date(
        Date.UTC(expectedStartYear, end.getUTCMonth(), expectedStartDay),
      )
        .toISOString()
        .slice(0, 10);
      if (profile.searchPlan.windowStart !== expectedStart) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['searchPlan', 'windowStart'],
          message: `The literature search window must be exactly ${profile.searchPlan.lookbackYears} calendar years.`,
        });
      }
    }
    if (profile.outcome === 'selected') {
      if (!profile.searchPlan || !profile.searchRun || !profile.selectedReferenceId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outcome'],
          message: 'A selected literature profile requires a search plan, run, and reference.',
        });
      }
      if (profile.searchRun?.selectedRank === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['searchRun', 'selectedRank'],
          message: 'A selected literature profile requires a selected rank.',
        });
      }
    }
    if (profile.outcome === 'no_suitable_recent_meta_analysis') {
      if (!profile.searchPlan || !profile.searchRun || profile.selectedReferenceId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outcome'],
          message:
            'A no-suitable-result profile requires a completed search and no selected reference.',
        });
      }
      if (profile.searchRun?.selectedRank !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['searchRun', 'selectedRank'],
          message: 'A no-suitable-result profile cannot have a selected rank.',
        });
      }
    }
    if (profile.outcome === 'requires_other_evidence') {
      if (
        profile.metaAnalysisFit !== 'not_applicable' ||
        profile.searchPlan ||
        profile.searchRun ||
        profile.selectedReferenceId
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outcome'],
          message:
            'A requires-other-evidence profile must be marked not applicable and have no meta-analysis search result.',
        });
      }
    }
  });
export type TicketLiteratureScoutProfile = z.infer<typeof TicketLiteratureScoutProfileSchema>;

export const TicketLiteratureScoutAttachmentSchema = z
  .object({
    ticketId: StableIdSchema,
    profileIds: z.array(StableIdSchema),
    exemptionReason: z.string().min(1).max(1000).nullable(),
  })
  .strict()
  .superRefine((attachment, context) => {
    if ((attachment.profileIds.length === 0) === (attachment.exemptionReason === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['profileIds'],
        message:
          'A ticket literature attachment must have profiles or one explicit exemption reason, but not both.',
      });
    }
  });
export type TicketLiteratureScoutAttachment = z.infer<typeof TicketLiteratureScoutAttachmentSchema>;

export const TicketLiteratureScoutCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: z.literal('ticket-literature-scout.psychsim'),
    references: z.array(TicketLiteratureScoutReferenceSchema),
    profiles: z.array(TicketLiteratureScoutProfileSchema),
    attachments: z.array(TicketLiteratureScoutAttachmentSchema).min(1),
  })
  .strict();
export type TicketLiteratureScoutCatalog = z.infer<typeof TicketLiteratureScoutCatalogSchema>;

export const ClinicalTicketExportBundleSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    exportVersion: z.literal(7),
    bundleId: StableIdSchema,
    buildKind: z.enum(['local_developer', 'portable_reviewer']),
    assignmentId: StableIdSchema.nullable(),
    exportedAt: z.string().datetime(),
    engineVersion: z.string().min(1),
    profileId: StableIdSchema,
    tickets: z.array(ClinicalReviewTicketSchema),
    attemptReviews: z.array(DeveloperAttemptReviewSchema),
    databaseEntryReviews: z.array(DatabaseEntryReviewSchema),
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
    if (
      bundle.buildKind === 'portable_reviewer' &&
      bundle.tickets.some((ticket) => ticket.sourceReviewSnapshot !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tickets'],
        message: 'Portable Reviewer exports cannot contain private source-review snapshots.',
      });
    }
    if (
      bundle.buildKind === 'portable_reviewer' &&
      bundle.tickets.some((ticket) => ticket.id.startsWith('ticket.database-dossier.'))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tickets'],
        message: 'Portable Reviewer exports cannot contain local Developer dossier reviews.',
      });
    }
    const completedAttemptsById = new Map(
      bundle.completedAttempts.map((attempt) => [attempt.id, attempt]),
    );
    const databaseEntryIds = new Set<string>();
    bundle.databaseEntryReviews.forEach((review, index) => {
      if (databaseEntryIds.has(review.entryId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['databaseEntryReviews', index, 'entryId'],
          message: 'An export can contain only one current review per database entry.',
        });
      }
      databaseEntryIds.add(review.entryId);
    });
    for (const [index, review] of bundle.attemptReviews.entries()) {
      if (!completedAttemptsById.has(review.attemptId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['attemptReviews', index, 'attemptId'],
          message: 'Every attempt review must have its completed attempt in the export.',
        });
      }
    }
    for (const [index, flag] of bundle.flags.entries()) {
      if (!completedAttemptsById.has(flag.attemptId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['flags', index, 'attemptId'],
          message: 'Every content flag must have its completed attempt in the export.',
        });
      }
    }
    for (const [index, ticket] of bundle.tickets.entries()) {
      if (ticket.attemptId !== null) {
        const attempt = completedAttemptsById.get(ticket.attemptId);
        if (!attempt) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tickets', index, 'attemptId'],
            message: 'Every attempt-linked ticket must have its completed attempt in the export.',
          });
        } else if (ticket.blueprintId !== null && attempt.blueprintId !== ticket.blueprintId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tickets', index, 'attemptId'],
            message: 'An attempt-linked ticket must match the attempt patient blueprint.',
          });
        }
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
    databaseEntryReviews: z.array(DatabaseEntryReviewSchema).default([]),
    legacyArchive: z.array(LegacySaveArchiveEntrySchema),
  })
  .strict()
  .superRefine((save, context) => {
    const databaseEntryIds = new Set<string>();
    save.databaseEntryReviews.forEach((review, index) => {
      if (databaseEntryIds.has(review.entryId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['databaseEntryReviews', index, 'entryId'],
          message: 'Save data can contain only one current review per database entry.',
        });
      }
      databaseEntryIds.add(review.entryId);
    });
  });
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

export const AppleNotesLocalAcknowledgementSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    noIdentifiablePatientInformation: z.literal(true),
    authorizedForLocalProcessing: z.literal(true),
    sharedMaterialRightsAcknowledged: z.literal(true),
    acknowledgedAt: z.string().datetime(),
    acknowledgedBy: z.string().min(1).max(120),
  })
  .strict();
export type AppleNotesLocalAcknowledgement = z.infer<typeof AppleNotesLocalAcknowledgementSchema>;

export const AppleNotesAttachmentRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    providerAttachmentId: z.string().min(1),
    providerContentIdentifier: z.string().nullable(),
    ordinal: z.number().int().positive(),
    createdAtProvider: z.string().min(1),
    modifiedAtProvider: z.string().min(1),
    exportStatus: z.enum(['pending', 'exported', 'unchanged', 'quarantined', 'missing']),
    relativePath: z.string().min(1).nullable(),
    mediaType: z.string().min(1).nullable(),
    sizeBytes: z.number().int().nonnegative().nullable(),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    duplicateOfId: StableIdSchema.nullable(),
    ocrStatus: z.enum(['not_requested', 'pending', 'completed', 'empty', 'unsupported', 'failed']),
    ocrEngine: z.string().min(1).nullable(),
    ocrTextHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    error: z.string().max(1000).nullable(),
  })
  .strict();
export type AppleNotesAttachmentRecord = z.infer<typeof AppleNotesAttachmentRecordSchema>;

export const AppleNotesNoteRecordSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    providerNoteId: z.string().min(1),
    createdAtProvider: z.string().min(1),
    modifiedAtProvider: z.string().min(1),
    locked: z.boolean(),
    shared: z.boolean(),
    exportStatus: z.enum(['metadata_only', 'exported', 'unchanged', 'quarantined', 'missing']),
    titleHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    plaintextHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    htmlHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    compositeHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    compositeInboxFilename: z.string().min(1).nullable(),
    sourceDocumentId: StableIdSchema.nullable(),
    attachmentRecords: z.array(AppleNotesAttachmentRecordSchema),
    error: z.string().max(1000).nullable(),
  })
  .strict();
export type AppleNotesNoteRecord = z.infer<typeof AppleNotesNoteRecordSchema>;

export const AppleNotesIntakeManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    manifestVersion: z.literal(1),
    provider: z.literal('apple_notes'),
    folderName: z.string().min(1),
    providerAccountId: z.string().min(1),
    providerFolderId: z.string().min(1),
    folderShared: z.boolean(),
    lastAuditedAt: z.string().datetime(),
    lastSynchronizedAt: z.string().datetime().nullable(),
    acknowledgement: AppleNotesLocalAcknowledgementSchema.nullable(),
    notes: z.array(AppleNotesNoteRecordSchema),
  })
  .strict();
export type AppleNotesIntakeManifest = z.infer<typeof AppleNotesIntakeManifestSchema>;

export const Sha256DigestSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const AppleNotesCodexReviewAcknowledgementSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentScope: z.literal('apple_notes_title_plaintext_only'),
    noIdentifiablePatientInformation: z.literal(true),
    authorizedForExternalAiProcessing: z.literal(true),
    titlePlaintextTransmissionRightsAcknowledged: z.literal(true),
    sharedMaterialRightsAcknowledged: z.literal(true),
    appropriateToTransmitToOpenAiCodex: z.literal(true),
    provider: z.literal('openai_codex'),
    modelIdentifier: z.string().min(1).max(200),
    acknowledgedAt: z.string().datetime(),
    acknowledgedBy: z.string().min(1).max(120),
  })
  .strict();
export type AppleNotesCodexReviewAcknowledgement = z.infer<
  typeof AppleNotesCodexReviewAcknowledgementSchema
>;

export const AppleNotesCodexReviewPacketSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    packetVersion: z.literal(1),
    id: StableIdSchema,
    packetBuilderVersion: z.literal('psychsim-apple-notes-codex-review-1'),
    segmenterVersion: z.literal('psychsim-utf8-segmenter-1'),
    sourceProvider: z.literal('apple_notes'),
    contentScope: z.literal('title_plaintext_only'),
    reviewPurpose: z.literal('private_semantic_source_classification'),
    noteRecordId: StableIdSchema,
    relatedSourceDocumentId: StableIdSchema,
    sourceModifiedAtProvider: z.string().min(1).max(200),
    titleHash: Sha256DigestSchema,
    plaintextHash: Sha256DigestSchema,
    segmentOrdinal: z.number().int().nonnegative(),
    segmentCount: z.number().int().positive().max(2048),
    segmentHash: Sha256DigestSchema,
    preparedForProvider: z.literal('openai_codex'),
    modelIdentifier: z.string().min(1).max(200),
    untrustedSourceData: z.literal(true),
    title: z.string(),
    plaintextSegment: z.string(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.segmentOrdinal >= value.segmentCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['segmentOrdinal'],
        message: 'Segment ordinal must be less than segment count.',
      });
    }
  });
export type AppleNotesCodexReviewPacket = z.infer<typeof AppleNotesCodexReviewPacketSchema>;

export const AppleNotesCodexReviewAuditEntrySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    packetId: StableIdSchema,
    packetRelativePath: z.string().min(1),
    packetSha256: Sha256DigestSchema,
    noteRecordId: StableIdSchema,
    relatedSourceDocumentId: StableIdSchema,
    titleHash: Sha256DigestSchema,
    plaintextHash: Sha256DigestSchema,
    segmentOrdinal: z.number().int().nonnegative(),
    segmentCount: z.number().int().positive().max(2048),
    segmentHash: Sha256DigestSchema,
    segmenterVersion: z.literal('psychsim-utf8-segmenter-1'),
    acknowledgement: AppleNotesCodexReviewAcknowledgementSchema,
    releasedForReviewAt: z.string().datetime(),
  })
  .strict();
export type AppleNotesCodexReviewAuditEntry = z.infer<typeof AppleNotesCodexReviewAuditEntrySchema>;

export const AppleNotesCodexReviewAuditManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    manifestVersion: z.literal(1),
    provider: z.literal('apple_notes'),
    reviewBridgeVersion: z.literal('psychsim-apple-notes-codex-review-1'),
    updatedAt: z.string().datetime(),
    entries: z.array(AppleNotesCodexReviewAuditEntrySchema),
  })
  .strict();
export type AppleNotesCodexReviewAuditManifest = z.infer<
  typeof AppleNotesCodexReviewAuditManifestSchema
>;

export const PersonalKnowledgeTargetKindSchema = z.enum([
  'medication',
  'diagnosis',
  'intervention',
  'test',
  'clinical_tag',
  'clinical_rule',
  'patient_template',
]);
export type PersonalKnowledgeTargetKind = z.infer<typeof PersonalKnowledgeTargetKindSchema>;

export const PersonalKnowledgeTargetRoleSchema = z.enum([
  'subject',
  'context',
  'comparator',
  'affected_rule',
]);

export const PersonalKnowledgeResolvedTargetSchema = z
  .object({
    resolution: z.literal('resolved'),
    targetKind: PersonalKnowledgeTargetKindSchema,
    targetContentId: StableIdSchema,
    role: PersonalKnowledgeTargetRoleSchema,
    rationale: z.string().min(1).max(500),
  })
  .strict();
export type PersonalKnowledgeResolvedTarget = z.infer<typeof PersonalKnowledgeResolvedTargetSchema>;

export const PersonalKnowledgeUnresolvedTargetSchema = z
  .object({
    resolution: z.literal('unresolved'),
    targetKindHint: PersonalKnowledgeTargetKindSchema.nullable(),
    searchLabel: z.string().min(1).max(200),
    role: PersonalKnowledgeTargetRoleSchema,
    reason: z.string().min(1).max(500),
  })
  .strict();

export const PersonalKnowledgeTargetReferenceSchema = z.discriminatedUnion('resolution', [
  PersonalKnowledgeResolvedTargetSchema,
  PersonalKnowledgeUnresolvedTargetSchema,
]);
export type PersonalKnowledgeTargetReference = z.infer<
  typeof PersonalKnowledgeTargetReferenceSchema
>;

export const PersonalKnowledgePilotProfileSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    label: z.string().min(1).max(180),
    description: z.string().min(1).max(800),
    contentScope: z.literal('apple_notes_title_plaintext_only'),
    requiredTermGroups: z
      .array(
        z
          .object({
            id: StableIdSchema,
            label: z.string().min(1).max(120),
            terms: z.array(z.string().min(2).max(120)).min(1),
          })
          .strict(),
      )
      .min(1),
    targetMatchers: z
      .array(
        z
          .object({
            id: StableIdSchema,
            target: PersonalKnowledgeResolvedTargetSchema,
            terms: z.array(z.string().min(2).max(120)).min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type PersonalKnowledgePilotProfile = z.infer<typeof PersonalKnowledgePilotProfileSchema>;

export const PersonalKnowledgePilotQueueEntrySchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    profileId: StableIdSchema,
    noteRecordId: StableIdSchema,
    sourceDocumentId: StableIdSchema,
    titleHash: Sha256DigestSchema,
    plaintextHash: Sha256DigestSchema,
    sourceModifiedAtProvider: z.string().min(1).max(200),
    matchedRequiredGroupIds: z.array(StableIdSchema),
    matchedTargetMatcherIds: z.array(StableIdSchema),
    matchedTargetContentIds: z.array(StableIdSchema),
    distinctSignalCount: z.number().int().nonnegative(),
    totalMatchCount: z.number().int().nonnegative(),
    state: z.enum([
      'queued',
      'released',
      'partially_classified',
      'classified',
      'adjudicated',
      'stale',
    ]),
    expectedSegmentCount: z.number().int().positive().max(2048).nullable().default(null),
    releasedPacketIds: z.array(StableIdSchema),
    releasedSegmentOrdinals: z.array(z.number().int().nonnegative().max(2047)).default([]),
    classifiedSegmentOrdinals: z.array(z.number().int().nonnegative().max(2047)).default([]),
  })
  .strict()
  .superRefine((entry, context) => {
    const released = new Set(entry.releasedSegmentOrdinals);
    const classified = new Set(entry.classifiedSegmentOrdinals);
    if (
      released.size !== entry.releasedSegmentOrdinals.length ||
      classified.size !== entry.classifiedSegmentOrdinals.length ||
      new Set(entry.releasedPacketIds).size !== entry.releasedPacketIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['releasedSegmentOrdinals'],
        message: 'Packet IDs and segment progress must not contain duplicates.',
      });
    }
    if (entry.expectedSegmentCount === null) {
      if (
        entry.releasedPacketIds.length > 0 ||
        released.size > 0 ||
        classified.size > 0 ||
        !['queued', 'stale'].includes(entry.state)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expectedSegmentCount'],
          message: 'Unsegmented entries cannot claim packet or classification progress.',
        });
      }
      return;
    }
    if ([...released, ...classified].some((ordinal) => ordinal >= entry.expectedSegmentCount!)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['releasedSegmentOrdinals'],
        message: 'Segment progress exceeds the recorded segment count.',
      });
    }
    if ([...classified].some((ordinal) => !released.has(ordinal))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['classifiedSegmentOrdinals'],
        message: 'A segment must be released before it can be classified.',
      });
    }
    if (entry.releasedPacketIds.length !== released.size) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['releasedPacketIds'],
        message: 'Every released segment requires one audited packet ID.',
      });
    }
    if (entry.state === 'stale') return;
    const fullyClassified = classified.size === entry.expectedSegmentCount;
    const hasUnclassifiedRelease = [...released].some((ordinal) => !classified.has(ordinal));
    const validState =
      (entry.state === 'queued' && released.size === 0 && classified.size === 0) ||
      (entry.state === 'released' && hasUnclassifiedRelease) ||
      (entry.state === 'partially_classified' &&
        classified.size > 0 &&
        !fullyClassified &&
        !hasUnclassifiedRelease) ||
      (['classified', 'adjudicated'].includes(entry.state) && fullyClassified);
    if (!validState) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['state'],
        message: 'Queue state does not match its released and classified segment progress.',
      });
    }
  });
export type PersonalKnowledgePilotQueueEntry = z.infer<
  typeof PersonalKnowledgePilotQueueEntrySchema
>;

export const PersonalKnowledgePilotQueueSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    queueVersion: z.literal(1),
    profileId: StableIdSchema,
    contentScope: z.literal('apple_notes_title_plaintext_only'),
    generatedAt: z.string().datetime(),
    entries: z.array(PersonalKnowledgePilotQueueEntrySchema),
  })
  .strict();
export type PersonalKnowledgePilotQueue = z.infer<typeof PersonalKnowledgePilotQueueSchema>;

export const PersonalKnowledgeSourceLocatorSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('apple_notes_packet'),
      sourceDocumentId: StableIdSchema,
      packetId: StableIdSchema,
      segmentOrdinal: z.number().int().nonnegative(),
      segmentHash: Sha256DigestSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('source_chunk'),
      sourceDocumentId: StableIdSchema,
      sourceChunkId: StableIdSchema,
      textHash: Sha256DigestSchema,
    })
    .strict(),
]);
export type PersonalKnowledgeSourceLocator = z.infer<typeof PersonalKnowledgeSourceLocatorSchema>;

export const PersonalKnowledgeCurrentnessSchema = z.enum([
  'needs_currentness_review',
  'current',
  'superseded',
  'retired',
]);

export const PersonalKnowledgeCandidateReviewStatusSchema = z.enum([
  'proposed',
  'in_review',
  'accepted',
  'rejected',
  'deferred',
  'duplicate',
]);

const AuthoredSourceUnitMetadataShape = {
  sourceLocators: z.array(PersonalKnowledgeSourceLocatorSchema).min(1),
  unitKind: z.enum([
    'personal_takeaway',
    'self_authored_article',
    'third_party_article',
    'presentation',
    'bibliography',
    'mixed',
    'unknown',
  ]),
  boundaryState: z.enum(['complete', 'partial', 'continuation', 'uncertain']),
  title: z.string().max(500).nullable(),
  byline: z.string().max(500).nullable(),
  venue: z.string().max(500).nullable(),
  url: z.string().url().nullable(),
  originalDate: PartialPublicationDateSchema.nullable(),
  revisedDate: PartialPublicationDateSchema.nullable(),
  assertedAuthorship: z.enum(['user_authored', 'coauthored', 'third_party', 'unknown']),
  rightsState: z.enum([
    'not_assessed',
    'private_processing_only',
    'permission_required',
    'excluded',
  ]),
  currentness: PersonalKnowledgeCurrentnessSchema,
  excludedMaterialKinds: z.array(
    z.enum([
      'third_party_quote',
      'table',
      'figure',
      'instrument',
      'screenshot',
      'patient_information',
      'other',
    ]),
  ),
  targets: z.array(PersonalKnowledgeTargetReferenceSchema),
} as const;

export const AuthoredSourceUnitCandidateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    candidateVersion: z.literal(1),
    id: StableIdSchema,
    ...AuthoredSourceUnitMetadataShape,
    semanticRunId: StableIdSchema,
    reviewStatus: PersonalKnowledgeCandidateReviewStatusSchema,
  })
  .strict();
export type AuthoredSourceUnitCandidate = z.infer<typeof AuthoredSourceUnitCandidateSchema>;

export const AuthoredSourceUnitSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    ...AuthoredSourceUnitMetadataShape,
    targets: z.array(PersonalKnowledgeResolvedTargetSchema),
    originCandidateIds: z.array(StableIdSchema).min(1),
    reviewedBy: z.string().min(1).max(160),
    reviewedAt: z.string().datetime(),
    reviewNote: z.string().max(1200),
    supersedesUnitIds: z.array(StableIdSchema),
  })
  .strict();
export type AuthoredSourceUnit = z.infer<typeof AuthoredSourceUnitSchema>;

export const BibliographicCandidateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    candidateVersion: z.literal(1),
    id: StableIdSchema,
    sourceUnitCandidateIds: z.array(StableIdSchema),
    sourceUnitIds: z.array(StableIdSchema),
    sourceLocators: z.array(PersonalKnowledgeSourceLocatorSchema).min(1),
    citationRole: z.enum(['primary_subject', 'embedded_reference', 'mentioned_source', 'unclear']),
    title: z.string().max(500).nullable(),
    authors: z.array(z.string().min(1).max(200)),
    organization: z.string().max(300).nullable(),
    year: z.number().int().min(1800).max(2200).nullable(),
    doi: z.string().max(200).nullable(),
    pmid: z.string().regex(/^\d+$/).nullable(),
    url: z.string().url().nullable(),
    citationText: z.string().max(1200).nullable(),
    targets: z.array(PersonalKnowledgeTargetReferenceSchema),
    verificationStatus: z.enum([
      'unverified',
      'verified_match',
      'ambiguous',
      'not_found',
      'rejected',
    ]),
    matchedEvidenceSourceId: StableIdSchema.nullable(),
    semanticRunId: StableIdSchema,
    reviewStatus: PersonalKnowledgeCandidateReviewStatusSchema,
  })
  .strict()
  .superRefine((candidate, context) => {
    if (candidate.sourceUnitCandidateIds.length + candidate.sourceUnitIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceUnitCandidateIds'],
        message: 'A bibliographic candidate requires at least one source-unit relationship.',
      });
    }
    if (
      (candidate.verificationStatus === 'verified_match') !==
      (candidate.matchedEvidenceSourceId !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matchedEvidenceSourceId'],
        message: 'Only a verified bibliographic match may identify a formal evidence source.',
      });
    }
  });
export type BibliographicCandidate = z.infer<typeof BibliographicCandidateSchema>;

export const DeveloperOpinionCandidateSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    candidateVersion: z.literal(1),
    id: StableIdSchema,
    sourceUnitCandidateIds: z.array(StableIdSchema),
    sourceUnitIds: z.array(StableIdSchema),
    sourceLocators: z.array(PersonalKnowledgeSourceLocatorSchema).min(1),
    summary: z.string().min(1).max(800),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    asOfDate: PartialPublicationDateSchema.nullable(),
    asOfDateBasis: z.enum(['source_date', 'revision_date', 'note_date', 'unknown']),
    currentness: PersonalKnowledgeCurrentnessSchema,
    targets: z.array(PersonalKnowledgeTargetReferenceSchema).min(1),
    nearbyBibliographicCandidateIds: z.array(StableIdSchema),
    semanticRunId: StableIdSchema,
    reviewStatus: PersonalKnowledgeCandidateReviewStatusSchema,
    medicalReviewStatus: z.literal('unreviewed'),
    needsHumanReview: z.literal(true),
  })
  .strict()
  .superRefine((candidate, context) => {
    if (candidate.sourceUnitCandidateIds.length + candidate.sourceUnitIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceUnitCandidateIds'],
        message: 'A Developer-opinion candidate requires at least one source-unit relationship.',
      });
    }
  });
export type DeveloperOpinionCandidate = z.infer<typeof DeveloperOpinionCandidateSchema>;

export const DeveloperOpinionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    summary: z.string().min(1).max(800),
    developerId: z.string().min(1).max(160),
    originKind: z.enum(['private_source', 'direct_reviewer_statement']),
    originSourceUnitIds: z.array(StableIdSchema),
    originCandidateIds: z.array(StableIdSchema),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    asOfDate: PartialPublicationDateSchema.nullable(),
    currentness: PersonalKnowledgeCurrentnessSchema,
    targets: z.array(PersonalKnowledgeResolvedTargetSchema).min(1),
    developerReview: z
      .object({
        status: z.enum(['accepted', 'superseded', 'retired']),
        reviewerId: z.string().min(1).max(160),
        reviewedAt: z.string().datetime(),
        note: z.string().max(1200),
      })
      .strict(),
    supersedesOpinionIds: z.array(StableIdSchema),
    evidenceRelationshipIds: z.array(StableIdSchema),
    ruleEligibility: z.literal('opinion_only'),
  })
  .strict()
  .superRefine((opinion, context) => {
    if (
      opinion.originKind === 'private_source' &&
      opinion.originSourceUnitIds.length + opinion.originCandidateIds.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['originCandidateIds'],
        message: 'A private-source Developer opinion requires at least one reviewed origin.',
      });
    }
  });
export type DeveloperOpinion = z.infer<typeof DeveloperOpinionSchema>;

export const OpinionEvidenceRelationshipSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    opinionId: StableIdSchema,
    evidenceSourceId: StableIdSchema,
    sourceUseDecisionId: StableIdSchema,
    relationType: z.enum([
      'supports',
      'partially_supports',
      'contextualizes',
      'challenges',
      'limits',
    ]),
    relationshipSummary: z.string().min(1).max(800),
    sourceLocation: z.string().min(1).max(500),
    applicabilityLimitations: z.array(z.string().min(1).max(500)),
    stillExpertBridge: z.boolean(),
    review: z
      .object({
        status: z.enum(['unreviewed', 'accepted', 'rejected', 'superseded']),
        reviewerId: z.string().max(160).nullable(),
        reviewedAt: z.string().datetime().nullable(),
        note: z.string().max(1200),
      })
      .strict(),
  })
  .strict()
  .superRefine((relationship, context) => {
    const reviewed = relationship.review.status !== 'unreviewed';
    const hasReviewer = relationship.review.reviewerId !== null;
    const hasTimestamp = relationship.review.reviewedAt !== null;
    if (
      (reviewed && (!hasReviewer || !hasTimestamp)) ||
      (!reviewed && (hasReviewer || hasTimestamp))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['review'],
        message: 'Evidence-relationship review identity and timestamp must match its status.',
      });
    }
  });
export type OpinionEvidenceRelationship = z.infer<typeof OpinionEvidenceRelationshipSchema>;

export const DeveloperOpinionCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    opinions: z.array(DeveloperOpinionSchema),
    evidenceRelationships: z.array(OpinionEvidenceRelationshipSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    const opinionIds = catalog.opinions.map((opinion) => opinion.id);
    const relationshipIds = catalog.evidenceRelationships.map((relationship) => relationship.id);
    if (
      new Set(opinionIds).size !== opinionIds.length ||
      new Set(relationshipIds).size !== relationshipIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['opinions'],
        message: 'Developer opinions and evidence relationships require unique stable IDs.',
      });
    }
    const opinionIdSet = new Set(opinionIds);
    const relationshipsByOpinionId = new Map<string, string[]>();
    catalog.evidenceRelationships.forEach((relationship, index) => {
      if (!opinionIdSet.has(relationship.opinionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['evidenceRelationships', index, 'opinionId'],
          message: `Evidence relationship references unknown opinion ${relationship.opinionId}.`,
        });
      }
      relationshipsByOpinionId.set(relationship.opinionId, [
        ...(relationshipsByOpinionId.get(relationship.opinionId) ?? []),
        relationship.id,
      ]);
    });
    catalog.opinions.forEach((opinion, index) => {
      const declared = [...opinion.evidenceRelationshipIds].sort();
      const actual = [...(relationshipsByOpinionId.get(opinion.id) ?? [])].sort();
      if (new Set(declared).size !== declared.length || declared.join('|') !== actual.join('|')) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['opinions', index, 'evidenceRelationshipIds'],
          message: 'A Developer opinion must name exactly its cataloged evidence relationships.',
        });
      }
    });
  });
export type DeveloperOpinionCatalog = z.infer<typeof DeveloperOpinionCatalogSchema>;

export const PersonalKnowledgeSemanticRunSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    profileId: StableIdSchema,
    packetId: StableIdSchema,
    packetSha256: Sha256DigestSchema,
    modelIdentifier: z.string().min(1).max(200),
    promptVersion: z.string().min(1).max(120),
    classifiedAt: z.string().datetime(),
    outputSha256: Sha256DigestSchema,
  })
  .strict();
export type PersonalKnowledgeSemanticRun = z.infer<typeof PersonalKnowledgeSemanticRunSchema>;

export const PersonalKnowledgeClassificationResultSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    classificationVersion: z.literal(1),
    id: StableIdSchema,
    profileId: StableIdSchema,
    packetId: StableIdSchema,
    packetSha256: Sha256DigestSchema,
    modelIdentifier: z.string().min(1).max(200),
    promptVersion: z.string().min(1).max(120),
    classifiedAt: z.string().datetime(),
    disposition: z.enum([
      'candidate_material',
      'secondary_context',
      'irrelevant',
      'duplicate',
      'needs_more_context',
    ]),
    dispositionSummary: z.string().min(1).max(800),
    sourceUnitCandidates: z.array(AuthoredSourceUnitCandidateSchema),
    bibliographicCandidates: z.array(BibliographicCandidateSchema),
    opinionCandidates: z.array(DeveloperOpinionCandidateSchema),
  })
  .strict()
  .superRefine((result, context) => {
    result.sourceUnitCandidates.forEach((candidate, index) => {
      if (
        candidate.reviewStatus !== 'proposed' ||
        candidate.currentness !== 'needs_currentness_review'
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sourceUnitCandidates', index],
          message:
            'Imported source-unit candidates must begin proposed and currentness-unreviewed.',
        });
      }
    });
    result.bibliographicCandidates.forEach((candidate, index) => {
      if (
        candidate.reviewStatus !== 'proposed' ||
        candidate.verificationStatus !== 'unverified' ||
        candidate.matchedEvidenceSourceId !== null
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bibliographicCandidates', index],
          message: 'Imported bibliographic candidates cannot verify or approve themselves.',
        });
      }
    });
    result.opinionCandidates.forEach((candidate, index) => {
      if (
        candidate.reviewStatus !== 'proposed' ||
        candidate.currentness !== 'needs_currentness_review'
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['opinionCandidates', index],
          message: 'Imported opinion candidates must begin proposed and currentness-unreviewed.',
        });
      }
    });
  });
export type PersonalKnowledgeClassificationResult = z.infer<
  typeof PersonalKnowledgeClassificationResultSchema
>;

export const PersonalKnowledgeWorkspaceSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    workspaceVersion: z.literal(1),
    updatedAt: z.string().datetime(),
    contentScope: z.literal('apple_notes_title_plaintext_only'),
    semanticRuns: z.array(PersonalKnowledgeSemanticRunSchema),
    sourceUnitCandidates: z.array(AuthoredSourceUnitCandidateSchema),
    sourceUnits: z.array(AuthoredSourceUnitSchema),
    bibliographicCandidates: z.array(BibliographicCandidateSchema),
    opinionCandidates: z.array(DeveloperOpinionCandidateSchema),
    opinions: z.array(DeveloperOpinionSchema),
    opinionEvidenceRelationships: z.array(OpinionEvidenceRelationshipSchema),
  })
  .strict();
export type PersonalKnowledgeWorkspace = z.infer<typeof PersonalKnowledgeWorkspaceSchema>;

export const PersonalKnowledgeWorkbenchCandidateSchema = z
  .object({
    id: StableIdSchema,
    summary: z.string().min(1).max(800),
    sourceUnitId: StableIdSchema,
    sourceDate: PartialPublicationDateSchema.nullable(),
    currentness: PersonalKnowledgeCurrentnessSchema,
    reviewStatus: PersonalKnowledgeCandidateReviewStatusSchema,
    contributionTypes: z.array(EvidenceContributionTypeSchema).default([]),
    resolvedTargets: z
      .array(
        z
          .object({
            targetKind: PersonalKnowledgeTargetKindSchema,
            targetContentId: StableIdSchema,
            role: PersonalKnowledgeTargetRoleSchema,
          })
          .strict(),
      )
      .default([]),
    unresolvedTargets: z.array(
      z
        .object({
          targetKindHint: PersonalKnowledgeTargetKindSchema.nullable(),
          searchLabel: z.string().min(1).max(200),
          role: PersonalKnowledgeTargetRoleSchema,
          reason: z.string().min(1).max(500),
        })
        .strict(),
    ),
    evidenceRelations: z.array(
      z
        .object({
          evidenceSourceId: StableIdSchema,
          relationship: z.enum([
            'supports',
            'partially_supports',
            'contextualizes',
            'challenges',
            'limits',
          ]),
          stillExpertBridge: z.boolean(),
          reviewStatus: z.enum(['unreviewed', 'accepted', 'rejected', 'superseded']),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((candidate, context) => {
    const resolvedTargetKeys = candidate.resolvedTargets.map(
      (target) => `${target.targetKind}:${target.targetContentId}:${target.role}`,
    );
    if (
      new Set(candidate.contributionTypes).size !== candidate.contributionTypes.length ||
      new Set(resolvedTargetKeys).size !== resolvedTargetKeys.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Workbench candidate contribution types and resolved targets must be unique.',
      });
    }
  });

export const PersonalKnowledgeWorkbenchBibliographicCandidateSchema = z
  .object({
    id: StableIdSchema,
    displayCitation: z.string().min(1).max(1200),
    verificationStatus: z.enum([
      'unverified',
      'verified_match',
      'ambiguous',
      'not_found',
      'rejected',
    ]),
    matchedEvidenceSourceId: StableIdSchema.nullable(),
  })
  .strict();

export const PersonalKnowledgeWorkbenchSourceUnitCandidateSchema = z
  .object({
    id: StableIdSchema,
    unitKind: z.enum([
      'personal_takeaway',
      'self_authored_article',
      'third_party_article',
      'presentation',
      'bibliography',
      'mixed',
      'unknown',
    ]),
    boundaryState: z.enum(['complete', 'partial', 'continuation', 'uncertain']),
    currentness: PersonalKnowledgeCurrentnessSchema,
    reviewStatus: PersonalKnowledgeCandidateReviewStatusSchema,
    resolvedTargetIds: z.array(StableIdSchema),
    unresolvedTargetLabels: z.array(z.string().min(1).max(200)),
  })
  .strict();

export const PersonalKnowledgeWorkbenchProjectionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    projectionVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    pilotTopicId: StableIdSchema,
    summary: z
      .object({
        intakeEligibleSources: z.number().int().nonnegative(),
        queuedSources: z.number().int().nonnegative(),
        releasedSources: z.number().int().nonnegative(),
        partiallyClassifiedSources: z.number().int().nonnegative(),
        classifiedSources: z.number().int().nonnegative(),
        sourceUnits: z.number().int().nonnegative(),
        opinionCandidates: z.number().int().nonnegative(),
        mappedCandidates: z.number().int().nonnegative(),
        unmappedCandidates: z.number().int().nonnegative(),
        needsCurrentnessReview: z.number().int().nonnegative(),
        bibliographicCandidates: z.number().int().nonnegative(),
        verifiedBibliography: z.number().int().nonnegative(),
        acceptedOpinions: z.number().int().nonnegative(),
        evidenceLinkedOpinions: z.number().int().nonnegative(),
        ocrAttachmentsOutsideSemanticScope: z.number().int().nonnegative(),
      })
      .strict(),
    dossiers: z.array(
      z
        .object({
          targetId: StableIdSchema,
          targetKind: z.enum(['medication', 'diagnosis', 'intervention', 'test']),
          label: z.string().min(1).max(200),
          queuedSourceCount: z.number().int().nonnegative(),
          sourceUnitCount: z.number().int().nonnegative(),
          formalEvidenceSourceIds: z.array(StableIdSchema),
          currentRuleIds: z.array(StableIdSchema),
          balanceEntries: z.array(
            z
              .object({
                id: StableIdSchema,
                summary: z.string().min(1).max(500),
                pointDelta: z.number().int(),
                reviewStatus: MedicalReviewStatusSchema,
              })
              .strict(),
          ),
          bibliographicCandidates: z.array(PersonalKnowledgeWorkbenchBibliographicCandidateSchema),
          candidates: z.array(PersonalKnowledgeWorkbenchCandidateSchema),
        })
        .strict(),
    ),
    sourceUnitCandidates: z.array(PersonalKnowledgeWorkbenchSourceUnitCandidateSchema),
    unmappedCandidates: z.array(PersonalKnowledgeWorkbenchCandidateSchema),
    unmappedBibliographicCandidates: z.array(
      PersonalKnowledgeWorkbenchBibliographicCandidateSchema,
    ),
    warnings: z.array(z.string().min(1).max(500)),
  })
  .strict();
export type PersonalKnowledgeWorkbenchProjection = z.infer<
  typeof PersonalKnowledgeWorkbenchProjectionSchema
>;

export const PersonalKnowledgeAuthoringAliasCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    runtimeExcluded: z.literal(true),
    entries: z.array(
      z
        .object({
          id: StableIdSchema,
          targetCategoryId: PublicClinicalCatalogCategoryIdSchema,
          targetContentId: StableIdSchema,
          aliases: z.array(z.string().min(2).max(300)).min(1),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((catalog, context) => {
    const entryIds = new Set<string>();
    const targetIds = new Set<string>();
    catalog.entries.forEach((entry, index) => {
      if (entryIds.has(entry.id) || targetIds.has(entry.targetContentId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index],
          message: 'Authoring alias entries require unique IDs and target content IDs.',
        });
      }
      entryIds.add(entry.id);
      targetIds.add(entry.targetContentId);
      const normalizedAliases = entry.aliases.map((alias) =>
        alias.normalize('NFKC').toLocaleLowerCase('en-US').trim(),
      );
      if (new Set(normalizedAliases).size !== normalizedAliases.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index, 'aliases'],
          message: 'Authoring aliases must be unique after normalization.',
        });
      }
    });
  });
export type PersonalKnowledgeAuthoringAliasCatalog = z.infer<
  typeof PersonalKnowledgeAuthoringAliasCatalogSchema
>;

export const PersonalKnowledgePrivateSourceCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentVersion: ContentVersionSchema,
    id: StableIdSchema,
    runtimeExcluded: z.literal(true),
    entries: z.array(
      z
        .object({
          id: StableIdSchema,
          expectedSha256: Sha256DigestSchema,
          sourceKind: z.enum(['user_authored_archive', 'private_drive_notes']),
          sourceRole: z.enum(['user_authored_article', 'private_notes']),
          unitStrategy: z.enum(['parser_v5_section_instance', 'parser_v5_unsectioned_chunks']),
          rightsState: z.literal('private_processing_only'),
          semanticBoundaryReview: z
            .object({
              status: z.enum(['approved', 'pending']),
              parserVersion: z.literal('psychsim-source-parser-5'),
              extractedTextHash: Sha256DigestSchema,
              decisionSummary: z.string().min(1).max(800),
              reviewedBy: z.string().min(1).max(160).nullable(),
              reviewedAt: z.string().datetime().nullable(),
            })
            .strict(),
        })
        .strict()
        .superRefine((entry, context) => {
          const reviewed = entry.semanticBoundaryReview.status === 'approved';
          if (
            reviewed !==
            Boolean(
              entry.semanticBoundaryReview.reviewedBy && entry.semanticBoundaryReview.reviewedAt,
            )
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['semanticBoundaryReview'],
              message: 'An approved private-source boundary requires reviewer identity and time.',
            });
          }
        }),
    ),
  })
  .strict();
export type PersonalKnowledgePrivateSourceCatalog = z.infer<
  typeof PersonalKnowledgePrivateSourceCatalogSchema
>;

export const PersonalKnowledgePrivateCorpusAcknowledgementSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    contentScope: z.literal('enrolled_private_corpus_source_unit'),
    noIdentifiablePatientInformation: z.literal(true),
    authorizedForExternalAiProcessing: z.literal(true),
    sourceProcessingRightsAcknowledged: z.literal(true),
    appropriateToTransmitToOpenAiCodex: z.literal(true),
    provider: z.literal('openai_codex'),
    modelIdentifier: z.string().min(1).max(200),
    acknowledgedAt: z.string().datetime(),
    acknowledgedBy: z.string().min(1).max(160),
  })
  .strict();

export const PersonalKnowledgePrivateCorpusClassificationSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    classificationVersion: z.literal(1),
    id: StableIdSchema,
    sourceDescriptorId: StableIdSchema,
    sourceDocumentId: StableIdSchema,
    sourceDocumentSha256: Sha256DigestSchema,
    parserVersion: z.literal('psychsim-source-parser-5'),
    developerDatabaseUnitId: StableIdSchema.refine(
      (value) => /^knowledge-unit\.[a-f0-9]{24}$/.test(value),
      'Expected an opaque Developer database unit ID',
    ),
    unitFingerprint: Sha256DigestSchema,
    classifiedAt: z.string().datetime(),
    modelIdentifier: z.string().min(1).max(200),
    promptVersion: z.string().min(1).max(120),
    acknowledgement: PersonalKnowledgePrivateCorpusAcknowledgementSchema,
    disposition: z.enum([
      'candidate_material',
      'secondary_context',
      'irrelevant',
      'duplicate',
      'needs_more_context',
    ]),
    dispositionSummary: z.string().min(1).max(800),
    sourceUnitCandidate: AuthoredSourceUnitCandidateSchema,
    bibliographicCandidates: z.array(BibliographicCandidateSchema).max(40),
    opinionCandidates: z.array(DeveloperOpinionCandidateSchema).max(8),
  })
  .strict()
  .superRefine((classification, context) => {
    const runMatches =
      classification.sourceUnitCandidate.semanticRunId === classification.id &&
      classification.bibliographicCandidates.every(
        (candidate) => candidate.semanticRunId === classification.id,
      ) &&
      classification.opinionCandidates.every(
        (candidate) => candidate.semanticRunId === classification.id,
      );
    const locators = classification.sourceUnitCandidate.sourceLocators;
    const sourceLocatorsAreExact =
      locators.length > 0 &&
      locators.every(
        (locator) =>
          locator.kind === 'source_chunk' &&
          locator.sourceDocumentId === classification.sourceDocumentId,
      );
    const sourceUnitCandidateId = classification.sourceUnitCandidate.id;
    const candidatesLinkToSourceUnit =
      classification.bibliographicCandidates.every(
        (candidate) =>
          candidate.sourceUnitCandidateIds.length === 1 &&
          candidate.sourceUnitCandidateIds[0] === sourceUnitCandidateId &&
          candidate.sourceUnitIds.length === 0,
      ) &&
      classification.opinionCandidates.every(
        (candidate) =>
          candidate.sourceUnitCandidateIds.length === 1 &&
          candidate.sourceUnitCandidateIds[0] === sourceUnitCandidateId &&
          candidate.sourceUnitIds.length === 0,
      );
    if (
      !runMatches ||
      !sourceLocatorsAreExact ||
      !candidatesLinkToSourceUnit ||
      classification.acknowledgement.modelIdentifier !== classification.modelIdentifier
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceUnitCandidate'],
        message:
          'Private-corpus classification provenance, model acknowledgement, and candidate relationships must remain exact.',
      });
    }
    if (
      classification.disposition === 'candidate_material' &&
      classification.opinionCandidates.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['opinionCandidates'],
        message: 'Candidate-material classifications require at least one atomic opinion.',
      });
    }
    if (
      classification.disposition !== 'candidate_material' &&
      classification.opinionCandidates.length > 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['opinionCandidates'],
        message: 'Only candidate-material classifications may create opinion candidates.',
      });
    }
  });
export type PersonalKnowledgePrivateCorpusClassification = z.infer<
  typeof PersonalKnowledgePrivateCorpusClassificationSchema
>;

export const DeveloperDatabaseSourceKindSchema = z.enum([
  'apple_notes',
  'user_authored_archive',
  'private_drive_notes',
]);
export type DeveloperDatabaseSourceKind = z.infer<typeof DeveloperDatabaseSourceKindSchema>;

export const DeveloperDatabaseSourceSurfaceSchema = z.enum([
  'note_title',
  'note_plaintext',
  'attachment_ocr',
  'structured_document',
]);
export type DeveloperDatabaseSourceSurface = z.infer<typeof DeveloperDatabaseSourceSurfaceSchema>;

export const DeveloperDatabaseSemanticStateSchema = z.enum([
  'not_semantically_reviewed',
  'queued',
  'partially_classified',
  'classified_no_candidate',
  'candidate_created',
  'reviewed_no_change',
  'incorporated',
]);
export type DeveloperDatabaseSemanticState = z.infer<typeof DeveloperDatabaseSemanticStateSchema>;

export const DeveloperDatabaseCorpusUnitSchema = z
  .object({
    id: StableIdSchema,
    sourceKind: DeveloperDatabaseSourceKindSchema,
    sourceRole: z.enum(['personal_research_note', 'user_authored_article', 'private_notes']),
    displayLabel: z.string().min(1).max(180),
    sourceModifiedAt: z.string().min(1).max(200).nullable(),
    surfaces: z.array(DeveloperDatabaseSourceSurfaceSchema).min(1),
    boundaryState: z.enum(['complete', 'warning', 'unstructured']),
    accessState: z.enum(['fully_indexed', 'partially_indexed', 'quarantined']),
    semanticState: DeveloperDatabaseSemanticStateSchema,
    semanticDisposition: z
      .enum([
        'candidate_material',
        'secondary_context',
        'irrelevant',
        'duplicate',
        'needs_more_context',
      ])
      .nullable(),
    semanticSummary: z.string().min(1).max(800).nullable(),
    targetEntryIds: z.array(StableIdSchema),
    totalMatches: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((unit, context) => {
    if ((unit.semanticDisposition === null) !== (unit.semanticSummary === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['semanticSummary'],
        message: 'Semantic disposition and summary must be present or absent together.',
      });
    }
    if (
      unit.semanticState === 'not_semantically_reviewed' &&
      (unit.semanticDisposition !== null || unit.semanticSummary !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['semanticState'],
        message: 'An unreviewed corpus unit cannot claim a semantic classification.',
      });
    }
  });
export type DeveloperDatabaseCorpusUnit = z.infer<typeof DeveloperDatabaseCorpusUnitSchema>;

export const DeveloperDatabaseLexicalSignalSchema = z
  .object({
    unitId: StableIdSchema,
    sourceKind: DeveloperDatabaseSourceKindSchema,
    sourceRole: z.enum(['personal_research_note', 'user_authored_article', 'private_notes']),
    sourceModifiedAt: z.string().min(1).max(200).nullable(),
    surfaces: z.array(DeveloperDatabaseSourceSurfaceSchema).min(1),
    semanticState: DeveloperDatabaseSemanticStateSchema,
    totalMatches: z.number().int().positive(),
    matchedTerms: z
      .array(
        z
          .object({
            term: z.string().min(1).max(300),
            count: z.number().int().positive(),
            surfaces: z.array(DeveloperDatabaseSourceSurfaceSchema).min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const DeveloperDatabaseFormalSourceSchema = z
  .object({
    id: StableIdSchema,
    title: z.string().min(1).max(600),
    citation: z.string().min(1).max(1200),
    url: z
      .string()
      .url()
      .refine((value) => /^https:\/\//i.test(value), 'Formal-source URLs must use HTTPS.'),
    sourceUseDecisionId: StableIdSchema.nullable(),
    sourceUseStatus: z
      .enum([
        'permitted_with_conditions',
        'metadata_only',
        'blocked_pending_permission',
        'not_reviewed',
        'not_recorded',
      ])
      .default('not_recorded'),
    derivedClinicalContentPermitted: z.boolean(),
    runtimeRedistributionPermitted: z.boolean(),
    attributionStatement: z.string().min(1).max(2000).nullable(),
    requiredNotices: z.array(z.string().min(1).max(1200)),
    sourceUseReviewedAt: z.string().datetime().nullable(),
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict();

export const DeveloperDatabaseFormalContributionSchema = z
  .object({
    id: StableIdSchema,
    authority: EvidenceAuthoritySchema,
    summary: z.string().min(1).max(800),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    evidenceSources: z.array(DeveloperDatabaseFormalSourceSchema),
    generatedBy: z.enum(['human', 'ai']),
    medicalReviewStatus: MedicalReviewStatusSchema,
  })
  .strict();

export const DeveloperDatabaseOpinionEvidenceRelationshipSchema = z
  .object({
    id: StableIdSchema,
    relationType: z.enum([
      'supports',
      'partially_supports',
      'contextualizes',
      'challenges',
      'limits',
    ]),
    relationshipSummary: z.string().min(1).max(800),
    sourceLocation: z.string().min(1).max(500),
    applicabilityLimitations: z.array(z.string().min(1).max(500)),
    stillExpertBridge: z.boolean(),
    evidenceSource: DeveloperDatabaseFormalSourceSchema,
    reviewStatus: z.enum(['unreviewed', 'accepted', 'rejected', 'superseded']),
  })
  .strict();

export const DeveloperDatabaseDeveloperOpinionSchema = z
  .object({
    id: StableIdSchema,
    summary: z.string().min(1).max(800),
    developerId: z.string().min(1).max(160),
    contributionTypes: z.array(EvidenceContributionTypeSchema).min(1),
    asOfDate: PartialPublicationDateSchema.nullable(),
    currentness: PersonalKnowledgeCurrentnessSchema,
    targetEntryIds: z.array(StableIdSchema).min(1),
    reviewStatus: z.enum(['accepted', 'superseded', 'retired']),
    reviewedBy: z.string().min(1).max(160),
    reviewedAt: z.string().datetime(),
    reviewNote: z.string().max(1200),
    evidenceRelationships: z.array(DeveloperDatabaseOpinionEvidenceRelationshipSchema),
    ruleEligibility: z.literal('opinion_only'),
  })
  .strict();

export const DeveloperDatabaseRuleSummarySchema = z
  .object({
    id: StableIdSchema,
    ruleKind: z.enum([
      'active_medication_fit',
      'inactive_author_override',
      'diagnosis_recommendation',
    ]),
    summary: z.string().min(1).max(1200),
    pointDelta: z.number().int().min(-100).max(100).nullable(),
    stance: RecommendationStanceSchema.nullable(),
    medicalReviewStatus: MedicalReviewStatusSchema,
    sourceUseNoteIds: z.array(StableIdSchema),
  })
  .strict();

export const DeveloperDatabaseCrossReferenceRecordSchema = z
  .object({
    entryId: StableIdSchema,
    categoryId: PublicClinicalCatalogCategoryIdSchema,
    label: z.string().min(1).max(600),
    compilationState: z.enum([
      'identity_only',
      'no_personal_match',
      'lexically_linked',
      'candidate_material',
      'reviewed_knowledge',
    ]),
    indexedTerms: z.array(z.string().min(1).max(300)).min(1),
    personalSourceUnitCount: z.number().int().nonnegative(),
    personalSourceTotalMatches: z.number().int().nonnegative(),
    lexicalSignals: z.array(DeveloperDatabaseLexicalSignalSchema),
    candidateSummaries: z.array(PersonalKnowledgeWorkbenchCandidateSchema),
    unresolvedCandidateMentions: z.array(PersonalKnowledgeWorkbenchCandidateSchema).default([]),
    bibliographicCandidates: z.array(PersonalKnowledgeWorkbenchBibliographicCandidateSchema),
    formalContributions: z.array(DeveloperDatabaseFormalContributionSchema),
    developerOpinions: z.array(DeveloperDatabaseDeveloperOpinionSchema).default([]),
    ruleSummaries: z.array(DeveloperDatabaseRuleSummarySchema),
    relatedEntryIds: z.array(StableIdSchema),
  })
  .strict();

export const DeveloperDatabaseCatalogIdentityOccurrenceSchema = z
  .object({
    candidateId: StableIdSchema,
    targetKindHint: PersonalKnowledgeTargetKindSchema.nullable(),
    searchLabel: z.string().min(1).max(200),
    role: PersonalKnowledgeTargetRoleSchema,
    reason: z.string().min(1).max(500),
  })
  .strict();

export const DeveloperDatabaseCatalogIdentityGapSchema = z
  .object({
    id: StableIdSchema,
    normalizedSearchLabel: z.string().min(1).max(200),
    displayLabel: z.string().min(1).max(200),
    targetKindHint: PersonalKnowledgeTargetKindSchema.nullable(),
    status: z.enum([
      'likely_existing_entry',
      'ambiguous_existing_entries',
      'proposed_new_catalog_entry',
      'non_catalog_target',
      'needs_kind_review',
    ]),
    candidateEntryIds: z.array(StableIdSchema),
    occurrences: z.array(DeveloperDatabaseCatalogIdentityOccurrenceSchema).min(1),
    reviewRequired: z.literal(true),
  })
  .strict();

export const DeveloperDatabaseCatalogTermOverlapSchema = z
  .object({
    id: StableIdSchema,
    normalizedTerm: z.string().min(1).max(300),
    entryIds: z.array(StableIdSchema).min(2),
    reviewStatus: z.literal('needs_developer_review'),
  })
  .strict();

export const DeveloperDatabaseCatalogIdentityAuditSchema = z
  .object({
    identityGaps: z.array(DeveloperDatabaseCatalogIdentityGapSchema),
    overlappingTerms: z.array(DeveloperDatabaseCatalogTermOverlapSchema),
  })
  .strict();

export const DeveloperDatabaseKnowledgeProjectionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    projectionVersion: z.literal(2),
    generatedAt: z.string().datetime(),
    catalogContentVersion: ContentVersionSchema,
    inputFingerprint: Sha256DigestSchema,
    summary: z
      .object({
        personalSourceDocuments: z.number().int().nonnegative(),
        appleNotesRevisions: z.number().int().nonnegative(),
        appleNotesAttachmentRecords: z.number().int().nonnegative(),
        appleNotesOcrCompleted: z.number().int().nonnegative(),
        privateDriveDocuments: z.number().int().nonnegative(),
        userAuthoredArchiveUnits: z.number().int().nonnegative(),
        sourceUnits: z.number().int().nonnegative(),
        fullyIndexedUnits: z.number().int().nonnegative(),
        partiallyIndexedUnits: z.number().int().nonnegative(),
        quarantinedUnits: z.number().int().nonnegative(),
        unitsWithTargetMatches: z.number().int().nonnegative(),
        unitsWithoutTargetMatches: z.number().int().nonnegative(),
        targetEntries: z.number().int().nonnegative(),
        matchedTargetEntries: z.number().int().nonnegative(),
        totalLexicalMatches: z.number().int().nonnegative(),
        semanticallyClassifiedUnits: z.number().int().nonnegative(),
        candidateSummaries: z.number().int().nonnegative(),
        acceptedOpinions: z.number().int().nonnegative(),
        formalContributions: z.number().int().nonnegative(),
        formalSources: z.number().int().nonnegative(),
        registeredFormalSources: z.number().int().nonnegative(),
      })
      .strict(),
    corpusUnits: z.array(DeveloperDatabaseCorpusUnitSchema),
    records: z.array(DeveloperDatabaseCrossReferenceRecordSchema),
    formalSourceRegistry: z.array(DeveloperDatabaseFormalSourceSchema),
    unmappedCandidateSummaries: z.array(PersonalKnowledgeWorkbenchCandidateSchema),
    unmappedBibliographicCandidates: z.array(
      PersonalKnowledgeWorkbenchBibliographicCandidateSchema,
    ),
    catalogIdentityAudit: DeveloperDatabaseCatalogIdentityAuditSchema,
    warnings: z.array(z.string().min(1).max(600)),
  })
  .strict()
  .superRefine((projection, context) => {
    const entryIds = projection.records.map((record) => record.entryId);
    const unitIds = projection.corpusUnits.map((unit) => unit.id);
    const registeredFormalSourceIds = projection.formalSourceRegistry.map((source) => source.id);
    if (
      new Set(entryIds).size !== entryIds.length ||
      new Set(unitIds).size !== unitIds.length ||
      new Set(registeredFormalSourceIds).size !== registeredFormalSourceIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['records'],
        message:
          'Developer database records, corpus units, and registered formal sources require unique IDs.',
      });
    }
    const entryIdSet = new Set(entryIds);
    const recordByEntryId = new Map(
      projection.records.map((record) => [record.entryId, record] as const),
    );
    const expectedCategoryForTargetKind = (
      targetKind: z.infer<typeof PersonalKnowledgeTargetKindSchema>,
    ): z.infer<typeof PublicClinicalCatalogCategoryIdSchema> | null =>
      targetKind === 'medication'
        ? 'medications'
        : targetKind === 'diagnosis'
          ? 'conditions'
          : targetKind === 'intervention'
            ? 'interventions'
            : targetKind === 'test'
              ? 'tests'
              : null;
    const catalogTargetKind = (
      targetKind: z.infer<typeof PersonalKnowledgeTargetKindSchema> | null,
    ): boolean =>
      targetKind === null ||
      ['medication', 'diagnosis', 'intervention', 'test'].includes(targetKind);
    const unitIdSet = new Set(unitIds);
    projection.corpusUnits.forEach((unit, index) => {
      unit.targetEntryIds.forEach((entryId) => {
        if (!entryIdSet.has(entryId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['corpusUnits', index, 'targetEntryIds'],
            message: `Corpus unit references unknown database entry ${entryId}.`,
          });
        }
      });
    });
    projection.records.forEach((record, index) => {
      const candidateLanes = [
        {
          candidates: record.candidateSummaries,
          path: 'candidateSummaries',
        },
        {
          candidates: record.unresolvedCandidateMentions,
          path: 'unresolvedCandidateMentions',
        },
      ] as const;
      candidateLanes.forEach(({ candidates, path }) => {
        candidates.forEach((candidate, candidateIndex) => {
          candidate.resolvedTargets.forEach((target, targetIndex) => {
            const expectedCategory = expectedCategoryForTargetKind(target.targetKind);
            if (expectedCategory === null) return;
            const targetRecord = recordByEntryId.get(target.targetContentId);
            if (!targetRecord) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['records', index, path, candidateIndex, 'resolvedTargets', targetIndex],
                message: `Candidate references unknown database entry ${target.targetContentId}.`,
              });
            } else if (targetRecord.categoryId !== expectedCategory) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['records', index, path, candidateIndex, 'resolvedTargets', targetIndex],
                message: `Candidate target kind ${target.targetKind} does not match database category ${targetRecord.categoryId}.`,
              });
            }
          });
        });
      });
      record.lexicalSignals.forEach((signal) => {
        if (!unitIdSet.has(signal.unitId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'lexicalSignals'],
            message: `Database record references unknown corpus unit ${signal.unitId}.`,
          });
        }
        const matchedTermKeys = signal.matchedTerms.map((match) =>
          match.term.normalize('NFKC').toLocaleLowerCase('en-US').trim(),
        );
        const matchedSurfaces = [
          ...new Set(signal.matchedTerms.flatMap((match) => match.surfaces)),
        ].sort();
        if (
          new Set(matchedTermKeys).size !== matchedTermKeys.length ||
          signal.totalMatches !==
            signal.matchedTerms.reduce((total, match) => total + match.count, 0) ||
          matchedSurfaces.join('|') !== [...signal.surfaces].sort().join('|')
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'lexicalSignals'],
            message: 'Lexical-signal terms, surfaces, and totals must be internally consistent.',
          });
        }
      });
      record.relatedEntryIds.forEach((entryId) => {
        if (!entryIdSet.has(entryId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'relatedEntryIds'],
            message: `Database record references unknown related entry ${entryId}.`,
          });
        }
      });
      if (
        record.personalSourceUnitCount !== record.lexicalSignals.length ||
        record.personalSourceTotalMatches !==
          record.lexicalSignals.reduce((total, signal) => total + signal.totalMatches, 0)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'personalSourceUnitCount'],
          message: 'Database personal-source aggregates must match their lexical signals.',
        });
      }
      const hasAcceptedCandidate =
        record.candidateSummaries.some((candidate) => candidate.reviewStatus === 'accepted') ||
        record.developerOpinions.some((opinion) => opinion.reviewStatus === 'accepted');
      const directCandidateIds = new Set(
        record.candidateSummaries.map((candidate) => candidate.id),
      );
      const unresolvedMentionIds = record.unresolvedCandidateMentions.map(
        (candidate) => candidate.id,
      );
      const indexedTermKeys = new Set(
        record.indexedTerms.map((term) => term.normalize('NFKC').toLocaleLowerCase('en-US').trim()),
      );
      if (
        new Set(unresolvedMentionIds).size !== unresolvedMentionIds.length ||
        unresolvedMentionIds.some((id) => directCandidateIds.has(id))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'unresolvedCandidateMentions'],
          message:
            'Unresolved candidate mentions must be unique and separate from directly mapped candidates.',
        });
      }
      record.unresolvedCandidateMentions.forEach((candidate, candidateIndex) => {
        if (
          !candidate.unresolvedTargets.some((target) =>
            indexedTermKeys.has(
              target.searchLabel.normalize('NFKC').toLocaleLowerCase('en-US').trim(),
            ),
          )
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'unresolvedCandidateMentions', candidateIndex],
            message:
              'An unresolved candidate mention must match an indexed term for the record where it appears.',
          });
        }
      });
      const expectedCompilationState = hasAcceptedCandidate
        ? 'reviewed_knowledge'
        : record.candidateSummaries.length > 0
          ? 'candidate_material'
          : record.lexicalSignals.length > 0
            ? 'lexically_linked'
            : null;
      if (
        (expectedCompilationState && record.compilationState !== expectedCompilationState) ||
        (!expectedCompilationState &&
          !['identity_only', 'no_personal_match'].includes(record.compilationState))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'compilationState'],
          message: 'Database compilation state does not match its semantic and lexical lanes.',
        });
      }
      const contributionIds = record.formalContributions.map((contribution) => contribution.id);
      if (new Set(contributionIds).size !== contributionIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'formalContributions'],
          message: 'Formal contribution IDs must be unique within a database record.',
        });
      }
      record.formalContributions.forEach((contribution, contributionIndex) => {
        const sourceIds = contribution.evidenceSources.map((source) => source.id);
        if (
          new Set(sourceIds).size !== sourceIds.length ||
          (contribution.authority === 'formal_publication' &&
            (sourceIds.length === 0 ||
              contribution.evidenceSources.some(
                (source) =>
                  !source.sourceUseDecisionId ||
                  !source.derivedClinicalContentPermitted ||
                  source.sourceUseStatus !== 'permitted_with_conditions',
              ))) ||
          (contribution.authority === 'expert_opinion' && sourceIds.length > 0)
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'formalContributions', contributionIndex],
            message:
              'Projected contribution authority must match unique, source-use-cleared evidence relationships.',
          });
        }
      });
      const developerOpinionIds = record.developerOpinions.map((opinion) => opinion.id);
      if (new Set(developerOpinionIds).size !== developerOpinionIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'developerOpinions'],
          message: 'Developer-opinion IDs must be unique within a database record.',
        });
      }
      record.developerOpinions.forEach((opinion, opinionIndex) => {
        if (
          !opinion.targetEntryIds.includes(record.entryId) ||
          opinion.targetEntryIds.some((targetEntryId) => !entryIdSet.has(targetEntryId))
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'developerOpinions', opinionIndex, 'targetEntryIds'],
            message:
              'A projected Developer opinion must name this record and only known database entries.',
          });
        }
        const relationshipIds = opinion.evidenceRelationships.map(
          (relationship) => relationship.id,
        );
        if (
          new Set(relationshipIds).size !== relationshipIds.length ||
          opinion.evidenceRelationships.some(
            (relationship) =>
              relationship.evidenceSource.sourceUseStatus !== 'permitted_with_conditions' ||
              !relationship.evidenceSource.derivedClinicalContentPermitted,
          )
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'developerOpinions', opinionIndex, 'evidenceRelationships'],
            message:
              'Developer-opinion evidence relationships require unique, derived-content-cleared sources.',
          });
        }
      });
      const contributionIdSet = new Set(contributionIds);
      record.ruleSummaries.forEach((rule, ruleIndex) => {
        if (
          rule.sourceUseNoteIds.some((sourceUseNoteId) => !contributionIdSet.has(sourceUseNoteId))
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['records', index, 'ruleSummaries', ruleIndex, 'sourceUseNoteIds'],
            message: 'Rule summaries must resolve every source-use note in the projected record.',
          });
        }
      });
    });
    if (
      projection.summary.sourceUnits !== projection.corpusUnits.length ||
      projection.summary.targetEntries !== projection.records.length ||
      projection.summary.unitsWithTargetMatches + projection.summary.unitsWithoutTargetMatches !==
        projection.corpusUnits.length ||
      projection.summary.fullyIndexedUnits +
        projection.summary.partiallyIndexedUnits +
        projection.summary.quarantinedUnits !==
        projection.corpusUnits.length ||
      projection.summary.personalSourceDocuments !==
        projection.summary.appleNotesRevisions + projection.summary.privateDriveDocuments ||
      projection.summary.appleNotesOcrCompleted > projection.summary.appleNotesAttachmentRecords
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: 'Developer database coverage totals are inconsistent.',
      });
    }
    const unitsWithMatches = projection.corpusUnits.filter(
      (unit) => unit.targetEntryIds.length > 0,
    ).length;
    const matchedRecords = projection.records.filter(
      (record) => record.personalSourceUnitCount > 0,
    ).length;
    const totalMatches = projection.records.reduce(
      (total, record) => total + record.personalSourceTotalMatches,
      0,
    );
    const mappedCandidateIds = new Set(
      projection.records.flatMap((record) =>
        record.candidateSummaries.map((candidate) => candidate.id),
      ),
    );
    const unmappedCandidateIds = projection.unmappedCandidateSummaries.map(
      (candidate) => candidate.id,
    );
    projection.unmappedCandidateSummaries.forEach((candidate, candidateIndex) => {
      candidate.resolvedTargets.forEach((target, targetIndex) => {
        const expectedCategory = expectedCategoryForTargetKind(target.targetKind);
        if (expectedCategory === null) return;
        const targetRecord = recordByEntryId.get(target.targetContentId);
        if (!targetRecord) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['unmappedCandidateSummaries', candidateIndex, 'resolvedTargets', targetIndex],
            message: `Candidate references unknown database entry ${target.targetContentId}.`,
          });
        } else if (targetRecord.categoryId !== expectedCategory) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['unmappedCandidateSummaries', candidateIndex, 'resolvedTargets', targetIndex],
            message: `Candidate target kind ${target.targetKind} does not match database category ${targetRecord.categoryId}.`,
          });
        }
      });
    });
    const candidateIds = new Set([...mappedCandidateIds, ...unmappedCandidateIds]);
    const mappedBibliographyIds = new Set(
      projection.records.flatMap((record) =>
        record.bibliographicCandidates.map((candidate) => candidate.id),
      ),
    );
    const unmappedBibliographyIds = projection.unmappedBibliographicCandidates.map(
      (candidate) => candidate.id,
    );
    if (
      new Set(unmappedCandidateIds).size !== unmappedCandidateIds.length ||
      unmappedCandidateIds.some((id) => mappedCandidateIds.has(id)) ||
      new Set(unmappedBibliographyIds).size !== unmappedBibliographyIds.length ||
      unmappedBibliographyIds.some((id) => mappedBibliographyIds.has(id))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['unmappedCandidateSummaries'],
        message: 'Mapped and unmapped semantic candidates require distinct stable IDs.',
      });
    }
    const identityGapIds = projection.catalogIdentityAudit.identityGaps.map((gap) => gap.id);
    const overlapIds = projection.catalogIdentityAudit.overlappingTerms.map(
      (overlap) => overlap.id,
    );
    if (
      new Set(identityGapIds).size !== identityGapIds.length ||
      new Set(overlapIds).size !== overlapIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['catalogIdentityAudit'],
        message: 'Catalog identity gaps and overlap groups require unique IDs.',
      });
    }
    const uniqueCandidates = new Map<
      string,
      z.infer<typeof PersonalKnowledgeWorkbenchCandidateSchema>
    >();
    for (const candidate of [
      ...projection.records.flatMap((record) => record.candidateSummaries),
      ...projection.unmappedCandidateSummaries,
    ]) {
      const existing = uniqueCandidates.get(candidate.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(candidate)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['catalogIdentityAudit', 'identityGaps'],
          message: `Candidate ${candidate.id} has divergent projections across database entries.`,
        });
      }
      uniqueCandidates.set(candidate.id, candidate);
    }
    const occurrenceKey = (
      occurrence: z.infer<typeof DeveloperDatabaseCatalogIdentityOccurrenceSchema>,
    ): string =>
      JSON.stringify({
        candidateId: occurrence.candidateId,
        targetKindHint: occurrence.targetKindHint,
        searchLabel: occurrence.searchLabel,
        role: occurrence.role,
        reason: occurrence.reason,
      });
    const expectedOccurrences = [...uniqueCandidates.values()]
      .flatMap((candidate) =>
        candidate.unresolvedTargets.map((target) => ({
          candidateId: candidate.id,
          targetKindHint: target.targetKindHint,
          searchLabel: target.searchLabel,
          role: target.role,
          reason: target.reason,
        })),
      )
      .map(occurrenceKey)
      .sort();
    const projectedOccurrences = projection.catalogIdentityAudit.identityGaps
      .flatMap((gap) => gap.occurrences)
      .map(occurrenceKey)
      .sort();
    if (
      expectedOccurrences.length !== projectedOccurrences.length ||
      expectedOccurrences.some((value, index) => value !== projectedOccurrences[index])
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['catalogIdentityAudit', 'identityGaps'],
        message:
          'Every unresolved semantic target must appear exactly once in the catalog identity audit.',
      });
    }
    const termOwners = new Map<string, string[]>();
    for (const record of projection.records) {
      for (const term of record.indexedTerms) {
        const normalizedTerm = term.normalize('NFKC').toLocaleLowerCase('en-US').trim();
        termOwners.set(
          normalizedTerm,
          [...new Set([...(termOwners.get(normalizedTerm) ?? []), record.entryId])].sort(),
        );
      }
    }
    projection.catalogIdentityAudit.identityGaps.forEach((gap, gapIndex) => {
      const occurrenceKinds = new Set(
        gap.occurrences.map((occurrence) => occurrence.targetKindHint),
      );
      const occurrenceLabels = new Set(
        gap.occurrences.map((occurrence) =>
          occurrence.searchLabel.normalize('NFKC').toLocaleLowerCase('en-US').trim(),
        ),
      );
      const expectedCategory = gap.targetKindHint
        ? expectedCategoryForTargetKind(gap.targetKindHint)
        : null;
      const compatibleEntryIds = (termOwners.get(gap.normalizedSearchLabel) ?? []).filter(
        (entryId) =>
          gap.targetKindHint === null ||
          (expectedCategory !== null &&
            recordByEntryId.get(entryId)?.categoryId === expectedCategory),
      );
      const expectedStatus =
        compatibleEntryIds.length === 1
          ? 'likely_existing_entry'
          : compatibleEntryIds.length > 1
            ? 'ambiguous_existing_entries'
            : gap.targetKindHint !== null && !catalogTargetKind(gap.targetKindHint)
              ? 'non_catalog_target'
              : gap.targetKindHint === null
                ? 'needs_kind_review'
                : 'proposed_new_catalog_entry';
      if (
        gap.normalizedSearchLabel !==
          gap.normalizedSearchLabel.normalize('NFKC').toLocaleLowerCase('en-US').trim() ||
        gap.displayLabel.normalize('NFKC').toLocaleLowerCase('en-US').trim() !==
          gap.normalizedSearchLabel ||
        occurrenceKinds.size !== 1 ||
        !occurrenceKinds.has(gap.targetKindHint) ||
        occurrenceLabels.size !== 1 ||
        !occurrenceLabels.has(gap.normalizedSearchLabel) ||
        gap.status !== expectedStatus ||
        [...gap.candidateEntryIds].sort().join('|') !== compatibleEntryIds.join('|')
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['catalogIdentityAudit', 'identityGaps', gapIndex],
          message:
            'Catalog identity-gap grouping, candidate entries, and status must match normalized catalog terms.',
        });
      }
    });
    const expectedOverlaps = [...termOwners.entries()]
      .filter(([, ownerIds]) => ownerIds.length > 1)
      .sort(([left], [right]) => left.localeCompare(right));
    const projectedOverlaps = [...projection.catalogIdentityAudit.overlappingTerms].sort(
      (left, right) => left.normalizedTerm.localeCompare(right.normalizedTerm),
    );
    if (
      expectedOverlaps.length !== projectedOverlaps.length ||
      expectedOverlaps.some(
        ([term, ownerIds], index) =>
          projectedOverlaps[index]?.normalizedTerm !== term ||
          [...(projectedOverlaps[index]?.entryIds ?? [])].sort().join('|') !== ownerIds.join('|'),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['catalogIdentityAudit', 'overlappingTerms'],
        message:
          'The catalog overlap audit must enumerate every normalized term owned by multiple entries.',
      });
    }
    const acceptedOpinionIds = new Set([
      ...projection.records.flatMap((record) =>
        record.candidateSummaries
          .filter((candidate) => candidate.reviewStatus === 'accepted')
          .map((candidate) => candidate.id),
      ),
      ...projection.records.flatMap((record) =>
        record.developerOpinions
          .filter((opinion) => opinion.reviewStatus === 'accepted')
          .map((opinion) => opinion.id),
      ),
      ...projection.unmappedCandidateSummaries
        .filter((candidate) => candidate.reviewStatus === 'accepted')
        .map((candidate) => candidate.id),
    ]);
    const formalSourceIds = new Set(
      projection.records.flatMap((record) => [
        ...record.formalContributions.flatMap((contribution) =>
          contribution.evidenceSources.map((source) => source.id),
        ),
        ...record.developerOpinions.flatMap((opinion) =>
          opinion.evidenceRelationships.map((relationship) => relationship.evidenceSource.id),
        ),
      ]),
    );
    if (
      projection.summary.unitsWithTargetMatches !== unitsWithMatches ||
      projection.summary.matchedTargetEntries !== matchedRecords ||
      projection.summary.totalLexicalMatches !== totalMatches ||
      projection.summary.semanticallyClassifiedUnits !==
        projection.corpusUnits.filter((unit) =>
          [
            'classified_no_candidate',
            'candidate_created',
            'reviewed_no_change',
            'incorporated',
          ].includes(unit.semanticState),
        ).length ||
      projection.summary.candidateSummaries !== candidateIds.size ||
      projection.summary.acceptedOpinions !== acceptedOpinionIds.size ||
      projection.summary.formalContributions !==
        projection.records.reduce(
          (total, record) => total + record.formalContributions.length,
          0,
        ) ||
      projection.summary.formalSources !== formalSourceIds.size ||
      projection.summary.registeredFormalSources !== projection.formalSourceRegistry.length ||
      projection.summary.userAuthoredArchiveUnits !==
        projection.corpusUnits.filter((unit) => unit.sourceKind === 'user_authored_archive')
          .length ||
      projection.summary.quarantinedUnits !==
        projection.corpusUnits.filter((unit) => unit.accessState === 'quarantined').length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: 'Developer database derived totals do not match their records.',
      });
    }
    const signalsByUnitId = new Map<string, Array<{ entryId: string; totalMatches: number }>>();
    projection.records.forEach((record) => {
      record.lexicalSignals.forEach((signal) => {
        signalsByUnitId.set(signal.unitId, [
          ...(signalsByUnitId.get(signal.unitId) ?? []),
          { entryId: record.entryId, totalMatches: signal.totalMatches },
        ]);
      });
    });
    projection.corpusUnits.forEach((unit, index) => {
      const signals = signalsByUnitId.get(unit.id) ?? [];
      const signalEntryIds = signals.map((signal) => signal.entryId).sort();
      const targetEntryIds = [...unit.targetEntryIds].sort();
      if (
        signalEntryIds.join('|') !== targetEntryIds.join('|') ||
        signals.reduce((total, signal) => total + signal.totalMatches, 0) !== unit.totalMatches
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['corpusUnits', index],
          message: 'Corpus-unit targets and match totals must mirror record lexical signals.',
        });
      }
    });
  });
export type DeveloperDatabaseKnowledgeProjection = z.infer<
  typeof DeveloperDatabaseKnowledgeProjectionSchema
>;

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
    extractionWarnings: z.array(z.string().min(1).max(1000)).max(50).optional(),
    extractionWarningCount: z.number().int().nonnegative().optional(),
    processedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((document, context) => {
    if (
      document.extractionWarnings &&
      document.extractionWarningCount !== undefined &&
      document.extractionWarningCount < document.extractionWarnings.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['extractionWarningCount'],
        message: 'Extraction warning count cannot be smaller than the retained warning list.',
      });
    }
  });
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;

export const SourceChunkSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: StableIdSchema,
    sourceDocumentId: StableIdSchema,
    ordinal: z.number().int().nonnegative(),
    page: z.number().int().positive().optional(),
    section: z.string().optional(),
    sectionPath: z.array(z.string().min(1).max(500)).min(1).max(6).optional(),
    sectionInstance: z.number().int().positive().optional(),
    text: z.string().min(1),
    textHash: z.string().regex(/^[a-f0-9]{64}$/),
    provenanceHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  })
  .strict()
  .superRefine((chunk, context) => {
    if (chunk.sectionPath && (!chunk.section || chunk.sectionPath.at(-1) !== chunk.section)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sectionPath'],
        message: 'A source chunk heading path must end with its leaf section.',
      });
    }
    if (chunk.sectionInstance && !chunk.sectionPath) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sectionInstance'],
        message: 'A source chunk section instance requires a heading path.',
      });
    }
  });
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
    staffAutomation: z
      .object({
        role: z.string().min(1).max(120),
        eligibleInformationActionIds: z.array(StableIdSchema).min(1),
        maximumAutomaticActions: z.number().int().positive(),
      })
      .strict()
      .optional(),
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

/**
 * Planned V2 current-regimen operation. It deliberately targets one regimen
 * entry rather than a medication identity so duplicate prescriptions remain
 * independently addressable. Runtime V1 treatment selections do not consume
 * this schema yet.
 */
export const MedicationRegimenAdjustmentSelectionSchema = z
  .object({
    selectionVersion: z.literal(2),
    regimenEntryId: StableIdSchema,
    operation: z.enum(['continue', 'increase', 'reduce_or_limit', 'taper', 'stop']),
  })
  .strict();
export type MedicationRegimenAdjustmentSelection = z.infer<
  typeof MedicationRegimenAdjustmentSelectionSchema
>;

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
  staffAutomation: z.object({
    role: z.string().min(1).max(120),
    eligibleInformationActionIds: z.array(StableIdSchema).min(1),
    maximumAutomaticActions: z.number().int().positive(),
  }),
})
  .strict()
  .superRefine((upgrade, context) => {
    if (
      new Set(upgrade.staffAutomation.eligibleInformationActionIds).size !==
        upgrade.staffAutomation.eligibleInformationActionIds.length ||
      upgrade.staffAutomation.maximumAutomaticActions >
        upgrade.staffAutomation.eligibleInformationActionIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Staff automation action IDs must be unique and the selection cap must fit.',
      });
    }
  });
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
    .object({
      type: z.literal('UpdateDiagnosisSelections'),
      selections: PlayerDiagnosisSelectionsSchema,
    })
    .strict(),
  z
    .object({ type: z.literal('UpdateTreatmentSelections'), selections: TreatmentSelectionSchema })
    .strict(),
  z.object({ type: z.literal('SubmitEncounter') }).strict(),
]);
export type EncounterCommand = z.infer<typeof EncounterCommandSchema>;

export const SaveDataVersionSchema = z.literal(5);
export type SaveDataVersion = z.infer<typeof SaveDataVersionSchema>;
