import Link from "next/link";
type Props = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0f14] px-4 text-center">
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
        Workspace invite
      </h1>
      <p className="mt-2 max-w-md text-sm text-white/50">
        Invite acceptance is coming soon. Token: <code className="text-[#4ade80]">{token}</code>
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex h-8 items-center justify-center rounded-lg bg-[#4ade80] px-4 text-sm font-medium text-black"
      >
        Sign in
      </Link>
    </div>
  );
}
