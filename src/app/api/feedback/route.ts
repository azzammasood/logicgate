import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser } from "@/lib/api";
import { z } from "zod";

const FEEDBACK_TOPICS = [
  "Bug report",
  "Feature request",
  "Usability",
  "Performance",
  "Documentation",
  "Other",
] as const;

const bodySchema = z.object({
  topic: z.enum(FEEDBACK_TOPICS),
  body: z.string().trim().min(3).max(5000),
  sentiment: z.enum(["sad", "neutral", "happy", "love"]).optional(),
});

export async function GET() {
  return apiResponse({ topics: FEEDBACK_TOPICS });
}

export async function POST(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiResponse(null, { error: "Invalid request body", status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.issues[0]?.message ?? "Invalid", status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        topic: parsed.data.topic,
        body: parsed.data.body,
        sentiment: parsed.data.sentiment ?? null,
      },
    });

    const ownerEmail =
      process.env.FEEDBACK_OWNER_EMAIL ?? "ahmaduzzammasood@gmail.com";

    // Persisted for the owner; email delivery can be wired via FEEDBACK_WEBHOOK_URL later.
    if (process.env.FEEDBACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.FEEDBACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: ownerEmail,
            from: user.email,
            fromName: user.name,
            topic: parsed.data.topic,
            body: parsed.data.body,
            sentiment: parsed.data.sentiment,
          }),
        });
      } catch (e) {
        console.error("Feedback webhook failed:", e);
      }
    }

    return apiResponse({ id: feedback.id, sentTo: ownerEmail }, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
