import {
  PublicClinicalCatalogProjectionSchema,
  type CatalogBundle,
  type MedicationIdentityDefinition,
  type PublicClinicalCatalogCategoryId,
  type PublicClinicalCatalogEntry,
  type PublicClinicalCatalogProjection,
} from '@psychsim/schemas';

import { catalogs } from './content';
import { medicationIdentities } from './medication-identities';

export const NLM_RXNORM_PUBLIC_ATTRIBUTION =
  'This product uses publicly available data courtesy of the U.S. National Library of Medicine (NLM), National Institutes of Health, Department of Health and Human Services; NLM is not responsible for the product and does not endorse or recommend this or any other product.';

const CATEGORY_COPY: ReadonlyArray<{
  id: PublicClinicalCatalogCategoryId;
  label: string;
  description: string;
}> = [
  {
    id: 'conditions',
    label: 'Modeled conditions',
    description:
      'Diagnosis-family definitions currently modeled for gameplay. This is not a comprehensive diagnostic manual or the local authoring classification index.',
  },
  {
    id: 'medications',
    label: 'Medications',
    description:
      'Normalized medication identities available for database review. Identity-only records are not selectable in gameplay; patient-specific fit and point rules are intentionally excluded.',
  },
  {
    id: 'interventions',
    label: 'Therapies & interventions',
    description:
      'Nonmedication treatment identities currently available to the game, including psychotherapy entries.',
  },
  {
    id: 'dispositions',
    label: 'Dispositions',
    description:
      'Current outpatient, referral, and transfer choices. Patient-specific grades are intentionally excluded.',
  },
  {
    id: 'investigations',
    label: 'Investigations',
    description:
      'The shared history, physical, laboratory, and imaging menu shown across patient encounters.',
  },
  {
    id: 'tests',
    label: 'Test definitions',
    description:
      'High-level test-generation coverage. Patient results, incidental probabilities, and generation ranges are intentionally excluded.',
  },
  {
    id: 'references',
    label: 'Formal references',
    description:
      'Verified bibliographic records shipped in this build. Catalog presence does not establish medical approval or support every game rule.',
  },
];

const compareEntries = (
  left: PublicClinicalCatalogEntry,
  right: PublicClinicalCatalogEntry,
): number => {
  const byLabel = left.label < right.label ? -1 : left.label > right.label ? 1 : 0;
  if (byLabel !== 0) return byLabel;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
};

const logicalPath = (categoryId: PublicClinicalCatalogCategoryId, id: string): string =>
  `catalogs.${categoryId}.${id}`;

export const buildPublicClinicalCatalog = (
  catalogs: CatalogBundle,
  identities: readonly MedicationIdentityDefinition[] = medicationIdentities,
): PublicClinicalCatalogProjection => {
  const conditions: PublicClinicalCatalogEntry[] = catalogs.diagnoses.map((diagnosis) => ({
    kind: 'condition',
    categoryId: 'conditions',
    id: diagnosis.id,
    label: diagnosis.label,
    logicalPath: logicalPath('conditions', diagnosis.id),
    contentVersion: diagnosis.contentVersion,
    medicalReviewStatus: diagnosis.medicalReviewStatus,
    description: diagnosis.description,
    severityLevels:
      diagnosis.severityAxis?.levels.map((level) => ({
        id: level.id,
        label: level.label,
      })) ?? [],
    specifierLabels: diagnosis.specifiers.map((specifier) => specifier.label),
  }));

  const runtimeMedicationById = new Map(
    catalogs.medications.map((medication) => [medication.id, medication]),
  );
  const medications: PublicClinicalCatalogEntry[] = identities.map((identity) => {
    const runtimeMedication = identity.runtimeMedicationDefinitionId
      ? runtimeMedicationById.get(identity.runtimeMedicationDefinitionId)
      : undefined;
    return {
      kind: 'medication',
      categoryId: 'medications',
      id: identity.id,
      label: identity.label,
      logicalPath: logicalPath('medications', identity.id),
      contentVersion: identity.contentVersion,
      medicalReviewStatus: identity.medicalReviewStatus,
      normalizedIngredientName: identity.normalizedIngredientName,
      aliases: identity.aliases,
      authoringStatus: identity.authoringStatus,
      rxnormRxcui: identity.rxnorm.rxcui,
      identityEvidenceSourceId: identity.rxnorm.evidenceSourceId,
      identityReleaseDate: identity.rxnorm.releaseDate,
      identityAttribution: NLM_RXNORM_PUBLIC_ATTRIBUTION,
      identityScopeNotice: `RxNorm identity snapshot dated ${identity.rxnorm.releaseDate}; it may not be current. Identity normalization only—not indications, comparative efficacy, contraindications, interactions, monitoring, or medical approval.`,
      classes: runtimeMedication?.classes ?? [],
    };
  });

  const treatmentEntries: PublicClinicalCatalogEntry[] = catalogs.treatments.map((treatment) => {
    const isDisposition = treatment.kind === 'disposition';
    const categoryId = isDisposition ? 'dispositions' : 'interventions';
    return {
      kind: isDisposition ? 'disposition' : 'intervention',
      categoryId,
      id: treatment.id,
      label: treatment.label,
      logicalPath: logicalPath(categoryId, treatment.id),
      contentVersion: treatment.contentVersion,
      medicalReviewStatus: null,
      treatmentCategory: treatment.category,
      requiredCapabilityCount: treatment.requiredCapabilities.length,
    };
  });

  const investigations: PublicClinicalCatalogEntry[] = catalogs.informationActions.map(
    (action) => ({
      kind: 'investigation',
      categoryId: 'investigations',
      id: action.id,
      label: action.label,
      logicalPath: logicalPath('investigations', action.id),
      contentVersion: null,
      medicalReviewStatus: null,
      description: action.description,
      investigationCategory: action.category,
      soapSection: action.soapSection,
      resultSource: action.resultSource,
      repeatable: action.repeatable,
    }),
  );

  const tests: PublicClinicalCatalogEntry[] = catalogs.tests.map((test) => {
    const components = [
      ...new Map(
        (test.generator.type === 'numeric_panel'
          ? test.generator.profiles.flatMap((profile) => profile.components)
          : []
        ).map((component) => [
          component.id,
          {
            id: component.id,
            label: component.label,
            unit: component.unit,
          },
        ]),
      ).values(),
    ].sort((left, right) =>
      left.label < right.label
        ? -1
        : left.label > right.label
          ? 1
          : left.id < right.id
            ? -1
            : left.id > right.id
              ? 1
              : 0,
    );
    return {
      kind: 'test',
      categoryId: 'tests',
      id: test.id,
      label: test.label,
      logicalPath: logicalPath('tests', test.id),
      contentVersion: test.contentVersion,
      medicalReviewStatus: test.medicalReviewStatus,
      testCategory: test.category,
      generatorKind: test.generator.type,
      relatedActionId: test.actionId,
      componentCount: components.length,
      components,
    };
  });

  const references: PublicClinicalCatalogEntry[] = catalogs.evidenceSources.map((source) => ({
    kind: 'reference',
    categoryId: 'references',
    id: source.id,
    label: source.title,
    logicalPath: logicalPath('references', source.id),
    contentVersion: source.contentVersion,
    medicalReviewStatus: source.medicalReviewStatus,
    sourceType: source.sourceType,
    authors: source.authors,
    organization: source.organization,
    publicationDate: source.publicationDate,
    versionLabel: source.versionLabel,
    containerTitle: source.containerTitle,
    doi: source.doi,
    pmid: source.pmid,
    citation: source.citation,
    url: source.url,
    bibliographicStatus: source.bibliographicStatus,
    jurisdictions: source.jurisdictions,
    populations: source.populations,
    settings: source.settings,
    sourceRelations: source.sourceRelations
      .map((relation) => ({
        sourceId: relation.sourceId,
        relationType: relation.relationType,
      }))
      .sort((left, right) => {
        const bySource =
          left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0;
        return bySource !== 0
          ? bySource
          : left.relationType < right.relationType
            ? -1
            : left.relationType > right.relationType
              ? 1
              : 0;
      }),
  }));

  const entries = [
    ...conditions,
    ...medications,
    ...treatmentEntries,
    ...investigations,
    ...tests,
    ...references,
  ].sort((left, right) => {
    const categoryOrder =
      CATEGORY_COPY.findIndex((category) => category.id === left.categoryId) -
      CATEGORY_COPY.findIndex((category) => category.id === right.categoryId);
    return categoryOrder !== 0 ? categoryOrder : compareEntries(left, right);
  });

  return PublicClinicalCatalogProjectionSchema.parse({
    schemaVersion: 1,
    projectionVersion: 1,
    catalogContentVersion: catalogs.contentVersion,
    totalEntryCount: entries.length,
    categories: CATEGORY_COPY.map((category) => ({
      ...category,
      entryCount: entries.filter((entry) => entry.categoryId === category.id).length,
    })),
    entries,
  });
};

export const publicClinicalCatalog = buildPublicClinicalCatalog(catalogs);
