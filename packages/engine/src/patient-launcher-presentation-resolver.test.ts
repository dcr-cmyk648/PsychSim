import { describe, expect, it } from 'vitest';

import {
  PatientChiefComplaintBankSchema,
  PatientLauncherPresentationResolutionArtifactSchema,
  PatientLauncherPresentationResolutionRequestSchema,
  type PatientChiefComplaintBank,
  type PatientLauncherPresentationResolutionRequest,
} from '@psychsim/schemas';

import {
  resolvePatientLauncherPresentation,
  verifyPatientLauncherPresentationResolutionIntegrity,
} from './patient-launcher-presentation-resolver';

const complaintBank = (id: string, texts: readonly string[]): PatientChiefComplaintBank => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  label: id,
  variants: texts.map((text, index) => ({
    id: `${id}.variant-${index + 1}`,
    text,
  })),
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
});

const requestFixture = (): PatientLauncherPresentationResolutionRequest => ({
  schemaVersion: 1,
  id: 'patient-launcher-presentation-request.test',
  patientStateId: 'patient-state.test.launcher',
  seed: 'patient-seed.test.launcher',
  profile: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-launcher-presentation-profile.test',
    modelVersion: 'patient-launcher-presentation-profile.v1',
    firstNamePoolRef: {
      id: 'variant-pool.fictional-first-names.test',
      contentVersion: '1.0.0',
    },
    lastNamePoolRef: {
      id: 'variant-pool.fictional-last-names.test',
      contentVersion: '1.0.0',
    },
    middleInitialProbability: {
      numerator: 1,
      denominator: 4,
    },
    complaintBankBindings: [
      {
        id: 'patient-launcher-complaint-binding.test.general',
        bankRef: {
          id: 'chief-complaint-bank.test.general',
          contentVersion: '1.0.0',
        },
        specificityPriority: 10,
        gameSelectionWeight: 10,
      },
      {
        id: 'patient-launcher-complaint-binding.test.focused',
        bankRef: {
          id: 'chief-complaint-bank.test.focused',
          contentVersion: '1.0.0',
        },
        specificityPriority: 20,
        gameSelectionWeight: 10,
      },
    ],
    developerOpinionIds: ['developer-opinion.test.patient-launcher'],
    review: {
      status: 'approved',
      reviewerId: 'reviewer.test',
      reviewedAt: '2026-08-03T00:00:00.000Z',
      sourceUseNoteIds: [],
    },
  },
  firstNamePool: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'variant-pool.fictional-first-names.test',
    kind: 'fictional_first_name',
    values: ['Avery', 'Jordan', 'Morgan', 'Riley'],
  },
  lastNamePool: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'variant-pool.fictional-last-names.test',
    kind: 'fictional_last_name',
    values: ['Garcia', 'Patel', 'Smith', 'Williams'],
  },
  complaintBanks: [
    complaintBank('chief-complaint-bank.test.general', ['Mood concerns', 'Not feeling well']),
    complaintBank('chief-complaint-bank.test.focused', [
      'Loss of interest',
      'Low mood',
      'No motivation',
    ]),
  ],
});

const resolveFixture = (request = requestFixture()) => {
  const result = resolvePatientLauncherPresentation(request);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

describe('patient launcher presentation resolver', () => {
  it('resolves a deterministic neutral launcher and replays the complete audit', () => {
    const request = requestFixture();
    const first = resolveFixture(request);
    const reordered = resolveFixture({
      ...request,
      profile: {
        ...request.profile,
        complaintBankBindings: [...request.profile.complaintBankBindings].reverse(),
      },
      firstNamePool: {
        ...request.firstNamePool,
        values: [...request.firstNamePool.values].reverse(),
      },
      lastNamePool: {
        ...request.lastNamePool,
        values: [...request.lastNamePool.values].reverse(),
      },
      complaintBanks: [...request.complaintBanks]
        .reverse()
        .map((bank) => ({ ...bank, variants: [...bank.variants].reverse() })),
    });

    expect(reordered).toEqual(first);
    expect(PatientLauncherPresentationResolutionArtifactSchema.parse(first)).toEqual(first);
    expect(verifyPatientLauncherPresentationResolutionIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });
    expect(first.resolvedPresentation.chiefComplaint.bankRef.id).toBe(
      'chief-complaint-bank.test.focused',
    );
    expect(first.complaintBankEvaluations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          binding: expect.objectContaining({
            id: 'patient-launcher-complaint-binding.test.general',
          }),
          disposition: 'shadowed_lower_specificity',
          selected: false,
        }),
        expect.objectContaining({
          binding: expect.objectContaining({
            id: 'patient-launcher-complaint-binding.test.focused',
          }),
          disposition: 'eligible_highest_specificity',
          selected: true,
        }),
      ]),
    );
    expect(first.resolvedPresentation).not.toHaveProperty('seed');
    expect(first.resolvedPresentation).not.toHaveProperty('diagnosisId');
  });

  it('varies first name, last name, optional middle initial, and complaint independently', () => {
    const presentations = Array.from(
      { length: 256 },
      (_, index) =>
        resolveFixture({
          ...requestFixture(),
          seed: `patient-seed.test.launcher.${index}`,
        }).resolvedPresentation,
    );
    const firstNames = new Set(
      presentations.map((presentation) => presentation.fictionalName.firstName),
    );
    const lastNames = new Set(
      presentations.map((presentation) => presentation.fictionalName.lastName),
    );
    const pairs = new Set(
      presentations.map(
        (presentation) =>
          `${presentation.fictionalName.firstName}\u0000${presentation.fictionalName.lastName}`,
      ),
    );
    const complaints = new Set(
      presentations.map((presentation) => presentation.chiefComplaint.variantId),
    );
    const middleInitialCount = presentations.filter(
      (presentation) => presentation.fictionalName.middleInitial !== null,
    ).length;

    expect(firstNames.size).toBe(4);
    expect(lastNames.size).toBe(4);
    expect(pairs.size).toBeGreaterThan(8);
    expect(complaints.size).toBe(3);
    expect(middleInitialCount).toBeGreaterThanOrEqual(40);
    expect(middleInitialCount).toBeLessThanOrEqual(88);
  });

  it('domain-separates name draws from complaint content and ignores race or sex entirely', () => {
    const baseRequest = requestFixture();
    const base = resolveFixture(baseRequest).resolvedPresentation;
    const changedComplaint = resolveFixture({
      ...baseRequest,
      complaintBanks: baseRequest.complaintBanks.map((bank) =>
        bank.id === 'chief-complaint-bank.test.focused'
          ? {
              ...bank,
              contentVersion: '1.1.0',
              variants: [
                { id: `${bank.id}.variant-a`, text: 'Fatigue and low mood' },
                { id: `${bank.id}.variant-b`, text: 'Feeling down' },
              ],
            }
          : bank,
      ),
      profile: {
        ...baseRequest.profile,
        complaintBankBindings: baseRequest.profile.complaintBankBindings.map((binding) =>
          binding.bankRef.id === 'chief-complaint-bank.test.focused'
            ? {
                ...binding,
                bankRef: { ...binding.bankRef, contentVersion: '1.1.0' },
              }
            : binding,
        ),
      },
    }).resolvedPresentation;

    expect(changedComplaint.fictionalName).toEqual(base.fictionalName);
    expect(changedComplaint.chiefComplaint.bankRef.contentVersion).toBe('1.1.0');
    expect(JSON.stringify(baseRequest)).not.toContain('raceEthnicity');
    expect(JSON.stringify(baseRequest)).not.toContain('sexForReference');
  });

  it('rejects stale pools, incomplete banks, duplicate complaint text, and unreviewed profiles', () => {
    const request = requestFixture();
    expect(
      PatientLauncherPresentationResolutionRequestSchema.safeParse({
        ...request,
        firstNamePool: { ...request.firstNamePool, kind: 'occupation' },
      }).success,
    ).toBe(false);
    expect(
      PatientLauncherPresentationResolutionRequestSchema.safeParse({
        ...request,
        complaintBanks: request.complaintBanks.slice(0, 1),
      }).success,
    ).toBe(false);
    expect(
      PatientChiefComplaintBankSchema.safeParse({
        ...request.complaintBanks[0],
        variants: [
          { id: 'chief-complaint-variant.test.one', text: 'Low mood' },
          { id: 'chief-complaint-variant.test.two', text: ' low MOOD ' },
        ],
      }).success,
    ).toBe(false);

    expect(
      resolvePatientLauncherPresentation({
        ...request,
        profile: {
          ...request.profile,
          review: {
            status: 'unreviewed',
            reviewerId: null,
            reviewedAt: null,
            sourceUseNoteIds: [],
          },
        },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'UNAPPROVED_PROFILE' },
    });
  });

  it('detects audit and resolved-display tampering', () => {
    const artifact = resolveFixture();
    const drawTampering = structuredClone(artifact);
    drawTampering.firstNameStableDrawId = 'stable-draw.patient-launcher.first-name.tampered';
    expect(verifyPatientLauncherPresentationResolutionIntegrity(drawTampering)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const displayTampering = structuredClone(artifact);
    displayTampering.resolvedPresentation.fictionalName.displayName = 'Different Name';
    expect(verifyPatientLauncherPresentationResolutionIntegrity(displayTampering)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
