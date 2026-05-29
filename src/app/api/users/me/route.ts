import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getInitials, formatZodError } from "@/lib/api";
import { patchUserSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const parsed = patchUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiResponse(null, { error: formatZodError(parsed.error), status: 400 });
    }

    const data = parsed.data;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name ? { name: data.name, avatarInitials: getInitials(data.name) } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
        ...(data.about !== undefined ? { about: data.about } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.preferences !== undefined
          ? { preferences: data.preferences as object }
          : {}),
      },
    });

    return apiResponse(updated);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Server error";
    return apiResponse(null, {
      error: process.env.NODE_ENV === "development" ? message : "Server error",
      status: 500,
    });
  }
}
