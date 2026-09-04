import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerToolInIndex } from "./add-tool.js";

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
  addMemory?: boolean;
}

const AGENT_MEMORY_VERSION = "^0.1.0";

export function scaffold(options: ScaffoldOptions) {
  const { projectName, targetDir, template, transport, includeResources, includePrompts, addMemory = false } = options;

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
      // src/index.sse.ts no longer exists post-rename — the dev:sse/start:sse
      // scripts and the "build" entry that referenced it are now dangling.
      removeSseScripts(targetDir);
    }
  } else {
    // Remove the SSE entry — user chose stdio
    const sseEntry = path.join(targetDir, "src", "index.sse.ts");
    if (fs.existsSync(sseEntry)) {
      fs.unlinkSync(sseEntry);
      // Same problem in the other direction: dev:sse/start:sse and the
      // build script's second entry now point at a file that doesn't exist.
      removeSseScripts(targetDir);
    }
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

  // opt-in: wire @workingmodel/agent-memory in as a dependency + starter tool
  if (addMemory) {
    applyMemoryAddon(targetDir, templatesRoot, template, vars);
  }
}

// Adds the @workingmodel/agent-memory dependency, a .gitignore line for its
// .memory/ storage dir, and (for templates with a src/tools/ registry) a
// starter `memory-snapshot` tool copied from the addon template source —
// same copy + registerToolInIndex mechanism `add tool <name>` already uses,
// so there's one way generated projects get a new tool wired in.
function applyMemoryAddon(
  targetDir: string,
  templatesRoot: string,
  template: "minimal" | "standard" | "full",
  vars: Record<string, string>
) {
  addPackageDependency(targetDir, "@workingmodel/agent-memory", AGENT_MEMORY_VERSION);
  addGitignoreLine(targetDir, ".memory/");

  // minimal has no src/tools/ registry or src/lib/ dir to hook into — the
  // dependency + gitignore line still land, but there's nowhere to install
  // the starter tool without inventing structure minimal deliberately lacks.
  if (template === "minimal") return;

  const addonRoot = path.join(templatesRoot, "_addons", "memory", "src");
  const libDest = path.join(targetDir, "src", "lib");
  const toolsDest = path.join(targetDir, "src", "tools");

  copyFile(path.join(addonRoot, "lib", "store.ts"), path.join(libDest, "store.ts"), vars);
  copyFile(path.join(addonRoot, "tools", "memory-snapshot.ts"), path.join(toolsDest, "memory-snapshot.ts"), vars);

  const indexPath = path.join(toolsDest, "index.ts");
  if (fs.existsSync(indexPath)) {
    registerToolInIndex(indexPath, "memorySnapshotTool", "memory-snapshot");
  }
}

function addPackageDependency(targetDir: string, name: string, version: string) {
  const pkgPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.dependencies = { ...pkg.dependencies, [name]: version };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function addGitignoreLine(targetDir: string, line: string) {
  const gitignorePath = path.join(targetDir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return;

  const content = fs.readFileSync(gitignorePath, "utf8");
  if (content.split("\n").some((l) => l.trim() === line)) return;

  const withTrailingNewline = content.endsWith("\n") ? content : content + "\n";
  fs.writeFileSync(gitignorePath, withTrailingNewline + line + "\n", "utf8");
}

// Drops the dev:sse/start:sse scripts and trims the now-single-entry-point
// "build" script's src/index.sse.ts argument from the generated package.json.
// Called any time src/index.sse.ts no longer exists post-scaffold — for
// stdio it was deleted outright, for SSE it was renamed to src/index.ts.
function removeSseScripts(targetDir: string) {
  const pkgPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (pkg.scripts) {
    delete pkg.scripts["dev:sse"];
    delete pkg.scripts["start:sse"];
    if (typeof pkg.scripts.build === "string") {
      pkg.scripts.build = pkg.scripts.build.replace(/\s+src\/index\.sse\.ts/, "");
    }
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
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

function copyFile(src: string, dest: string, vars: Record<string, string>) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const content = applyVars(fs.readFileSync(src, "utf8"), vars);
  fs.writeFileSync(dest, content, "utf8");
}

function applyVars(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

