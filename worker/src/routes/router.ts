import type { Env } from "../config";

type Handler = (
  req: Request,
  env: Env,
  params: Record<string, string>
) => Promise<Response>;

interface Route {
  method: string;
  pattern: string;
  handler: Handler;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function matchPath(
  pathname: string,
  pattern: string
): Record<string, string> | null {
  const patParts = pattern.split("/");
  const urlParts = pathname.split("/");

  if (patParts.length !== urlParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(":")) {
      params[patParts[i].slice(1)] = urlParts[i];
    } else if (patParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

export function createRouter(routes: Route[]) {
  return async (req: Request, env: Env): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);

    for (const route of routes) {
      if (route.method !== req.method) continue;
      const params = matchPath(url.pathname, route.pattern);
      if (params !== null) {
        try {
          return await route.handler(req, env, params);
        } catch (err) {
          console.error("Route error:", err);
          return json(
            { error: err instanceof Error ? err.message : "Internal error" },
            500
          );
        }
      }
    }

    return json({ error: "Not Found" }, 404);
  };
}
