/**
 * SSE transport entry point — for remote HTTP clients (Cursor, Windsurf, web apps).
 *
 * Usage:
 *   npm run dev:sse      # dev mode
 *   npm run start:sse    # production
 *
 * Connect your MCP client to: http://localhost:PORT/sse
 */
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3000);

const mcpServer = createServer();

// Map sessionId → transport so POST /messages can route to the right connection
const transports = new Map<string, SSEServerTransport>();

const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Client opens SSE stream
  if (req.method === "GET" && url.pathname === "/sse") {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);

    res.on("close", () => {
      transports.delete(transport.sessionId);
    });

    await mcpServer.connect(transport);
    return;
  }

  // Client posts a message to an established session
  if (req.method === "POST" && url.pathname === "/messages") {
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const transport = transports.get(sessionId);

    if (!transport) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Session not found");
      return;
    }

    await transport.handlePostMessage(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

httpServer.listen(PORT, () => {
  console.log(`{{PROJECT_NAME}} MCP server (SSE) listening on http://localhost:${PORT}/sse`);
});
