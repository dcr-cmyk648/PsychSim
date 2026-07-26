import { describe, expect, it } from 'vitest';

import { startingProfile } from '@psychsim/content-runtime';
import { SaveDataSchema } from '@psychsim/schemas';

import { migrateSaveData } from './persistence';

describe('save migrations', () => {
  it('adds semantically correct fields to an existing v5 save without changing the envelope', () => {
    const versionFiveSave = {
      schemaVersion: 1,
      saveDataVersion: 5,
      nestedAttempt: {
        caseInstance: {
          metadata: {
            title: 'Historical MDD decision',
            medicalReviewStatus: 'unreviewed',
          },
          opening: {
            knownMedicationIds: ['medication.sertraline'],
          },
        },
        receipt: {
          settlement: {
            operatingExpenses: 75,
          },
        },
      },
    };

    const migrated = migrateSaveData(versionFiveSave) as {
      nestedAttempt: {
        caseInstance: {
          metadata: { debriefTitle: string };
          opening: { medicationListStatus: string };
        };
        receipt: {
          settlement: { informationExpenses: number; treatmentExpenses: number };
        };
      };
    };
    expect(migrated.nestedAttempt.caseInstance.metadata.debriefTitle).toBe(
      'Historical MDD decision',
    );
    expect(migrated.nestedAttempt.caseInstance.opening.medicationListStatus).toBe('provided');
    expect(migrated.nestedAttempt.receipt.settlement).toMatchObject({
      informationExpenses: 75,
      treatmentExpenses: 0,
    });
    expect(versionFiveSave.nestedAttempt.caseInstance.metadata).not.toHaveProperty('debriefTitle');
  });

  it('migrates a legacy profile to v5 without retaining Reputation fields', () => {
    const legacyClinic = {
      ...startingProfile.clinic,
      reputationXP: 17,
    } as Record<string, unknown>;
    delete legacyClinic.lifetimePointsEarned;
    const legacy = {
      schemaVersion: 1,
      saveDataVersion: 2,
      profile: {
        schemaVersion: 1,
        id: startingProfile.id,
        clinic: legacyClinic,
        completedAttemptIds: [],
      },
      attempts: [],
      flags: [],
    };

    const migrated = SaveDataSchema.parse(migrateSaveData(legacy));
    expect(migrated.saveDataVersion).toBe(5);
    expect(migrated.profile.progressionMode).toBe('standard');
    expect(migrated.profile.clinic.lifetimePointsEarned).toBe(0);
    expect('reputationXP' in migrated.profile.clinic).toBe(false);
    expect(migrated.patientQueues.standardSlots).toEqual([]);
    expect(migrated.attemptReviews).toEqual([]);
    expect(migrated.databaseEntryReviews).toEqual([]);
  });

  it('archives incompatible historical score reports instead of silently discarding them', () => {
    const legacy = {
      schemaVersion: 1,
      saveDataVersion: 3,
      profile: startingProfile,
      attempts: [
        {
          id: 'attempt.legacy.1',
          receipt: { scoreReport: { clinicalScore: 91, clinicalRank: 'A' } },
        },
      ],
      flags: [],
    };
    const migrated = SaveDataSchema.parse(migrateSaveData(legacy));
    expect(migrated.attempts).toEqual([]);
    expect(migrated.legacyArchive).toHaveLength(1);
    expect(migrated.legacyArchive[0]).toMatchObject({
      sourceSaveDataVersion: 3,
      reason: expect.stringContaining('retired 0–100 scoring model'),
    });
    expect(JSON.stringify(migrated.legacyArchive[0]!.payload)).toContain('clinicalScore');
  });

  it('preserves a v4 save while adding the Developer attempt-review collection', () => {
    const versionFourSave = {
      schemaVersion: 1,
      saveDataVersion: 4,
      profile: startingProfile,
      attempts: [],
      flags: [],
      patientQueues: {
        schemaVersion: 1,
        generation: 3,
        standardSlots: [],
        endgameSlots: [],
        developerSlots: [],
        developerRunBlueprintIds: ['case.review.test'],
        recentChiefComplaints: ['low mood'],
      },
      clinicalTickets: [],
      legacyArchive: [],
    };

    const migrated = SaveDataSchema.parse(migrateSaveData(versionFourSave));
    expect(migrated.saveDataVersion).toBe(5);
    expect(migrated.patientQueues.generation).toBe(3);
    expect(migrated.patientQueues.developerRunBlueprintIds).toEqual(['case.review.test']);
    expect(migrated.attemptReviews).toEqual([]);
    expect(migrated.databaseEntryReviews).toEqual([]);
  });

  it('adds the database-entry review collection to an existing complete v5 save', () => {
    const migrated = SaveDataSchema.parse(
      migrateSaveData({
        schemaVersion: 1,
        saveDataVersion: 5,
        profile: startingProfile,
        attempts: [],
        flags: [],
        patientQueues: {
          schemaVersion: 1,
          generation: 0,
          standardSlots: [],
          endgameSlots: [],
          developerSlots: [],
          developerRunBlueprintIds: [],
          recentChiefComplaints: [],
        },
        clinicalTickets: [],
        attemptReviews: [],
        legacyArchive: [],
      }),
    );

    expect(migrated.databaseEntryReviews).toEqual([]);
  });
});
