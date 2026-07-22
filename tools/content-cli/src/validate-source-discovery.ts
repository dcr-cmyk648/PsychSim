import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import {
  RemoteSourceDiscoveryManifestSchema,
  SourceChunkSchema,
  SourceDocumentSchema,
  SourceManifestSchema,
} from '@psychsim/schemas';

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
    for (const artifactName of artifactNames) {
      const raw = JSON.parse(await readFile(join(extractedDirectory, artifactName), 'utf8')) as {
        document?: unknown;
        chunks?: unknown;
      };
      const document = SourceDocumentSchema.parse(raw.document);
      const chunks = SourceChunkSchema.array().parse(raw.chunks);
      if (chunks.some((chunk) => chunk.sourceDocumentId !== document.id)) {
        throw new Error(`${artifactName} contains a chunk for another source document.`);
      }
      for (const chunk of chunks) {
        if (sha256(chunk.text) !== chunk.textHash) {
          throw new Error(`${chunk.id} text hash does not match its extracted text.`);
        }
      }
      if (sha256(chunks.map((chunk) => chunk.text).join('\n\n')) !== document.extractedTextHash) {
        throw new Error(`${document.id} combined extracted-text hash does not match its chunks.`);
      }
    }
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
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Source discovery validation failed.');
  process.exitCode = 1;
}
