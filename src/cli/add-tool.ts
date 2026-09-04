/**
 * `create-mcp-server add tool <name>`
 *
 * Scaffolds a new typed tool file + test stub, then appends the import
 * and registration to src/tools/index.ts.
 */
import fs from "fs";
import path from "path";
import kleur from "kleur";

export async function addTool(toolName: string, cwd = process.cwd()) {

  // Validate we're inside a create-mcp-server project
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.error(kleur.red("\n  No package.json found. Run this inside a scaffolded project.\n"));
    process.exit(1);
  }

  const toolsDir = path.join(cwd, "src", "tools");
  const testsDir = path.join(toolsDir, "__tests__");
  const indexPath = path.join(toolsDir, "index.ts");

  if (!fs.existsSync(toolsDir)) {
    console.error(kleur.red("\n  src/tools/ not found. Is this a standard or full template project?\n"));
    process.exit(1);
  }

  const fileName = toKebab(toolName);
  const varName = toCamel(toolName) + "Tool";
  const toolFile = path.join(toolsDir, `${fileName}.ts`);
  const testFile = path.join(testsDir, `${fileName}.test.ts`);

  if (fs.existsSync(toolFile)) {
    console.error(kleur.red(`\n  Tool file already exists: src/tools/${fileName}.ts\n`));
    process.exit(1);
  }

  // Write tool file
  fs.writeFileSync(toolFile, toolTemplate(varName, fileName), "utf8");

  // Write test stub
  fs.mkdirSync(testsDir, { recursive: true });
  fs.writeFileSync(testFile, testTemplate(varName, fileName), "utf8");

  // Append import + registration to src/tools/index.ts
  if (fs.existsSync(indexPath)) {
    registerToolInIndex(indexPath, varName, fileName);
  }

  console.log();
  console.log(kleur.green(`  ✓ Created src/tools/${fileName}.ts`));
  console.log(kleur.green(`  ✓ Created src/tools/__tests__/${fileName}.test.ts`));
  if (fs.existsSync(indexPath)) {
    console.log(kleur.green(`  ✓ Registered in src/tools/index.ts`));
  }
  console.log();
  console.log(kleur.gray(`  Edit ${kleur.white(`src/tools/${fileName}.ts`)} to implement your tool.`));
  console.log();
}

/**
 * Inserts `import { varName } from "./fileName.js";` after the last existing
 * import line, and appends `varName` to the `export const tools = [...]`
 * array, in the given src/tools/index.ts. Shared by `add tool <name>` and
 * scaffold()'s addMemory starter-tool wiring so there's exactly one way
 * this file gets edited.
 */
export function registerToolInIndex(indexPath: string, varName: string, fileName: string) {
  let index = fs.readFileSync(indexPath, "utf8");
  // Add import after last existing import line
  const importLine = `import { ${varName} } from "./${fileName}.js";`;
  if (!index.includes(importLine)) {
    const lastImport = index.lastIndexOf("\nimport ");
    const insertAt = index.indexOf("\n", lastImport + 1);
    index = index.slice(0, insertAt) + "\n" + importLine + index.slice(insertAt);
  }
  // Add to tools array
  index = index.replace(
    /export const tools[^=]*=\s*\[([^\]]*)\]/s,
    (match, inner) => {
      const trimmed = inner.trimEnd();
      const sep = trimmed.endsWith(",") || trimmed.trim() === "" ? "\n  " : ",\n  ";
      return match.replace(inner, trimmed + sep + varName + ",\n");
    }
  );
  fs.writeFileSync(indexPath, index, "utf8");
}

function toolTemplate(varName: string, fileName: string): string {
  return `import { z } from "zod";
import { defineTool, text } from "../lib/tool-builder.js";

export const ${varName} = defineTool({
  name: "${fileName}",
  description: "TODO: describe what this tool does",
  input: z.object({
    // TODO: define your input schema
    param: z.string().describe("TODO: describe this parameter"),
  }),
  handler: async ({ param }) => {
    // TODO: implement your tool logic
    return text(\`Result: \${param}\`);
  },
});
`;
}

function testTemplate(varName: string, fileName: string): string {
  return `import { describe, it, expect } from "vitest";
import { ${varName} } from "../${fileName}.js";

describe("${fileName} tool", () => {
  it("returns a result", async () => {
    const result = await ${varName}.handler({ param: "test" });
    expect(result.content[0].type).toBe("text");
  });
});
`;
}

function toKebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toCamel(name: string): string {
  return toKebab(name)
    .split("-")
    .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join("");
}
