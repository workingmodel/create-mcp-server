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
});
