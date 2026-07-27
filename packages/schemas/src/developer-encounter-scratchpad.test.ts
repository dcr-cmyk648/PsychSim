import { describe, expect, it } from 'vitest';

import { DeveloperEncounterScratchpadSchema } from './index';

const scratchpad = {
  schemaVersion: 1,
  id: 'scratchpad.case-instance.test',
  caseInstanceId: 'case-instance.test',
  blueprintId: 'case.test',
  caseContentVersion: '1.0.0',
  seed: 'seed-test',
  reviewerNote: 'Question the workup reward before changing this rule.',
  createdAt: '2026-07-27T12:00:00.000Z',
  updatedAt: '2026-07-27T12:05:00.000Z',
};

describe('Developer encounter scratchpad schema', () => {
  it('preserves an attempt-scoped note without accepting gameplay state', () => {
    expect(DeveloperEncounterScratchpadSchema.parse(scratchpad)).toEqual(scratchpad);
    expect(
      DeveloperEncounterScratchpadSchema.safeParse({
        ...scratchpad,
        reviewerNote: ' ',
      }).success,
    ).toBe(false);
    expect(
      DeveloperEncounterScratchpadSchema.safeParse({
        ...scratchpad,
        treatmentSelections: { startMedicationIds: ['medication.sertraline'] },
      }).success,
    ).toBe(false);
  });
});
