import { lstat, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { PersonalKnowledgePrivateSourceCatalogSchema } from '@psychsim/schemas';

import {
  buildPrivateCorpusClassifications,
  CompactPrivateCorpusDraftBundleSchema,
  writePrivateCorpusClassifications,
  type CompactPrivateCorpusDraftBundle,
  type PrivateCorpusSourceContext,
} from './materialize-private-corpus-classifications';
import {
  groupParserV5SourceUnits,
  privateCorpusSourceUnitIdentity,
} from './private-corpus-source-units';

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const sourceSha = 'a'.repeat(64);
const extractedTextHash = 'b'.repeat(64);
const sourceCatalog = PersonalKnowledgePrivateSourceCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'authoring-sources.personal-knowledge.synthetic',
  runtimeExcluded: true,
  entries: [
    {
      id: 'personal-source.synthetic',
      expectedSha256: sourceSha,
      sourceKind: 'user_authored_archive',
      sourceRole: 'user_authored_article',
      unitStrategy: 'parser_v5_section_instance',
      rightsState: 'private_processing_only',
      semanticBoundaryReview: {
        status: 'approved',
        parserVersion: 'psychsim-source-parser-5',
        extractedTextHash,
        decisionSummary: 'Synthetic source-unit boundary for tests.',
        reviewedBy: 'reviewer.synthetic',
        reviewedAt: '2026-07-26T12:00:00.000Z',
      },
    },
  ],
});
const artifact: PrivateCorpusSourceContext['artifact'] = {
  document: {
    schemaVersion: 1,
    id: `source-document.${sourceSha.slice(0, 20)}`,
    sourceManifestEntryId: 'source-manifest.synthetic',
    mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extractedTextHash,
    parserVersion: 'psychsim-source-parser-5',
    extractionWarnings: [],
    extractionWarningCount: 0,
    processedAt: '2026-07-26T12:00:00.000Z',
  },
  chunks: [
    {
      schemaVersion: 1,
      id: 'source-chunk.synthetic.1',
      sourceDocumentId: `source-document.${sourceSha.slice(0, 20)}`,
      ordinal: 0,
      section: 'Synthetic section',
      sectionPath: ['Synthetic section'],
      sectionInstance: 1,
      text: 'Private synthetic source prose.',
      textHash: 'c'.repeat(64),
      provenanceHash: 'd'.repeat(64),
    },
  ],
};
const groups = groupParserV5SourceUnits(artifact, 'parser_v5_section_instance');
const contexts = new Map<string, PrivateCorpusSourceContext>([
  [
    'personal-source.synthetic',
    {
      descriptor: sourceCatalog.entries[0]!,
      artifact,
      groups,
    },
  ],
]);
const authorization = {
  modelIdentifier: 'gpt-5.6-sol',
  promptVersion: 'private-corpus-semantic-draft-1',
  acknowledgedBy: 'Dustin Rowland',
  acknowledgedAt: '2026-07-26T12:00:00.000Z',
};

const bundle = CompactPrivateCorpusDraftBundleSchema.parse({
  schemaVersion: 1,
  bundleVersion: 1,
  sourceDescriptorId: 'personal-source.synthetic',
  drafts: [
    {
      sourceUnitSelector: { kind: 'section_instance', sectionInstance: 1 },
      disposition: 'candidate_material',
      dispositionSummary: 'One synthetic authored medication-fit candidate was identified.',
      sourceUnit: {
        unitKind: 'self_authored_article',
        boundaryState: 'complete',
        title: null,
        byline: null,
        venue: null,
        url: null,
        originalDate: null,
        revisedDate: null,
        assertedAuthorship: 'user_authored',
        currentness: 'needs_currentness_review',
        excludedMaterialKinds: ['third_party_quote'],
      },
      bibliographicCandidates: [
        {
          key: 'synthetic-paper',
          citationRole: 'embedded_reference',
          title: 'Synthetic paper',
          authors: ['Author A'],
          organization: null,
          year: 2024,
          doi: null,
          pmid: null,
          url: null,
          citationText: 'Author A. Synthetic paper. 2024.',
          targets: [
            {
              resolution: 'resolved',
              targetKind: 'medication',
              targetContentId: 'medication.bupropion',
              role: 'subject',
              rationale: 'Synthetic bibliography target.',
            },
          ],
        },
      ],
      opinionCandidates: [
        {
          key: 'synthetic-fit',
          summary: 'Synthetic, medically unreviewed medication-fit opinion.',
          contributionTypes: ['medication_fit'],
          asOfDate: null,
          asOfDateBasis: 'unknown',
          currentness: 'needs_currentness_review',
          targets: [
            {
              resolution: 'resolved',
              targetKind: 'medication',
              targetContentId: 'medication.bupropion',
              role: 'subject',
              rationale: 'Synthetic opinion target.',
            },
            {
              resolution: 'unresolved',
              targetKindHint: 'clinical_rule',
              searchLabel: 'Synthetic seizure-fit rule',
              role: 'affected_rule',
              reason: 'A rule identity does not yet exist.',
            },
          ],
          nearbyBibliographicKeys: ['synthetic-paper'],
        },
      ],
    },
  ],
});

describe('private-corpus classification materializer', () => {
  it('derives exact provenance and wires keyed candidates without granting authority', () => {
    const [classification] = buildPrivateCorpusClassifications(bundle, contexts, authorization);
    const identity = privateCorpusSourceUnitIdentity(artifact, groups[0]!);
    expect(classification).toMatchObject({
      developerDatabaseUnitId: identity.id,
      unitFingerprint: identity.fingerprint,
      disposition: 'candidate_material',
      modelIdentifier: 'gpt-5.6-sol',
      sourceUnitCandidate: {
        rightsState: 'private_processing_only',
        reviewStatus: 'proposed',
      },
    });
    expect(classification!.sourceUnitCandidate.sourceLocators).toEqual(identity.sourceLocators);
    expect(classification!.opinionCandidates[0]).toMatchObject({
      medicalReviewStatus: 'unreviewed',
      needsHumanReview: true,
      reviewStatus: 'proposed',
      nearbyBibliographicCandidateIds: [classification!.bibliographicCandidates[0]!.id],
    });
  });

  it('rejects opinions on a non-candidate disposition', () => {
    expect(() =>
      CompactPrivateCorpusDraftBundleSchema.parse({
        ...bundle,
        drafts: bundle.drafts.map((draft) => ({
          ...draft,
          disposition: 'needs_more_context',
        })),
      }),
    ).toThrow(/Only candidate-material/);
  });

  it('writes private files idempotently and refuses an unreviewed replacement', async () => {
    const root = await mkdtemp(join(tmpdir(), 'psychsim-private-classifications-'));
    temporaryDirectories.push(root);
    const outputRoot = join(root, 'classifications');
    const classifications = buildPrivateCorpusClassifications(bundle, contexts, authorization);
    await expect(writePrivateCorpusClassifications(classifications, outputRoot)).resolves.toEqual({
      materialized: 1,
      unchanged: 0,
    });
    await expect(writePrivateCorpusClassifications(classifications, outputRoot)).resolves.toEqual({
      materialized: 0,
      unchanged: 1,
    });
    const outputPath = join(outputRoot, `${classifications[0]!.developerDatabaseUnitId}.json`);
    expect((await lstat(outputRoot)).mode & 0o777).toBe(0o700);
    expect((await lstat(outputPath)).mode & 0o777).toBe(0o600);

    const changedBundle: CompactPrivateCorpusDraftBundle = {
      ...bundle,
      drafts: bundle.drafts.map((draft) => ({
        ...draft,
        opinionCandidates: draft.opinionCandidates.map((opinion) => ({
          ...opinion,
          summary: 'A different unreviewed summary must not silently replace the first.',
        })),
      })),
    };
    await expect(
      writePrivateCorpusClassifications(
        buildPrivateCorpusClassifications(changedBundle, contexts, authorization),
        outputRoot,
      ),
    ).rejects.toThrow(/different classification already exists/);
  });
});
