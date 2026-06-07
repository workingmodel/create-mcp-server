# {{PROJECT_NAME}}

An MCP server built with [create-mcp-server](https://github.com/workingmodel/wm-create-mcp-server).

## Commands

```bash
npm run dev          # start server in watch mode
npm run inspector    # build + open MCP Inspector UI
npm run test         # run unit tests
npm run validate     # typecheck + tests
npm run build        # compile to dist/
npm run docker:build # build Docker image
npm run docker:run   # start via docker compose
```

## Project structure

```
src/
  tools/
    index.ts         ← register all tools here
    echo.ts          ← example: echo tool
    get-weather.ts   ← example: weather tool (stub)
    __tests__/       ← vitest unit tests per tool
  resources/
    index.ts         ← MCP resource definitions
  prompts/
    index.ts         ← MCP prompt templates
  auth/
    index.ts         ← API key auth stub
  lib/
    tool-builder.ts  ← defineTool() + registerTools()
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
