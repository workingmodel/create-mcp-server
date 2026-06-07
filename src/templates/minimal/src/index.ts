import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "{{PROJECT_NAME}}",
  version: "{{VERSION}}",
});

// Example tool — replace or extend this
server.tool(
  "echo",
  "Returns the input message unchanged",
  { message: z.string().describe("The message to echo back") },
  async ({ message }) => ({
    content: [{ type: "text", text: message }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
