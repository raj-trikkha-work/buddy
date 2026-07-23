import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: `You are helping capture a task from spoken notes. Today's date is ${today}.

A task is only complete once you know both:
1. title — a short, clear description of what the task is
2. due_date — an actual calendar date (YYYY-MM-DD). Convert relative dates ("tomorrow", "Friday") using today's date above.

Read the full conversation so far (it may span multiple turns) and combine everything said into one evolving understanding of the task.

If either piece is still missing or unclear, set status to "needs_info" and ask ONE short, natural, specific follow-up question for exactly what's missing — don't ask about something you already know. If you have both, set status to "complete".`,
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
            follow_up_question: {
              type: ["string", "null"],
              description:
                "A short question asking for the missing info, or null if status is complete",
            },
          },
          required: ["status", "title", "due_date", "follow_up_question"],
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
    follow_up_question: string | null;
  };

  // Defensive check: never save unless both fields actually made it through,
  // regardless of what Claude claims its own status is.
  if (parsed.status !== "complete" || !parsed.title || !parsed.due_date) {
    return NextResponse.json({
      done: false,
      follow_up_question:
        parsed.follow_up_question ?? "Could you clarify the task?",
    });
  }

  const rawInput = (messages as ConversationMessage[])
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" / ");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: parsed.title,
      due_date: parsed.due_date,
      raw_input: rawInput,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ done: true, task: data });
}
