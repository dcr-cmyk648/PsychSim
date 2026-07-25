# iPhone installation and distribution updates

## Scope

PsychSim exposes a bounded iPhone installation path without beginning the broad offline/PWA
hardening planned for Milestone 8. The public GitHub Pages artifact is still a static portable
Reviewer build. Ordinary development remains on `beta`; only a fully gated `main` commit becomes a
phone distribution. Validated runtime content, scoring/provenance, and finite Reviewer-ticket
updates normally move to `main`, while materially risky UI/app mechanisms remain beta-only until
their additional risk is resolved.

There is no service-worker app-shell cache in this checkpoint. Current iPhone Safari can add the
site as a Home Screen web app, while Vite's content-hashed JavaScript and CSS plus an explicit
release marker provide a smaller and safer update path. Offline gameplay, background push, and
automatic synchronization are not implied.

## Install from Safari

1. Open the public PsychSim Pages address in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Enable **Open as Web App**.
5. Tap **Add**.

The in-app **Install on iPhone** dialog repeats these steps. The relative
`manifest.webmanifest` keeps `id`, `start_url`, and `scope` at `./`, so the same artifact works at
the GitHub repository subpath. The tracked SVG is the icon source; `pnpm assets:icons`
deterministically renders the 180, 192, and 512 pixel PNG assets with a local headless Chrome.

Apple's current user instructions are available at
[Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).
The physical Add-to-Home-Screen operating-system action cannot be automated by Playwright and
remains a one-time device smoke test.

## Local-data boundary

The installed Home Screen app can receive a storage container separate from Safari. Installing
PsychSim does not promise to copy an existing Safari IndexedDB database. The install dialog tells
a reviewer who already used Safari to export one complete feedback bundle first.

After installation, application updates preserve the same origin, manifest identity, Reviewer
assignment ID, and IndexedDB name. The release SHA is never part of the database name, and the
update path never clears IndexedDB, CacheStorage, attempts, or review comments. A material Reviewer
cohort/policy revision still changes the assignment ID under D-111; that is a content/persistence
boundary, not a cache-busting trick.

## Release identity

`apps/web/vite.config.ts` resolves one distribution record:

- `distributionId`: `VITE_PSYCHSIM_DISTRIBUTION_ID`, then `GITHUB_SHA`, then the local short Git
  SHA, with `development` only as a final fallback;
- `buildKind`: Player or portable Reviewer;
- `channel`: `main` for Pages distribution and `local` for ordinary local builds;
- `schemaVersion`: currently `1`.

The record is compiled into the application and emitted byte-for-byte as `version.json`. The Pages
package job explicitly supplies the full `${{ github.sha }}` and `main`; the bundle verifier
rejects a main marker that is not an exact 40-character commit SHA, a build-kind mismatch, missing
icons, or a nonrelative manifest scope.

No person increments a manual sync/cache number. Promoting a different verified commit to `main`
necessarily produces a different distribution ID.

## Update discovery and application

The browser checks base-relative `version.json`:

- once when the application mounts;
- whenever the page becomes visible;
- when connectivity returns;
- every five minutes while it remains open;
- when the user selects **Check for update**.

Requests use `cache: "no-store"`, omit credentials/referrer data, and include a changing query.
The payload is strict-parsed. An update is offered only when schema, build kind, and channel match
but the distribution ID differs. GitHub Pages currently may retain an edge-cached marker for
several minutes regardless of query, so detection is eventual on a later poll/foreground; it is
not an external push channel and cannot run while the app is closed or offline.

A new release displays a persistent, accessible banner. During an encounter or receipt the action
is disabled and explains that the reviewer must finish/save/export and return to the clinic. At
the hub, **Update now** reloads the same URL with `release=<new-sha>`. That unique navigation
causes Pages/browser HTML caching to resolve the new Vite entry point and content-hashed assets.
The user controls the reload because active encounters and unsaved textarea drafts are not durable
until their existing save actions run.

## Test and release gates

- Unit tests cover strict markers, base-aware URLs, build/channel comparison, reload URLs, Apple
  device detection, installation instructions, and safe-screen update gating.
- The bundle verifier requires the manifest, exact icon set, and `version.json`, checks relative
  scope, checks the expected Player/Reviewer kind, and compares any supplied release ID.
- Mobile Reviewer Playwright tests fetch the built manifest/version/icons, inspect the install
  dialog at 390 and 320 pixels, and continue to prove IndexedDB reload/export behavior.
- Both Player and Reviewer bundle-isolation scans still reject private source material, Developer
  queues, the local writer, AI SDK markers, and nonallowlisted review content.
- Before promoting `beta` to `main`, run the ordinary definition-of-done gates. Reviewer-surface
  changes also require the 390-pixel, 320-pixel, and CI iPhone/WebKit gates. After Pages deploys,
  smoke the installed app on one physical iPhone and confirm that an older installed release
  discovers the new SHA without losing saved reviews.

## Explicitly deferred

- offline app-shell or runtime caching;
- service-worker activation/migration;
- background push;
- account/device synchronization;
- automatic feedback upload;
- moving Safari data into the Home Screen container;
- bypassing GitHub Pages' CDN with a new backend or third-party release service.
