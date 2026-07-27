"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Category } from "@/lib/categories";
import { Task } from "@/lib/types";
import CategoryPicker from "@/components/CategoryPicker";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<Category>("Personal");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
      if (data) {
        const t = data as Task;
        setTask(t);
        setTitle(t.title);
        setDueDate(t.due_date);
        setCategory(t.category);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due_date: dueDate, category }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/dashboard");
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  if (!task) {
    return (
      <div className="max-w-md mx-auto pt-5">
        <p className="text-sm text-stone-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 pt-5">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-sm text-indigo-600 self-start"
      >
        ← Back
      </button>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs text-stone-400 mb-1 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-stone-400 mb-1 block">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-stone-400 mb-1 block">Category</label>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>

        <p className="text-xs text-stone-400 italic">
          Originally said: &ldquo;{task.raw_input}&rdquo;
        </p>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 text-white text-sm py-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {confirmingDelete ? (
          <div className="flex gap-2 items-center justify-between bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-700">Delete this task for good?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-xs text-stone-500"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="text-xs text-red-700 font-medium">
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-red-600 self-start"
          >
            Delete task
          </button>
        )}
      </div>
    </div>
  );
}
