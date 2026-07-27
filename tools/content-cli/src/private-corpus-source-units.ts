import { createHash } from 'node:crypto';

import type { SourceChunk, SourceDocument } from '@psychsim/schemas';

export interface ParserV5ExtractionArtifact {
  document: SourceDocument;
  chunks: SourceChunk[];
}

export type PrivateCorpusUnitStrategy =
  | 'parser_v5_section_instance'
  | 'parser_v5_unsectioned_chunks';

export interface PrivateCorpusSourceUnitGroup {
  key: string;
  chunks: SourceChunk[];
}

export interface PrivateCorpusSourceUnitIdentity {
  id: string;
  fingerprint: string;
  sourceLocators: Array<{
    kind: 'source_chunk';
    sourceDocumentId: string;
    sourceChunkId: string;
    textHash: string;
  }>;
}

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export const groupParserV5SourceUnits = (
  artifact: ParserV5ExtractionArtifact,
  unitStrategy: PrivateCorpusUnitStrategy,
): PrivateCorpusSourceUnitGroup[] => {
  if (artifact.document.parserVersion !== 'psychsim-source-parser-5') {
    throw new Error(`${artifact.document.id} must use parser v5 for private corpus authoring.`);
  }
  const groups = new Map<string, SourceChunk[]>();
  for (const chunk of [...artifact.chunks].sort((left, right) => left.ordinal - right.ordinal)) {
    const key =
      unitStrategy === 'parser_v5_section_instance' && chunk.sectionInstance
        ? `section.${chunk.sectionInstance}`
        : `chunk.${chunk.ordinal}`;
    groups.set(key, [...(groups.get(key) ?? []), chunk]);
  }
  return [...groups.entries()].map(([key, chunks]) => ({ key, chunks }));
};

export const privateCorpusSourceUnitIdentity = (
  artifact: ParserV5ExtractionArtifact,
  group: PrivateCorpusSourceUnitGroup,
): PrivateCorpusSourceUnitIdentity => {
  const chunkFingerprintInput = group.chunks.map((chunk) => chunk.textHash).join('|');
  return {
    id: `knowledge-unit.${sha256(
      `${artifact.document.id}|${group.key}|${chunkFingerprintInput}`,
    ).slice(0, 24)}`,
    fingerprint: sha256(chunkFingerprintInput),
    sourceLocators: group.chunks.map((chunk) => ({
      kind: 'source_chunk',
      sourceDocumentId: artifact.document.id,
      sourceChunkId: chunk.id,
      textHash: chunk.textHash,
    })),
  };
};
