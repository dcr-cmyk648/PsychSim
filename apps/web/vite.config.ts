import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const LOCAL_TICKET_FILE_NAME =
  process.env.PSYCHSIM_E2E === '1' ? 'tickets.e2e.json' : 'tickets.json';
const LOCAL_TICKET_PATH = fileURLToPath(
  new URL(
    `../../content/generated/local-review-tickets/${LOCAL_TICKET_FILE_NAME}`,
    import.meta.url,
  ),
);
const LOCAL_TICKET_DISPLAY_PATH = `content/generated/local-review-tickets/${LOCAL_TICKET_FILE_NAME}`;
const MAX_TICKET_BUNDLE_BYTES = 2_000_000;

const localTicketWriter = (): Plugin => ({
  name: 'psychsim-local-ticket-writer',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__psychsim/local-review-tickets', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (request.method !== 'PUT') {
        response.statusCode = 405;
        response.end(JSON.stringify({ ok: false, error: 'Use PUT for the local ticket writer.' }));
        return;
      }
      try {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of request) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          size += buffer.length;
          if (size > MAX_TICKET_BUNDLE_BYTES) {
            throw new Error('Ticket bundle exceeds the 2 MB local-development limit.');
          }
          chunks.push(buffer);
        }
        const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
        if (
          typeof raw !== 'object' ||
          raw === null ||
          !('exportVersion' in raw) ||
          raw.exportVersion !== 2 ||
          !('tickets' in raw) ||
          !Array.isArray(raw.tickets) ||
          !raw.tickets.every(
            (ticket) =>
              typeof ticket === 'object' &&
              ticket !== null &&
              'reviewerNotes' in ticket &&
              typeof ticket.reviewerNotes === 'string',
          )
        ) {
          throw new Error('Ticket bundle has an unsupported shape.');
        }
        await mkdir(dirname(LOCAL_TICKET_PATH), { recursive: true });
        const temporaryPath = `${LOCAL_TICKET_PATH}.tmp`;
        await writeFile(temporaryPath, `${JSON.stringify(raw, null, 2)}\n`, {
          encoding: 'utf8',
          mode: 0o600,
        });
        await rename(temporaryPath, LOCAL_TICKET_PATH);
        response.statusCode = 200;
        response.end(JSON.stringify({ ok: true, path: LOCAL_TICKET_DISPLAY_PATH }));
      } catch (caught) {
        response.statusCode = 400;
        response.end(
          JSON.stringify({
            ok: false,
            error: caught instanceof Error ? caught.message : 'Could not write ticket bundle.',
          }),
        );
      }
    });
  },
});

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), localTicketWriter()],
  build: {
    sourcemap: true,
  },
});
