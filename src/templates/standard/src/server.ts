import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./lib/tool-builder.js";
import { tools } from "./tools/index.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "{{PROJECT_NAME}}",
    version: "{{VERSION}}",
  });

  registerTools(server, tools);

  return server;
}
