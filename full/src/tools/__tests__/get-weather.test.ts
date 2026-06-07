import { describe, it, expect } from "vitest";
import { getWeatherTool } from "../get-weather.js";

describe("get-weather tool", () => {
  it("returns weather for a location in celsius", async () => {
    const result = await getWeatherTool.handler({ location: "London", units: "celsius" });
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as { type: "text"; text: string }).text).toContain("London");
    expect((result.content[0] as { type: "text"; text: string }).text).toContain("°C");
  });

  it("returns weather in fahrenheit", async () => {
    const result = await getWeatherTool.handler({ location: "New York", units: "fahrenheit" });
    expect((result.content[0] as { type: "text"; text: string }).text).toContain("°F");
  });
});
