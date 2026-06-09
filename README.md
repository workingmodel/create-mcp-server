# @workingmodel/create-mcp-server

Stop wiring up MCP boilerplate by hand. Scaffold a production-ready MCP server with typed tools, local inspector, and CI in under 60 seconds. Developed by [Working Model](https://workingmodel.co).

[![npm version](https://img.shields.io/npm/v/@workingmodel/create-mcp-server)](https://www.npmjs.com/package/@workingmodel/create-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@workingmodel/create-mcp-server)](https://www.npmjs.com/package/@workingmodel/create-mcp-server)
[![license](https://img.shields.io/npm/l/@workingmodel/create-mcp-server)](LICENSE)

---

## Install

```bash
npx @workingmodel/create-mcp-server my-server
```

---

## Usage

```bash
npx @workingmodel/create-mcp-server my-server
# → interactive wizard
# → installs dependencies
# → ready in < 60 seconds
```

```bash
cd my-server
npm run dev          # start server in watch mode
npm run inspector    # build + open MCP Inspector UI
npm run test         # run unit tests
npm run validate     # typecheck + tests
```

### Templates

| Template | What's included |
|----------|----------------|
| `standard` (default) | Tool registry, typed `defineTool()`, tests, inspector harness, SSE entry point |
| `minimal` | Single `index.ts`, one example tool — maximum flexibility |
| `full` | Everything in `standard` + MCP resources, prompts, auth stub, Docker |

### Typed tools

The `defineTool()` helper converts your Zod schema into MCP-compatible JSON Schema automatically, with full TypeScript inference in the handler:

```ts
import { z } from "zod";
import { defineTool, text } from "./lib/tool-builder.js";

export const getWeatherTool = defineTool({
  name: "get-weather",
  description: "Get current weather for a location",
  input: z.object({
    location: z.string().describe("City name"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
  }),
  handler: async ({ location, units }) => {
    // location: string, units: "celsius" | "fahrenheit" — fully typed
    return text(`Weather in ${location}: 22${units === "celsius" ? "°C" : "°F"}`);
  },
});
```

Register it by adding to `src/tools/index.ts`:

```ts
import { getWeatherTool } from "./get-weather.js";
export const tools = [echoTool, getWeatherTool];
```

Or use the built-in generator — from inside your project:

```bash
npx create-mcp-server add tool get-weather
# → creates src/tools/get-weather.ts (typed, with handler stub)
# → creates src/tools/__tests__/get-weather.test.ts
# → auto-registers in src/tools/index.ts
```

### Transport options

**stdio** (default) — for Claude Desktop, Cursor, Windsurf, and local clients

**SSE** — for remote HTTP clients. Select SSE in the wizard and your project gets a `node:http` server with session routing at `GET /sse` + `POST /messages`:

```bash
npm run dev:sse     # start SSE server on http://localhost:3000/sse
npm run start:sse   # production
```

### Connecting to Claude Desktop

After running `npm run build`, add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/my-server/dist/index.js"]
    }
  }
}
```

### CLI reference

```
npx @workingmodel/create-mcp-server [project-name] [flags]
npx @workingmodel/create-mcp-server add tool <tool-name>

Flags:
  --template, -t  Template to use: minimal, standard (default), full
  --yes, -y       Skip prompts, use defaults
  --version, -v   Print version
  --help, -h      Show help

Examples:
  npx @workingmodel/create-mcp-server my-server
  npx @workingmodel/create-mcp-server my-server --yes
  npx @workingmodel/create-mcp-server my-server --template full
  npx @workingmodel/create-mcp-server add tool send-email
```

---

## Why This Exists

Every MCP server starts the same way: copy someone's example repo, rename a few things, wire up transport, figure out why types aren't inferring, add tests later (or not). This scaffolds the boring part correctly so you can start on the part that actually matters — the tools. Opinionated enough to save you an hour, minimal enough to stay out of your way.

---

## More tools →

More tools from Working Model → [workingmodel.co](https://workingmodel.co)
