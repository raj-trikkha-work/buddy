"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SLUG_TO_CATEGORY } from "@/lib/categories";
import { Task } from "@/lib/types";
import { groupAndSortTasks, SortBy } from "@/lib/taskView";
import TaskCard from "@/components/TaskCard";
import CaptureModal from "@/components/CaptureModal";

export default function CategoryDrawerPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = use(params);
  const category = SLUG_TO_CATEGORY[slug];

  if (!category) {
    notFound();
  }

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("dueDate");
  const [captureOpen, setCaptureOpen] = useState(false);

  const loadTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const toggleDone = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    loadTasks();
  };

  const [group] = groupAndSortTasks(tasks, {
    groupBy: "none",
    sortBy,
    categoryFilter: [category],
    statusFilter: "active",
  });
  const visibleTasks = group?.tasks ?? [];

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-800">{category}</h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-600"
        >
          <option value="dueDate">Sort: Due date</option>
          <option value="recentlyAdded">Sort: Recently added</option>
          <option value="title">Sort: Title A-Z</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {visibleTasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggleDone={toggleDone} />
        ))}
        {visibleTasks.length === 0 && (
          <p className="text-center text-stone-400 text-sm mt-8">
            No {category} tasks yet — tap + to add one.
          </p>
        )}
      </div>

      <button
        onClick={() => setCaptureOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl shadow-lg flex items-center justify-center"
      >
        +
      </button>

      <CaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        presetCategory={category}
        onCaptured={loadTasks}
      />
    </div>
  );
}
