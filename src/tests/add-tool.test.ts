import { describe, it, expect, afterEach } from "vitest";
import { scaffold } from "../cli/scaffold.js";
import { addTool } from "../cli/add-tool.js";
import fs from "fs";
import path from "path";
import os from "os";

function tmpProject(): string {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "cms-add-tool-"));
  const targetDir = path.join(base, "test-server");
  scaffold({
    projectName: "test-server",
    targetDir,
    template: "standard",
    transport: "stdio",
    includeResources: false,
    includePrompts: false,
  });
  return targetDir;
}

describe("add tool", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) fs.rmSync(path.dirname(d), { recursive: true, force: true });
    dirs.length = 0;
  });

  it("creates tool file with correct name", async () => {
    const dir = tmpProject(); dirs.push(dir);
    await addTool("send-email", dir);
    expect(fs.existsSync(path.join(dir, "src", "tools", "send-email.ts"))).toBe(true);
  });

  it("creates test stub", async () => {
    const dir = tmpProject(); dirs.push(dir);
    await addTool("send-email", dir);
    expect(fs.existsSync(path.join(dir, "src", "tools", "__tests__", "send-email.test.ts"))).toBe(true);
  });

  it("appends import to tools/index.ts", async () => {
    const dir = tmpProject(); dirs.push(dir);
    await addTool("send-email", dir);
    const index = fs.readFileSync(path.join(dir, "src", "tools", "index.ts"), "utf8");
    expect(index).toContain(`import { sendEmailTool } from "./send-email.js"`);
  });

  it("registers tool in the tools array", async () => {
    const dir = tmpProject(); dirs.push(dir);
    await addTool("send-email", dir);
    const index = fs.readFileSync(path.join(dir, "src", "tools", "index.ts"), "utf8");
    expect(index).toContain("sendEmailTool");
  });

  it("converts PascalCase input to kebab-case filename", async () => {
    const dir = tmpProject(); dirs.push(dir);
    await addTool("GetForecast", dir);
    expect(fs.existsSync(path.join(dir, "src", "tools", "get-forecast.ts"))).toBe(true);
  });

  it("tool file contains defineTool and correct variable name", async () => {
    const dir = tmpProject(); dirs.push(dir);
    await addTool("fetch-data", dir);
    const content = fs.readFileSync(path.join(dir, "src", "tools", "fetch-data.ts"), "utf8");
    expect(content).toContain("defineTool");
    expect(content).toContain("fetchDataTool");
  });
});
