# Squad Skills

[![skills.sh](https://skills.sh/b/danh121097/squad-skills)](https://skills.sh/danh121097/squad-skills)

Supports **OpenCode**, **Claude Code**, **Codex**, **Cursor**, and
[**73 more**](https://www.npmjs.com/package/skills#supported-agents).

Role-specialized engineering skills for AI coding agents. The collection covers
product framing, design, frontend, backend, mobile, DevOps, QA, code review, bug
fixing, and coordinated squad delivery while preserving clear ownership
boundaries.

The repository follows the open Agent Skills format and keeps each installable
skill under `skills/<skill-name>/SKILL.md`.

## Install

Every path installs the same set of skills. They differ in how the matching
subagents arrive.

| Path               | Skills | Subagents        | Tools                               |
| ------------------ | ------ | ---------------- | ----------------------------------- |
| Claude Code plugin | ✅     | ✅ same step     | Claude Code                         |
| Codex plugin       | ✅     | one more command | Codex                               |
| npm CLI            | ✅     | ✅ same step     | Claude Code, Codex                  |
| `npx skills add`   | ✅     | one more command | every agent the Skills CLI supports |

### As a Claude Code plugin

The plugin ships the skills and the subagents together, so one command installs
both:

```sh
/plugin marketplace add danh121097/squad-skills
/plugin install squad-skills@squad-skills
```

Each role then exists twice over: as a skill you invoke, and as a subagent you
spawn by name.

### As a Codex plugin

Codex installs the skill catalog directly from the repository plugin:

```sh
codex plugin marketplace add danh121097/squad-skills
codex plugin add squad-skills@squad-skills
```

The Codex plugin manifest lives at `.codex-plugin/plugin.json` and exposes
`skills/`. Codex agent definitions remain a separate runtime surface, so add
them after plugin installation when named subagents are wanted:

```sh
npx squad-skills add --all --global --agent codex
```

This command installs durable copied skills and generates their agents together.
The `agents` command alone finds standalone skill installations, not plugin-cache
payloads. Use `--skill <name>` instead of `--all` to install selected roles. Keep
the plugin and copied catalog on the same release, or use the npm path alone to
avoid two catalog versions.

### From the npm package (recommended)

Run without a permanent CLI installation:

```sh
npx squad-skills list
npx squad-skills add --skill squads-team
npx squad-skills add --skill squad-frontend --global --agent codex
```

Or install the command globally first:

```sh
npm install --global squad-skills
squad-skills add --skill squads-team
```

The npm command delegates installation to the official `skills` package and
defaults to copied files, so installed skills do not depend on an ephemeral
`npx` package-cache path.

### Each role as a subagent too

`squad-skills add` also writes a subagent definition for every skill it
installs, so a role can be spawned by name instead of only loaded as a skill.
Claude Code reads `.claude/agents/<name>.md`; Codex reads
`.codex/agents/<name>.toml` and loads it only once `config.toml` names the file,
which the CLI registers after backing that config up. Each definition points at
the `SKILL.md` just installed rather than copying it, so the skill stays the one
source of truth.

`squads-team` and `squad-fix` dispatch other roles. Their ability to delegate from a
Claude subagent depends on the installed version, depth limit and available tools;
inspect those capabilities rather than assuming nesting is always available or absent.
When delegation is unavailable or the user requests one session, use distinct logical
gate passes and report them as non-independent.

Use `--no-agents` to install skills alone. A catalog installed through
`npx skills add` never runs this CLI, so generate the definitions afterwards:

```sh
npx squad-skills agents --global
```

Each Claude Code subagent file carries a model and a reasoning effort for its
role. `squads-team`, `squad-product`, `squad-fix` and `squad-code-review` run on
`opus`; the other roles run on `sonnet`. Every role runs at `medium` effort. `--model` and `--effort`
override them, with a bare value for every role or `<skill>=<value>` for one,
and `inherit` drops the field for the runtime to resolve:

```sh
npx squad-skills agents --global --agent claude-code --model squad-qa=opus,squad-designer=inherit --effort squad-qa=high
```

Codex named agents carry their own `model` and `model_reasoning_effort` in
`~/.codex/agents/<name>.toml`:

| Roles                                                                                           | Model         | Effort   |
| ----------------------------------------------------------------------------------------------- | ------------- | -------- |
| `squads-team`, `squad-product`, `squad-fix`, `squad-code-review`                                | `gpt-6.1-sol` | `high`   |
| `squad-backend`, `squad-designer`, `squad-devops`, `squad-frontend`, `squad-mobile`, `squad-qa` | `gpt-6.1-sol` | `medium` |

These per-agent fields take precedence over `[agents]` defaults in `config.toml`.
`--model`, `--effort` and named overrides work for Codex too; `inherit` omits a
field, leaving Codex to resolve it from the spawn request, `[agents]` defaults
or parent session. The CLI preserves those global defaults. See the
[OpenAI subagent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents)
for runtime precedence and model access requirements.

```sh
npx squad-skills agents --global --agent codex
npx squad-skills agents --global --agent codex --effort squad-qa=high
```

Every install regenerates these files, so pass the same flags again to keep an
override. A bare model applies to every selected tool; use `--agent` to target
model IDs to the intended runtime. Loading a skill in the current chat keeps
that chat's model. Codex leads use the same role preferences for subagents and
separate worker chats: each field takes your role-specific choice, then your
overall choice, then the installed role file, or the bundled mapping when that
file is absent. An omitted installed field or explicit `inherit` leaves that
field to the chosen runtime. For a separate chat, the lead passes the resolved
model and effort as `model` and `thinking` to `create_thread`; the chat does not
load a named subagent's TOML automatically. A subagent whose fixed role settings
conflict with your override uses a generic agent loaded with the same role skill.

The authored model/effort defaults for both tools live in `src/agents/role-defaults.ts`.
`pnpm agents:generate` derives matching worker tables inside `squads-team` and
`squad-fix`, so each skill works alone through GitHub or npm. Their
`worker-models.md` references contain separate Codex and Claude columns. Tests reject stale references and compare the rows with both native formats.

Claude workers use the same precedence: your role-specific choice, then your
overall choice, then the active installed role definition, else the bundled
Claude defaults. Claude Code uses supported per-invocation `model`/`effort`
fields for subagents and `--model`/`--effort` for independent CLI sessions.
Claude Desktop sessions do not inherit a named subagent's frontmatter: select
the resolved non-inherit model and effort in the session controls before sending
the worker task, then verify those selections before its first edit. A task chip without
model/effort controls keeps implementation pending until the pair can be selected
and verified; a title or skill name alone does not set either field. Forced
environment settings or managed limits can supersede the requested pair. See
[Claude Desktop](https://code.claude.com/docs/en/desktop) and [Claude subagents](https://code.claude.com/docs/en/sub-agents)
and the [CLI reference](https://code.claude.com/docs/en/cli-reference).

Runtime authorization and model availability still apply; the lead distinguishes
selected settings from values confirmed in runtime metadata and preserves the lead's
model and unrelated global settings.

See [the installation guide](docs/installation.md) for local-checkout commands,
installation scope, copy versus symlink behavior, and publishing notes.

### From GitHub or skills.sh

List the available skills directly from the public repository:

```sh
npx skills add danh121097/squad-skills --list
```

Install the squad orchestrator globally for selected agents:

```sh
npx skills add danh121097/squad-skills \
  --skill squads-team --global \
  --agent codex --agent claude-code --agent cursor --agent opencode
```

Install a single role:

```sh
npx skills add danh121097/squad-skills \
  --skill squad-frontend --global --agent codex
```

This route installs skills only; generate the subagents afterwards with
`npx squad-skills agents --global`, as above.

## Choosing a skill

Every skill here is model-invocable, so an agent routes most work on its own. This table is for the moment
you want to pick the role yourself.

| Situation                                                                                                                             | Reach for           |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| An idea or goal with no acceptance criteria yet, or an empty repository to frame                                                      | `squad-product`     |
| A UI, UX, design-system or motion decision that your screenshot, link, brief or Figma and the existing system leave open              | `squad-designer`    |
| Web UI, client logic and API integration                                                                                              | `squad-frontend`    |
| APIs, data models, auth, migrations, queues and server logic                                                                          | `squad-backend`     |
| React Native, Expo, Flutter, SwiftUI or Compose screens and app logic                                                                 | `squad-mobile`      |
| CI/CD, containers, IaC, reverse proxy and TLS, observability, release and rollback                                                    | `squad-devops`      |
| A bug, regression, failing test, broken build or CI/deploy failure whose owner is unproven, or that wants a diagnosis-to-fix pipeline | `squad-fix`         |
| Test design, a reproduction, or a fix that needs an evidence-backed verdict                                                           | `squad-qa`          |
| A diff, PR or branch that needs an implementation review before it ships                                                              | `squad-code-review` |
| Work spanning several roles, or work needing independent QA and review gates                                                          | `squads-team`       |

Two of these are gates rather than builders. `squad-qa` verifies observable behavior against acceptance and
risk, then issues `PASS`, `FAIL` or `NEEDS_ENVIRONMENT`. `squad-code-review` runs beside it on the same revision, consumes that
evidence before its verdict, reviews implementation quality and issues `APPROVE`, `CHANGES_REQUESTED` or `NEEDS_EVIDENCE`; it never implements
the fixes it asks for. Reach for the smallest role that fits and let it escalate.

### When other skill packs are installed

A general-purpose skill from another pack can take a request before any squad role does. In local evals with
`superpowers` and the Figma plugin installed, 30 plain requests went to `superpowers:brainstorming`,
`superpowers:systematic-debugging` or `figma:figma-design-to-code` 9 times on Sonnet and once on Opus. Adding this
line to your `AGENTS.md` or `CLAUDE.md` removed every `superpowers` pick:

```markdown
- Before acting on a non-trivial engineering request, choose which squad skill to invoke for it,
  even when another plugin's skill (brainstorming, systematic debugging, Figma design-to-code)
  also matches; that skill can still run inside the squad role.
```

With the line, 27 of 30 requests routed correctly on Sonnet and 28 of 30 on Opus, in one run per model on one
machine. Sonnet still sent most web builds from a Figma file to the Figma skill; naming that case in the
`squad-frontend` description brought them to 6 of 9 runs, and the same in `squad-mobile` brought Expo, Flutter
and SwiftUI builds from 7 of 18 to 14 of 18. The rest still go to `figma:figma-design-to-code`.

## How the squad runs

`squads-team` names a gate tier in one line before building:

| Tier       | When                                                                                                 | Closes on                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `light`    | One owner; no change to a public contract, auth, data or migration, infrastructure or a dependency   | One combined verify pass with real commands            |
| `standard` | The default                                                                                          | QA `PASS` and Code Review `APPROVE`, run together      |
| `high`     | Auth or permissions, payment, data or migration, production infrastructure or secrets, data deletion | Both gates, run independently where the runtime allows |

QA and Code Review return all actionable findings to the same build worker. Main sends them to that
worker's existing chat; the worker fixes and reports the completed pass back to main. Main then reruns
both gates on the repaired revision, focusing on the finding and affected scope, until QA `PASS` and Code
Review `APPROVE`. Main reports `done` to the worker chat and stops dispatching it. Main assesses each completed repair, including the second. If the same failure
persists across two assessments without new evidence, or the second repair still fails, it reports
`BLOCKED` with attempts and options; you can ask it to run another bounded batch. A missing environment,
authority or decision is also reported as blocked. `APPROVE`
closes a unit: its warnings and suggestions reach you as options in the final report instead of going
back to the owner, and a follow-up you ask for is tiered on its own diff, so a docs or test tweak does
not rerun both gates, and a fix that changes no observable behavior reruns only the existing suite. A build role or `squad-fix` called on its own verifies with real commands and ends
by suggesting `/squad-qa` then `/squad-code-review`; `high` work still runs both. Outside main/coordinator
thread mode, unavailable delegation lets unassigned gates run as distinct logical passes, reported as
non-independent. An explicitly required independent or externally
assigned gate remains pending until its matching verdict arrives. Designer runs only for
decisions your own references and the existing design system leave open.

### Gates in another session

The same rules apply in Herdr, Claude Desktop and Codex. By default, each skill follows its normal
workflow. Explicitly assigning QA or Code Review to another named session transfers that gate instead
of adding a second local pass. Assign the gates separately; an external reviewer does not automatically
own QA. Local verification and the tier's requirements remain in place, including independence for
`high` work where the runtime allows.

For example, in the builder session:

> Use `squads-team` to implement this change. Your session owns implementation, local verification and
> any QA required by the tier. The Codex reviewer session owns Code Review; hand off the exact diff and
> evidence to it.

In the reviewer session:

> Use `squad-code-review` on the handed-off diff. Consume matching QA evidence and add only checks
> needed to verify findings or resolve missing evidence. Return the verdict and findings to the owner.

Either model can take either role. An app name or another open session alone assigns no gate. When
sessions cannot communicate, the builder returns the handoff in prose for you to relay: base, revision
and pending changes, acceptance criteria, commands, results, environment and gaps. A branch name or HEAD
alone does not identify an uncommitted diff.

The builder may report implementation ready, with external review pending; the task is not done until
assigned gates return their required passing verdicts on that diff. Builder verification alone is not
an independent QA `PASS`. Retain valid evidence after fixes and rerun affected checks; a requested
second opinion after approval does not restart the whole pipeline.

### Orchestrator flags

When you designate the current session as **main/coordinator**, implementation runs
in worker threads/sub-sessions that report back to main, on both Claude and Codex.
Main coordinates, reviews results, advances gates and integrates; workers own implementation.
This designation persists through follow-ups, task completion and context compaction until you change
execution mode. Routing a single-role task selects its worker; it does not make main the implementer.
Main keeps the existing `squads-team` or `squad-fix` coordination contract, or loads `squads-team`
before dispatch if none is active. Its runtime dispatch, model selection, snapshot and gate references
also apply to a single-role task. If neither lead skill is installed, dispatch stays pending with the
missing skill reported. Workers execute only their assigned role.
Before implementation, main identifies the worker session or explains a verified capability gap.
QA and Code Review use paired subagents for standard/high thread-mode work; light work uses its combined verify pass.
Small integration edits may stay in main unless `--coordinate-only` applies. A small task alone does
not cancel the thread preference.

Worker sessions require creation, result read-back and follow-ups. If the runtime lacks these capabilities,
main states the limitation and falls back to subagents, then single-session execution if necessary.
A supported user-started session remains pending until launched. Missing runtime-required permission
also leaves dispatch pending; main asks for only the missing authorization. Naming a session main does
not bypass runtime permission rules. Explicit single-session or no-delegation instructions take precedence. Gate execution follows the
mode actually used: single-session fallback runs required unassigned gates as logical passes, reported
as non-independent; explicitly independent or externally assigned gates remain pending without their
evidence. In thread mode, missing paired subagents keep the gate pending. Light work needs only its
combined verify pass.

Without a main/coordinator designation or explicit mode, choose the lowest-overhead suitable mode.
Build worker chats use `[squad-frontend]: <slice>`, `[squad-backend]: <slice>`, or the matching assigned
skill name in the same project; sidebar nesting is runtime-dependent. Main starts QA and Code Review as
subagents together on each paired gate round. They exchange evidence directly when supported, or through
main; Review waits for QA evidence before its verdict. If either subagent cannot start, main leaves the
paired gate pending. Main sends findings back to the build chat. A Codex
worker chat must receive its role's selected model and effort through `create_thread` `model` and `thinking`,
then receive that pair again on each `send_message_to_thread` follow-up. Loading a skill inside the chat
does not select the pair. Check the worker turn metadata for the effort that actually ran; the effort shown
in an idle composer can differ from a completed turn. For concurrent Codex build chats in one Git repo,
request a separate worktree for each worker. After passing gates, main reports done to the worker,
integrates its exact changes into the current branch, resolves conflicts, verifies the combined diff, and
then cleans task-owned worktrees and branches. The current branch keeps a reviewable diff; integration
does not imply an automatic commit.

Name new worktree branches `codex/<slug>` for Codex work and `claude/<slug>` for Claude work when the
runtime supports branch naming. Claude Desktop's **Branch prefix** setting should be `claude`; it adds
the slash for new branches. Codex's managed worktree name accepts a slug rather than a slash, so check the
branch returned by the app. If a runtime assigns a different name without exposing branch control, keep
its managed checkout and report the observed branch and path. Existing worktrees keep their names.

The initial prompt requires the worker to capture its snapshot after seeding and before its first edit;
capture failure stops editing. This applies to Claude and Codex, including sessions that start immediately.
Each gate receives the absolute worker checkout path, base, initial snapshot and current diff identity,
including untracked content. Workers pause edits during the gates; changed inputs invalidate affected
verdicts. Integration transfers the worker delta from that initial snapshot, including added, deleted,
renamed and binary files. Compare it against the current target to preserve inherited dirty state and
concurrent user edits. A passing worker is not a completed parent task until integration is verified.
With `--coordinate-only`, one assigned integration owner applies changes, resolves conflicts and runs
combined checks; main reviews evidence without editing the target. Otherwise main can integrate.
Thread instructions are loaded only for build chats; single-session paths skip their dispatch details.
For runtimes requiring explicit creation and messaging authorization, a complete request is:

> Use `squads-team` for this change. Create a separate chat for each implementation worker in this
> project and keep this chat as lead. Give concurrent coding workers separate worktrees. Apply the Codex
> role model/effort mapping, with any model or effort I specify taking precedence. Read worker reports
> here, run QA and Code Review as subagents, and send findings back to the same implementation chat
> until the gates pass. Integrate passing work into this branch, resolve conflicts, then clean its task
> worktree and branch after verifying the integrated diff.

`squads-team` flags, each overriding one default:

| Flag                                          | Default without it                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--devs N`                                    | every safe ready slice runs; `N` caps parallel build slices                                                         |
| `--with-mobile`, `--with-designer`            | roles come from scope routing                                                                                       |
| `--coordinate-only`                           | the lead may implement outside thread mode, make small integration edits inside it; with it, delegate only          |
| `--plan-approval`                             | no pause for build plans; material decisions still go to the user                                                   |
| `--mode auto\|team\|thread\|subagent\|single` | `auto`, threads for a designated main/coordinator; otherwise lowest overhead                                        |
| `--no-worktree`                               | authorized parallel Codex build chats use separate worktrees; without them, chats sharing a checkout are serialized |

## Skill format

Each skill directory must contain a `SKILL.md` whose YAML `name` matches the
directory name and whose `description` explains when the skill applies. Bundle
supporting material inside that same skill directory so installations remain
self-contained.

The executable contract is owned by the TypeScript validator and tests. Run
`pnpm validate` for a focused catalog check or `pnpm test` for the full gate.

`pnpm payload:report` reports declared reading-path and workflow word counts;
these are not measured token usage. `pnpm eval:skills` prepares repeatable
Claude/Codex evaluation packets and summarizes recorded observations without
launching models. See [skill evaluation](docs/skill-evaluation.md) for the
comparison protocol and evidence required before changing model defaults.

## Written plans

Plans stay in the conversation unless you ask `squad-product` or `squads-team` to write one to disk, or pass
`squad-product` a `--plan-dir` / `--plan-file`. A written plan is one `plan.md`, with each phase a `## Phase N — <title>`
section. A plan too long to read as one file keeps `plan.md` as the only index and moves each phase to
`phases/phase-XX-<kebab-case-title>.md`:

```text
plans/<YYMMDD-HHmm>-<topic>/
├── plan.md
└── phases/
    ├── phase-01-<kebab-case-title>.md
    └── phase-02-<kebab-case-title>.md
```

`plan.md` owns the outcome, constraints, non-goals, acceptance criteria, labeled assumptions, open decisions
and the phase list. Each phase names its required Squad roles — for example `squad-backend` and
`squad-devops` — with a distinct responsibility for each, its ordered work and the evidence that proves it
done; the lead assigns live files and agents later. A plan never records a gate verdict: gates hand off in
prose between roles.

## Upgrading

### From 0.3 to 0.4

- A written plan is one `plan.md`; phases move to `phases/` only when the plan is too long. A plan written
  by 0.3 still reads, but `artifacts/`, `adr/`, `references/` and gate records are no longer written.
- Claude Code agent files now carry a per-role `model` and `effort`. Pass `--model inherit` or
  `--effort inherit` to keep following the session's.
- `--model` and `--effort` both accept a bare value for every role or `<skill>=<value>` for one.

### From 0.2 to 0.3

- New plan directories are named `<YYMMDD-HHmm>-<topic>`; existing `<DDMMYYYY-HHmm>` directories still
  read and need no rename.
- `--delegate` is gone; use `--coordinate-only`. `--allow-new-threads` and the thread registry are gone;
  ask for a separate task directly when you want one.
- QA and Code Review are no longer run on every change: `light` work closes on one combined verify pass.
- A role invoked on its own names its own gate tier and suggests the gates it did not run; `high` work
  still runs both.

## License

MIT. See [LICENSE](LICENSE).

## Discovery

skills.sh discovers and ranks public GitHub skills from anonymous Skills CLI
installation telemetry; the npm package is an additional distribution path and
does not replace the GitHub source.
