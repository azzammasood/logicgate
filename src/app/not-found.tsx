import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0f14] px-4 text-center">
      <p className="font-[family-name:var(--font-syne)] text-6xl font-bold text-[#4ade80]">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-white/50">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/app/definitions"
        className="mt-8 inline-flex h-8 items-center justify-center rounded-lg bg-[#4ade80] px-4 text-sm font-medium text-black hover:bg-[#4ade80]/90"
      >
        Back to definitions
      </Link>
    </div>
  );
}
