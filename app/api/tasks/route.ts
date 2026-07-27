import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySession } from "@/lib/session";
import { isCategory } from "@/lib/categories";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, due_date, category, raw_input } = await request.json();

  if (typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "Missing or invalid title" }, { status: 400 });
  }
  if (typeof due_date !== "string" || !DATE_RE.test(due_date)) {
    return NextResponse.json({ error: "Missing or invalid due_date" }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: "Missing or invalid category" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      due_date,
      category,
      raw_input: typeof raw_input === "string" ? raw_input : title,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
