import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import {
  RemoteSourceDiscoveryManifestSchema,
  SourceChunkSchema,
  SourceDocumentSchema,
  SourceManifestSchema,
} from '@psychsim/schemas';
import { validateAppleNotesCodexReviewAudit } from './apple-notes-codex-review';
import { validateAppleNotesManifest } from './apple-notes-provider';
import { validatePersonalKnowledgePrivateState } from './personal-knowledge-workspace';
import {
  calculateSourceChunkProvenanceHash,
  sourceParserCapturesWarningCount,
  sourceParserCapturesWarnings,
  sourceParserUsesStructuredProvenance,
  validateSourceManifestArtifactCoverage,
} from './source-pipeline';
import { validateSourceReviewPrivateState } from './source-review-packets';

const manifestPath = resolve('content/source-docs/manifests/google-drive-discovery.json');

const validateDriveManifest = async (): Promise<void> => {
  try {
    const raw = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
    const manifest = RemoteSourceDiscoveryManifestSchema.parse(raw);
    const fileIds = manifest.candidates.map((candidate) => candidate.providerFileId);
    const duplicateIds = fileIds.filter((id, index) => fileIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      throw new Error(`Duplicate Drive file IDs: ${[...new Set(duplicateIds)].join(', ')}`);
    }
    console.log(
      `PASS source discovery manifest (${manifest.candidates.length} candidate${
        manifest.candidates.length === 1 ? '' : 's'
      })`,
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('PASS no local Drive discovery manifest (clean checkout)');
    } else {
      throw error;
    }
  }
};

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

const validateLocalManifest = async (): Promise<void> => {
  const localManifestPath = resolve('content/source-docs/manifests/source-manifest.json');
  try {
    const manifest = SourceManifestSchema.parse(
      JSON.parse(await readFile(localManifestPath, 'utf8')) as unknown,
    );
    const ids = new Set(manifest.entries.map((entry) => entry.id));
    for (const entry of manifest.entries) {
      if (entry.duplicateOfId && !ids.has(entry.duplicateOfId)) {
        throw new Error(`${entry.id} references missing duplicate source ${entry.duplicateOfId}.`);
      }
    }
    const extractedDirectory = resolve('content/source-docs/extracted');
    const artifactNames = (await readdir(extractedDirectory)).filter(
      (filename) => filename.startsWith('source-document.') && filename.endsWith('.json'),
    );
    const artifactDocuments = [];
    for (const artifactName of artifactNames) {
      const raw = JSON.parse(await readFile(join(extractedDirectory, artifactName), 'utf8')) as {
        document?: unknown;
        chunks?: unknown;
      };
      const document = SourceDocumentSchema.parse(raw.document);
      artifactDocuments.push(document);
      const chunks = SourceChunkSchema.array().parse(raw.chunks);
      const manifestEntry = manifest.entries.find(
        (entry) => entry.id === document.sourceManifestEntryId,
      );
      if (!manifestEntry) {
        throw new Error(
          `${artifactName} references missing manifest entry ${document.sourceManifestEntryId}.`,
        );
      }
      if (artifactName !== `${document.id}.json`) {
        throw new Error(`${artifactName} does not match its source document ID ${document.id}.`);
      }
      if (manifestEntry.parserVersion !== document.parserVersion) {
        throw new Error(`${document.id} parser version does not match its source manifest entry.`);
      }
      if (sourceParserCapturesWarnings(document.parserVersion) && !document.extractionWarnings) {
        throw new Error(`${document.id} is missing parser-warning provenance.`);
      }
      if (
        sourceParserCapturesWarningCount(document.parserVersion) &&
        document.extractionWarningCount === undefined
      ) {
        throw new Error(`${document.id} is missing parser-warning-count provenance.`);
      }
      if (chunks.some((chunk) => chunk.sourceDocumentId !== document.id)) {
        throw new Error(`${artifactName} contains a chunk for another source document.`);
      }
      for (const [index, chunk] of chunks.entries()) {
        const expectedId = `${document.id.replace('source-document.', 'source-chunk.')}.${index + 1}`;
        if (chunk.ordinal !== index || chunk.id !== expectedId) {
          throw new Error(`${chunk.id} does not match its deterministic ordinal locator.`);
        }
        if (sha256(chunk.text) !== chunk.textHash) {
          throw new Error(`${chunk.id} text hash does not match its extracted text.`);
        }
        if (
          chunk.provenanceHash &&
          calculateSourceChunkProvenanceHash(chunk) !== chunk.provenanceHash
        ) {
          throw new Error(`${chunk.id} provenance hash does not match its locator metadata.`);
        }
        if (
          sourceParserUsesStructuredProvenance(document.parserVersion) &&
          (!chunk.provenanceHash || (chunk.sectionPath && !chunk.sectionInstance))
        ) {
          throw new Error(`${chunk.id} is missing structured parser provenance.`);
        }
      }
      if (sha256(chunks.map((chunk) => chunk.text).join('\n\n')) !== document.extractedTextHash) {
        throw new Error(`${document.id} combined extracted-text hash does not match its chunks.`);
      }
    }
    validateSourceManifestArtifactCoverage(manifest, artifactDocuments);
    console.log(
      `PASS local source manifest (${manifest.entries.length} entries; ${artifactNames.length} extracted artifacts)`,
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('PASS no local source-processing manifest (clean checkout)');
    } else {
      throw error;
    }
  }
};

try {
  await validateDriveManifest();
  await validateLocalManifest();
  const appleNotesManifest = await validateAppleNotesManifest();
  if (appleNotesManifest) {
    console.log(
      `PASS Apple Notes manifest (${appleNotesManifest.notes.length} private note records)`,
    );
  } else {
    console.log('PASS no local Apple Notes manifest (clean checkout)');
  }
  const appleNotesCodexReviewAudit = await validateAppleNotesCodexReviewAudit();
  if (appleNotesCodexReviewAudit) {
    console.log(
      `PASS Apple Notes Codex review audit (${appleNotesCodexReviewAudit.entries.length} bounded packet records)`,
    );
  } else {
    console.log('PASS no private Apple Notes Codex review packets');
  }
  const personalKnowledge = await validatePersonalKnowledgePrivateState();
  if (personalKnowledge) {
    console.log(
      `PASS private personal-knowledge state (${personalKnowledge.queueEntries} queued-topic records; ${personalKnowledge.semanticRuns} semantic runs; ${personalKnowledge.opinionCandidates} opinion candidates)`,
    );
  } else {
    console.log('PASS no private personal-knowledge workflow state');
  }
  const sourceReview = await validateSourceReviewPrivateState();
  if (sourceReview) {
    console.log(
      `PASS private source-review state (${sourceReview.tickets} immutable ticket packet${sourceReview.tickets === 1 ? '' : 's'})`,
    );
  } else {
    console.log('PASS no private source-review packets');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Source discovery validation failed.');
  process.exitCode = 1;
}
