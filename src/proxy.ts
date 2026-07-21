import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset-password"];
const PUBLIC_PREFIXES = ["/invite/"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

// Rate-limit tiers (per client IP, sliding window). Auth/invite endpoints are
// abuse-sensitive (credential stuffing, invite brute force) so they get a much
// tighter budget than ordinary API traffic.
const SENSITIVE_PREFIXES = ["/api/auth", "/api/workspaces", "/api/invite"];
const GENERAL_API = { limit: 120, windowMs: 60_000 };
const SENSITIVE_API = { limit: 20, windowMs: 60_000 };

function rateLimitResponse(pathname: string, request: NextRequest): NextResponse | null {
  if (!pathname.startsWith("/api")) return null;

  const sensitive = SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p));
  const opts = sensitive ? SENSITIVE_API : GENERAL_API;
  const ip = clientIp(request.headers);
  const bucket = sensitive ? "sensitive" : "api";
  const result = rateLimit(`${bucket}:${ip}`, opts);

  if (!result.ok) {
    return NextResponse.json(
      {
        data: null,
        error: "Too many requests — slow down and try again shortly.",
        meta: {},
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
        },
      }
    );
  }
  return null; // within limit — proceed to auth/session handling
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enforce rate limits before doing any auth/session work.
  const limited = rateLimitResponse(pathname, request);
  if (limited) return limited;

  const response = await updateSession(request);

  if (isPublic(pathname)) return response;

  const needsAuth =
    pathname.startsWith("/app") || pathname.startsWith("/api");

  if (!needsAuth) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { data: null, error: "Unauthorized", meta: {} },
        { status: 401 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
