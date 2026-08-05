import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { formatAdjunctPacketInventory, readAdjunctPacketInventory } from './adjunct-packet-status';

const writeFixture = async (path: string, value: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value, 'utf8');
};

describe('read-only PsychSimDataAdjunct inventory', () => {
  it('classifies packet workflow without treating reviews or legacy handoffs as mappings', async () => {
    const root = await mkdtemp(join(tmpdir(), 'psychsim-adjunct-status-'));
    await writeFixture(
      join(root, 'coordination', 'thread-sync-state.json'),
      JSON.stringify({
        schemaVersion: 1,
        coordinationRevision: 7,
        updatedAt: '2026-08-05T12:00:00-04:00',
        activeReview: {
          packetId: 'adjunct-packet.active-medication.2026-08-05',
          path: 'packets/adjunct-packet.active-medication.2026-08-05/review.md',
          status: 'prepared_for_sequential_review',
        },
        lastReviewedPacket: {
          packetId: 'adjunct-packet.reviewed-antidepressant.2026-08-04',
          path: 'packets/adjunct-packet.reviewed-antidepressant.2026-08-04/developer-review.2026-08-05.md',
          status: 'reviewed',
        },
      }),
    );
    await writeFixture(
      join(root, 'packets', 'adjunct-packet.active-medication.2026-08-05', 'review.md'),
      '- **Status:** `prepared_for_sequential_review`\n',
    );
    await writeFixture(
      join(root, 'packets', 'adjunct-packet.reviewed-antidepressant.2026-08-04', 'review.md'),
      '- **Status:** `prepared_for_sequential_review`\n',
    );
    await writeFixture(
      join(
        root,
        'packets',
        'adjunct-packet.reviewed-antidepressant.2026-08-04',
        'developer-review.2026-08-05.md',
      ),
      '# Developer review\n',
    );
    await writeFixture(
      join(root, 'packets', 'adjunct-packet.legacy-only.2026-08-03', 'review.md'),
      '# Review\n',
    );
    await writeFixture(
      join(root, 'handoff', 'psychsim', 'adjunct-bundle.legacy-only.2026-08-03.json'),
      JSON.stringify({
        packetId: 'adjunct-packet.legacy-only.2026-08-03',
      }),
    );
    await writeFixture(
      join(root, 'evidence', 'bundles', 'adjunct-evidence-bundle.fixture.json'),
      '{}\n',
    );
    await mkdir(join(root, 'proposals', 'psychsim'), { recursive: true });

    const inventory = await readAdjunctPacketInventory({
      adjunctRoot: root,
      includeGit: false,
    });

    expect(inventory.counts).toEqual({
      packets: 3,
      developerReviewedPackets: 1,
      activeReviewPackets: 1,
      legacyHandoffBundles: 1,
      immutableEvidenceBundles: 1,
      snapshotMappingProposals: 0,
    });
    expect(
      inventory.packets.map((packet) => ({
        id: packet.packetId,
        state: packet.workflowState,
        action: packet.canonicalNextAction,
      })),
    ).toEqual([
      {
        id: 'adjunct-packet.active-medication.2026-08-05',
        state: 'active_review',
        action: 'await_developer_review',
      },
      {
        id: 'adjunct-packet.legacy-only.2026-08-03',
        state: 'legacy_handoff_only',
        action: 'legacy_handoff_requires_rederivation',
      },
      {
        id: 'adjunct-packet.reviewed-antidepressant.2026-08-04',
        state: 'developer_review_recorded',
        action: 'await_immutable_source_units_and_snapshot_mapping',
      },
    ]);
    expect(inventory.medicationQueue.map((packet) => packet.packetId)).toEqual([
      'adjunct-packet.active-medication.2026-08-05',
      'adjunct-packet.reviewed-antidepressant.2026-08-04',
    ]);
    expect(formatAdjunctPacketInventory(inventory)).toContain(
      'No snapshot-bound PsychSim mapping proposal is available',
    );
  });
});
