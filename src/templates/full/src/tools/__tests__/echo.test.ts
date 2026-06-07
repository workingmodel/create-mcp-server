import { describe, it, expect } from "vitest";
import { echoTool } from "../echo.js";

describe("echo tool", () => {
  it("returns the input message", async () => {
    const result = await echoTool.handler({ message: "hello world" });
    expect(result.content[0]).toEqual({ type: "text", text: "hello world" });
  });

  it("handles empty string", async () => {
    const result = await echoTool.handler({ message: "" });
    expect(result.content[0]).toEqual({ type: "text", text: "" });
  });
});
