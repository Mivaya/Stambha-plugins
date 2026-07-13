import type { DiscordOAuthUser, OAuthGuild } from "./types.js";

const DISCORD_API = "https://discord.com/api/v10";
const AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize";
const TOKEN_URL = "https://discord.com/api/oauth2/token";
const REVOKE_URL = "https://discord.com/api/oauth2/token/revoke";

export interface TokenResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export function buildAuthorizeUrl(options: {
  clientId: string;
  redirectUri: string;
  scopes: readonly string[];
  state: string;
  codeChallenge?: string;
}): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("scope", options.scopes.join(" "));
  url.searchParams.set("state", options.state);
  url.searchParams.set("prompt", "none");
  if (options.codeChallenge) {
    url.searchParams.set("code_challenge", options.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  // Allow consent when prompt=none fails — Discord ignores invalid prompt; use consent for first login
  url.searchParams.delete("prompt");
  return url.toString();
}

export async function exchangeAuthorizationCode(options: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  fetchImpl?: typeof fetch;
}): Promise<TokenResult> {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectUri,
  });
  if (options.codeVerifier) body.set("code_verifier", options.codeVerifier);

  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`@stambha/api: token exchange failed (${res.status})`);
  }
  return (await res.json()) as TokenResult;
}

export async function refreshAccessToken(options: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fetchImpl?: typeof fetch;
}): Promise<TokenResult> {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    grant_type: "refresh_token",
    refresh_token: options.refreshToken,
  });
  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`@stambha/api: token refresh failed (${res.status})`);
  }
  return (await res.json()) as TokenResult;
}

export async function revokeToken(options: {
  clientId: string;
  clientSecret: string;
  token: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    token: options.token,
  });
  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(REVOKE_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  return res.ok || res.status === 200;
}

export async function fetchOAuthUser(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DiscordOAuthUser> {
  const res = await fetchImpl(`${DISCORD_API}/users/@me`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`@stambha/api: failed to fetch user (${res.status})`);
  return (await res.json()) as DiscordOAuthUser;
}

export async function fetchOAuthGuilds(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OAuthGuild[]> {
  const res = await fetchImpl(`${DISCORD_API}/users/@me/guilds`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`@stambha/api: failed to fetch guilds (${res.status})`);
  return (await res.json()) as OAuthGuild[];
}

/** Manage Guild permission bit. */
export const MANAGE_GUILD = 0x20n;
export const ADMINISTRATOR = 0x8n;

export function guildIsManageable(
  guild: Pick<OAuthGuild, "owner" | "permissions">,
  requiredPermission: bigint = MANAGE_GUILD,
): boolean {
  if (guild.owner) return true;
  try {
    const perms = BigInt(guild.permissions);
    if ((perms & ADMINISTRATOR) === ADMINISTRATOR) return true;
    return (perms & requiredPermission) === requiredPermission;
  } catch {
    return false;
  }
}
