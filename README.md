# create-mcp-server

> Scaffold a production-ready MCP server in seconds.

```bash
npx create-mcp-server my-server
```

The fastest way to start building with the [Model Context Protocol](https://modelcontextprotocol.io). Opinionated structure, typed tool definitions with full Zod inference, local inspector harness, and CI included out of the box.

---

## Quick start

```bash
npx create-mcp-server my-server
# → interactive wizard
# → installs dependencies
# → ready in < 60 seconds
```

```bash
cd my-server
npm run dev          # start server in watch mode
npm run inspector    # open MCP Inspector UI
npm run test         # run unit tests
```

---

## Templates

| Template | What's included |
|----------|----------------|
| `standard` (default) | Tool registry, typed `defineTool()`, tests, GitHub Actions CI, inspector harness |
| `minimal` | Single `index.ts`, one example tool — maximum flexibility |
| `full` | Everything in `standard` + MCP resources, prompts, auth stub, Docker |

---

## Typed tools

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

---

## Transport options

**stdio** (default) — for Claude Desktop, Cursor, Windsurf, and local clients

**SSE** — for remote HTTP clients (use the `full` template with Docker for this)

---

## Connecting to Claude Desktop

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

---

## CLI flags

```
npx create-mcp-server [project-name] [flags]

--yes, -y     Skip prompts, use defaults
--version, -v Print version
--help, -h    Show help
```

---

## Built by [Working Model](https://workingmodel.co)

MIT License
