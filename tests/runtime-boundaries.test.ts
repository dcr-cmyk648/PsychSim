import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const filesBelow = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const values = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(path) : Promise.resolve([path]);
    }),
  );
  return values.flat();
};

describe('runtime boundaries', () => {
  it('does not import an AI SDK in the web application', async () => {
    const webRoot = resolve('apps/web');
    const files = (await filesBelow(webRoot)).filter((file) => /\.(ts|tsx|json)$/.test(file));
    const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
    expect(source).not.toMatch(/from\s+['"]openai['"]|@openai\/|OPENAI_API_KEY/);
    const packageJson = JSON.parse(await readFile(resolve('apps/web/package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(
      Object.keys(packageJson.dependencies).some((name) =>
        /openai|anthropic|generative/i.test(name),
      ),
    ).toBe(false);
  });

  it('has no web import or public asset path to source documents', async () => {
    const files = (await filesBelow(resolve('apps/web'))).filter((file) =>
      /\.(ts|tsx|css|html|json)$/.test(file),
    );
    const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
    expect(source).not.toContain('content/source-docs');
    expect(source).not.toContain('source-docs/inbox');
  });

  it('keeps review patients out of the production content entry point', async () => {
    const runtimeEntry = await readFile(resolve('packages/content-runtime/src/content.ts'), 'utf8');
    expect(runtimeEntry).not.toContain('content/cases/review');
    expect(runtimeEntry).not.toContain('restless-after-augmentation');
    expect(runtimeEntry).not.toContain('review-basic-mdd-scaffold');
  });

  it('gitignores every private source-document material directory', async () => {
    const ignore = await readFile(resolve('.gitignore'), 'utf8');
    for (const folder of [
      'inbox',
      'processed',
      'archive',
      'quarantine',
      'extracted',
      'manifests',
    ]) {
      expect(ignore).toContain(`content/source-docs/${folder}/*`);
    }
    expect(ignore).toContain('content/generated/*');
    expect(ignore).toContain('!content/generated/.gitkeep');
  });

  it('does not use nondeterministic randomness in domain logic', async () => {
    const files = (await filesBelow(resolve('packages/engine/src'))).filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.test.ts'),
    );
    const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
    expect(source).not.toContain('Math.random');
  });
});
