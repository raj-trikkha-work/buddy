import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: `You extract task information from a short spoken note. Today's date is ${today}. If the note mentions a relative date (like "tomorrow" or "Friday"), convert it to an actual calendar date.`,
    messages: [{ role: "user", content: text }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "A short, clear task title",
            },
            due_date: {
              type: ["string", "null"],
              description:
                "ISO date YYYY-MM-DD if a date was mentioned, otherwise null",
            },
          },
          required: ["title", "due_date"],
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
    title: string;
    due_date: string | null;
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: parsed.title,
      due_date: parsed.due_date,
      raw_input: text,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
