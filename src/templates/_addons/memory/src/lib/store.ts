import { FileBackend, MemoryStore } from "@workingmodel/agent-memory";

/**
 * Storage root for the `.memory/` directory the underlying MemoryStore reads
 * and writes. Defaults to this server's working directory (matching the
 * core library's own `FileBackend` default), overridable via
 * AGENT_MEMORY_ROOT so a single running server can be pointed at a specific
 * repo checkout regardless of where the process itself was launched from.
 */
export function getMemoryStore(): MemoryStore {
  const root = process.env.AGENT_MEMORY_ROOT ?? process.cwd();
  return new MemoryStore(new FileBackend(root));
}
