import { z } from "zod";
import { defineTool, text } from "../lib/tool-builder.js";

export const echoTool = defineTool({
  name: "echo",
  description: "Returns the input message unchanged. Useful for testing your server connection.",
  input: z.object({
    message: z.string().describe("The message to echo back"),
  }),
  handler: async ({ message }) => text(message),
});
