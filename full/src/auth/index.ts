// Auth stub — wire this to your actual auth layer.
// Currently validates a static API key from the environment.
// Replace with OAuth2, JWT, or your preferred auth mechanism.

const VALID_API_KEY = process.env.API_KEY;

export interface AuthResult {
  ok: boolean;
  reason?: string;
}

export function validateApiKey(providedKey: string | undefined): AuthResult {
  if (!VALID_API_KEY) {
    // No key configured → auth disabled (open access)
    return { ok: true };
  }
  if (!providedKey) {
    return { ok: false, reason: "Missing API key" };
  }
  if (providedKey !== VALID_API_KEY) {
    return { ok: false, reason: "Invalid API key" };
  }
  return { ok: true };
}
