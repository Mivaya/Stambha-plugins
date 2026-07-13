export { parseCookieHeader, resolveCookieOptions, serializeCookie } from "./auth/cookies.js";
export { createAuthRuntime, shouldListen } from "./auth/createAuthRuntime.js";
export {
  ADMINISTRATOR,
  buildAuthorizeUrl,
  exchangeAuthorizationCode,
  fetchOAuthGuilds,
  fetchOAuthUser,
  guildIsManageable,
  MANAGE_GUILD,
  refreshAccessToken,
  revokeToken,
} from "./auth/discordOAuth.js";
export {
  createCsrfToken,
  createOAuthState,
  createSessionId,
  MemoryOAuthStateStore,
  MemorySessionStore,
} from "./auth/MemorySessionStore.js";
export { createPkcePair } from "./auth/pkce.js";
export type {
  ApiAuthOptions,
  ApiAuthorizationOptions,
  ApiDashboardOptions,
  ApiSession,
  AuthCookieOptions,
  AuthRuntime,
  DiscordOAuthUser,
  OAuthGuild,
  OAuthPendingState,
  OAuthStateStore,
  SessionStore,
  VaultLike,
} from "./auth/types.js";
export {
  type ApiPluginHandle,
  type ApiPluginOptions,
  createApiPlugin,
  createDashboardPlugin,
} from "./createApiPlugin.js";
/** @deprecated Use {@link createApiServer}. */
export {
  type ApiServer,
  createApiServer,
  createApiServer as createDashboardServer,
} from "./createApiServer.js";
export { createApiRequest } from "./http/ApiRequest.js";
export { createApiResponse } from "./http/ApiResponse.js";
export { BodyTooLargeError, createBodyMiddleware } from "./middleware/body.js";
export { createCorsMiddleware } from "./middleware/cors.js";
export { MiddlewareStore } from "./middleware/MiddlewareStore.js";
export { createRateLimitMiddleware } from "./middleware/rateLimit.js";
export { createRequestIdMiddleware } from "./middleware/requestId.js";
export { createCsrfMiddleware, createRequireAuthMiddleware } from "./middleware/requireAuth.js";
export { createSessionMiddleware } from "./middleware/session.js";
export { RouteStore } from "./route/RouteStore.js";
export { joinPrefix, normalizePath, type RouteMatch, Router } from "./router/Router.js";
export { createAuthRoutes } from "./routes/auth.js";
export { assertGuildAccess, createGuildRoutes } from "./routes/guilds.js";
export { createHealthRoute } from "./routes/health.js";
export { createSettingsRoutes } from "./routes/settings.js";
export { createVersionRoute } from "./routes/version.js";
export type {
  ApiRequest,
  ApiResponse,
  ApiServerHandle,
  ApiServerOptions,
  HttpMethod,
  MiddlewareDefinition,
  MiddlewareHandler,
  RouteDefinition,
  RouteHandler,
} from "./types.js";
export { resolveApiServerOptions } from "./validateOptions.js";
export { API_PACKAGE_VERSION } from "./version.js";
