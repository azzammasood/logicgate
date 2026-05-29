import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return apiResponse(null, { error: "No file uploaded", status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return apiResponse(null, {
        error: "Use JPEG, PNG, WebP, or GIF",
        status: 400,
      });
    }
    if (file.size > MAX_BYTES) {
      return apiResponse(null, { error: "Max file size is 2 MB", status: 400 });
    }

    const ext = file.type.split("/")[1] ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return apiResponse(null, {
        error:
          "Avatar upload failed. Create a public “avatars” bucket in Supabase Storage, or try again.",
        status: 500,
      });
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return apiResponse({ avatarUrl: updated.avatarUrl });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
