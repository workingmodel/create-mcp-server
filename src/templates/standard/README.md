# {{PROJECT_NAME}}

An MCP server built with [create-mcp-server](https://github.com/workingmodel/create-mcp-server).

## Commands

```bash
npm run dev          # start server in watch mode
npm run inspector    # open MCP Inspector UI to test tools interactively
npm run test         # run unit tests
npm run validate     # typecheck + tests
npm run build        # compile to dist/
```

## Project structure

```
src/
  tools/
    index.ts         ← register all tools here
    echo.ts          ← example: echo tool
    get-weather.ts   ← example: weather tool (stub — wire to a real API)
    __tests__/       ← vitest unit tests per tool
  lib/
    tool-builder.ts  ← defineTool() helper + registerTools()
  server.ts          ← MCP server setup
  index.ts           ← transport entry point
```

## Adding a tool

1. Create `src/tools/my-tool.ts`:

```ts
import { z } from "zod";
import { defineTool, text } from "../lib/tool-builder.js";

export const myTool = defineTool({
  name: "my-tool",
  description: "What this tool does",
  input: z.object({
    param: z.string().describe("Description of param"),
  }),
  handler: async ({ param }) => text(`Result: ${param}`),
});
```

2. Add to `src/tools/index.ts`:

```ts
import { myTool } from "./my-tool.js";
export const tools = [...existingTools, myTool];
```

3. Write a test in `src/tools/__tests__/my-tool.test.ts`.

## Connecting to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "{{PROJECT_NAME}}": {
      "command": "node",
      "args": ["/absolute/path/to/{{PROJECT_NAME}}/dist/index.js"]
    }
  }
}
```

## Connecting to Cursor / Windsurf

In your editor's MCP config:

```json
{
  "{{PROJECT_NAME}}": {
    "command": "node",
    "args": ["/absolute/path/to/{{PROJECT_NAME}}/dist/index.js"]
  }
}
```
