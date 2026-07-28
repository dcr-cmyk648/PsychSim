import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { chmod, mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import {
  ClinicalTicketExportBundleSchema,
  RemoteSourceDiscoveryManifestSchema,
  type RemoteSourceCandidate,
  type RemoteSourceDiscoveryManifest,
} from '@psychsim/schemas';
import { scanSourceInbox } from './source-pipeline';

export const DRIVE_REMOTE_NAME = 'psychsim-drive';
export const DRIVE_FOLDER_NAME = 'PsychSim documents';
export const DEFAULT_DRIVE_MANIFEST_PATH = resolve(
  'content/source-docs/manifests/google-drive-discovery.json',
);
export const DEFAULT_DRIVE_REVIEW_INBOX = resolve('content/generated/drive-review-inbox');
export const DEFAULT_SOURCE_INBOX = resolve('content/source-docs/inbox');

const REVIEW_BUNDLE_SUFFIX = '.review-bundle.json';
const SHARED_CLIENT_RETIREMENT_MARKER = 'shared Google Drive client_id';
const execFile = promisify(execFileCallback);

export interface RcloneDriveEntry {
  ID: string;
  IsDir: boolean;
  MimeType: string;
  ModTime: string;
  Name: string;
  Path: string;
  Size: number;
  Hashes?: Record<string, string>;
}

export type DriveSourceAction = 'discover' | 'repull' | 'refresh_metadata' | 'unchanged';
export type DriveReviewAction = 'pull' | 'unchanged';

export interface PlannedDriveSource {
  action: DriveSourceAction;
  candidate: RemoteSourceCandidate;
  remote: RcloneDriveEntry;
}

export interface PlannedDriveReviewBundle {
  action: DriveReviewAction;
  remote: RcloneDriveEntry;
}

export interface DriveSyncPlan {
  sources: PlannedDriveSource[];
  reviewBundles: PlannedDriveReviewBundle[];
  ignoredRemoteFiles: string[];
  retainedMissingCandidates: RemoteSourceCandidate[];
}

export interface DriveCommandResult {
  stdout: string;
  stderr: string;
}

export interface DriveSyncOptions {
  manifestPath?: string;
  reviewInbox?: string;
  sourceInbox?: string;
  now?: () => string;
  runCommand?: (args: readonly string[]) => Promise<DriveCommandResult>;
}

export interface DriveStatusReport {
  remoteFiles: number;
  sourceCandidates: number;
  sourceDiscoveries: number;
  sourceRepulls: number;
  reviewBundles: number;
  reviewBundlesToPull: number;
  ignoredRemoteFiles: number;
  sharedClientRetirementWarning: boolean;
  manifestPath: string;
  reviewInbox: string;
  nextSourceCandidate: { id: string; filename: string } | null;
}

export interface DriveSyncReport extends DriveStatusReport {
  pulledReviewBundles: number;
  quarantinedReviewBundles: number;
  pulledSourceRevisions: number;
  sourceScanRan: boolean;
}

export interface DriveSourcePullReport {
  candidateId: string;
  filename: string;
  sha256: string;
  sizeBytes: number;
  manifestPath: string;
}

const sha256 = (value: Uint8Array | string): string =>
  createHash('sha256').update(value).digest('hex');

const normalizeHash = (value: string | undefined): string | undefined => value?.toLocaleLowerCase();

const supportedSourceExtensions = new Set(['.pdf', '.docx', '.txt', '.md', '.markdown']);

const isReviewBundle = (entry: RcloneDriveEntry): boolean =>
  entry.Name.toLocaleLowerCase().endsWith(REVIEW_BUNDLE_SUFFIX);

const isSupportedSource = (entry: RcloneDriveEntry): boolean =>
  supportedSourceExtensions.has(extname(entry.Name).toLocaleLowerCase());

const safeFilename = (value: string): string => {
  const cleaned = basename(value)
    .normalize('NFKC')
    .split('')
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? '-' : character;
    })
    .join('')
    .replaceAll(/[/\\:]/g, '-')
    .replaceAll(/\s+/g, ' ')
    .trim();
  if (cleaned === '' || cleaned === '.' || cleaned === '..') {
    throw new Error('Drive file has no safe local filename.');
  }
  return cleaned;
};

const sourceInboxFilename = (entry: RcloneDriveEntry): string =>
  `google-drive--${sha256(entry.ID).slice(0, 10)}--${safeFilename(entry.Name)}`;

const candidateIdFor = (providerFileId: string): string =>
  `source-candidate.google-drive.${sha256(providerFileId).slice(0, 20)}`;

const webViewUrlFor = (providerFileId: string): string =>
  `https://drive.google.com/open?id=${encodeURIComponent(providerFileId)}`;

const remoteContentChanged = (
  entry: RcloneDriveEntry,
  existing: RemoteSourceCandidate,
): boolean => {
  if (entry.ModTime !== existing.sourceModifiedAt) return true;
  const remoteHash = normalizeHash(entry.Hashes?.sha256);
  return Boolean(remoteHash && existing.sha256 && remoteHash !== existing.sha256);
};

const candidateFromRemote = (
  entry: RcloneDriveEntry,
  existing: RemoteSourceCandidate | undefined,
  folderId: string,
  timestamp: string,
  reviewOrder: number,
): RemoteSourceCandidate => {
  const usableSize = entry.Size >= 0 ? entry.Size : (existing?.sizeBytes ?? 0);
  return {
    schemaVersion: 1,
    id: existing?.id ?? candidateIdFor(entry.ID),
    provider: 'google_drive',
    providerFileId: entry.ID,
    providerFolderId: existing?.providerFolderId ?? folderId,
    filename: entry.Name,
    mediaType: entry.MimeType || existing?.mediaType || 'application/octet-stream',
    sizeBytes: usableSize,
    sourceModifiedAt: entry.ModTime,
    discoveredAt: existing?.discoveredAt ?? timestamp,
    webViewUrl: existing?.webViewUrl ?? webViewUrlFor(entry.ID),
    status: existing?.status ?? 'discovered',
    sha256: existing?.sha256 ?? null,
    reviewOrder: existing?.reviewOrder ?? reviewOrder,
  };
};

export const planGoogleDriveSync = (input: {
  manifest: RemoteSourceDiscoveryManifest;
  remoteEntries: readonly RcloneDriveEntry[];
  localReviewHashes: ReadonlySet<string>;
  localReviewNames: ReadonlySet<string>;
  timestamp: string;
}): DriveSyncPlan => {
  const existingByProviderId = new Map(
    input.manifest.candidates.map((candidate) => [candidate.providerFileId, candidate]),
  );
  const remoteProviderIds = new Set<string>();
  let nextReviewOrder =
    input.manifest.candidates.reduce(
      (maximum, candidate) => Math.max(maximum, candidate.reviewOrder),
      0,
    ) + 1;
  const sources: PlannedDriveSource[] = [];
  const reviewBundles: PlannedDriveReviewBundle[] = [];
  const ignoredRemoteFiles: string[] = [];

  for (const entry of input.remoteEntries) {
    if (entry.IsDir) continue;
    remoteProviderIds.add(entry.ID);
    if (isReviewBundle(entry)) {
      const remoteHash = normalizeHash(entry.Hashes?.sha256);
      const alreadyLocal =
        (remoteHash !== undefined && input.localReviewHashes.has(remoteHash)) ||
        (remoteHash === undefined && input.localReviewNames.has(safeFilename(entry.Name)));
      reviewBundles.push({ action: alreadyLocal ? 'unchanged' : 'pull', remote: entry });
      continue;
    }
    if (!isSupportedSource(entry)) {
      ignoredRemoteFiles.push(entry.Name);
      continue;
    }

    const existing = existingByProviderId.get(entry.ID);
    const candidate = candidateFromRemote(
      entry,
      existing,
      input.manifest.folderId,
      input.timestamp,
      nextReviewOrder,
    );
    if (!existing) {
      nextReviewOrder += 1;
      sources.push({ action: 'discover', candidate, remote: entry });
      continue;
    }

    const contentChanged = remoteContentChanged(entry, existing);
    if (contentChanged && existing.status === 'pulled') {
      sources.push({ action: 'repull', candidate, remote: entry });
    } else if (
      candidate.filename !== existing.filename ||
      candidate.mediaType !== existing.mediaType ||
      candidate.sizeBytes !== existing.sizeBytes ||
      candidate.sourceModifiedAt !== existing.sourceModifiedAt
    ) {
      sources.push({ action: 'refresh_metadata', candidate, remote: entry });
    } else {
      sources.push({ action: 'unchanged', candidate, remote: entry });
    }
  }

  return {
    sources,
    reviewBundles,
    ignoredRemoteFiles,
    retainedMissingCandidates: input.manifest.candidates.filter(
      (candidate) => !remoteProviderIds.has(candidate.providerFileId),
    ),
  };
};

const defaultRunCommand = async (args: readonly string[]): Promise<DriveCommandResult> => {
  const result = await execFile('rclone', [...args], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return { stdout: result.stdout, stderr: result.stderr };
};

const listRemoteEntries = async (
  runCommand: (args: readonly string[]) => Promise<DriveCommandResult>,
): Promise<{ entries: RcloneDriveEntry[]; sharedClientRetirementWarning: boolean }> => {
  let result: DriveCommandResult;
  try {
    result = await runCommand([
      'lsjson',
      `${DRIVE_REMOTE_NAME}:`,
      '--files-only',
      '--max-depth',
      '1',
      '--hash',
      '--metadata',
    ]);
  } catch {
    throw new Error(
      `Unable to read the ${DRIVE_REMOTE_NAME} read-only remote. Run "pnpm content:drive:status" after checking network access and rclone authentication.`,
    );
  }
  const parsed = JSON.parse(result.stdout) as unknown;
  if (!Array.isArray(parsed)) throw new Error('rclone returned a non-array Drive listing.');
  const entries = parsed.map((value, index) => {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('ID' in value) ||
      !('Name' in value) ||
      !('Path' in value) ||
      !('ModTime' in value)
    ) {
      throw new Error(`rclone Drive listing entry ${index + 1} is incomplete.`);
    }
    const candidate = value as Partial<RcloneDriveEntry>;
    if (
      typeof candidate.ID !== 'string' ||
      typeof candidate.Name !== 'string' ||
      typeof candidate.Path !== 'string' ||
      typeof candidate.ModTime !== 'string'
    ) {
      throw new Error(`rclone Drive listing entry ${index + 1} has invalid identity fields.`);
    }
    return {
      ID: candidate.ID,
      IsDir: candidate.IsDir ?? false,
      MimeType: candidate.MimeType ?? 'application/octet-stream',
      ModTime: candidate.ModTime,
      Name: candidate.Name,
      Path: candidate.Path,
      Size: candidate.Size ?? 0,
      Hashes: candidate.Hashes ?? {},
    };
  });
  return {
    entries,
    sharedClientRetirementWarning: result.stderr.includes(SHARED_CLIENT_RETIREMENT_MARKER),
  };
};

const emptyManifest = (timestamp: string): RemoteSourceDiscoveryManifest =>
  RemoteSourceDiscoveryManifestSchema.parse({
    schemaVersion: 1,
    provider: 'google_drive',
    folderId: `${DRIVE_REMOTE_NAME}:`,
    folderName: DRIVE_FOLDER_NAME,
    lastScannedAt: timestamp,
    candidates: [],
  });

const loadDriveManifest = async (
  manifestPath: string,
  timestamp: string,
): Promise<RemoteSourceDiscoveryManifest> => {
  try {
    return RemoteSourceDiscoveryManifestSchema.parse(
      JSON.parse(await readFile(manifestPath, 'utf8')) as unknown,
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyManifest(timestamp);
    throw error;
  }
};

const readLocalReviewState = async (
  reviewInbox: string,
): Promise<{ hashes: Set<string>; names: Set<string> }> => {
  const hashes = new Set<string>();
  const names = new Set<string>();
  const readDirectory = async (directory: string, quarantined: boolean): Promise<void> => {
    try {
      for (const filename of await readdir(directory)) {
        const lowerFilename = filename.toLocaleLowerCase();
        if (
          quarantined
            ? !lowerFilename.endsWith('.json')
            : !lowerFilename.endsWith(REVIEW_BUNDLE_SUFFIX)
        ) {
          continue;
        }
        const bytes = await readFile(join(directory, filename));
        hashes.add(sha256(bytes));
        if (!quarantined) names.add(filename);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  };
  await Promise.all([
    readDirectory(reviewInbox, false),
    readDirectory(join(reviewInbox, 'quarantine'), true),
  ]);
  return { hashes, names };
};

const writeManifest = async (
  manifestPath: string,
  manifest: RemoteSourceDiscoveryManifest,
): Promise<void> => {
  await mkdir(dirname(manifestPath), { recursive: true });
  const temporaryPath = `${manifestPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await rename(temporaryPath, manifestPath);
  await chmod(manifestPath, 0o600);
};

const downloadRemoteFile = async (
  entry: RcloneDriveEntry,
  targetPath: string,
  runCommand: (args: readonly string[]) => Promise<DriveCommandResult>,
): Promise<void> => {
  await mkdir(dirname(targetPath), { recursive: true });
  await runCommand([
    'copyto',
    `${DRIVE_REMOTE_NAME}:${entry.Path}`,
    targetPath,
    '--drive-export-formats',
    'docx,xlsx,pptx,pdf',
  ]);
};

const pullReviewBundle = async (
  entry: RcloneDriveEntry,
  reviewInbox: string,
  runCommand: (args: readonly string[]) => Promise<DriveCommandResult>,
): Promise<'pulled' | 'unchanged' | 'quarantined'> => {
  await mkdir(reviewInbox, { recursive: true });
  const safeName = safeFilename(entry.Name);
  const temporaryPath = join(reviewInbox, `.${safeName}.${process.pid}.tmp`);
  await downloadRemoteFile(entry, temporaryPath, runCommand);
  const bytes = await readFile(temporaryPath);
  const hash = sha256(bytes);
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString('utf8')) as unknown;
    ClinicalTicketExportBundleSchema.parse(parsed);
  } catch (error) {
    const quarantineDirectory = join(reviewInbox, 'quarantine');
    await mkdir(quarantineDirectory, { recursive: true });
    const quarantinePath = join(
      quarantineDirectory,
      `${safeName.replace(REVIEW_BUNDLE_SUFFIX, '')}--invalid-${hash.slice(0, 12)}.json`,
    );
    await rename(temporaryPath, quarantinePath);
    await writeFile(
      `${quarantinePath}.error.txt`,
      `${error instanceof Error ? error.message : 'Invalid review bundle.'}\n`,
      { mode: 0o600 },
    );
    return 'quarantined';
  }

  const primaryTarget = join(reviewInbox, safeName);
  try {
    const existing = await readFile(primaryTarget);
    if (sha256(existing) === hash) {
      await unlink(temporaryPath);
      return 'unchanged';
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const targetPath = await (async (): Promise<string> => {
    try {
      await readFile(primaryTarget);
      return join(
        reviewInbox,
        `${safeName.replace(REVIEW_BUNDLE_SUFFIX, '')}--${hash.slice(0, 12)}${REVIEW_BUNDLE_SUFFIX}`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return primaryTarget;
      throw error;
    }
  })();
  await rename(temporaryPath, targetPath);
  await chmod(targetPath, 0o600);
  return 'pulled';
};

const buildStatusReport = (
  plan: DriveSyncPlan,
  remoteFiles: number,
  sharedClientRetirementWarning: boolean,
  manifestPath: string,
  reviewInbox: string,
): DriveStatusReport => {
  const nextSource = plan.sources
    .filter((item) => item.candidate.status === 'discovered')
    .sort((left, right) => left.candidate.reviewOrder - right.candidate.reviewOrder)[0];
  return {
    remoteFiles,
    sourceCandidates: plan.sources.length + plan.retainedMissingCandidates.length,
    sourceDiscoveries: plan.sources.filter((item) => item.action === 'discover').length,
    sourceRepulls: plan.sources.filter((item) => item.action === 'repull').length,
    reviewBundles: plan.reviewBundles.length,
    reviewBundlesToPull: plan.reviewBundles.filter((item) => item.action === 'pull').length,
    ignoredRemoteFiles: plan.ignoredRemoteFiles.length,
    sharedClientRetirementWarning,
    manifestPath,
    reviewInbox,
    nextSourceCandidate: nextSource
      ? { id: nextSource.candidate.id, filename: nextSource.candidate.filename }
      : null,
  };
};

const prepareDrivePlan = async (
  options: DriveSyncOptions,
): Promise<{
  plan: DriveSyncPlan;
  manifest: RemoteSourceDiscoveryManifest;
  listing: { entries: RcloneDriveEntry[]; sharedClientRetirementWarning: boolean };
  manifestPath: string;
  reviewInbox: string;
  sourceInbox: string;
  timestamp: string;
  runCommand: (args: readonly string[]) => Promise<DriveCommandResult>;
}> => {
  const timestamp = options.now?.() ?? new Date().toISOString();
  const manifestPath = options.manifestPath ?? DEFAULT_DRIVE_MANIFEST_PATH;
  const reviewInbox = options.reviewInbox ?? DEFAULT_DRIVE_REVIEW_INBOX;
  const sourceInbox = options.sourceInbox ?? DEFAULT_SOURCE_INBOX;
  const runCommand = options.runCommand ?? defaultRunCommand;
  const [manifest, localReviews, listing] = await Promise.all([
    loadDriveManifest(manifestPath, timestamp),
    readLocalReviewState(reviewInbox),
    listRemoteEntries(runCommand),
  ]);
  const plan = planGoogleDriveSync({
    manifest,
    remoteEntries: listing.entries,
    localReviewHashes: localReviews.hashes,
    localReviewNames: localReviews.names,
    timestamp,
  });
  return {
    plan,
    manifest,
    listing,
    manifestPath,
    reviewInbox,
    sourceInbox,
    timestamp,
    runCommand,
  };
};

export const getGoogleDriveStatus = async (
  options: DriveSyncOptions = {},
): Promise<DriveStatusReport> => {
  const prepared = await prepareDrivePlan(options);
  return buildStatusReport(
    prepared.plan,
    prepared.listing.entries.length,
    prepared.listing.sharedClientRetirementWarning,
    prepared.manifestPath,
    prepared.reviewInbox,
  );
};

export const syncGoogleDrive = async (options: DriveSyncOptions = {}): Promise<DriveSyncReport> => {
  const prepared = await prepareDrivePlan(options);
  let pulledReviewBundles = 0;
  let quarantinedReviewBundles = 0;
  for (const item of prepared.plan.reviewBundles.filter((entry) => entry.action === 'pull')) {
    const outcome = await pullReviewBundle(item.remote, prepared.reviewInbox, prepared.runCommand);
    if (outcome === 'pulled') pulledReviewBundles += 1;
    if (outcome === 'quarantined') quarantinedReviewBundles += 1;
  }

  const updatedCandidates: RemoteSourceCandidate[] = [];
  let pulledSourceRevisions = 0;
  for (const item of prepared.plan.sources) {
    if (item.action !== 'repull') {
      updatedCandidates.push(item.candidate);
      continue;
    }
    const targetPath = join(prepared.sourceInbox, sourceInboxFilename(item.remote));
    await downloadRemoteFile(item.remote, targetPath, prepared.runCommand);
    const bytes = await readFile(targetPath);
    updatedCandidates.push({
      ...item.candidate,
      status: 'pulled',
      sha256: sha256(bytes),
      sizeBytes: bytes.byteLength,
    });
    pulledSourceRevisions += 1;
  }
  updatedCandidates.push(...prepared.plan.retainedMissingCandidates);
  updatedCandidates.sort((left, right) => left.reviewOrder - right.reviewOrder);

  const nextManifest = RemoteSourceDiscoveryManifestSchema.parse({
    ...prepared.manifest,
    lastScannedAt: prepared.timestamp,
    candidates: updatedCandidates,
  });

  const sourceScanRan = pulledSourceRevisions > 0;
  if (sourceScanRan) {
    await scanSourceInbox({ root: dirname(prepared.sourceInbox), now: options.now });
  }
  await writeManifest(prepared.manifestPath, nextManifest);

  return {
    ...buildStatusReport(
      prepared.plan,
      prepared.listing.entries.length,
      prepared.listing.sharedClientRetirementWarning,
      prepared.manifestPath,
      prepared.reviewInbox,
    ),
    pulledReviewBundles,
    quarantinedReviewBundles,
    pulledSourceRevisions,
    sourceScanRan,
  };
};

export const pullNextGoogleDriveSource = async (
  candidateId: string | undefined,
  options: DriveSyncOptions = {},
): Promise<DriveSourcePullReport> => {
  const prepared = await prepareDrivePlan(options);
  const eligible = prepared.plan.sources
    .filter((item) => item.candidate.status === 'discovered')
    .sort((left, right) => left.candidate.reviewOrder - right.candidate.reviewOrder);
  const selected = candidateId
    ? eligible.find((item) => item.candidate.id === candidateId)
    : eligible[0];
  if (!selected) {
    throw new Error(
      candidateId
        ? `Drive source candidate ${candidateId} is not a current discovered candidate.`
        : 'No discovered Drive source is waiting for one-at-a-time intake.',
    );
  }

  const targetPath = join(prepared.sourceInbox, sourceInboxFilename(selected.remote));
  await downloadRemoteFile(selected.remote, targetPath, prepared.runCommand);
  const bytes = await readFile(targetPath);
  const downloadedHash = sha256(bytes);
  const updatedCandidates = [
    ...prepared.plan.sources.map((item) =>
      item.candidate.id === selected.candidate.id
        ? {
            ...item.candidate,
            status: 'pulled' as const,
            sha256: downloadedHash,
            sizeBytes: bytes.byteLength,
          }
        : item.candidate,
    ),
    ...prepared.plan.retainedMissingCandidates,
  ].sort((left, right) => left.reviewOrder - right.reviewOrder);
  await scanSourceInbox({ root: dirname(prepared.sourceInbox), now: options.now });
  await writeManifest(
    prepared.manifestPath,
    RemoteSourceDiscoveryManifestSchema.parse({
      ...prepared.manifest,
      lastScannedAt: prepared.timestamp,
      candidates: updatedCandidates,
    }),
  );
  return {
    candidateId: selected.candidate.id,
    filename: selected.candidate.filename,
    sha256: downloadedHash,
    sizeBytes: bytes.byteLength,
    manifestPath: prepared.manifestPath,
  };
};

const printStatus = (report: DriveStatusReport): void => {
  console.log(
    `Drive status: ${report.remoteFiles} remote files; ${report.sourceCandidates} source candidates (${report.sourceDiscoveries} new, ${report.sourceRepulls} changed); ${report.reviewBundles} review bundles (${report.reviewBundlesToPull} not yet local).`,
  );
  console.log(`Discovery manifest: ${report.manifestPath}`);
  console.log(`Review inbox: ${report.reviewInbox}`);
  if (report.nextSourceCandidate) {
    console.log(
      `Next source awaiting explicit intake: ${report.nextSourceCandidate.id} (${report.nextSourceCandidate.filename})`,
    );
  }
  if (report.sharedClientRetirementWarning) {
    console.warn(
      "WARNING: rclone's shared Google OAuth client is scheduled for retirement during 2026. Configure a private read-only Google OAuth client before that cutoff.",
    );
  }
};

const runCli = async (): Promise<void> => {
  const mode = process.argv.includes('--pull-source')
    ? 'pull-source'
    : process.argv.includes('--sync')
      ? 'sync'
      : 'status';
  if (mode === 'pull-source') {
    const candidateArgumentIndex = process.argv.indexOf('--candidate');
    const candidateId =
      candidateArgumentIndex >= 0 ? process.argv[candidateArgumentIndex + 1] : undefined;
    if (candidateArgumentIndex >= 0 && !candidateId) {
      throw new Error('--candidate requires one stable Drive source-candidate ID.');
    }
    const report = await pullNextGoogleDriveSource(candidateId);
    console.log(
      `Drive source admitted: ${report.candidateId} (${report.filename}); ${report.sizeBytes} bytes; SHA-256 ${report.sha256}.`,
    );
    console.log(`Discovery manifest: ${report.manifestPath}`);
  } else if (mode === 'sync') {
    const report = await syncGoogleDrive();
    printStatus(report);
    console.log(
      `Drive sync: ${report.pulledReviewBundles} review bundles pulled, ${report.quarantinedReviewBundles} quarantined, ${report.pulledSourceRevisions} changed source revisions pulled${report.sourceScanRan ? ' and scanned' : ''}.`,
    );
  } else {
    printStatus(await getGoogleDriveStatus());
  }
};

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(resolve(entrypoint)).href) {
  try {
    await runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Google Drive workflow failed.');
    process.exitCode = 1;
  }
}
