"use client";

import { useRouter } from "next/navigation";
import { Task } from "@/lib/types";
import CategoryChip from "@/components/CategoryChip";

type TaskCardProps = {
  task: Task;
  onToggleDone: (task: Task) => void;
};

export default function TaskCard({ task, onToggleDone }: TaskCardProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-stone-100 p-3 shadow-sm">
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => {
          e.stopPropagation();
          onToggleDone(task);
        }}
        className="w-5 h-5 shrink-0 accent-indigo-600"
      />
      <button
        type="button"
        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
        className="flex-1 text-left min-w-0"
      >
        <p
          className={`truncate ${
            task.done ? "line-through text-stone-400" : "text-stone-800"
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-stone-500">Due {task.due_date}</span>
          <CategoryChip category={task.category} size="sm" />
        </div>
      </button>
    </div>
  );
}
