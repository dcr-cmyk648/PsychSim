# PsychSim

PsychSim is a browser-based psychiatric clinic-building game prototype. Milestones 0–3 deliver a small playable clinical loop plus the first progression arc: purchase immediate structured information, assemble a treatment plan, lock it in, receive an itemized all-points settlement, and reinvest banked points in services, formularies, facilities, and visible ambience.

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

The first profile begins with 250 spendable points and zero lifetime points earned. Investigation costs, care awards/penalties, reimbursement, purchases, and progression all use the same point unit. There is no letter grade, 0–100 score, credits, Reputation, or XP. The clinic store currently offers a 1,200-point ECG machine, an 800-point outpatient formulary expansion, two facility moves, and three decor items. Purchases reduce only the spendable balance; lifetime points never decrease. Encounter expenses never debit banked points directly—only the nonnegative settled payout is added. Saves, resolved patient slots, attempts, flags, review tickets, facility state, decor, and upgrade ownership use a small IndexedDB repository in the browser.

The first facility move becomes eligible at 2,500 lifetime points and separately costs 1,800 spendable points, increasing the persistent queue from one to two slots. The multidisciplinary center becomes eligible at 7,500 lifetime points, requires the outpatient-clinic move, costs 5,000 spendable points, and adds a third slot. Waiting patients and previous purchases survive the move. The plant, framed print, and warm-lighting purchases appear in the hub and add diminishing ambience toward a cataloged 1.15× cap on positive rewards only; they never change clinical scoring or rescue unsafe care.

The ECG patient is playable before ownership through a 500-point outside service. Owning the machine automatically fulfills the same order in house for 70 points; the receipt reports the 430-point external cost avoided without changing any clinical rule or result.

The hub includes reversible Endgame and local-only Developer practice modes. Endgame derives a highest-tier clinic with every currently modeled capability and multiple approved patient slots. Developer mode also exposes review content that has not yet been run, supports reroll/reset, and shows the local clinical-ticket queue. Every ticket has one plain-language “What should Codex do?” field; internal lifecycle statuses are not user-facing. Saving instructions persists them in browser IndexedDB and automatically refreshes the fixed gitignored Codex handoff file at `content/generated/local-review-tickets/tickets.json`; after reviewing, the user only needs to tell Codex that the local review is ready. Codex infers the intended action from the prose and asks only when a material choice remains ambiguous. “Update Codex handoff file” retries or refreshes that copy, while “Export JSON” downloads a backup. Practice receipts bank zero points. Production builds exclude Developer content and the writable local endpoint.

Numeric laboratory results use an EMR-style `Test · Result · Reference interval · Flag` table with familiar display units, UCUM codes in the data model, and explicit normal/high/low interpretation. Reference intervals belong to versioned test profiles rather than being treated as universal; see [LAB_RESULTS.md](docs/LAB_RESULTS.md).

The local authoring slice now hashes and extracts PDF, DOCX, TXT, and Markdown sources into gitignored document/chunk records. A controlled scaffold request can turn an existing reviewed-as-a-template case into a new medically unreviewed Developer patient with source provenance and blocking clinical-audit tickets. It does not infer clinical rules or call an AI provider. See [DOCUMENT_INGESTION.md](docs/DOCUMENT_INGESTION.md) and [the scaffold example](content/cases/blueprints/basic-mdd-scaffold.example.json).

Formal literature has a separate, tracked evidence catalog. Each article, guideline, or regulatory document receives one stable bibliographic record; case and medication contribution notes say exactly which rule it informed and how. Receipt traces show those citations and contribution statements. Rules without a linked formal contribution display `Expert opinion` rather than receiving an inferred citation. Run `pnpm content:evidence` to audit cataloged publications, linked contributions, unused sources, and implicit expert-opinion rules.

The clinical-model checkpoint now includes one file per diagnosis family, top-down base/severity/specifier composition, deterministic gameplay-critical patient-context variants, multi-diagnosis conflict quarantine, and a five-dimensional complexity vector. Diagnosis guidance is qualitative and point-free until separately balanced. MDD severity and optional comorbidity generation remain disabled in approved content pending source and policy decisions; see [DIAGNOSIS_ENGINE.md](docs/DIAGNOSIS_ENGINE.md).

The CANMAT MDD source has been decomposed into five unresolved Developer tickets rather than applied automatically. Three additional ECG tickets cover necessity/weight, continuation versus switching, and disposition. Switch to Developer mode on the local server to review and disposition them; resolving a ticket records workflow state but does not silently rewrite clinical JSON.

## Static deployment

The application is GitHub Pages-ready. [The Pages workflow](.github/workflows/pages.yml) runs formatting, lint, typecheck, unit/content/browser gates, builds with the repository subpath as Vite's base URL, verifies that private source and Developer content are absent, and deploys `apps/web/dist` when Pages is available. Public repositories deploy automatically. A private repository deploys only when its GitHub plan supports Pages and the repository variable `PSYCHSIM_ENABLE_PAGES=true` is set; otherwise the verification/build job stays green and deployment is skipped. Local builds continue to use `/`; reproduce the Pages shape with:

```sh
VITE_BASE_PATH=/PsychSim/ pnpm build
```

Pages is a static host only. Saves, patient queues, attempts, and points remain in that browser's IndexedDB; there is no account sync or server database. The production deployment includes approved-for-prototype patients only and never includes the local source inbox, extracted text, review patients, clinical-ticket writer, or AI SDK.

## Documents

Start with [PROJECT_STATE.md](PROJECT_STATE.md), [GAME_DESIGN.md](docs/GAME_DESIGN.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [LAB_RESULTS.md](docs/LAB_RESULTS.md), and [DECISIONS.md](docs/DECISIONS.md). Contributor constraints live in [AGENTS.md](AGENTS.md), milestone sequencing is in [ROADMAP.md](docs/ROADMAP.md), and phone/Mac coordination is in [CODEX_THREAD_HANDOFF.md](docs/CODEX_THREAD_HANDOFF.md).
