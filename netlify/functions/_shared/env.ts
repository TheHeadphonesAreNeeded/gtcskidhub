// Centralised, validated access to environment variables. Throwing here
// (instead of deep inside a handler) surfaces misconfiguration clearly.

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export function siteUrl(): string {
  // Netlify injects URL / DEPLOY_PRIME_URL automatically; SITE_URL wins
  // if the operator set it explicitly.
  return (
    optionalEnv("SITE_URL") ||
    optionalEnv("DEPLOY_PRIME_URL") ||
    optionalEnv("URL") ||
    "http://localhost:8888"
  ).replace(/\/$/, "");
}

export function ownerDiscordIds(): string[] {
  return optionalEnv("OWNER_DISCORD_IDS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
