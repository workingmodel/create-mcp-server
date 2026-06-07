# create-mcp-server — Build Plan

**Package name:** `create-mcp-server`  
**Repository:** github.com/workingmodel/create-mcp-server  
**Tagline:** The fastest way to scaffold a production-ready MCP server  
**Status:** Sprint 1 — build in progress  
**Date:** 2026-06-07  

---

## What It Is

A `create-*` style CLI (like `create-next-app`, `create-vite`) that scaffolds a fully-typed, opinionated MCP server project. Designed for the current explosion in MCP tooling — every AI developer is looking at MCP but the DX for *building* servers is still rough.

```bash
npx create-mcp-server my-weather-server
# → interactive wizard
# → scaffolds typed project
# → npm install
# → ready in < 60 seconds
```

---

## Goals

1. **Speed to first tool** — developer has a working, typed MCP server in under 2 minutes
2. **Opinionated but escapable** — good defaults, clearly documented overrides
3. **Typed throughout** — Zod schemas, full TypeScript inference, no manual JSON Schema
4. **Testable from day one** — built-in inspector harness, unit test stubs
5. **Publishable** — GitHub Actions CI + npm publish workflow baked in

---

## Target User

- AI developers building tools, integrations, or agents with Claude, Cursor, Windsurf, or any MCP client
- Developers who've seen MCP but found the raw SDK setup friction-heavy
- Agencies (like WM) who want a repeatable starting point for client MCP projects

---

## Feature Set

### CLI (`create-mcp-server`)

Interactive wizard prompts:

| Prompt | Options |
|--------|---------|
| Project name | free text |
| Transport | `stdio` (default), `SSE` |
| Template | `minimal`, `standard`, `full` |
| Include resources? | yes/no |
| Include prompts? | yes/no |
| Include auth stub? | yes/no |
| Package manager | `npm`, `pnpm`, `bun` |

Post-scaffold:
- Runs `install` automatically
- Prints "next steps" summary
- Optional: `git init` + initial commit

---

### Templates

#### `minimal`
- Single `index.ts` entry point
- One example tool (`echo`)
- `package.json`, `tsconfig.json`, `.gitignore`
- README

#### `standard` (default)
Everything in `minimal` plus:
- `src/tools/` directory with typed tool registry
- `src/server.ts` server setup separated from tools
- `src/types.ts` shared types
- `.env.example`
- Vitest unit tests for tools
- GitHub Actions CI (`test.yml`)
- `npm run dev` with watch mode
- `npm run inspector` harness

#### `full`
Everything in `standard` plus:
- `src/resources/` — MCP resource definitions
- `src/prompts/` — MCP prompt templates
- `src/auth/` — OAuth/API key auth stub
- `src/middleware/` — request logging, rate limiting stubs
- Docker + `docker-compose.yml` for SSE transport
- Changeset versioning setup
- `npm run publish:dry` preview

---

### Typed Tool Builder

The core DX improvement over raw SDK. Instead of:

```ts
// raw SDK — verbose, no inference
server.tool("get-weather", {
  description: "Get weather",
  inputSchema: {
    type: "object",
    properties: {
      location: { type: "string" }
    },
    required: ["location"]
  }
}, async ({ location }) => { ... })
```

With `create-mcp-server`'s tool builder:

```ts
import { defineTool } from "./lib/tool-builder";
import { z } from "zod";

export const getWeather = defineTool({
  name: "get-weather",
  description: "Get current weather for a location",
  input: z.object({
    location: z.string().describe("City name or coordinates"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
  }),
  handler: async ({ location, units }) => {
    // fully typed — location: string, units: "celsius" | "fahrenheit"
    return { content: [{ type: "text", text: `Weather in ${location}...` }] };
  },
});
```

`defineTool` converts the Zod schema to MCP-compatible JSON Schema automatically.

---

### Local Dev Harness

`npm run dev` — starts the server in watch mode (tsx --watch)

`npm run inspector` — launches `@modelcontextprotocol/inspector` pointed at the local server. Developer can call tools interactively in the browser UI.

`npm run validate` — runs TypeScript + Zod schema validation across all registered tools

`npm run test` — Vitest unit tests

---

### Tool Registry Pattern

```
src/
  tools/
    index.ts          ← registers all tools
    echo.ts           ← example: echo tool
    get-weather.ts    ← example: weather fetch tool
  resources/          ← (full template only)
    index.ts
  prompts/            ← (full template only)
    index.ts
  lib/
    tool-builder.ts   ← defineTool() helper
    schema.ts         ← zod-to-json-schema converter
  server.ts           ← MCP server setup
  index.ts            ← entry point / transport
```

---

### GitHub Actions CI

Two workflows baked in:

**`test.yml`** — on push/PR:
- TypeScript typecheck
- Vitest unit tests
- Schema validation

**`publish.yml`** — on release tag:
- Build
- `npm publish`

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | Node.js 20+ (Bun compatible) | Broadest MCP client compat |
| Language | TypeScript 5 | Required for typed tools |
| MCP SDK | `@modelcontextprotocol/sdk` | Official |
| Schema | `zod` + `zod-to-json-schema` | Best TS inference |
| Build | `tsup` | Fast, zero-config ESM build |
| Dev/watch | `tsx` | Fast TS execution |
| Tests | `vitest` | Modern, fast |
| CLI | `prompts` + `kleur` | Lightweight, no heavy deps |
| Inspector | `@modelcontextprotocol/inspector` | Official MCP debug UI |

---

## npm Package Structure

```
create-mcp-server/          ← the CLI (npx create-mcp-server)
  src/
    cli/
      index.ts              ← entry, prompts wizard
      scaffold.ts           ← file generation
      install.ts            ← package manager detection + install
    templates/
      minimal/              ← template source files
      standard/
      full/
    lib/
      template-engine.ts    ← variable substitution in template files
  dist/                     ← built output (published to npm)
  package.json
```

---

## Sprint Plan

### Sprint 1 — Core (this session)
- [x] `_docs/build-plan.md` written
- [ ] Repo init, `package.json`, `tsconfig.json`
- [ ] CLI entry point with wizard (`prompts` library)
- [ ] `minimal` template
- [ ] `standard` template (tool registry, tests, CI)
- [ ] `defineTool()` builder + Zod→JSON Schema
- [ ] Scaffold engine (copy + variable substitution)
- [ ] Package manager detection + auto-install
- [ ] README for the CLI package
- [ ] Smoke test: `node dist/cli/index.js test-project`

### Sprint 2 — Polish + Publish
- [ ] `full` template (resources, prompts, auth stub, Docker)
- [ ] `npm run inspector` harness wired up
- [ ] `npm run validate` command
- [ ] Changeset versioning
- [ ] GitHub Actions publish workflow
- [ ] CLI help text + `--version` flag
- [ ] Register in project-registry.md
- [ ] Publish `create-mcp-server@0.1.0` to npm

### Sprint 3 — DX Extras
- [ ] `--template` flag to skip wizard
- [ ] `--yes` / `-y` flag (non-interactive, all defaults)
- [ ] Add-tool generator: `npx create-mcp-server add tool get-weather`
- [ ] VS Code extension recommendation in scaffolded README
- [ ] Landing page / docs site (WM-Site pattern)

---

## Success Metrics

- Scaffolds a working server that passes `npx @modelcontextprotocol/inspector` in < 5 minutes
- Zero TypeScript errors out of the box
- `defineTool()` infers handler argument types correctly
- Published to npm with `create-mcp-server` package name

---

## Open Questions

- Should SSE transport scaffold include Docker by default, or only in `full`?
- Auth stub: API key header (simpler) or full OAuth2 PKCE flow?
- `pnpm workspace` for monorepo variant? (Sprint 3)
