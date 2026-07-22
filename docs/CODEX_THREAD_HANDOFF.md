# Codex phone and Mac thread handoff

PsychSim uses one canonical, write-capable Codex thread per local Git worktree. This prevents an old computer thread and a phone-created direct fork from editing the same files independently while still allowing either surface to continue the same project.

This coordinates Codex threads using the same Mac worktree through remote control. It does not synchronize different clones or computers, merge Git changes, replace normal commits/pushes, or replace the durable operational record in `PROJECT_STATE.md`.

## Components

- `PROJECT_STATE.md`: tracked durable handoff and exact resume point.
- `scripts/codex-handoff`: operator command.
- `scripts/codex_handoff.py`: standard-library lease state machine and hook handler.
- `.codex/hooks.json`: session, prompt, write-tool, and stop hooks.
- `.codex-handoff.local.json`: gitignored local lease and worktree fingerprint.
- `.codex-handoff.local.lock`: gitignored process lock.

The local lease records thread IDs, direct-fork lineage, generation, explicit target, active-turn state, branch/HEAD/status fingerprints, and a hash of `PROJECT_STATE.md`. It never stores prompts, source documents, clinical content, tickets, credentials, or patient data.

## One-time hook trust

Codex project hooks run only after this repository and the exact hook definitions are trusted:

1. Review `.codex/hooks.json` and `scripts/codex_handoff.py`.
2. Run `/hooks` in Codex CLI and trust the project hooks.
3. Resume or restart the thread so `SessionStart` runs.
4. Run `./scripts/codex-handoff status`.

Hooks are guardrails, not a security boundary. `AGENTS.md` startup checks remain mandatory.

## Mac to phone

Tell the canonical Mac thread: `Prepare phone handoff`.

It must finish its current operation, leave no file write or background mutation in flight, update `PROJECT_STATE.md` if workflow state changed, and run this as its final command:

```sh
./scripts/codex-handoff prepare phone
```

Open that conversation through remote control on the phone and send the next prompt. A direct child fork claims the lease only when its parent is canonical, no other turn is active, and branch, HEAD, working-tree status, and `PROJECT_STATE.md` still match the recorded snapshot.

## Phone to Mac

Tell the canonical phone thread: `Prepare Mac handoff`. After it finishes, use a normal terminal rather than typing in a stale Codex prompt:

```sh
cd /Users/dustinrowland/Projects/PsychSim
./scripts/codex-handoff resume
```

The wrapper resumes the canonical ID with unfiltered session flags, even when the ordinary resume picker omits it.

## Status and recovery

```sh
./scripts/codex-handoff status
./scripts/codex-handoff resume --print
```

Status reports the canonical thread, current relation, generation, prepared target, active turn, snapshot match, and exact resume command.

An unprepared direct fork can still claim safely when it is the canonical thread's direct child, the prior turn ended, and the snapshot matches. Preparation is preferred because it records intent.

If the snapshot changed, automatic takeover is blocked. The exact prompt `Accept handoff` permits the direct child to enter read-only reconciliation mode. After comparing Git and `PROJECT_STATE.md` and receiving user confirmation about which state to retain, the canonical reconciliation thread may run:

```sh
./scripts/codex-handoff reconcile --adopt-current
```

This changes only the local lease/fingerprint. It never resets, restores, stages, commits, pushes, or modifies project content.

If an interrupted response leaves an active-turn marker, first verify that no response, tool call, or background write is still running. The canonical thread can then run:

```sh
./scripts/codex-handoff recover-turn
```

There is no timed lease expiry. A stale thread must not attempt repository reconciliation or continue editing; resume the printed canonical ID from a normal terminal.

## Durable synchronization rules

- Conversation history is not durable project state.
- Update `PROJECT_STATE.md` before ending substantial work or handing off surfaces.
- Commit and push validated checkpoints when authorized so work survives different clones or computers.
- Never force-push. Stop if the remote diverges.
- Never use the lease as a reason to stage, commit, push, merge, or resolve a clinical ticket.
- Files on disk are authoritative; reload them before editing and preserve manual changes.

## Limits

- Codex does not expose trustworthy phone-versus-computer identity in the hook metadata. Explicit prepare targets and direct-fork ancestry are used instead.
- Transcript inspection is limited to best-effort direct-parent detection because the hook payload does not always expose ancestry directly.
- The guard cannot make uncommitted work durable on another machine. Git checkpoints remain necessary.
- Hook coverage may not intercept every future tool surface, so repository instructions and startup status checks remain required.
