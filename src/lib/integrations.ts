import { prisma } from "@/lib/prisma";
import type { WorkspaceSettings } from "@/types";

export type PublishedPayload = {
  event: "definition.published";
  at: string;
  workspace: { id: string; name: string };
  definition: {
    id: string;
    name: string;
    type: string;
    status: string;
    version?: number;
  };
  message?: string;
};

/**
 * Best-effort outbound webhook fired when a definition is published (either via
 * the Publish button or an approved change request). Never throws — a failing
 * or slow webhook must not break publishing.
 */
export async function firePublishWebhook(
  workspaceId: string,
  payload: Omit<PublishedPayload, "event" | "at" | "workspace">
): Promise<void> {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return;
    const settings = (workspace.workspaceSettings ?? {}) as WorkspaceSettings;
    const url = settings.webhookUrl?.trim();
    if (!url || !/^https?:\/\//i.test(url)) return;

    const body: PublishedPayload = {
      event: "definition.published",
      at: new Date().toISOString(),
      workspace: { id: workspace.id, name: workspace.name },
      ...payload,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch {
    /* best-effort — swallow all webhook errors */
  }
}
