import type { ToolDefinition } from "../lib/tool-builder.js";
import { echoTool } from "./echo.js";
import { getWeatherTool } from "./get-weather.js";

// Register all tools here. Import and add to this array.
export const tools: ToolDefinition[] = [
  echoTool,
  getWeatherTool,
];
