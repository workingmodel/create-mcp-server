import { z } from "zod";
import { defineTool, text, error } from "../lib/tool-builder.js";

// Example tool showing a realistic pattern: validated input, error handling, typed output.
// Replace with your own logic or delete this file.
export const getWeatherTool = defineTool({
  name: "get-weather",
  description: "Get the current weather for a city. Returns temperature and conditions.",
  input: z.object({
    location: z.string().describe("City name, e.g. 'New York' or 'London, UK'"),
    units: z
      .enum(["celsius", "fahrenheit"])
      .default("celsius")
      .describe("Temperature unit"),
  }),
  handler: async ({ location, units }) => {
    // TODO: Replace with a real weather API call
    // e.g. const data = await fetch(`https://api.openweathermap.org/...`)

    // Stub response for demonstration
    const temp = units === "celsius" ? "22°C" : "72°F";
    return text(`Weather in ${location}: ${temp}, partly cloudy.`);
  },
});
