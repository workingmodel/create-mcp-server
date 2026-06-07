/**
 * Integration test: scaffold a standard project, build it, spawn the server
 * process, send an MCP initialize request over stdio, and assert a valid
 * JSON-RPC response. This catches transport/runtime failures that unit tests miss.
 */
import { describe, it, expect, afterAll } from "vitest";
import { scaffold } from "../cli/scaffold.js";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "cms-integration-"));
const targetDir = path.join(projectDir, "integration-server");

// Scaffold + build once for all tests in this file
function setupProject() {
  scaffold({
    projectName: "integration-server",
    targetDir,
    template: "standard",
    transport: "stdio",
    includeResources: false,
    includePrompts: false,
  });
  execSync("npm install --prefer-offline", { cwd: targetDir, stdio: "ignore" });
  execSync("npm run build", { cwd: targetDir, stdio: "ignore" });
}

afterAll(() => {
  fs.rmSync(projectDir, { recursive: true, force: true });
});

describe("integration: scaffolded server", () => {
  it("builds without errors", () => {
    setupProject();
    expect(fs.existsSync(path.join(targetDir, "dist", "index.js"))).toBe(true);
  });

  it("responds to MCP initialize over stdio", async () => {
    const serverEntry = path.join(targetDir, "dist", "index.js");
    expect(fs.existsSync(serverEntry)).toBe(true);

    const initRequest = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    }) + "\n";

    const response = await new Promise<string>((resolve, reject) => {
      const proc = spawn("node", [serverEntry], {
        cwd: targetDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let output = "";
      const timeout = setTimeout(() => {
        proc.kill();
        reject(new Error("Server did not respond within 5 seconds"));
      }, 5000);

      proc.stdout.on("data", (chunk: Buffer) => {
        output += chunk.toString();
        // MCP responses are newline-delimited JSON
        if (output.includes("\n")) {
          clearTimeout(timeout);
          proc.kill();
          resolve(output.trim());
        }
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        // Ignore stderr — servers may log startup info there
      });

      proc.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      proc.stdin.write(initRequest);
    });

    const parsed = JSON.parse(response);
    expect(parsed.jsonrpc).toBe("2.0");
    expect(parsed.id).toBe(1);
    expect(parsed.result).toBeDefined();
    expect(parsed.result.serverInfo).toBeDefined();
    expect(parsed.result.serverInfo.name).toBe("integration-server");
  });

  it("lists tools including echo", async () => {
    const serverEntry = path.join(targetDir, "dist", "index.js");

    // Send initialize then tools/list
    const messages = [
      JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "initialize",
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } },
      }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    ].join("\n") + "\n";

    const responses = await new Promise<string[]>((resolve, reject) => {
      const proc = spawn("node", [serverEntry], { cwd: targetDir, stdio: ["pipe", "pipe", "pipe"] });
      let buf = "";
      const collected: string[] = [];

      const timeout = setTimeout(() => { proc.kill(); reject(new Error("Timeout")); }, 5000);

      proc.stdout.on("data", (chunk: Buffer) => {
        buf += chunk.toString();
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) collected.push(line.trim());
        }
        // Expect 2 responses: initialize + tools/list
        if (collected.length >= 2) {
          clearTimeout(timeout);
          proc.kill();
          resolve(collected);
        }
      });

      proc.on("error", reject);
      proc.stdin.write(messages);
    });

    const toolsResponse = JSON.parse(responses[1]);
    expect(toolsResponse.result).toBeDefined();
    const toolNames = toolsResponse.result.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("echo");
    expect(toolNames).toContain("get-weather");
  });
});
