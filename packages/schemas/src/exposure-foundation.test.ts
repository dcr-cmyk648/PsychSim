import { describe, expect, it } from 'vitest';

import exposureCatalogJson from '../../../content/catalogs/exposures/definitions.json';
import {
  AgentMisuseGenerationPriorSchema,
  ExposureCatalogSchema,
  ResolvedExposureInventorySchema,
  ResolvedExposureUseEntrySchema,
} from './index';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test.exposure',
  ownerContentVersion: '1.0.0',
} as const;

const generatedResolution = {
  origin: 'deterministic_generation',
  generationProfileId: 'generation-profile.test.exposure',
  generationProfileContentVersion: '1.0.0',
  resolverVersion: '1.0.0',
  stableDrawId: 'draw.test.exposure',
} as const;

const medicationPrior = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'misuse-prior.test.gabapentin',
  agent: {
    kind: 'medication',
    identityId: 'medication.gabapentin',
    identityContentVersion: '1.0.0',
  },
  baseMisuseProbabilityGivenUse: 0.05,
  prescriptionContextMultipliers: {
    prescribedToPatient: 0.5,
    notPrescribedToPatient: 3,
  },
  developerOpinionIds: ['developer-opinion.test.gabapentin-misuse'],
  review: {
    status: 'unreviewed',
    reviewerId: null,
    reviewedAt: null,
    sourceUseNoteIds: [],
  },
} as const;

const currentMedicationUse = {
  schemaVersion: 1,
  id: 'exposure-use.test.gabapentin',
  agent: medicationPrior.agent,
  mostRecentUse: { kind: 'current' },
  currentAmount: {
    quantity: 2,
    unitLabel: 'capsules',
    frequencyLabel: 'per day',
  },
  prescriptionRelationship: 'not_prescribed_to_patient',
  misuseTruth: true,
  resolution: generatedResolution,
} as const;

const pastAlcoholUse = {
  schemaVersion: 1,
  id: 'exposure-use.test.alcohol',
  agent: {
    kind: 'other_substance',
    identityId: 'substance.alcohol',
    identityContentVersion: '1.0.0',
  },
  mostRecentUse: { kind: 'elapsed', value: 3, unit: 'year' },
  currentAmount: null,
  prescriptionRelationship: 'not_applicable',
  misuseTruth: false,
  resolution: authoredResolution,
} as const;

describe('substance and background-exposure foundation', () => {
  it('parses the identity-only catalog without inventing misuse rates', () => {
    const catalog = ExposureCatalogSchema.parse(exposureCatalogJson);
    expect(catalog.id).toBe('registry.catalog.exposures');
    expect(catalog.otherSubstanceIdentities.map((entry) => entry.id)).toEqual([
      'substance.alcohol',
      'substance.caffeine',
      'substance.cannabis',
      'substance.nicotine',
    ]);
    expect(catalog.misuseGenerationPriors).toEqual([]);
    expect(catalog.sourceUseNotes).toEqual([]);
  });

  it('stores one coarse probability plus prescribed and nonprescribed modifiers for medications', () => {
    const parsed = AgentMisuseGenerationPriorSchema.parse(medicationPrior);
    expect(parsed.baseMisuseProbabilityGivenUse).toBe(0.05);
    expect(parsed.prescriptionContextMultipliers).toEqual({
      prescribedToPatient: 0.5,
      notPrescribedToPatient: 3,
    });
  });

  it('requires prescription modifiers only for medication agents', () => {
    expect(
      AgentMisuseGenerationPriorSchema.safeParse({
        ...medicationPrior,
        prescriptionContextMultipliers: null,
      }).success,
    ).toBe(false);
    expect(
      AgentMisuseGenerationPriorSchema.safeParse({
        ...medicationPrior,
        id: 'misuse-prior.test.alcohol',
        agent: pastAlcoholUse.agent,
        prescriptionContextMultipliers: null,
      }).success,
    ).toBe(true);
    expect(
      AgentMisuseGenerationPriorSchema.safeParse({
        ...medicationPrior,
        id: 'misuse-prior.test.alcohol',
        agent: pastAlcoholUse.agent,
      }).success,
    ).toBe(false);
  });

  it('requires a formal contribution or Developer opinion before a rate can exist', () => {
    expect(
      AgentMisuseGenerationPriorSchema.safeParse({
        ...medicationPrior,
        developerOpinionIds: [],
      }).success,
    ).toBe(false);
    expect(
      AgentMisuseGenerationPriorSchema.safeParse({
        ...medicationPrior,
        developerOpinionIds: [],
        review: {
          ...medicationPrior.review,
          sourceUseNoteIds: ['source-use-note.test.gabapentin-misuse'],
        },
      }).success,
    ).toBe(true);
  });

  it('requires formal source-use notes to exist and target the exact prior', () => {
    const formalSourceUse = {
      id: 'source-use.test.gabapentin-misuse',
      authority: 'formal_publication',
      evidenceSourceIds: ['evidence.test.gabapentin-misuse'],
      sourceDocumentId: null,
      sourceChunkIds: [],
      targetContentIds: [medicationPrior.id],
      contributionTypes: ['patient_fact'],
      contribution: 'Synthetic test contribution for schema validation.',
      generatedBy: 'human',
      medicalReviewStatus: 'unreviewed',
    } as const;
    const priorWithFormalSource = {
      ...medicationPrior,
      developerOpinionIds: [],
      review: {
        ...medicationPrior.review,
        sourceUseNoteIds: [formalSourceUse.id],
      },
    } as const;
    const catalog = {
      ...exposureCatalogJson,
      misuseGenerationPriors: [priorWithFormalSource],
      sourceUseNotes: [formalSourceUse],
    };
    expect(ExposureCatalogSchema.safeParse(catalog).success).toBe(true);
    expect(
      ExposureCatalogSchema.safeParse({
        ...catalog,
        sourceUseNotes: [],
      }).success,
    ).toBe(false);
    expect(
      ExposureCatalogSchema.safeParse({
        ...catalog,
        sourceUseNotes: [
          {
            ...formalSourceUse,
            targetContentIds: ['misuse-prior.test.other'],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      ExposureCatalogSchema.safeParse({
        ...catalog,
        misuseGenerationPriors: [
          {
            ...priorWithFormalSource,
            review: {
              ...priorWithFormalSource.review,
              sourceUseNoteIds: [formalSourceUse.id, formalSourceUse.id],
            },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('stores only positive patient use facts and freezes the final misuse truth', () => {
    const parsed = ResolvedExposureInventorySchema.parse({
      schemaVersion: 1,
      id: 'resolved-exposure-inventory.test',
      useEntries: [currentMedicationUse, pastAlcoholUse],
    });
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
    expect(parsed.useEntries.map((entry) => entry.misuseTruth)).toEqual([true, false]);
    expect(parsed).not.toHaveProperty('evaluatedAgents');
  });

  it('requires current amount only for current use', () => {
    expect(ResolvedExposureUseEntrySchema.safeParse(currentMedicationUse).success).toBe(true);
    expect(ResolvedExposureUseEntrySchema.safeParse(pastAlcoholUse).success).toBe(true);
    expect(
      ResolvedExposureUseEntrySchema.safeParse({
        ...currentMedicationUse,
        currentAmount: null,
      }).success,
    ).toBe(false);
    expect(
      ResolvedExposureUseEntrySchema.safeParse({
        ...pastAlcoholUse,
        currentAmount: currentMedicationUse.currentAmount,
      }).success,
    ).toBe(false);
  });

  it('keeps medication prescription context explicit without applying it to other agents', () => {
    expect(
      ResolvedExposureUseEntrySchema.safeParse({
        ...currentMedicationUse,
        misuseTruth: false,
      }).success,
    ).toBe(true);
    expect(
      ResolvedExposureUseEntrySchema.safeParse({
        ...currentMedicationUse,
        prescriptionRelationship: 'not_applicable',
      }).success,
    ).toBe(false);
    expect(
      ResolvedExposureUseEntrySchema.safeParse({
        ...pastAlcoholUse,
        prescriptionRelationship: 'prescribed_to_patient',
      }).success,
    ).toBe(false);
  });

  it('permits at most one positive-use summary per agent', () => {
    expect(
      ResolvedExposureInventorySchema.safeParse({
        schemaVersion: 1,
        id: 'resolved-exposure-inventory.test',
        useEntries: [
          currentMedicationUse,
          {
            ...currentMedicationUse,
            id: 'exposure-use.test.gabapentin.duplicate',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it.each([
    ['assessmentStatus', 'assessed'],
    ['patientReport', 'denies'],
    ['knownAtOpening', true],
    ['revealed', true],
    ['accuracy', 0.9],
    ['intoxication', false],
    ['withdrawal', false],
    ['diagnosisId', 'diagnosis.substance-induced-mood-disorder'],
    ['attribution', 'primary_cause'],
    ['points', 10],
  ])(
    'rejects evidence, inference, or scoring field %s from objective use truth',
    (field, value) => {
      expect(
        ResolvedExposureUseEntrySchema.safeParse({
          ...pastAlcoholUse,
          [field]: value,
        }).success,
      ).toBe(false);
    },
  );
});
