import { parseCookieHeader } from "../auth/cookies.js";
import { fetchOAuthUser, refreshAccessToken } from "../auth/discordOAuth.js";
import type { ApiSession, AuthRuntime } from "../auth/types.js";
import type { MiddlewareDefinition } from "../types.js";

export function createSessionMiddleware(runtime: AuthRuntime): MiddlewareDefinition {
  return {
    name: "session",
    position: 50,
    async run(request, _response, next) {
      request.auth = runtime;
      const cookies = parseCookieHeader(
        typeof request.headers.cookie === "string" ? request.headers.cookie : undefined,
      );
      const sessionId = cookies[runtime.options.cookie.name];
      if (!sessionId) {
        request.session = null;
        await next();
        return;
      }

      let session: ApiSession | null = await runtime.sessions.get(sessionId);
      if (!session) {
        request.session = null;
        await next();
        return;
      }

      if (session.accessExpiresAt - 60_000 < Date.now()) {
        try {
          const tokens = await refreshAccessToken({
            clientId: runtime.options.clientId,
            clientSecret: runtime.options.clientSecret,
            refreshToken: session.refreshToken,
          });
          const user = await fetchOAuthUser(tokens.access_token);
          session = {
            ...session,
            user,
            userId: user.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || session.refreshToken,
            accessExpiresAt: Date.now() + tokens.expires_in * 1000,
          };
          await runtime.sessions.set(session);
        } catch {
          await runtime.sessions.delete(sessionId);
          request.session = null;
          await next();
          return;
        }
      }

      request.session = session;
      await next();
    },
  };
}
