import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { apiResponse, getInitials, reconcileInvitedUser } from "@/lib/api";
import { UserRole } from "@prisma/client";
import type { AppUserRole } from "@/lib/roles";

function mapSignupRole(role?: string): UserRole {
  const allowed: Record<AppUserRole, UserRole> = {
    ENGINEER: UserRole.ENGINEER,
    ANALYST: UserRole.ANALYST,
    ARCHITECT: UserRole.ARCHITECT,
    STAKEHOLDER: UserRole.STAKEHOLDER,
  };
  if (role && role in allowed) return allowed[role as AppUserRole];
  if (role === "ADMIN") return UserRole.ADMIN;
  return UserRole.STAKEHOLDER;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return apiResponse(null, { error: "Unauthorized", status: 401 });
    }
    const meta = user.user_metadata as { name?: string; role?: string };
    const name = meta.name ?? user.email.split("@")[0];
    const role = mapSignupRole(meta.role);

    await reconcileInvitedUser(user.email, user.id);

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name,
        role,
        avatarInitials: getInitials(name),
      },
      update: {
        email: user.email,
        name,
        avatarInitials: getInitials(name),
      },
    });

    return apiResponse(dbUser);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

