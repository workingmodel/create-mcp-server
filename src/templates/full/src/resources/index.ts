import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerResources(server: McpServer) {
  // Static resource example
  server.resource(
    "config",
    "mcp://{{PROJECT_NAME}}/config",
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ name: "{{PROJECT_NAME}}", version: "{{VERSION}}" }, null, 2),
        },
      ],
    })
  );

  // Dynamic resource example (parameterized URI template)
  server.resource(
    "item",
    new ResourceTemplate("mcp://{{PROJECT_NAME}}/items/{id}", { list: undefined }),
    async (uri) => {
      const id = uri.pathname.split("/").pop();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/plain",
            text: `Item ${id} content here. Replace with real data lookup.`,
          },
        ],
      };
    }
  );
}
