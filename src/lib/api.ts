import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import type { User, WorkspaceMember } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
};

export function formatZodError(error: ZodError): string {
  const first = error.issues[0];
  if (!first) return "Invalid input";
  const field = first.path.join(".") || "field";
  if (field === "workspaceId") {
    return "Select or create an organization in the left panel first.";
  }
  return `${field}: ${first.message}`;
}

export function apiResponse<T>(
  data: T | null,
  options?: { error?: string; meta?: Record<string, unknown>; status?: number }
) {
  const status = options?.status ?? (options?.error ? 400 : 200);
  return NextResponse.json(
    { data, error: options?.error ?? null, meta: options?.meta ?? {} } satisfies ApiResponse<T>,
    { status }
  );
}

/**
 * Invites can pre-create a placeholder User row (keyed by a random id) for an
 * email that hasn't signed up yet. When that person authenticates, their real
 * row must be keyed by the Supabase auth id — but the email is unique, so a
 * naive create collides. This re-points the placeholder row (and its cascading
 * memberships) to the real auth id so pre-created invites attach correctly.
 */
export async function reconcileInvitedUser(email: string, authId: string): Promise<void> {
  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail && byEmail.id !== authId) {
    // FK relations to User use ON UPDATE CASCADE (Prisma default), so updating
    // the primary key migrates WorkspaceMember/ownership rows with it.
    await prisma.user.update({ where: { email }, data: { id: authId } });
  }
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return prisma.user.findUnique({ where: { id: user.id } });
}

export async function requireSessionUser(): Promise<User | { error: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: apiResponse(null, { error: "Unauthorized", status: 401 }) };
  }
  return user;
}

export async function getWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<WorkspaceMember | null> {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
}

export async function requireWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<WorkspaceMember | { error: NextResponse }> {
  const member = await getWorkspaceMember(userId, workspaceId);
  if (!member) {
    return { error: apiResponse(null, { error: "Forbidden", status: 403 }) };
  }
  return member;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

