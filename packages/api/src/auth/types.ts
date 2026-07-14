import type { RestPort, StambhaClient } from "@stambha/core";

/** Minimal Vault surface used by settings routes (duck-typed; optional peer). */
export interface VaultLike {
  ledger(name: string): {
    readonly blueprint: {
      readonly shape: Readonly<Record<string, unknown>>;
      defaults(): Record<string, unknown>;
      validate(data: unknown): Record<string, unknown>;
      patch(
        current: Record<string, unknown>,
        patch: Record<string, unknown>,
      ): Record<string, unknown>;
    };
    acquire(id: string): {
      sync(): Promise<unknown>;
      getAll(): Readonly<Record<string, unknown>>;
      patch(partial: Record<string, unknown>): unknown;
      save(): Promise<unknown>;
    };
  };
}

export interface DiscordOAuthUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
  discriminator?: string;
}

export interface OAuthGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface ApiSession {
  id: string;
  userId: string;
  user: DiscordOAuthUser;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  csrfToken: string;
  createdAt: number;
}

export interface SessionStore {
  get(id: string): Promise<ApiSession | null>;
  set(session: ApiSession): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface OAuthPendingState {
  state: string;
  codeVerifier?: string;
  redirectTo?: string;
  expiresAt: number;
}

export interface OAuthStateStore {
  put(entry: OAuthPendingState): Promise<void>;
  take(state: string): Promise<OAuthPendingState | null>;
}

export interface AuthCookieOptions {
  /** Cookie name (default `stambha_session`). */
  name?: string;
  /** Max-Age seconds (default matches Discord token lifetime when known, else 7d). */
  maxAgeSeconds?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
}

export interface ApiAuthOptions {
  clientId: string;
  clientSecret: string;
  /** Absolute redirect URI registered in the Discord application. */
  redirectUri: string;
  /** OAuth scopes (default `identify guilds`). */
  scopes?: readonly string[];
  cookie?: AuthCookieOptions;
  /** Enable PKCE (default true). */
  pkce?: boolean;
  sessionStore?: SessionStore;
  stateStore?: OAuthStateStore;
}

export interface ApiAuthorizationOptions {
  /**
   * Discord permission bit required on the OAuth guild entry (default Manage Guild `0x20`).
   * Owners always pass.
   */
  requiredPermission?: bigint;
}

export interface ApiDashboardOptions {
  auth?: ApiAuthOptions;
  /** When set with auth, enables `/guilds/:id/settings` routes. */
  vault?: VaultLike;
  /** Ledger name for guild settings (default `guild`). */
  guildSettingsLedger?: string;
  authorization?: ApiAuthorizationOptions;
  /**
   * Called before listen. Return false to skip binding the port
   * (e.g. wrong worker process). Default always true.
   */
  listenWhen?: (client: StambhaClient | undefined) => boolean;
  /**
   * When true (default), refuse to listen if `client.workerRole === "gateway"`
   * and `client.tier` is `split` or `distributed` — prefer mounting the API
   * only in the bot entrypoint instead of "shard 0" hacks.
   */
  rejectGatewayListen?: boolean;
  /** RestPort override; otherwise `client.restPort`. */
  restPort?: RestPort;
}

export interface AuthRuntime {
  readonly options: Required<
    Pick<ApiAuthOptions, "clientId" | "clientSecret" | "redirectUri" | "scopes" | "pkce">
  > & {
    cookie: Required<AuthCookieOptions>;
  };
  readonly sessions: SessionStore;
  readonly states: OAuthStateStore;
  readonly requiredPermission: bigint;
  readonly vault: VaultLike | null;
  readonly guildSettingsLedger: string;
  restPort: RestPort | null;
}
