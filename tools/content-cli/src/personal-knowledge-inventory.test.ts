import { createHash } from 'node:crypto';
import { lstat, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  PersonalKnowledgeLexicalInventorySchema,
  buildPersonalKnowledgeLexicalInventory,
  countBoundaryAwareLiteralMatches,
  validatePersonalKnowledgeLexicalInventory,
  writePrivatePersonalKnowledgeInventory,
  type PersonalKnowledgeInventorySnapshot,
  type PersonalKnowledgeInventoryTarget,
} from './personal-knowledge-inventory';

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const hash = (value: string): string => createHash('sha256').update(value).digest('hex');

const snapshots: PersonalKnowledgeInventorySnapshot[] = [
  {
    noteRecordId: 'apple-note.alpha',
    sourceDocumentId: 'source-document.alpha',
    titleHash: hash('private alpha title'),
    plaintextHash: hash('private alpha body'),
    sourceModifiedAtProvider: '2026-07-20T12:00:00.000Z',
    title: 'Private alpha title',
    plaintext: 'BUPROPION appeared twice; bupropion was discussed again.',
  },
  {
    noteRecordId: 'apple-note.beta',
    sourceDocumentId: 'source-document.beta',
    titleHash: hash('private beta title'),
    plaintextHash: hash('private beta body'),
    sourceModifiedAtProvider: '2026-07-21T12:00:00.000Z',
    title: 'Private beta title',
    plaintext: 'Romania should not match. Major depressive disorder was discussed.',
  },
];

const targets: PersonalKnowledgeInventoryTarget[] = [
  {
    targetKind: 'medication',
    targetId: 'medication.bupropion',
    label: 'Bupropion',
    terms: ['Bupropion', 'Wellbutrin'],
  },
  {
    targetKind: 'diagnosis',
    targetId: 'diagnosis.major-depressive-disorder',
    label: 'Major depressive disorder',
    terms: ['Major depressive disorder'],
  },
  {
    targetKind: 'diagnosis',
    targetId: 'diagnosis.mania-fixture',
    label: 'Mania fixture',
    terms: ['mania'],
  },
];

describe('personal-knowledge whole-corpus lexical inventory', () => {
  it('is deterministic under reordered input and stores no private prose', () => {
    const first = buildPersonalKnowledgeLexicalInventory(
      {
        snapshots,
        attachmentRecordsExcluded: 4,
        ocrRecordsExcluded: 2,
      },
      targets,
    );
    const second = buildPersonalKnowledgeLexicalInventory(
      {
        snapshots: [...snapshots].reverse(),
        attachmentRecordsExcluded: 4,
        ocrRecordsExcluded: 2,
      },
      [...targets].reverse(),
    );
    expect(second).toEqual(first);
    expect(first.summary).toMatchObject({
      eligibleSourceRevisions: 2,
      matchedSourceRevisions: 2,
      unmatchedSourceRevisions: 0,
      targetIdentityCount: 3,
      matchedTargetIdentityCount: 2,
      totalMatches: 3,
      attachmentRecordsExcluded: 4,
      ocrRecordsExcluded: 2,
      remoteSourcesInspected: 0,
    });
    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain('Private alpha title');
    expect(serialized).not.toContain('appeared twice');
    expect(serialized).not.toContain('Romania');
    expect(validatePersonalKnowledgeLexicalInventory(first)).toEqual(first);
  });

  it('uses NFKC/case normalization and Unicode-aware term boundaries', () => {
    expect(countBoundaryAwareLiteralMatches('BUPROPION and bupropion', 'bupropion')).toBe(2);
    expect(countBoundaryAwareLiteralMatches('Romania', 'mania')).toBe(0);
    expect(countBoundaryAwareLiteralMatches('mania; hypomania', 'mania')).toBe(1);
    expect(countBoundaryAwareLiteralMatches('ＳＳＲＩ and ssri', 'SSRI')).toBe(2);
  });

  it('rejects inconsistent derived values and writes only a private regular file', async () => {
    const inventory = buildPersonalKnowledgeLexicalInventory(
      {
        snapshots,
        attachmentRecordsExcluded: 0,
        ocrRecordsExcluded: 0,
      },
      targets,
    );
    const tampered = structuredClone(inventory);
    tampered.summary.totalMatches += 1;
    expect(() => validatePersonalKnowledgeLexicalInventory(tampered)).toThrow(
      /derived values are inconsistent/,
    );
    expect(
      PersonalKnowledgeLexicalInventorySchema.safeParse({
        ...inventory,
        privateExcerpt: 'must never be accepted',
      }).success,
    ).toBe(false);

    const root = await mkdtemp(join(tmpdir(), 'psychsim-private-inventory-'));
    temporaryDirectories.push(root);
    const output = join(root, 'corpus-lexical-inventory.json');
    await writePrivatePersonalKnowledgeInventory(inventory, output, root);
    const [rootStat, fileStat, stored] = await Promise.all([
      lstat(root),
      lstat(output),
      readFile(output, 'utf8'),
    ]);
    expect(rootStat.mode & 0o777).toBe(0o700);
    expect(fileStat.mode & 0o777).toBe(0o600);
    expect(fileStat.isSymbolicLink()).toBe(false);
    expect(JSON.parse(stored)).toEqual(inventory);
  });
});
