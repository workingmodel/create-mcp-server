import kleur from "kleur";
import prompts from "prompts";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { scaffold } from "./scaffold.js";
import { install } from "./install.js";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json") as { version: string };

const args = process.argv.slice(2);

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
})() as "minimal" | "standard" | "full" | undefined;

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
    template: (templateFlag ?? "standard") as "minimal" | "standard" | "full",
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
    transport: "stdio",
    includeResources: answers.includeResources || answers.template === "full",
    includePrompts: answers.includePrompts || answers.template === "full",
  });

  console.log(kleur.green("  ✓ Files created"));
  console.log(kleur.gray(`  Installing dependencies with ${answers.packageManager}...`));

  await install(targetDir, answers.packageManager);

  console.log(kleur.green("  ✓ Dependencies installed\n"));
  console.log(kleur.bold("  Next steps:\n"));
  console.log(kleur.cyan(`    cd ${projectName}`));
  console.log(kleur.cyan(`    npm run dev          `) + kleur.gray("# start server in watch mode"));
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

  ${kleur.bold("Examples:")}
    npx create-mcp-server my-server
    npx create-mcp-server my-server --yes
    npx create-mcp-server my-server --template full
  `);
}

main().catch((err) => {
  console.error(kleur.red("\n  Error: " + err.message));
  process.exit(1);
});
