import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow client-side AI calls: OpenRouter, plus local OpenAI-compatible
              // endpoints (Ollama, LM Studio, vLLM) the user may configure.
              `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://openrouter.ai http://localhost:* http://127.0.0.1:*`,
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
            ].join("; "),
          },
        ],
      },
      // NOTE: no CORS headers on /api — the app is same-origin and the client's
      // AI calls go directly to OpenRouter, not through our API. A wildcard
      // `Access-Control-Allow-Origin: *` would needlessly expose the API surface
      // to any origin, so it's intentionally omitted.
    ];
  },
};

export default nextConfig;
