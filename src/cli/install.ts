import { execSync } from "child_process";

export async function install(cwd: string, pm: "npm" | "pnpm" | "bun") {
  const cmd = pm === "bun" ? "bun install" : `${pm} install`;
  try {
    execSync(cmd, { cwd, stdio: "ignore" });
  } catch {
    // non-fatal — user can install manually
    console.warn(`  Warning: auto-install failed. Run \`${cmd}\` in the project directory.`);
  }
}
