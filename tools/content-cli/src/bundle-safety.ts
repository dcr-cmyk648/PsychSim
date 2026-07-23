import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

export interface BundleSafetyReport {
  safe: boolean;
  filesScanned: number;
  violations: string[];
}

const listFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
};

export const verifyProductionBundle = async (directory: string): Promise<BundleSafetyReport> => {
  const files = await listFiles(directory);
  const violations: string[] = [];
  const forbiddenText = [
    'content/source-docs',
    'source-docs/inbox',
    'source-docs/extracted',
    'source-docs/manifests',
    'OPENAI_API_KEY',
    'from "openai"',
    "from 'openai'",
    'case.restless-after-augmentation',
    'case.review.basic-mdd-scaffold',
    'ticket.audit.review-basic-mdd-scaffold',
    'source-request.mdd.tsh-workup',
    '/__psychsim/local-review-tickets',
    'content/generated/local-review-tickets',
  ];
  for (const file of files) {
    const relativePath = relative(directory, file);
    if (/source-docs|\.pdf$|\.docx$/i.test(relativePath)) {
      violations.push(`Forbidden source asset path: ${relativePath}`);
      continue;
    }
    if (['.js', '.css', '.html', '.map', '.json'].includes(extname(file))) {
      const text = await readFile(file, 'utf8');
      for (const marker of forbiddenText) {
        if (text.includes(marker)) violations.push(`${relativePath} contains ${marker}`);
      }
    }
  }
  return { safe: violations.length === 0, filesScanned: files.length, violations };
};
