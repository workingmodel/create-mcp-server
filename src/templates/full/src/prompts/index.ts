import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "summarize",
    "Summarize a piece of text concisely",
    { text: z.string().describe("The text to summarize") },
    ({ text }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please summarize the following text in 2-3 sentences:\n\n${text}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "improve-writing",
    "Improve the clarity and style of a piece of writing",
    {
      text: z.string().describe("The text to improve"),
      tone: z.enum(["professional", "casual", "concise"]).default("professional"),
    },
    ({ text, tone }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Rewrite the following text with a ${tone} tone, improving clarity and style:\n\n${text}`,
          },
        },
      ],
    })
  );
}
