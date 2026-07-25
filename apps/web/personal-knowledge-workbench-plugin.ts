import { lstat, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PersonalKnowledgeWorkbenchProjectionSchema,
  type PersonalKnowledgeWorkbenchProjection,
} from '@psychsim/schemas';
import type { Plugin } from 'vite';

export const PERSONAL_KNOWLEDGE_WORKBENCH_ENDPOINT = '/__psychsim/personal-knowledge-workbench';
const MAX_PROJECTION_BYTES = 2_000_000;
const GENERATED_ROOT = fileURLToPath(new URL('../../content/generated/', import.meta.url));
const PROJECTION_FILE_NAME =
  process.env.PSYCHSIM_E2E === '1' ? 'workbench.e2e.json' : 'workbench.json';
const DEFAULT_PROJECTION_PATH = fileURLToPath(
  new URL(`../../content/generated/personal-knowledge/${PROJECTION_FILE_NAME}`, import.meta.url),
);

const pathInside = (parent: string, child: string): boolean => {
  const relativePath = relative(parent, child);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
};

export const isPersonalKnowledgeWorkbenchLoopback = (address: string | undefined): boolean =>
  address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

export const loadPersonalKnowledgeWorkbenchProjection = async (
  path = DEFAULT_PROJECTION_PATH,
  allowedRoot = GENERATED_ROOT,
): Promise<PersonalKnowledgeWorkbenchProjection | null> => {
  try {
    const stat = await lstat(path);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size > MAX_PROJECTION_BYTES ||
      (stat.mode & 0o777) !== 0o600
    ) {
      return null;
    }
    const [resolvedPath, resolvedRoot] = await Promise.all([realpath(path), realpath(allowedRoot)]);
    if (!pathInside(resolvedRoot, resolvedPath)) return null;
    return PersonalKnowledgeWorkbenchProjectionSchema.parse(
      JSON.parse(await readFile(resolvedPath, 'utf8')) as unknown,
    );
  } catch {
    return null;
  }
};

interface WorkbenchRequest {
  method?: string;
  socket: { remoteAddress?: string };
}

interface WorkbenchResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

export const respondToPersonalKnowledgeWorkbenchRequest = async (
  request: WorkbenchRequest,
  response: WorkbenchResponse,
  loadProjection = loadPersonalKnowledgeWorkbenchProjection,
): Promise<void> => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  if (!isPersonalKnowledgeWorkbenchLoopback(request.socket.remoteAddress)) {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, error: 'Not found.' }));
    return;
  }
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: 'Use GET.' }));
    return;
  }
  const projection = await loadProjection();
  if (!projection) {
    response.statusCode = 404;
    response.end(
      JSON.stringify({
        ok: false,
        error: 'Personal knowledge workbench is unavailable.',
      }),
    );
    return;
  }
  response.statusCode = 200;
  response.end(JSON.stringify(projection));
};

export const personalKnowledgeWorkbenchBridge = (): Plugin => ({
  name: 'psychsim-personal-knowledge-workbench',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(PERSONAL_KNOWLEDGE_WORKBENCH_ENDPOINT, async (request, response) => {
      await respondToPersonalKnowledgeWorkbenchRequest(request, response);
    });
  },
});
