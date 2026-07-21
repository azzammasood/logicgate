import { prisma } from "@/lib/prisma";
import { apiResponse, getInitials, reconcileInvitedUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    // Resolve the DB user for the current session, provisioning the row on
    // first access so a freshly-confirmed account never gets stuck loading.
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return apiResponse(null, { error: "Unauthorized", status: 401 });
    }

    const meta = authUser.user_metadata as { name?: string; role?: string };
    const name = meta.name ?? authUser.email.split("@")[0];
    const roleValue =
      meta.role && meta.role in UserRole
        ? (meta.role as UserRole)
        : UserRole.STAKEHOLDER;

    await reconcileInvitedUser(authUser.email, authUser.id);

    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email: authUser.email,
        name,
        role: roleValue,
        avatarInitials: getInitials(name),
      },
      update: { email: authUser.email },
    });

    const workspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });

    return apiResponse({
      user,
      workspaces: workspaces.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      })),
    });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
