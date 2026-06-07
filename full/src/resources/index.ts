import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerResources(server: McpServer) {
  // Static resource example
  server.resource(
    "config",
    "mcp://full/config",
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ name: "full", version: "0.1.0" }, null, 2),
        },
      ],
    })
  );

  // Dynamic resource example (parameterized URI)
  server.resource(
    "item",
    new URL("mcp://full/items/{id}"),
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
