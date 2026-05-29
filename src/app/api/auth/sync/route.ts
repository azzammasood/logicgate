import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { apiResponse, getInitials } from "@/lib/api";
import { UserRole } from "@prisma/client";

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
    const role =
      meta.role === "ENGINEER"
        ? UserRole.ENGINEER
        : meta.role === "ADMIN"
          ? UserRole.ADMIN
          : UserRole.STAKEHOLDER;

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

