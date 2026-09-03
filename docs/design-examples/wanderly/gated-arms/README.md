# Gated arms — the dependency-free round

An earlier run of the same brief, under a different output contract.

The gate harness in this repository builds a candidate offline with Vite and no
`node_modules`. To get gate numbers at all, that round's contract forbade every
dependency — including the Next.js, GSAP, Lenis and `lucide-react` stack the
brief itself names. The four arms here are therefore vanilla HTML, CSS and ES
modules. `OUTPUT-CONTRACT-vanilla.md` is the contract they were given.

They are kept for two reasons: they are the only arms the shipped gates could
score, and several of the lessons in `../lessons.md` came out of reading them.

| Folder                   | Runtime                | Skill | Note                                                                                                                                     |
| ------------------------ | ---------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `codex-skill-on/`        | Codex `gpt-5.6-sol`    | on    |                                                                                                                                          |
| `codex-skill-off/`       | Codex `gpt-5.6-sol`    | off   | matched rerun                                                                                                                            |
| `claude-skill-on/`       | Claude `claude-opus-5` | on    |                                                                                                                                          |
| `claude-skill-off/`      | Claude `claude-opus-5` | off   | ended `error_during_execution` during a final polish pass; deliverable builds and was scored as-is                                       |
| `codex-selfqa-appendix/` | Codex `gpt-5.6-sol`    | off   | **not a cell of the 2×2** — ran with full network access and a measure-fix-remeasure loop the other arms were denied. See `../matrix.md` |

`renders/` holds their screenshots and `renders/compare/` the off-versus-on
pairs, built the same way as the real-stack ones.

Do not read these as recommended technique for the brief. They are what the
brief looks like when the toolchain is taken away.
