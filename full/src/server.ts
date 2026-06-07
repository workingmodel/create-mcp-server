import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./lib/tool-builder.js";
import { tools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "full",
    version: "0.1.0",
  });

  registerTools(server, tools);
  registerResources(server);
  registerPrompts(server);

  return server;
}
