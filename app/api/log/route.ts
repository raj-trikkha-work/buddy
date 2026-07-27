import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { CATEGORIES, isCategory } from "@/lib/categories";
import { ConversationMessage } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, presetCategory } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const preset = isCategory(presetCategory) ? presetCategory : null;

  // Give the model a precomputed weekday->date table for the next two weeks
  // instead of making it do date arithmetic itself — small models reliably
  // miscalculate relative dates across month/week boundaries otherwise.
  const upcomingDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().split("T")[0];
    const weekday = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const label = i === 0 ? "today" : i === 1 ? "tomorrow" : weekday;
    return `${label} = ${iso} (${weekday})`;
  }).join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: `You are helping capture a task from spoken notes. Today's date is ${today}.

Here is the exact date for every day over the next two weeks — use this table directly instead of calculating dates yourself:
${upcomingDays}

A task is only complete once you know both:
1. title — a short, clear description of what the task is
2. due_date — an actual calendar date (YYYY-MM-DD). Look up relative dates ("tomorrow", "Friday", "this weekend") directly in the table above — do not compute them yourself. If a weekday name appears twice in the table (e.g. two Saturdays), use the nearest upcoming one unless the person clearly means "next" (further out).

Read the full conversation so far (it may span multiple turns) and combine everything said into one evolving understanding of the task.

If either piece is still missing or unclear, set status to "needs_info" and ask ONE short, natural, specific follow-up question for exactly what's missing — don't ask about something you already know. Never ask a follow-up question about category. If you have both title and due_date, set status to "complete".

Once status is "complete", also silently pick the single best-fitting category from this exact list: ${CATEGORIES.join(", ")}.${
      preset
        ? ` The user was already browsing the "${preset}" area when they started this, so default to "${preset}" unless the content clearly belongs elsewhere.`
        : ""
    } If genuinely ambiguous, default to "Personal". Never ask the user about category — always make your best guess.`,
    messages: (messages as ConversationMessage[]).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["complete", "needs_info"],
            },
            title: {
              type: ["string", "null"],
              description: "The task title, or null if not yet known",
            },
            due_date: {
              type: ["string", "null"],
              description: "ISO date YYYY-MM-DD, or null if not yet known",
            },
            category: {
              anyOf: [{ type: "string", enum: [...CATEGORIES] }, { type: "null" }],
              description:
                "Best-guess category, silently inferred. Null while status is needs_info. Never null when status is complete.",
            },
            follow_up_question: {
              type: ["string", "null"],
              description:
                "A short question asking for the missing title/due_date info, or null if status is complete",
            },
          },
          required: ["status", "title", "due_date", "category", "follow_up_question"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "Claude did not return a structured result" },
      { status: 500 }
    );
  }

  const parsed = JSON.parse(textBlock.text) as {
    status: "complete" | "needs_info";
    title: string | null;
    due_date: string | null;
    category: string | null;
    follow_up_question: string | null;
  };

  // Defensive check: never treat as ready unless title/due_date actually made
  // it through, regardless of what Claude claims its own status is.
  if (parsed.status !== "complete" || !parsed.title || !parsed.due_date) {
    return NextResponse.json({
      status: "needs_info",
      follow_up_question:
        parsed.follow_up_question ?? "Could you clarify the task?",
    });
  }

  const category = isCategory(parsed.category) ? parsed.category : preset ?? "Personal";

  const rawInput = (messages as ConversationMessage[])
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" / ");

  return NextResponse.json({
    status: "ready",
    draft: {
      title: parsed.title,
      due_date: parsed.due_date,
      category,
      raw_input: rawInput,
    },
  });
}
