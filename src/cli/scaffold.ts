import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function readCliVersion(): string {
  const candidates = [
    path.resolve(__dirname, "../package.json"),   // dist/index.js
    path.resolve(__dirname, "../../package.json"), // src/cli/scaffold.ts
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return JSON.parse(fs.readFileSync(c, "utf8")).version as string;
  }
  return "0.0.0";
}
const CLI_VERSION = readCliVersion();

export interface ScaffoldOptions {
  projectName: string;
  targetDir: string;
  template: "minimal" | "standard" | "full";
  transport: "stdio" | "sse";
  includeResources: boolean;
  includePrompts: boolean;
}

export function scaffold(options: ScaffoldOptions) {
  const { projectName, targetDir, template, transport, includeResources, includePrompts } = options;

  const vars: Record<string, string> = {
    PROJECT_NAME: projectName,
    VERSION: CLI_VERSION,
  };

  // templates live next to src/ in the package; when running from dist, go up two levels
  const templatesRoot = findTemplatesRoot();
  const templateDir = path.join(templatesRoot, template);

  fs.mkdirSync(targetDir, { recursive: true });

  copyDir(templateDir, targetDir, vars);

  // SSE transport: swap index.ts with the SSE entry point, remove the stdio one
  if (transport === "sse" && template !== "minimal") {
    const sseEntry = path.join(targetDir, "src", "index.sse.ts");
    const stdioEntry = path.join(targetDir, "src", "index.ts");
    if (fs.existsSync(sseEntry)) {
      fs.renameSync(sseEntry, stdioEntry);
    }
  } else {
    // Remove the SSE entry — user chose stdio
    const sseEntry = path.join(targetDir, "src", "index.sse.ts");
    if (fs.existsSync(sseEntry)) fs.unlinkSync(sseEntry);
  }

  // optionally layer in resources / prompts from the full template
  if (template === "standard") {
    if (includeResources) {
      const resourcesSrc = path.join(templatesRoot, "full", "src", "resources");
      copyDir(resourcesSrc, path.join(targetDir, "src", "resources"), vars);
    }
    if (includePrompts) {
      const promptsSrc = path.join(templatesRoot, "full", "src", "prompts");
      copyDir(promptsSrc, path.join(targetDir, "src", "prompts"), vars);
    }
  }
}

function findTemplatesRoot(): string {
  const candidates = [
    // tsx from source: src/cli/ → ../templates
    path.resolve(__dirname, "../templates"),
    // built: dist/ → ../src/templates (tsup flattens to dist/index.js)
    path.resolve(__dirname, "../src/templates"),
    // built with subdir: dist/cli/ → ../../src/templates
    path.resolve(__dirname, "../../src/templates"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Cannot locate templates directory");
}

function copyDir(src: string, dest: string, vars: Record<string, string>) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    // _gitignore → .gitignore (npm strips dotfiles from published packages)
    const destName = entry.name.startsWith("_dot_") ? "." + entry.name.slice(5) : entry.name;
    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, vars);
    } else {
      let content = fs.readFileSync(srcPath, "utf8");
      content = applyVars(content, vars);
      fs.writeFileSync(destPath, content, "utf8");
    }
  }
}

function applyVars(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

