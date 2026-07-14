import {
  buildAuthorizeUrl,
  exchangeAuthorizationCode,
  fetchOAuthUser,
  revokeToken,
} from "../auth/discordOAuth.js";
import { createCsrfToken, createOAuthState, createSessionId } from "../auth/MemorySessionStore.js";
import { createPkcePair } from "../auth/pkce.js";
import type { AuthRuntime } from "../auth/types.js";
import type { RouteDefinition } from "../types.js";

export function createAuthRoutes(runtime: AuthRuntime): RouteDefinition[] {
  return [
    {
      name: "auth.login",
      method: "GET",
      path: "/auth/login",
      run: async (request, response) => {
        const state = createOAuthState();
        const redirectTo =
          typeof request.query.redirect === "string" ? request.query.redirect : undefined;
        const pending: import("../auth/types.js").OAuthPendingState = {
          state,
          expiresAt: Date.now() + 10 * 60 * 1000,
        };
        let codeChallenge: string | undefined;
        if (runtime.options.pkce) {
          const pair = createPkcePair();
          codeChallenge = pair.challenge;
          pending.codeVerifier = pair.verifier;
        }
        if (redirectTo) pending.redirectTo = redirectTo;
        await runtime.states.put(pending);
        const authorizeOpts: Parameters<typeof buildAuthorizeUrl>[0] = {
          clientId: runtime.options.clientId,
          redirectUri: runtime.options.redirectUri,
          scopes: runtime.options.scopes,
          state,
        };
        if (codeChallenge) authorizeOpts.codeChallenge = codeChallenge;
        const url = buildAuthorizeUrl(authorizeOpts);
        response.redirect(url);
      },
    },
    {
      name: "auth.callback.get",
      method: "GET",
      path: "/auth/callback",
      run: async (request, response) => {
        const code = request.query.code;
        const state = request.query.state;
        if (typeof code !== "string" || typeof state !== "string") {
          response.status(400).json({ error: "Missing code or state" });
          return;
        }
        await completeOAuth(runtime, { code, state }, response, "redirect");
      },
    },
    {
      name: "auth.callback.post",
      method: "POST",
      path: "/auth/callback",
      run: async (request, response) => {
        const body = (request.body ?? {}) as Record<string, unknown>;
        const code = typeof body.code === "string" ? body.code : undefined;
        const state = typeof body.state === "string" ? body.state : undefined;
        if (!code || !state) {
          response.status(400).json({ error: "Missing code or state" });
          return;
        }
        await completeOAuth(runtime, { code, state }, response, "json");
      },
    },
    {
      name: "auth.logout",
      method: "POST",
      path: "/auth/logout",
      run: async (request, response) => {
        if (request.session) {
          await revokeToken({
            clientId: runtime.options.clientId,
            clientSecret: runtime.options.clientSecret,
            token: request.session.accessToken,
          }).catch(() => false);
          await runtime.sessions.delete(request.session.id);
        }
        response.clearCookie(runtime.options.cookie.name, runtime.options.cookie);
        response.json({ ok: true });
      },
    },
    {
      name: "auth.me",
      method: "GET",
      path: "/auth/me",
      run: async (request, response) => {
        if (!request.session) {
          response.status(401).json({ error: "Unauthorized" });
          return;
        }
        response.json({
          user: request.session.user,
          csrfToken: request.session.csrfToken,
        });
      },
    },
  ];
}

async function completeOAuth(
  runtime: AuthRuntime,
  input: { code: string; state: string },
  response: import("../types.js").ApiResponse,
  mode: "json" | "redirect",
): Promise<void> {
  const pending = await runtime.states.take(input.state);
  if (!pending || pending.expiresAt < Date.now()) {
    response.status(400).json({ error: "Invalid or expired state" });
    return;
  }

  try {
    const tokens = await exchangeAuthorizationCode({
      clientId: runtime.options.clientId,
      clientSecret: runtime.options.clientSecret,
      code: input.code,
      redirectUri: runtime.options.redirectUri,
      ...(pending.codeVerifier ? { codeVerifier: pending.codeVerifier } : {}),
    });
    const user = await fetchOAuthUser(tokens.access_token);
    const session = {
      id: createSessionId(),
      userId: user.id,
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessExpiresAt: Date.now() + tokens.expires_in * 1000,
      csrfToken: createCsrfToken(),
      createdAt: Date.now(),
    };
    await runtime.sessions.set(session);
    response.setCookie(runtime.options.cookie.name, session.id, {
      ...runtime.options.cookie,
      maxAgeSeconds: Math.max(tokens.expires_in, runtime.options.cookie.maxAgeSeconds),
    });

    if (mode === "redirect" && pending.redirectTo && isSafeRedirect(pending.redirectTo)) {
      response.redirect(pending.redirectTo);
      return;
    }

    response.json({
      user,
      csrfToken: session.csrfToken,
    });
  } catch (error) {
    response.status(502).json({
      error: "OAuth exchange failed",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

function isSafeRedirect(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
