# {{PROJECT_NAME}}

An MCP server built with [create-mcp-server](https://github.com/workingmodel/create-mcp-server).

## Getting started

```bash
npm run dev        # start server in watch mode (stdio transport)
npm run build      # compile to dist/
npm run start      # run compiled server
```

## Adding tools

Edit `src/index.ts` and add a new `server.tool()` call:

```ts
server.tool(
  "my-tool",
  "What this tool does",
  { param: z.string() },
  async ({ param }) => ({
    content: [{ type: "text", text: `Result: ${param}` }],
  })
);
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
