# PsychSim

PsychSim is a browser-based psychiatric clinic-building game prototype. Milestones 0–2 deliver a small playable clinical loop plus the first clinic-building decision: purchase immediate structured information, assemble a treatment plan, lock it in, receive an itemized all-points settlement, and reinvest banked points in clinic capabilities.

Cross-device Codex work uses one canonical write-capable thread per local worktree. Start every new or resumed thread from [PROJECT_STATE.md](PROJECT_STATE.md), run `./scripts/codex-handoff status`, and follow [the phone/Mac handoff guide](docs/CODEX_THREAD_HANDOFF.md) before editing. Conversation history is not project memory.

The two runtime patients are fictional, synthetic, medically unreviewed, and not authoritative treatment guidance. Waiting-room cards intentionally show only patient name, chief complaint, and setting; hidden case labels and diagnoses are never used as launcher copy. No external service, account, API key, backend, or AI call is required to play.

## Quick start

Requirements: Node 22+ and pnpm 10.13.1.

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Other root commands:

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:handoff
pnpm test:e2e
pnpm content:validate
pnpm content:sources:validate
pnpm content:scan
pnpm content:extract
pnpm content:watch
pnpm content:draft content/cases/blueprints/basic-mdd-scaffold.example.json
pnpm content:review
pnpm content:evidence
pnpm content:compile
pnpm content:impact medication.bupropion
pnpm demo:reference-runs
```

On a machine without a locally installed Google Chrome, install Playwright's pinned browser once
with `pnpm exec playwright install chromium` before `pnpm test:e2e`.

The first profile begins with 250 spendable points and zero lifetime points earned. Investigation costs, care awards/penalties, reimbursement, purchases, and progression all use the same point unit. There is no letter grade, 0–100 score, credits, Reputation, or XP. The clinic store currently offers a 1,200-point ECG machine and an 800-point outpatient formulary expansion. Purchases reduce only the spendable balance; lifetime points never decrease. Encounter expenses never debit banked points directly—only the nonnegative settled payout is added. Saves, resolved patient slots, attempts, flags, review tickets, and upgrade ownership use a small IndexedDB repository in the browser.

The ECG patient is playable before ownership through a 500-point outside service. Owning the machine automatically fulfills the same order in house for 70 points; the receipt reports the 430-point external cost avoided without changing any clinical rule or result.

The hub includes reversible Endgame and local-only Developer practice modes. Endgame derives a highest-tier clinic with every currently modeled capability and multiple approved patient slots. Developer mode also exposes review content that has not yet been run, supports reroll/reset, and shows the local clinical-ticket queue. It can mirror the queue to a fixed gitignored workspace file or export a versioned JSON bundle. Practice receipts bank zero points. Production builds exclude Developer content and the writable local endpoint.

Numeric laboratory results use an EMR-style `Test · Result · Reference interval · Flag` table with familiar display units, UCUM codes in the data model, and explicit normal/high/low interpretation. Reference intervals belong to versioned test profiles rather than being treated as universal; see [LAB_RESULTS.md](docs/LAB_RESULTS.md).

The local authoring slice now hashes and extracts PDF, DOCX, TXT, and Markdown sources into gitignored document/chunk records. A controlled scaffold request can turn an existing reviewed-as-a-template case into a new medically unreviewed Developer patient with source provenance and blocking clinical-audit tickets. It does not infer clinical rules or call an AI provider. See [DOCUMENT_INGESTION.md](docs/DOCUMENT_INGESTION.md) and [the scaffold example](content/cases/blueprints/basic-mdd-scaffold.example.json).

Formal literature has a separate, tracked evidence catalog. Each article, guideline, or regulatory document receives one stable bibliographic record; case and medication contribution notes say exactly which rule it informed and how. Receipt traces show those citations and contribution statements. Rules without a linked formal contribution display `Expert opinion` rather than receiving an inferred citation. Run `pnpm content:evidence` to audit cataloged publications, linked contributions, unused sources, and implicit expert-opinion rules.

## Static deployment

The application is GitHub Pages-ready. [The Pages workflow](.github/workflows/pages.yml) runs formatting, lint, typecheck, unit/content/browser gates, builds with the repository subpath as Vite's base URL, verifies that private source and Developer content are absent, and deploys `apps/web/dist` when Pages is available. Public repositories deploy automatically. A private repository deploys only when its GitHub plan supports Pages and the repository variable `PSYCHSIM_ENABLE_PAGES=true` is set; otherwise the verification/build job stays green and deployment is skipped. Local builds continue to use `/`; reproduce the Pages shape with:

```sh
VITE_BASE_PATH=/PsychSim/ pnpm build
```

Pages is a static host only. Saves, patient queues, attempts, and points remain in that browser's IndexedDB; there is no account sync or server database. The production deployment includes approved-for-prototype patients only and never includes the local source inbox, extracted text, review patients, clinical-ticket writer, or AI SDK.

## Documents

Start with [PROJECT_STATE.md](PROJECT_STATE.md), [GAME_DESIGN.md](docs/GAME_DESIGN.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [LAB_RESULTS.md](docs/LAB_RESULTS.md), and [DECISIONS.md](docs/DECISIONS.md). Contributor constraints live in [AGENTS.md](AGENTS.md), milestone sequencing is in [ROADMAP.md](docs/ROADMAP.md), and phone/Mac coordination is in [CODEX_THREAD_HANDOFF.md](docs/CODEX_THREAD_HANDOFF.md).
