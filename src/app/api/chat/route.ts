import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAiProvider, AiProviderResponseError, AiProviderUnavailableError } from "@/lib/ai/provider";
import { runAssistantTurn, type ConversationTurn } from "@/lib/ai/assistant";
import { isChatRateLimited } from "@/lib/ai/rateLimit";

/**
 * Public AI travel assistant endpoint — no authentication required, same as
 * /api/contact. Request/response shape, validation, and error style follow
 * that route's conventions.
 *
 * Deliberately thin: this file's job is HTTP request handling, rate
 * limiting, and conversation persistence. The model conversation itself
 * (system prompt + tools + the provider round trip) lives in
 * src/lib/ai/assistant.ts — see that file's comment for why.
 */

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long"),
  conversationId: z.string().min(1).max(100).optional(),
});

/** How many prior turns to feed back to the model. Bounds context size and
 * cost; a real trip-planning conversation rarely needs more than this to
 * stay coherent. */
const HISTORY_LIMIT = 20;

const UNAVAILABLE_MESSAGE = "Sorry, the travel assistant is temporarily unavailable. Please try again shortly.";
const GENERIC_ERROR_MESSAGE = "Sorry, something went wrong on our end. Please try again.";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isChatRateLimited(ip)) {
    return NextResponse.json(
      { error: "You're sending messages a little too quickly. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { message, conversationId: requestedConversationId } = parsed.data;

  // A conversationId the client sends might be stale, expired, or simply
  // wrong — that's not a client error, it just means we start a fresh one
  // and hand back its real id. Never 404 for this.
  const existing = requestedConversationId
    ? await prisma.aiConversation.findUnique({
        where: { id: requestedConversationId },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: HISTORY_LIMIT,
            select: { role: true, content: true },
          },
        },
      })
    : null;

  const history: ConversationTurn[] = existing ? [...existing.messages].reverse() : [];

  const { conversationId } = await prisma.$transaction(async (tx) => {
    const conversation =
      existing ?? (await tx.aiConversation.create({ data: {} }));

    await tx.aiMessage.create({
      data: { conversationId: conversation.id, role: "USER", content: message },
    });

    return { conversationId: conversation.id };
  });

  let reply: string;
  try {
    const provider = getAiProvider();
    reply = await runAssistantTurn(provider, history, message);
  } catch (err) {
    if (err instanceof AiProviderUnavailableError || err instanceof AiProviderResponseError) {
      console.error("[ai] provider call failed:", err.message);
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE, conversationId }, { status: 503 });
    }
    console.error("[ai] unexpected error handling chat request", err);
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE, conversationId }, { status: 500 });
  }

  await prisma.aiConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      messages: { create: { role: "ASSISTANT", content: reply } },
    },
  });

  return NextResponse.json({ message: reply, conversationId }, { status: 200 });
}
