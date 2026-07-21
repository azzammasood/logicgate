import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createUserClient } from "@/lib/supabase/server";

const BUCKET = "avatars";

/**
 * Service-role Supabase client (server-only). Present only when
 * SUPABASE_SERVICE_ROLE_KEY is configured — it bypasses Storage RLS and can
 * create buckets, which the anon/user client cannot.
 */
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Only worth checking once per server process.
let bucketEnsured = false;
async function ensureBucket(client: NonNullable<ReturnType<typeof adminClient>>) {
  if (bucketEnsured) return;
  const { data } = await client.storage.getBucket(BUCKET);
  if (!data) {
    await client.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "2MB",
    });
  }
  bucketEnsured = true;
}

export type UploadResult = { url?: string; error?: string };

/**
 * Upload an image to the public "avatars" bucket and return its public URL.
 *
 * When a service-role key is available we use it — this auto-creates the bucket
 * on first use and sidesteps Storage RLS, so uploads "just work". Otherwise we
 * fall back to the user-scoped client, which requires the bucket (and an INSERT
 * policy) to already exist, and return an actionable message if it doesn't.
 */
export async function uploadPublicImage(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const admin = adminClient();

  if (admin) {
    try {
      await ensureBucket(admin);
    } catch {
      /* bucket may already exist or lack list perms — the upload below is the real test */
    }
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true });
    if (error) return { error: `Upload failed: ${error.message}` };
    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }

  // Fallback: user session client.
  const user = await createUserClient();
  const { error } = await user.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) {
    return {
      error:
        "Image upload failed. Set SUPABASE_SERVICE_ROLE_KEY in .env.local (recommended — it auto-creates the bucket), or create a public “avatars” bucket in Supabase Storage.",
    };
  }
  const { data } = user.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
