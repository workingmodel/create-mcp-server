import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ToolResult {
  content: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  >;
  isError?: boolean;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ToolDefinition<TInput extends z.ZodRawShape = any> {
  name: string;
  description: string;
  input: z.ZodObject<TInput>;
  handler: (input: z.infer<z.ZodObject<TInput>>) => Promise<ToolResult>;
}

export function defineTool<TInput extends z.ZodRawShape>(
  definition: ToolDefinition<TInput>
): ToolDefinition<TInput> {
  return definition;
}

export function registerTools(server: McpServer, tools: ToolDefinition[]) {
  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      tool.input.shape,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (input: any) => tool.handler(input)
    );
  }
}

export function text(content: string): ToolResult {
  return { content: [{ type: "text", text: content }] };
}

export function error(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
