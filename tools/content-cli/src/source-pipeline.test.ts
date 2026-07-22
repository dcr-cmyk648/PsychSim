import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  extractDiscoveredSources,
  listExtractedSourceArtifacts,
  loadSourceManifest,
  scanSourceInbox,
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
});
