import kleur from "kleur";
import prompts from "prompts";
import path from "path";
import fs from "fs";
import { scaffold } from "./scaffold.js";
import { install } from "./install.js";
import { addTool } from "./add-tool.js";

function readVersion(): string {
  const candidates = [
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../package.json"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../package.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return JSON.parse(fs.readFileSync(c, "utf8")).version as string;
  }
  return "0.0.0";
}
const VERSION = readVersion();

const args = process.argv.slice(2);

// Subcommand: create-mcp-server add tool <name>
if (args[0] === "add" && args[1] === "tool") {
  const toolName = args[2];
  if (!toolName) {
    console.error(kleur.red("\n  Usage: create-mcp-server add tool <tool-name>\n"));
    process.exit(1);
  }
  addTool(toolName).catch((err) => {
    console.error(kleur.red("\n  Error: " + err.message));
    process.exit(1);
  });
  // Exit early — don't run the scaffold wizard
} else {

if (args.includes("--version") || args.includes("-v")) {
  console.log(VERSION);
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const nonFlagArgs = args.filter((a, i) => {
  if (a.startsWith("-")) return false;
  const prev = args[i - 1];
  if (prev === "--template" || prev === "-t") return false;
  return true;
});
const projectNameArg = nonFlagArgs[0];
const yesFlag = args.includes("--yes") || args.includes("-y");
const templateFlag = (() => {
  const idx = args.findIndex((a) => a === "--template" || a === "-t");
  return idx !== -1 ? args[idx + 1] : undefined;
})();
const VALID_TEMPLATES = ["minimal", "standard", "full"] as const;
type Template = typeof VALID_TEMPLATES[number];
if (templateFlag && !VALID_TEMPLATES.includes(templateFlag as Template)) {
  console.error(kleur.red(`\n  Invalid template "${templateFlag}". Choose: minimal, standard, full.\n`));
  process.exit(1);
}

async function main() {
  console.log();
  console.log(kleur.bold().cyan("  create-mcp-server") + kleur.gray(` v${VERSION}`));
  console.log(kleur.gray("  Scaffold a production-ready MCP server\n"));

  let projectName = projectNameArg;

  if (!projectName) {
    const res = await prompts({
      type: "text",
      name: "projectName",
      message: "Project name",
      initial: "my-mcp-server",
      validate: (v) => /^[a-z0-9-]+$/.test(v) || "Use lowercase letters, numbers, and hyphens only",
    });
    if (!res.projectName) process.exit(0);
    projectName = res.projectName;
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(kleur.red(`\n  Directory "${projectName}" already exists.\n`));
    process.exit(1);
  }

  let answers = {
    template: (templateFlag ?? "standard") as Template,
    transport: "stdio" as "stdio" | "sse",
    includeResources: false,
    includePrompts: false,
    packageManager: "npm" as "npm" | "pnpm" | "bun",
  };

  if (!yesFlag) {
    const res = await prompts(
      [
        {
          type: "select",
          name: "template",
          message: "Template",
          choices: [
            { title: "standard  — tool registry, tests, CI", value: "standard" },
            { title: "minimal   — single file, one example tool", value: "minimal" },
            { title: "full      — resources, prompts, auth stub, Docker", value: "full" },
          ],
          initial: 0,
        },
        {
          type: "select",
          name: "transport",
          message: "Transport",
          choices: [
            { title: "stdio  — for Claude Desktop / local clients (recommended)", value: "stdio" },
            { title: "SSE    — for remote HTTP clients (Cursor, web apps)", value: "sse" },
          ],
          initial: 0,
        },
        {
          type: (prev: string, values: Record<string, unknown>) =>
            values.template === "standard" ? "toggle" : null,
          name: "includeResources",
          message: "Include MCP resources?",
          initial: false,
          active: "yes",
          inactive: "no",
        },
        {
          type: (prev: string, values: Record<string, unknown>) =>
            values.template === "standard" ? "toggle" : null,
          name: "includePrompts",
          message: "Include MCP prompts?",
          initial: false,
          active: "yes",
          inactive: "no",
        },
        {
          type: "select",
          name: "packageManager",
          message: "Package manager",
          choices: [
            { title: "npm", value: "npm" },
            { title: "pnpm", value: "pnpm" },
            { title: "bun", value: "bun" },
          ],
          initial: 0,
        },
      ],
      { onCancel: () => process.exit(0) }
    );

    answers = { ...answers, ...res };
  }

  console.log();
  console.log(kleur.gray(`  Scaffolding ${kleur.white(projectName)}...`));

  scaffold({
    projectName,
    targetDir,
    template: answers.template,
    transport: answers.transport,
    includeResources: answers.includeResources || answers.template === "full",
    includePrompts: answers.includePrompts || answers.template === "full",
  });

  console.log(kleur.green("  ✓ Files created"));
  console.log(kleur.gray(`  Installing dependencies with ${answers.packageManager}...`));

  await install(targetDir, answers.packageManager);

  console.log(kleur.green("  ✓ Dependencies installed\n"));
  console.log(kleur.bold("  Next steps:\n"));
  console.log(kleur.cyan(`    cd ${projectName}`));
  const devCmd = answers.transport === "sse" ? "npm run dev:sse" : "npm run dev     ";
  const devNote = answers.transport === "sse" ? "# start SSE server (http://localhost:3000/sse)" : "# start server in watch mode";
  console.log(kleur.cyan(`    ${devCmd}       `) + kleur.gray(devNote));
  console.log(kleur.cyan(`    npm run inspector    `) + kleur.gray("# open MCP inspector UI"));
  console.log(kleur.cyan(`    npm run test         `) + kleur.gray("# run tool unit tests\n"));
  console.log(
    kleur.gray("  Docs: https://github.com/workingmodel/create-mcp-server\n")
  );
}

function printHelp() {
  console.log(`
  ${kleur.bold().cyan("create-mcp-server")} v${VERSION}

  ${kleur.bold("Usage:")}
    npx create-mcp-server [project-name] [flags]

  ${kleur.bold("Flags:")}
    --template, -t  Template to use: minimal, standard (default), full
    --yes, -y       Skip prompts, use defaults
    --version, -v   Print version
    --help, -h      Show this help

  ${kleur.bold("Subcommands:")}
    add tool <name>   Scaffold a new tool file + test in an existing project

  ${kleur.bold("Examples:")}
    npx create-mcp-server my-server
    npx create-mcp-server my-server --yes
    npx create-mcp-server my-server --template full
    npx create-mcp-server add tool get-weather
  `);
}

main().catch((err) => {
  console.error(kleur.red("\n  Error: " + err.message));
  process.exit(1);
});

} // end else (not a subcommand)
