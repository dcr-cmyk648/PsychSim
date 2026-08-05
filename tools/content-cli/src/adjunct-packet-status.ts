import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { z } from 'zod';

const execFile = promisify(execFileCallback);

const CoordinationStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    coordinationRevision: z.number().int().nonnegative(),
    updatedAt: z.string().min(1),
    activeReview: z
      .object({
        packetId: z.string().min(1),
        path: z.string().min(1),
        status: z.string().min(1),
      })
      .strict()
      .nullable(),
    lastReviewedPacket: z
      .object({
        packetId: z.string().min(1),
        path: z.string().min(1),
        status: z.string().min(1),
      })
      .strict()
      .nullable(),
    latestReconciledInput: z.unknown().optional(),
  })
  .passthrough();

export interface AdjunctPacketInventoryEntry {
  packetId: string;
  reviewPath: string | null;
  packetStatus: string | null;
  developerReviewPaths: string[];
  psychsimBriefPath: string | null;
  researchMatrixPath: string | null;
  legacyHandoffPaths: string[];
  contentFingerprint: string;
  activeReview: boolean;
  workflowState:
    | 'active_review'
    | 'developer_review_recorded'
    | 'legacy_handoff_only'
    | 'prepared'
    | 'unclassified';
  canonicalNextAction:
    | 'await_developer_review'
    | 'await_immutable_source_units_and_snapshot_mapping'
    | 'legacy_handoff_requires_rederivation'
    | 'inspect_packet_record';
}

export interface AdjunctPacketInventory {
  schemaVersion: 1;
  adjunctRoot: string;
  git: {
    head: string | null;
    branch: string | null;
    dirty: boolean | null;
    changedPathCount: number | null;
  };
  coordination: {
    revision: number;
    updatedAt: string;
    activePacketId: string | null;
    activeStatus: string | null;
    lastReviewedPacketId: string | null;
    lastReviewedStatus: string | null;
  };
  counts: {
    packets: number;
    developerReviewedPackets: number;
    activeReviewPackets: number;
    legacyHandoffBundles: number;
    immutableEvidenceBundles: number;
    snapshotMappingProposals: number;
  };
  packets: AdjunctPacketInventoryEntry[];
  medicationQueue: AdjunctPacketInventoryEntry[];
  proposalPaths: string[];
  evidenceBundlePaths: string[];
  inventoryFingerprint: string;
}

export interface ReadAdjunctPacketInventoryOptions {
  adjunctRoot?: string;
  includeGit?: boolean;
}

const DEFAULT_ADJUNCT_ROOT = resolve('..', 'PsychSimDataAdjunct');
const MEDICATION_PACKET_PATTERN =
  /(medication|antidepressant|antipsychotic|mood-stabilizer|anticonvulsant|insomnia-wakefulness|substance-use-withdrawal-overdose-tobacco|cognition-dementia-behavior)/i;

const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

const sortedFileNames = async (directory: string): Promise<string[]> => {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
};

const sortedDirectoryNames = async (directory: string): Promise<string[]> => {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
};

const readOptional = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
};

const relativePath = (root: string, path: string): string =>
  relative(root, path).split('\\').join('/');

const packetStatusFromReview = (review: string | null): string | null => {
  if (review === null) return null;
  const match = review.match(/^- \*\*Status:\*\*\s*`?([^`\n]+)`?\s*$/m);
  return match?.[1]?.trim() ?? null;
};

const packetIdFromLegacyHandoff = async (path: string): Promise<string | null> => {
  try {
    const value = JSON.parse(await readFile(path, 'utf8')) as { packetId?: unknown };
    return typeof value.packetId === 'string' && value.packetId.length > 0 ? value.packetId : null;
  } catch {
    return null;
  }
};

const fingerprintDirectoryFiles = async (
  directory: string,
  fileNames: readonly string[],
): Promise<string> => {
  const content = await Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      sha256: sha256(await readFile(join(directory, fileName), 'utf8')),
    })),
  );
  return sha256(JSON.stringify(content));
};

const readGitState = async (root: string): Promise<AdjunctPacketInventory['git']> => {
  try {
    const [{ stdout: head }, { stdout: branch }, { stdout: status }] = await Promise.all([
      execFile('git', ['rev-parse', 'HEAD'], { cwd: root }),
      execFile('git', ['branch', '--show-current'], { cwd: root }),
      execFile('git', ['status', '--porcelain=v1'], { cwd: root }),
    ]);
    const changedPaths = status
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      head: head.trim(),
      branch: branch.trim() || null,
      dirty: changedPaths.length > 0,
      changedPathCount: changedPaths.length,
    };
  } catch {
    return {
      head: null,
      branch: null,
      dirty: null,
      changedPathCount: null,
    };
  }
};

const workflowFor = (input: {
  activeReview: boolean;
  developerReviewPaths: readonly string[];
  legacyHandoffPaths: readonly string[];
  reviewPath: string | null;
}): Pick<AdjunctPacketInventoryEntry, 'workflowState' | 'canonicalNextAction'> => {
  if (input.activeReview) {
    return {
      workflowState: 'active_review',
      canonicalNextAction: 'await_developer_review',
    };
  }
  if (input.developerReviewPaths.length > 0) {
    return {
      workflowState: 'developer_review_recorded',
      canonicalNextAction: 'await_immutable_source_units_and_snapshot_mapping',
    };
  }
  if (input.legacyHandoffPaths.length > 0) {
    return {
      workflowState: 'legacy_handoff_only',
      canonicalNextAction: 'legacy_handoff_requires_rederivation',
    };
  }
  if (input.reviewPath !== null) {
    return {
      workflowState: 'prepared',
      canonicalNextAction: 'await_developer_review',
    };
  }
  return {
    workflowState: 'unclassified',
    canonicalNextAction: 'inspect_packet_record',
  };
};

export const readAdjunctPacketInventory = async (
  options: ReadAdjunctPacketInventoryOptions = {},
): Promise<AdjunctPacketInventory> => {
  const adjunctRoot = resolve(options.adjunctRoot ?? DEFAULT_ADJUNCT_ROOT);
  const coordinationPath = join(adjunctRoot, 'coordination', 'thread-sync-state.json');
  const coordination = CoordinationStateSchema.parse(
    JSON.parse(await readFile(coordinationPath, 'utf8')) as unknown,
  );
  const packetRoot = join(adjunctRoot, 'packets');
  const packetIds = (await sortedDirectoryNames(packetRoot)).filter((name) =>
    name.startsWith('adjunct-packet.'),
  );

  const legacyHandoffRoot = join(adjunctRoot, 'handoff', 'psychsim');
  const legacyHandoffFiles = (await sortedFileNames(legacyHandoffRoot)).filter(
    (name) => name.endsWith('.json') && name.startsWith('adjunct-bundle.'),
  );
  const legacyHandoffsByPacket = new Map<string, string[]>();
  for (const fileName of legacyHandoffFiles) {
    const path = join(legacyHandoffRoot, fileName);
    const packetId = await packetIdFromLegacyHandoff(path);
    if (packetId === null) continue;
    const paths = legacyHandoffsByPacket.get(packetId) ?? [];
    paths.push(relativePath(adjunctRoot, path));
    legacyHandoffsByPacket.set(packetId, paths);
  }

  const packets = await Promise.all(
    packetIds.map(async (packetId): Promise<AdjunctPacketInventoryEntry> => {
      const packetDirectory = join(packetRoot, packetId);
      const fileNames = await sortedFileNames(packetDirectory);
      const reviewFile = fileNames.includes('review.md') ? 'review.md' : null;
      const reviewPath =
        reviewFile === null ? null : relativePath(adjunctRoot, join(packetDirectory, reviewFile));
      const review =
        reviewFile === null ? null : await readOptional(join(packetDirectory, reviewFile));
      const developerReviewPaths = fileNames
        .filter((name) => name.startsWith('developer-review') && name.endsWith('.md'))
        .map((name) => relativePath(adjunctRoot, join(packetDirectory, name)));
      const psychsimBriefPath = fileNames.includes('psychsim-brief.md')
        ? relativePath(adjunctRoot, join(packetDirectory, 'psychsim-brief.md'))
        : null;
      const researchMatrixPath = fileNames.includes('research-matrix.md')
        ? relativePath(adjunctRoot, join(packetDirectory, 'research-matrix.md'))
        : null;
      const legacyHandoffPaths = legacyHandoffsByPacket.get(packetId) ?? [];
      const activeReview = coordination.activeReview?.packetId === packetId;
      return {
        packetId,
        reviewPath,
        packetStatus: packetStatusFromReview(review),
        developerReviewPaths,
        psychsimBriefPath,
        researchMatrixPath,
        legacyHandoffPaths,
        contentFingerprint: await fingerprintDirectoryFiles(packetDirectory, fileNames),
        activeReview,
        ...workflowFor({
          activeReview,
          developerReviewPaths,
          legacyHandoffPaths,
          reviewPath,
        }),
      };
    }),
  );

  const proposalPaths = (await sortedFileNames(join(adjunctRoot, 'proposals', 'psychsim')))
    .filter((name) => name.endsWith('.json'))
    .map((name) => `proposals/psychsim/${name}`);
  const evidenceBundlePaths = (await sortedFileNames(join(adjunctRoot, 'evidence', 'bundles')))
    .filter((name) => name.endsWith('.json'))
    .map((name) => `evidence/bundles/${name}`);
  const medicationQueue = packets.filter((packet) =>
    MEDICATION_PACKET_PATTERN.test(packet.packetId),
  );
  const git =
    options.includeGit === false
      ? {
          head: null,
          branch: null,
          dirty: null,
          changedPathCount: null,
        }
      : await readGitState(adjunctRoot);
  const inventoryPayload = {
    git,
    coordination: {
      revision: coordination.coordinationRevision,
      updatedAt: coordination.updatedAt,
      activePacketId: coordination.activeReview?.packetId ?? null,
      activeStatus: coordination.activeReview?.status ?? null,
      lastReviewedPacketId: coordination.lastReviewedPacket?.packetId ?? null,
      lastReviewedStatus: coordination.lastReviewedPacket?.status ?? null,
    },
    packets,
    proposalPaths,
    evidenceBundlePaths,
  };

  return {
    schemaVersion: 1,
    adjunctRoot,
    git,
    coordination: inventoryPayload.coordination,
    counts: {
      packets: packets.length,
      developerReviewedPackets: packets.filter((packet) => packet.developerReviewPaths.length > 0)
        .length,
      activeReviewPackets: packets.filter((packet) => packet.activeReview).length,
      legacyHandoffBundles: legacyHandoffFiles.length,
      immutableEvidenceBundles: evidenceBundlePaths.length,
      snapshotMappingProposals: proposalPaths.length,
    },
    packets,
    medicationQueue,
    proposalPaths,
    evidenceBundlePaths,
    inventoryFingerprint: sha256(JSON.stringify(inventoryPayload)),
  };
};

export const formatAdjunctPacketInventory = (inventory: AdjunctPacketInventory): string => {
  const lines = [
    'PASS read-only PsychSimDataAdjunct inventory',
    `Root: ${inventory.adjunctRoot}`,
    `Git: ${inventory.git.branch ?? 'unknown'} ${inventory.git.head ?? 'unknown'}; ${
      inventory.git.dirty === null
        ? 'worktree state unknown'
        : inventory.git.dirty
          ? `${inventory.git.changedPathCount} changed paths`
          : 'clean'
    }`,
    `Coordination revision: ${inventory.coordination.revision} (${inventory.coordination.updatedAt})`,
    `Active review: ${inventory.coordination.activePacketId ?? 'none'} [${
      inventory.coordination.activeStatus ?? 'none'
    }]`,
    `Packets: ${inventory.counts.packets}; developer-reviewed: ${inventory.counts.developerReviewedPackets}; legacy handoffs: ${inventory.counts.legacyHandoffBundles}; immutable evidence bundles: ${inventory.counts.immutableEvidenceBundles}; snapshot mappings: ${inventory.counts.snapshotMappingProposals}.`,
    `Inventory fingerprint: ${inventory.inventoryFingerprint}`,
    '',
    'Medication-related canonical intake queue:',
  ];
  for (const packet of inventory.medicationQueue) {
    lines.push(`- ${packet.packetId}: ${packet.workflowState}; ${packet.canonicalNextAction}`);
  }
  lines.push(
    '',
    inventory.counts.snapshotMappingProposals === 0
      ? 'No snapshot-bound PsychSim mapping proposal is available for direct canonical intake.'
      : 'Snapshot-bound proposal files exist; validate their exact hashes, source use, targets, and freshness before any canonical intake.',
  );
  return lines.join('\n');
};

export const runAdjunctPacketStatusCli = async (args: readonly string[]): Promise<void> => {
  const normalizedArgs = args.filter((argument) => argument !== '--');
  let adjunctRoot: string | undefined;
  let json = false;
  for (let index = 0; index < normalizedArgs.length; index += 1) {
    const argument = normalizedArgs[index]!;
    if (argument === '--json') {
      json = true;
      continue;
    }
    if (argument === '--adjunct-root') {
      const value = normalizedArgs[index + 1];
      if (!value) throw new Error('--adjunct-root requires a path.');
      adjunctRoot = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown adjunct-status argument: ${argument}`);
  }
  const inventory = await readAdjunctPacketInventory({ adjunctRoot });
  console.log(json ? JSON.stringify(inventory, null, 2) : formatAdjunctPacketInventory(inventory));
};

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await runAdjunctPacketStatusCli(process.argv.slice(2));
}
