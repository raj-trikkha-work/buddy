import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySession } from "@/lib/session";
import { isCategory } from "@/lib/categories";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  const updates: Record<string, string | boolean> = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    updates.title = body.title;
  }
  if ("due_date" in body) {
    if (typeof body.due_date !== "string" || !DATE_RE.test(body.due_date)) {
      return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
    }
    updates.due_date = body.due_date;
  }
  if ("category" in body) {
    if (!isCategory(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = body.category;
  }
  if ("done" in body) {
    if (typeof body.done !== "boolean") {
      return NextResponse.json({ error: "Invalid done" }, { status: 400 });
    }
    updates.done = body.done;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const { error, count } = await supabase
    .from("tasks")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
