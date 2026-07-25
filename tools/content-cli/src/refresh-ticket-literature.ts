import { rename, writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  TicketLiteratureScoutCatalogSchema,
  type TicketLiteratureScoutCatalog,
} from '@psychsim/schemas';

import { searchEuropePmcMetaAnalyses } from './literature-discovery';

const catalogPath = resolve('content/cases/review/ticket-literature-scout.catalog.json');
const privateSnapshotDirectory = resolve('content/generated/literature-scout');

interface Arguments {
  ticketId: string | null;
  next: boolean;
  dryRun: boolean;
}

const parseArguments = (values: readonly string[]): Arguments => {
  let ticketId: string | null = null;
  let next = false;
  let dryRun = false;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--') {
      continue;
    } else if (value === '--ticket') {
      ticketId = values[index + 1] ?? null;
      index += 1;
    } else if (value === '--next') {
      next = true;
    } else if (value === '--dry-run') {
      dryRun = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  if (Number(Boolean(ticketId)) + Number(next) !== 1) {
    throw new Error('Choose exactly one of --ticket <ticket-id> or --next.');
  }
  return { ticketId, next, dryRun };
};

const stableTimestamp = (): string => new Date().toISOString();
const pathTimestamp = (timestamp: string): string => timestamp.replaceAll(/[:.]/g, '-');
const subtractCalendarYears = (date: string, years: number): string => {
  const end = new Date(`${date}T00:00:00.000Z`);
  const targetYear = end.getUTCFullYear() - years;
  const targetDay = Math.min(
    end.getUTCDate(),
    new Date(Date.UTC(targetYear, end.getUTCMonth() + 1, 0)).getUTCDate(),
  );
  return new Date(Date.UTC(targetYear, end.getUTCMonth(), targetDay)).toISOString().slice(0, 10);
};

const writeAtomically = async (path: string, body: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, body, { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, path);
};

const arguments_ = parseArguments(process.argv.slice(2));
const catalog = TicketLiteratureScoutCatalogSchema.parse(
  JSON.parse(await readFile(catalogPath, 'utf8')) as unknown,
);
const attachments = catalog.attachments.filter((attachment) => attachment.profileIds.length > 0);
const attachment = arguments_.next
  ? attachments
      .map((candidate) => ({
        candidate,
        oldestSearch:
          candidate.profileIds
            .map(
              (profileId) =>
                catalog.profiles.find((profile) => profile.id === profileId)?.searchRun
                  ?.searchedAt ?? '',
            )
            .sort()[0] ?? '',
      }))
      .sort(
        (left, right) =>
          left.oldestSearch.localeCompare(right.oldestSearch) ||
          left.candidate.ticketId.localeCompare(right.candidate.ticketId),
      )[0]?.candidate
  : catalog.attachments.find((candidate) => candidate.ticketId === arguments_.ticketId);

if (!attachment) {
  throw new Error(
    arguments_.ticketId
      ? `No literature-scout attachment exists for ${arguments_.ticketId}.`
      : 'No searchable literature-scout attachment remains.',
  );
}
if (attachment.profileIds.length === 0) {
  throw new Error(`${attachment.ticketId} is explicitly exempt from meta-analysis discovery.`);
}

const timestamp = stableTimestamp();
const updatedProfiles = [...catalog.profiles];
const updatedReferences = [...catalog.references];

for (const profileId of attachment.profileIds) {
  const profileIndex = updatedProfiles.findIndex((profile) => profile.id === profileId);
  const profile = updatedProfiles[profileIndex];
  if (!profile?.searchPlan) {
    console.log(`SKIP ${profileId}: ${profile?.relevanceNote ?? 'no search plan'}`);
    continue;
  }

  const windowEnd = timestamp.slice(0, 10);
  const refreshedProfile = {
    ...profile,
    searchPlan: {
      ...profile.searchPlan,
      windowEnd,
      windowStart: subtractCalendarYears(windowEnd, profile.searchPlan.lookbackYears),
    },
  };
  const snapshot = await searchEuropePmcMetaAnalyses(refreshedProfile);
  const rawSnapshotPath = resolve(
    privateSnapshotDirectory,
    `${profile.id}.${pathTimestamp(timestamp)}.json`,
  );
  if (!arguments_.dryRun) {
    await writeAtomically(rawSnapshotPath, `${snapshot.rawResponse}\n`);
  }

  let selectedRank: number | null = null;
  if (profile.selectedReferenceId) {
    const referenceIndex = updatedReferences.findIndex(
      (reference) => reference.id === profile.selectedReferenceId,
    );
    const reference = updatedReferences[referenceIndex];
    if (!reference) throw new Error(`${profile.id} references an unknown literature record.`);
    const candidateIndex = snapshot.candidates.findIndex(
      (candidate) => candidate.pmid === reference.pmid,
    );
    if (candidateIndex < 0) {
      throw new Error(
        `${reference.pmid} is no longer returned by the exact search for ${profile.id}; review the query or selection before updating.`,
      );
    }
    selectedRank = candidateIndex + 1;
    const candidate = snapshot.candidates[candidateIndex]!;
    updatedReferences[referenceIndex] = {
      ...reference,
      citationMetric: {
        ...reference.citationMetric,
        count: candidate.citedByCount ?? 0,
        asOf: timestamp,
      },
    };
  }

  updatedProfiles[profileIndex] = {
    ...refreshedProfile,
    searchRun: {
      searchedAt: timestamp,
      resultCount: snapshot.resultCount,
      screenedResultCount: snapshot.candidates.length,
      selectedRank,
      responseSha256: snapshot.responseSha256,
      candidateSetSha256: snapshot.candidateSetSha256,
      selectionNote:
        selectedRank === null
          ? 'No returned record directly answered the tracked clinical question; the explicit no-suitable outcome remains queued for other evidence.'
          : selectedRank === 1
            ? 'Selected the highest-cited result returned by the exact, clinically bounded query.'
            : `Selected rank ${selectedRank} after excluding higher-cited records that did not directly answer the tracked clinical question; see the profile relevance note.`,
    },
  };
  console.log(
    `REFRESH ${profile.id}: ${snapshot.resultCount} result(s), selected rank ${selectedRank ?? 'none'}, snapshot ${snapshot.responseSha256.slice(0, 12)}…`,
  );
}

const updatedCatalog: TicketLiteratureScoutCatalog = TicketLiteratureScoutCatalogSchema.parse({
  ...catalog,
  references: updatedReferences,
  profiles: updatedProfiles,
});
if (arguments_.dryRun) {
  console.log(`DRY RUN ${attachment.ticketId}: no tracked or private files changed.`);
} else {
  await writeAtomically(catalogPath, `${JSON.stringify(updatedCatalog, null, 2)}\n`);
  console.log(
    `UPDATED ${attachment.ticketId}. Raw API responses remain ignored under content/generated/literature-scout/.`,
  );
}
