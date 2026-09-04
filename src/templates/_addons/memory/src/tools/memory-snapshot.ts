import { z } from "zod";
import { defineTool, text } from "../lib/tool-builder.js";
import { getMemoryStore } from "../lib/store.js";

// The "wake-up payload" for an agent: renders all of its durable facts plus
// its most recent log entries as a single readable Markdown block, suitable
// for dropping straight into a fresh session's prompt so it can pick up
// where the last session left off. Wraps MemoryStore.snapshot + renderSnapshot
// from @workingmodel/agent-memory.
export const memorySnapshotTool = defineTool({
  name: "memory-snapshot",
  description:
    "The 'wake-up payload' for an agent: renders all of its durable facts plus its most recent log " +
    "entries as a single readable Markdown block, suitable for dropping straight into a fresh session's " +
    "prompt so it can pick up where the last session left off.",
  input: z.object({
    agentId: z.string().describe("Agent whose memory to snapshot, e.g. 'my-agent'"),
    recentLimit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max recent entries to include (defaults to 20)"),
  }),
  handler: async ({ agentId, recentLimit }) => {
    const store = getMemoryStore();
    const snapshot = await store.snapshot(agentId, recentLimit);
    return text(store.renderSnapshot(snapshot));
  },
});
