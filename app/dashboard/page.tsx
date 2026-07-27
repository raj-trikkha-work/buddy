"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, Category } from "@/lib/categories";
import { Task } from "@/lib/types";
import { groupAndSortTasks, GroupBy, SortBy, StatusFilter } from "@/lib/taskView";
import CategoryChip from "@/components/CategoryChip";
import TaskCard from "@/components/TaskCard";
import CaptureModal from "@/components/CaptureModal";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [sortBy, setSortBy] = useState<SortBy>("dueDate");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [categoryFilter, setCategoryFilter] = useState<Category[]>([...CATEGORIES]);
  const [captureOpen, setCaptureOpen] = useState(false);

  const loadTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, []);

  const toggleCategoryFilter = (category: Category) => {
    setCategoryFilter((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleDone = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    loadTasks();
  };

  const groups = groupAndSortTasks(tasks, { groupBy, sortBy, categoryFilter, statusFilter });
  const hasAnyTasks = groups.some((g) => g.tasks.length > 0);

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 pt-5">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <CategoryChip
            key={category}
            category={category}
            selected={categoryFilter.includes(category)}
            onClick={() => toggleCategoryFilter(category)}
            size="sm"
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-stone-200 text-xs">
          {(["active", "done", "all"] as StatusFilter[]).map((option) => (
            <button
              key={option}
              onClick={() => setStatusFilter(option)}
              className={`px-3 py-1.5 capitalize ${
                statusFilter === option
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-stone-500"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-600"
        >
          <option value="none">No grouping</option>
          <option value="category">Group: Category</option>
          <option value="dueDate">Group: Due date</option>
          <option value="status">Group: Status</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-600"
        >
          <option value="dueDate">Sort: Due date</option>
          <option value="recentlyAdded">Sort: Recently added</option>
          <option value="title">Sort: Title A-Z</option>
          <option value="category">Sort: Category A-Z</option>
        </select>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map(
          (group) =>
            group.tasks.length > 0 && (
              <div key={group.label || "flat"} className="flex flex-col gap-2">
                {group.label && (
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                    {group.label}
                  </h2>
                )}
                {group.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggleDone={toggleDone} />
                ))}
              </div>
            )
        )}
        {!hasAnyTasks && (
          <p className="text-center text-stone-400 text-sm mt-8">
            Nothing here — tap the mic on the home screen, or use the + button.
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
        onCaptured={loadTasks}
      />
    </div>
  );
}
