import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import JSZip from 'jszip';
import { afterEach, describe, expect, it } from 'vitest';

import { SourceChunkSchema, SourceDocumentSchema } from '@psychsim/schemas';
import {
  SOURCE_PARSER_VERSION,
  calculateSourceChunkProvenanceHash,
  extractDocxHtmlFragment,
  extractDiscoveredSources,
  listExtractedSourceArtifacts,
  loadSourceManifest,
  scanSourceInbox,
  validateSourceManifestArtifactCoverage,
} from './source-pipeline';

const temporaryRoots: string[] = [];

const makeSourceRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-source-pipeline-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'inbox'), { recursive: true });
  return root;
};

const makeMinimalPdf = (): Buffer => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    '<< /Length 65 >>\nstream\nBT /F1 12 Tf 72 720 Td (PsychSim PDF extraction fixture) Tj ET\nendstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    body += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body, 'ascii');
};

const makeHeadingDocx = async (firstParagraphStyle = 'Heading1'): Promise<Buffer> => {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '</Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
  );
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>',
  );
  zip.file(
    'word/styles.xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style>' +
      '</w:styles>',
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
      `<w:p><w:pPr><w:pStyle w:val="${firstParagraphStyle}"/></w:pPr><w:r><w:t>Article one</w:t></w:r></w:p>` +
      '<w:p><w:r><w:t>Opening paragraph.</w:t></w:r></w:p>' +
      '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Detail</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>Nested paragraph.</w:t></w:r></w:p>' +
      '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Article two</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>Closing paragraph.</w:t></w:r></w:p>' +
      '</w:body></w:document>',
  );
  return zip.generateAsync({ type: 'nodebuffer' });
};

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('local source pipeline', () => {
  it('hashes, extracts, chunks, retains, and idempotently records Markdown', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-22T12:00:00.000Z';
    await writeFile(
      join(root, 'inbox', 'example.md'),
      '# Summary\n\nA short source-derived paragraph.\n\n## Findings\n\nA second paragraph.',
    );

    await expect(scanSourceInbox({ root, now })).resolves.toMatchObject({
      discovered: 1,
      duplicates: 0,
      quarantined: 0,
    });
    await expect(extractDiscoveredSources({ root, now })).resolves.toMatchObject({
      extracted: 1,
      quarantined: 0,
    });

    const manifest = await loadSourceManifest(root);
    expect(manifest.entries).toHaveLength(1);
    expect(manifest.entries[0]).toMatchObject({
      filename: 'example.md',
      mediaType: 'text/markdown',
      status: 'extracted',
      duplicateOfId: null,
    });
    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      document: { id: string; extractedTextHash: string };
      chunks: Array<{ id: string; section?: string; text: string; textHash: string }>;
    };
    expect(artifact.document.id).toMatch(/^source-document\./);
    expect(artifact.document.extractedTextHash).toHaveLength(64);
    expect(artifact.chunks.map((chunk) => chunk.section)).toEqual(['Summary', 'Findings']);
    expect(
      artifact.chunks.every((chunk) => chunk.text.length > 0 && chunk.textHash.length === 64),
    ).toBe(true);

    await expect(scanSourceInbox({ root, now })).resolves.toMatchObject({
      discovered: 0,
      unchanged: 0,
    });
    await expect(extractDiscoveredSources({ root, now })).resolves.toMatchObject({
      extracted: 0,
    });
  });

  it('records exact hashes as duplicates and retains unsupported files in quarantine', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-22T12:00:00.000Z';
    const content = 'Same bytes, different filename.';
    await writeFile(join(root, 'inbox', 'first.txt'), content);
    await scanSourceInbox({ root, now });
    await extractDiscoveredSources({ root, now });

    await writeFile(join(root, 'inbox', 'duplicate.txt'), content);
    const duplicateScan = await scanSourceInbox({ root, now });
    expect(duplicateScan.duplicates).toBe(1);

    await writeFile(join(root, 'inbox', 'unknown.bin'), 'untrusted bytes');
    const unsupportedScan = await scanSourceInbox({ root, now });
    expect(unsupportedScan.quarantined).toBe(1);

    const manifest = await loadSourceManifest(root);
    const primary = manifest.entries.find((entry) => entry.filename === 'first.txt')!;
    expect(manifest.entries.find((entry) => entry.filename === 'duplicate.txt')).toMatchObject({
      status: 'duplicate',
      duplicateOfId: primary.id,
      sha256: primary.sha256,
    });
    expect(manifest.entries.find((entry) => entry.filename === 'unknown.bin')).toMatchObject({
      status: 'quarantined',
      error: expect.stringContaining('Unsupported source type'),
    });
  });

  it('requires a one-to-one relationship between extracted entries and artifacts', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-26T12:00:00.000Z';
    await writeFile(join(root, 'inbox', 'coverage.txt'), 'Coverage fixture.');
    await scanSourceInbox({ root, now });
    await extractDiscoveredSources({ root, now });
    const manifest = await loadSourceManifest(root);
    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as { document?: unknown };
    const document = SourceDocumentSchema.parse(artifact.document);

    expect(() => validateSourceManifestArtifactCoverage(manifest, [document])).not.toThrow();
    expect(() => validateSourceManifestArtifactCoverage(manifest, [])).toThrow(
      'has no matching source-document artifact',
    );
    expect(() =>
      validateSourceManifestArtifactCoverage(
        {
          ...manifest,
          entries: manifest.entries.map((entry) => ({ ...entry, status: 'discovered' as const })),
        },
        [document],
      ),
    ).toThrow('with status discovered');
    expect(() => validateSourceManifestArtifactCoverage(manifest, [document, document])).toThrow(
      'duplicates an extracted source relationship',
    );
  });

  it('atomically claims a stale source lock across the vulnerable compare/unlink pause', async () => {
    const root = await makeSourceRoot();
    const manifests = join(root, 'manifests');
    await mkdir(manifests, { recursive: true });
    const lockPath = join(manifests, 'source-pipeline.lock');
    await writeFile(
      lockPath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          token: '00000000-0000-4000-8000-000000000000',
          pid: 2_147_483_647,
          createdAt: '2026-07-26T11:59:00.000Z',
        },
        null,
        2,
      )}\n`,
    );

    let releaseFirst!: () => void;
    const firstCanContinue = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstReachedUnlink!: () => void;
    const firstIsPaused = new Promise<void>((resolve) => {
      firstReachedUnlink = resolve;
    });
    const first = scanSourceInbox({
      root,
      now: () => '2026-07-26T12:00:00.000Z',
      beforeStaleLockUnlink: async () => {
        firstReachedUnlink();
        await firstCanContinue;
      },
    });
    await firstIsPaused;

    await expect(scanSourceInbox({ root, now: () => '2026-07-26T12:00:00.000Z' })).rejects.toThrow(
      'stale-lock recovery is already active',
    );
    expect(JSON.parse(await readFile(lockPath, 'utf8'))).toMatchObject({
      token: '00000000-0000-4000-8000-000000000000',
    });

    releaseFirst();
    await expect(first).resolves.toMatchObject({ discovered: 0 });
    await expect(readFile(lockPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(readFile(`${lockPath}.stale-claim`, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(loadSourceManifest(root)).resolves.toMatchObject({ entries: [] });
  });

  it('extracts page-aware text from a PDF without executing document content', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-22T12:00:00.000Z';
    await writeFile(join(root, 'inbox', 'fixture.pdf'), makeMinimalPdf());
    await scanSourceInbox({ root, now });
    const report = await extractDiscoveredSources({ root, now });
    expect(report).toMatchObject({ extracted: 1, quarantined: 0 });
    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      chunks: Array<{ page?: number; text: string }>;
    };
    expect(artifact.chunks[0]).toMatchObject({
      page: 1,
      text: expect.stringContaining('PsychSim PDF extraction fixture'),
    });
  });

  it('preserves DOCX heading paths without copying headings into chunk text', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-26T12:00:00.000Z';
    await writeFile(join(root, 'inbox', 'heading-fixture.docx'), await makeHeadingDocx());
    await scanSourceInbox({ root, now });
    await expect(extractDiscoveredSources({ root, now })).resolves.toMatchObject({
      extracted: 1,
      refreshed: 0,
      quarantined: 0,
    });

    const manifest = await loadSourceManifest(root);
    expect(manifest.entries[0]?.parserVersion).toBe(SOURCE_PARSER_VERSION);
    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      document: { parserVersion: string };
      chunks: Array<{
        section?: string;
        sectionPath?: string[];
        sectionInstance?: number;
        provenanceHash?: string;
        text: string;
      }>;
    };
    expect(artifact.document.parserVersion).toBe(SOURCE_PARSER_VERSION);
    expect(
      (
        artifact.document as {
          extractionWarnings?: string[];
          extractionWarningCount?: number;
        }
      ).extractionWarnings,
    ).toEqual([]);
    expect(
      (
        artifact.document as {
          extractionWarningCount?: number;
        }
      ).extractionWarningCount,
    ).toBe(0);
    expect(artifact.chunks.map((chunk) => chunk.sectionPath)).toEqual([
      ['Article one'],
      ['Article one', 'Detail'],
      ['Article two'],
    ]);
    expect(artifact.chunks.map((chunk) => chunk.section)).toEqual([
      'Article one',
      'Detail',
      'Article two',
    ]);
    expect(artifact.chunks.map((chunk) => chunk.sectionInstance)).toEqual([1, 2, 3]);
    expect(
      artifact.chunks.every(
        (chunk) =>
          chunk.provenanceHash?.length === 64 &&
          calculateSourceChunkProvenanceHash(SourceChunkSchema.parse(chunk)) ===
            chunk.provenanceHash,
      ),
    ).toBe(true);
    expect(artifact.chunks.map((chunk) => chunk.text)).toEqual([
      'Opening paragraph.',
      'Nested paragraph.',
      'Closing paragraph.',
    ]);
  });

  it('retains DOCX style warnings as private extraction provenance', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-26T12:00:00.000Z';
    await writeFile(
      join(root, 'inbox', 'warning-fixture.docx'),
      await makeHeadingDocx('UnrecognizedHeadingStyle'),
    );
    await scanSourceInbox({ root, now });
    await expect(extractDiscoveredSources({ root, now })).resolves.toMatchObject({
      extracted: 1,
      quarantined: 0,
    });
    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      document: { extractionWarnings?: string[]; extractionWarningCount?: number };
    };
    expect(artifact.document.extractionWarnings).toContainEqual(
      expect.stringContaining('Unrecognised paragraph style'),
    );
    expect(artifact.document.extractionWarningCount).toBeGreaterThanOrEqual(
      artifact.document.extractionWarnings?.length ?? 0,
    );
  });

  it('keeps generated DOCX HTML inert and avoids duplicate nested block text', () => {
    const pieces = extractDocxHtmlFragment(
      '<h1>Article</h1>' +
        '<p>Literal &lt;script&gt;instruction()&lt;/script&gt; and <a href="https://example.test/private">linked text</a><img src="data:image/png;base64,secret"></p>' +
        '<script>not visible</script>' +
        '<ul><li>First<ul><li>Nested</li></ul></li><li>Second</li></ul>' +
        '<table><tr><th>Column A</th><th>Column B</th></tr><tr><td>One</td><td>Two</td></tr></table>',
    );
    const text = pieces.map((piece) => piece.text).join('\n');
    expect(pieces.every((piece) => piece.section === 'Article')).toBe(true);
    expect(pieces.every((piece) => piece.sectionPath?.join(' > ') === 'Article')).toBe(true);
    expect(text).toContain('Literal <script>instruction()</script> and linked text');
    expect(text).not.toContain('not visible');
    expect(text).not.toContain('example.test');
    expect(text).not.toContain('data:image');
    expect(text.match(/Nested/g)).toHaveLength(1);
    expect(text).toContain('Column A | Column B');
    expect(text).toContain('One | Two');

    const repeated = extractDocxHtmlFragment(
      '<h1>Repeated title</h1><p>First unit.</p><h1>Repeated title</h1><p>Second unit.</p>',
    );
    expect(repeated.map((piece) => piece.text)).toEqual(['First unit.', 'Second unit.']);
    expect(repeated.map((piece) => piece.sectionPath)).toEqual([
      ['Repeated title'],
      ['Repeated title'],
    ]);
    expect(repeated.map((piece) => piece.sectionInstance)).toEqual([1, 2]);
  });

  it('retains full heading context when a DOCX section requires multiple chunks', () => {
    const pieces = extractDocxHtmlFragment(
      `<h1>Article</h1><h2>Long section</h2><p>${'x'.repeat(6_100)}</p>`,
    );
    expect(pieces).toHaveLength(2);
    expect(
      pieces.every(
        (piece) =>
          piece.section === 'Long section' &&
          piece.sectionPath?.join(' > ') === 'Article > Long section' &&
          piece.sectionInstance === 2,
      ),
    ).toBe(true);
  });

  it('rejects source locators whose heading leaf and section disagree', () => {
    expect(
      SourceChunkSchema.safeParse({
        schemaVersion: 1,
        id: 'source-chunk.example.1',
        sourceDocumentId: 'source-document.example',
        ordinal: 0,
        section: 'Different leaf',
        sectionPath: ['Article', 'Expected leaf'],
        sectionInstance: 2,
        text: 'Body',
        textHash: 'a'.repeat(64),
        provenanceHash: 'b'.repeat(64),
      }).success,
    ).toBe(false);
  });

  it('requires an explicit refresh and archives the prior extraction revision', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-26T12:00:00.000Z';
    await writeFile(join(root, 'inbox', 'refresh-fixture.docx'), await makeHeadingDocx());
    await scanSourceInbox({ root, now });
    await extractDiscoveredSources({ root, now });

    const manifestPath = join(root, 'manifests', 'source-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      parserVersion: string;
      entries: Array<{ id: string; parserVersion: string }>;
    };
    const entryId = manifest.entries[0]!.id;
    manifest.parserVersion = 'psychsim-source-parser-1';
    manifest.entries[0]!.parserVersion = 'psychsim-source-parser-1';
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      document: { parserVersion: string };
      chunks: Array<{ provenanceHash?: string; sectionInstance?: number }>;
    };
    artifact.document.parserVersion = 'psychsim-source-parser-1';
    for (const chunk of artifact.chunks) {
      delete chunk.provenanceHash;
      delete chunk.sectionInstance;
    }
    await writeFile(artifactPath!, `${JSON.stringify(artifact, null, 2)}\n`);

    await expect(extractDiscoveredSources({ root, now })).resolves.toMatchObject({
      extracted: 0,
      refreshed: 0,
    });
    expect(
      (
        JSON.parse(await readFile(artifactPath!, 'utf8')) as {
          document: { parserVersion: string };
        }
      ).document.parserVersion,
    ).toBe('psychsim-source-parser-1');

    await writeFile(join(root, 'inbox', 'pending.txt'), 'Leave this source discovered.');
    await scanSourceInbox({ root, now });
    await expect(
      extractDiscoveredSources({ root, now, refreshEntryIds: [entryId] }),
    ).resolves.toMatchObject({
      extracted: 0,
      refreshed: 1,
      quarantined: 0,
    });
    const refreshedManifest = await loadSourceManifest(root);
    expect(refreshedManifest.entries[0]?.parserVersion).toBe(SOURCE_PARSER_VERSION);
    expect(
      (
        JSON.parse(await readFile(artifactPath!, 'utf8')) as {
          document: { parserVersion: string };
        }
      ).document.parserVersion,
    ).toBe(SOURCE_PARSER_VERSION);
    expect(
      refreshedManifest.entries.find((entry) => entry.filename === 'pending.txt')?.status,
    ).toBe('discovered');
    await expect(readdir(join(root, 'extracted', 'history'))).resolves.toHaveLength(1);
  });

  it('rolls back an explicit refresh when its manifest commit fails', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-26T12:00:00.000Z';
    await writeFile(join(root, 'inbox', 'rollback-fixture.docx'), await makeHeadingDocx());
    await scanSourceInbox({ root, now });
    await extractDiscoveredSources({ root, now });

    const manifestPath = join(root, 'manifests', 'source-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      parserVersion: string;
      entries: Array<{ id: string; parserVersion: string }>;
    };
    const entryId = manifest.entries[0]!.id;
    manifest.parserVersion = 'psychsim-source-parser-2';
    manifest.entries[0]!.parserVersion = 'psychsim-source-parser-2';
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      document: { parserVersion: string };
      chunks: unknown[];
    };
    artifact.document.parserVersion = 'psychsim-source-parser-2';
    for (const rawChunk of artifact.chunks) {
      const chunk = rawChunk as { provenanceHash?: string; sectionInstance?: number };
      delete chunk.provenanceHash;
      delete chunk.sectionInstance;
    }
    const priorArtifactText = `${JSON.stringify(artifact, null, 2)}\n`;
    await writeFile(artifactPath!, priorArtifactText);

    let interruptedTransactionText = '';
    let proposedArtifactText = '';
    await expect(
      extractDiscoveredSources({
        root,
        now,
        refreshEntryIds: [entryId],
        beforeRefreshManifestWrite: async () => {
          interruptedTransactionText = await readFile(
            join(root, 'manifests', 'source-refresh-transaction.json'),
            'utf8',
          );
          proposedArtifactText = await readFile(artifactPath!, 'utf8');
          throw new Error('Injected manifest failure');
        },
      }),
    ).rejects.toThrow('prior extraction and manifest entry were preserved');

    expect(await readFile(artifactPath!, 'utf8')).toBe(priorArtifactText);
    expect(
      (
        JSON.parse(await readFile(manifestPath, 'utf8')) as {
          entries: Array<{ parserVersion: string }>;
        }
      ).entries[0]?.parserVersion,
    ).toBe('psychsim-source-parser-2');
    const historyDirectory = join(root, 'extracted', 'history');
    const historyFiles = await readdir(historyDirectory);
    expect(historyFiles).toHaveLength(1);

    expect(interruptedTransactionText).not.toBe('');
    expect(proposedArtifactText).not.toBe('');
    await writeFile(artifactPath!, proposedArtifactText);
    await writeFile(
      join(root, 'manifests', 'source-refresh-transaction.json'),
      interruptedTransactionText,
    );
    await expect(extractDiscoveredSources({ root, now })).resolves.toMatchObject({
      extracted: 0,
      refreshed: 0,
    });
    expect(await readFile(artifactPath!, 'utf8')).toBe(priorArtifactText);
    await expect(
      readFile(join(root, 'manifests', 'source-refresh-transaction.json'), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });

    const committedManifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      parserVersion: string;
      entries: Array<{ parserVersion: string }>;
    };
    committedManifest.parserVersion = SOURCE_PARSER_VERSION;
    committedManifest.entries[0]!.parserVersion = SOURCE_PARSER_VERSION;
    await writeFile(manifestPath, `${JSON.stringify(committedManifest, null, 2)}\n`);
    await writeFile(artifactPath!, proposedArtifactText);
    await writeFile(
      join(root, 'manifests', 'source-refresh-transaction.json'),
      interruptedTransactionText,
    );
    await expect(extractDiscoveredSources({ root, now })).resolves.toMatchObject({
      extracted: 0,
      refreshed: 0,
    });
    expect(await readFile(artifactPath!, 'utf8')).toBe(proposedArtifactText);
    await expect(
      readFile(join(root, 'manifests', 'source-refresh-transaction.json'), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });

    committedManifest.parserVersion = 'psychsim-source-parser-2';
    committedManifest.entries[0]!.parserVersion = 'psychsim-source-parser-2';
    await writeFile(manifestPath, `${JSON.stringify(committedManifest, null, 2)}\n`);
    await writeFile(artifactPath!, priorArtifactText);

    const historyPath = join(historyDirectory, historyFiles[0]!);
    const conflictingHistory = JSON.parse(await readFile(historyPath, 'utf8')) as {
      document: { processedAt: string };
    };
    conflictingHistory.document.processedAt = '2026-07-27T12:00:00.000Z';
    await writeFile(historyPath, `${JSON.stringify(conflictingHistory, null, 2)}\n`);
    await expect(
      extractDiscoveredSources({ root, now, refreshEntryIds: [entryId] }),
    ).rejects.toThrow('existing extraction history is not equivalent');
  });

  it('refuses to overwrite a manifest changed outside the source-pipeline lock', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-26T12:00:00.000Z';
    await writeFile(join(root, 'inbox', 'concurrency-fixture.docx'), await makeHeadingDocx());
    await scanSourceInbox({ root, now });
    await extractDiscoveredSources({ root, now });

    const manifestPath = join(root, 'manifests', 'source-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      parserVersion: string;
      updatedAt: string;
      entries: Array<{ id: string; parserVersion: string }>;
    };
    const entryId = manifest.entries[0]!.id;
    manifest.parserVersion = 'psychsim-source-parser-3';
    manifest.entries[0]!.parserVersion = 'psychsim-source-parser-3';
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      document: { parserVersion: string };
    };
    artifact.document.parserVersion = 'psychsim-source-parser-3';
    const priorArtifactText = `${JSON.stringify(artifact, null, 2)}\n`;
    await writeFile(artifactPath!, priorArtifactText);

    await expect(
      extractDiscoveredSources({
        root,
        now,
        refreshEntryIds: [entryId],
        beforeRefreshManifestWrite: async () => {
          const concurrentManifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
            updatedAt: string;
          };
          concurrentManifest.updatedAt = '2026-07-26T12:01:00.000Z';
          await writeFile(manifestPath, `${JSON.stringify(concurrentManifest, null, 2)}\n`);
        },
      }),
    ).rejects.toThrow('refusing to overwrite concurrent updates');

    expect(await readFile(artifactPath!, 'utf8')).toBe(priorArtifactText);
    expect(
      (
        JSON.parse(await readFile(manifestPath, 'utf8')) as {
          updatedAt: string;
          entries: Array<{ parserVersion: string }>;
        }
      ).updatedAt,
    ).toBe('2026-07-26T12:01:00.000Z');
  });

  it('rejects a refresh when prior chunk integrity is corrupted', async () => {
    const root = await makeSourceRoot();
    const now = () => '2026-07-26T12:00:00.000Z';
    await writeFile(join(root, 'inbox', 'corrupt-fixture.docx'), await makeHeadingDocx());
    await scanSourceInbox({ root, now });
    await extractDiscoveredSources({ root, now });

    const manifestPath = join(root, 'manifests', 'source-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      parserVersion: string;
      entries: Array<{ id: string; parserVersion: string }>;
    };
    const entryId = manifest.entries[0]!.id;
    manifest.parserVersion = 'psychsim-source-parser-2';
    manifest.entries[0]!.parserVersion = 'psychsim-source-parser-2';
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const [artifactPath] = await listExtractedSourceArtifacts(root);
    const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
      document: { parserVersion: string };
      chunks: Array<{ ordinal: number; provenanceHash?: string; sectionInstance?: number }>;
    };
    artifact.document.parserVersion = 'psychsim-source-parser-2';
    artifact.chunks[0]!.ordinal = 99;
    for (const chunk of artifact.chunks) {
      delete chunk.provenanceHash;
      delete chunk.sectionInstance;
    }
    await writeFile(artifactPath!, `${JSON.stringify(artifact, null, 2)}\n`);

    await expect(
      extractDiscoveredSources({ root, now, refreshEntryIds: [entryId] }),
    ).rejects.toThrow('Extraction chunk integrity failed');
    expect(
      (
        JSON.parse(await readFile(manifestPath, 'utf8')) as {
          entries: Array<{ parserVersion: string }>;
        }
      ).entries[0]?.parserVersion,
    ).toBe('psychsim-source-parser-2');
    await expect(readdir(join(root, 'extracted', 'history'))).resolves.toHaveLength(0);
  });
});
