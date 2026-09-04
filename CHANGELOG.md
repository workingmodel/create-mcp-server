# Changelog

## Unreleased

- Fix: stdio-transport (and SSE-transport) scaffolds no longer leave `dev:sse`/`start:sse` scripts, or a stale `src/index.sse.ts` entry in the `build` script, pointing at a file that was deleted/renamed away during scaffolding.
- Add: opt-in `Add persistent cross-session memory? (agent-memory)` prompt (default no). When accepted, wires `@workingmodel/agent-memory` into the generated `package.json`, adds `.memory/` to `.gitignore`, and drops in a `memory-snapshot` starter tool. Not offered for the `minimal` template. **`@workingmodel/agent-memory` is not yet published to npm** — the mechanism is wired correctly but `npm install` won't resolve the dependency until publish.

## 1.0.0

Migrated to `@workingmodel/create-mcp-server`. Package renamed from `wm-create-mcp-server`.
