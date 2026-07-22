import { PlayerProfileSchema, SaveDataSchema, type SaveData } from '@psychsim/schemas';

const DATABASE_NAME = 'psychsim-local-save';
const STORE_NAME = 'save-data';
const SAVE_KEY = 'primary';

export interface SaveRepository {
  load(): Promise<SaveData | null>;
  save(data: SaveData): Promise<void>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const migrateLegacyNode = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(migrateLegacyNode);
  if (!isRecord(value)) return value;

  const migrated = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, migrateLegacyNode(child)]),
  );

  if ('minimumReputationXP' in migrated) {
    migrated.minimumLifetimePoints = migrated.minimumReputationXP;
    delete migrated.minimumReputationXP;
  }
  delete migrated.maximumReputationXP;
  delete migrated.reputationXPEarned;

  if ('clinicPoints' in migrated && 'reputationXP' in migrated) {
    migrated.lifetimePointsEarned = 0;
    delete migrated.reputationXP;
  }
  if (
    'seed' in migrated &&
    'resolvedVariants' in migrated &&
    !('resolvedObservations' in migrated)
  ) {
    const patientRecord = isRecord(migrated.patientRecord) ? migrated.patientRecord : null;
    migrated.resolvedObservations = Array.isArray(patientRecord?.observations)
      ? patientRecord.observations
      : [];
  }
  return migrated;
};

/** Migrate the only pre-release save shape without mutating the stored value. */
export const migrateSaveData = (value: unknown): unknown => {
  if (!isRecord(value) || value.saveDataVersion === 4) return value;
  const sourceSaveDataVersion =
    typeof value.saveDataVersion === 'number' ? value.saveDataVersion : 0;
  const migrated = migrateLegacyNode(value);
  if (!isRecord(migrated)) return migrated;
  const attempts = Array.isArray(migrated.attempts) ? migrated.attempts : [];
  let earnedFromAttempts = 0;
  for (const attempt of attempts) {
    if (!isRecord(attempt)) continue;
    if (isRecord(attempt.clinicStateAtStart)) {
      attempt.clinicStateAtStart.lifetimePointsEarned = earnedFromAttempts;
    }
    if (!isRecord(attempt.receipt) || !isRecord(attempt.receipt.settlement)) continue;
    const settlement = attempt.receipt.settlement;
    const earned = settlement.netClinicPointsEarned;
    const nonnegativeEarned = typeof earned === 'number' && earned >= 0 ? earned : 0;
    settlement.bankedClinicPointsEarned = nonnegativeEarned;
    settlement.practiceMode = false;
    settlement.lifetimePointsBefore = earnedFromAttempts;
    earnedFromAttempts += nonnegativeEarned;
    settlement.lifetimePointsAfter = earnedFromAttempts;
  }
  if (isRecord(migrated.profile)) {
    if (migrated.profile.progressionMode !== 'endgame') {
      migrated.profile.progressionMode = 'standard';
    }
    if (isRecord(migrated.profile.clinic)) {
      const current = migrated.profile.clinic.lifetimePointsEarned;
      migrated.profile.clinic.lifetimePointsEarned = Math.max(
        typeof current === 'number' ? current : 0,
        earnedFromAttempts,
      );
    }
  }
  const profile = PlayerProfileSchema.safeParse(migrated.profile);
  if (!profile.success) return migrated;
  return {
    schemaVersion: 1,
    saveDataVersion: 4,
    profile: profile.data,
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
    legacyArchive: [
      {
        schemaVersion: 1,
        id: 'legacy-save.archive-1',
        sourceSaveDataVersion,
        reason:
          'Archived during the pre-release v4 migration because historical score reports use the retired 0–100 scoring model.',
        archivedAt: new Date().toISOString(),
        payload: migrated,
      },
    ],
  };
};

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });

export class IndexedDbSaveRepository implements SaveRepository {
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open local save data.'));
    });
  }

  async load(): Promise<SaveData | null> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const value = await requestResult(transaction.objectStore(STORE_NAME).get(SAVE_KEY));
      if (value === undefined) return null;
      const parsed = SaveDataSchema.safeParse(migrateSaveData(value));
      return parsed.success ? parsed.data : null;
    } finally {
      database.close();
    }
  }

  async save(data: SaveData): Promise<void> {
    const validated = SaveDataSchema.parse(data);
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      await requestResult(transaction.objectStore(STORE_NAME).put(validated, SAVE_KEY));
    } finally {
      database.close();
    }
  }
}
