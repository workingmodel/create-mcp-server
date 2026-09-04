import { describe, it, expect, afterEach } from "vitest";
import { scaffold } from "../cli/scaffold.js";
import fs from "fs";
import path from "path";
import os from "os";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cms-test-"));
}

const base_opts = { transport: "stdio" as const, includeResources: false, includePrompts: false };

describe("scaffold()", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    dirs.length = 0;
  });

  it("creates minimal template", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "minimal", ...base_opts });
    expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "src", "index.ts"))).toBe(true);
  });

  it("creates standard template with tool files", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "standard", ...base_opts });
    expect(fs.existsSync(path.join(targetDir, "src", "tools", "index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "src", "lib", "tool-builder.ts"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "src", "server.ts"))).toBe(true);
  });

  it("substitutes project name in package.json", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "cool-server");
    scaffold({ projectName: "cool-server", targetDir, template: "minimal", ...base_opts });
    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
    expect(pkg.name).toBe("cool-server");
  });

  it("renames _dot_ files to dotfiles", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "minimal", ...base_opts });
    expect(fs.existsSync(path.join(targetDir, ".gitignore"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "_dot_gitignore"))).toBe(false);
  });

  it("creates full template with resources and prompts", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "full", transport: "stdio", includeResources: true, includePrompts: true });
    expect(fs.existsSync(path.join(targetDir, "src", "resources", "index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "src", "prompts", "index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "Dockerfile"))).toBe(true);
  });

  it("SSE transport swaps index.ts with SSE entry point", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "standard", transport: "sse", includeResources: false, includePrompts: false });
    const content = fs.readFileSync(path.join(targetDir, "src", "index.ts"), "utf8");
    expect(content).toContain("SSEServerTransport");
    expect(fs.existsSync(path.join(targetDir, "src", "index.sse.ts"))).toBe(false);
  });

  it("stdio transport removes SSE entry point", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "standard", ...base_opts });
    const content = fs.readFileSync(path.join(targetDir, "src", "index.ts"), "utf8");
    expect(content).toContain("StdioServerTransport");
    expect(fs.existsSync(path.join(targetDir, "src", "index.sse.ts"))).toBe(false);
  });

  it("stdio transport strips dangling dev:sse/start:sse scripts and the sse build entry", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "standard", ...base_opts });
    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
    expect(pkg.scripts["dev:sse"]).toBeUndefined();
    expect(pkg.scripts["start:sse"]).toBeUndefined();
    expect(pkg.scripts.build).not.toContain("index.sse.ts");
    expect(pkg.scripts.build).toContain("src/index.ts");
    // no script in the generated package.json should reference the deleted file
    for (const script of Object.values(pkg.scripts) as string[]) {
      expect(script).not.toContain("index.sse.ts");
    }
  });

  it("SSE transport strips dangling dev:sse/start:sse scripts and the stale build entry", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "standard", transport: "sse", includeResources: false, includePrompts: false });
    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
    expect(pkg.scripts["dev:sse"]).toBeUndefined();
    expect(pkg.scripts["start:sse"]).toBeUndefined();
    expect(pkg.scripts.build).not.toContain("index.sse.ts");
    expect(pkg.scripts.build).toContain("src/index.ts");
    for (const script of Object.values(pkg.scripts) as string[]) {
      expect(script).not.toContain("index.sse.ts");
    }
  });
});

describe("scaffold() addMemory", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    dirs.length = 0;
  });

  it("wires @workingmodel/agent-memory in for standard when addMemory is true", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "standard", ...base_opts, addMemory: true });

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
    expect(pkg.dependencies["@workingmodel/agent-memory"]).toBeDefined();

    const gitignore = fs.readFileSync(path.join(targetDir, ".gitignore"), "utf8");
    expect(gitignore.split("\n")).toContain(".memory/");

    const toolPath = path.join(targetDir, "src", "tools", "memory-snapshot.ts");
    expect(fs.existsSync(toolPath)).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "src", "lib", "store.ts"))).toBe(true);

    const index = fs.readFileSync(path.join(targetDir, "src", "tools", "index.ts"), "utf8");
    expect(index).toContain('import { memorySnapshotTool } from "./memory-snapshot.js";');
    expect(index).toContain("memorySnapshotTool");
  });

  it("wires @workingmodel/agent-memory in for full when addMemory is true", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "full", ...base_opts, addMemory: true });

    expect(fs.existsSync(path.join(targetDir, "src", "tools", "memory-snapshot.ts"))).toBe(true);
    const index = fs.readFileSync(path.join(targetDir, "src", "tools", "index.ts"), "utf8");
    expect(index).toContain("memorySnapshotTool");
  });

  it("adds the dependency and gitignore line for minimal, but skips the starter tool (no tools registry to hook into)", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "minimal", ...base_opts, addMemory: true });

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
    expect(pkg.dependencies["@workingmodel/agent-memory"]).toBeDefined();
    const gitignore = fs.readFileSync(path.join(targetDir, ".gitignore"), "utf8");
    expect(gitignore.split("\n")).toContain(".memory/");
    expect(fs.existsSync(path.join(targetDir, "src", "tools"))).toBe(false);
  });

  it("does nothing memory-related when addMemory is false or omitted", () => {
    const base = tmpDir(); dirs.push(base);
    const targetDir = path.join(base, "my-server");
    scaffold({ projectName: "my-server", targetDir, template: "standard", ...base_opts });

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
    expect(pkg.dependencies["@workingmodel/agent-memory"]).toBeUndefined();

    const gitignore = fs.readFileSync(path.join(targetDir, ".gitignore"), "utf8");
    expect(gitignore).not.toContain(".memory/");

    expect(fs.existsSync(path.join(targetDir, "src", "tools", "memory-snapshot.ts"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "src", "lib", "store.ts"))).toBe(false);

    const index = fs.readFileSync(path.join(targetDir, "src", "tools", "index.ts"), "utf8");
    expect(index).not.toContain("memorySnapshotTool");
  });
});
