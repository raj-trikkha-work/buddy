import { CATEGORIES, Category } from "@/lib/categories";
import { Task } from "@/lib/types";

export type GroupBy = "none" | "category" | "dueDate" | "status";
export type SortBy = "dueDate" | "recentlyAdded" | "title" | "category";
export type StatusFilter = "active" | "done" | "all";

export type TaskViewOptions = {
  groupBy: GroupBy;
  sortBy: SortBy;
  categoryFilter: Category[];
  statusFilter: StatusFilter;
};

export type TaskGroup = {
  label: string;
  tasks: Task[];
};

const DUE_DATE_BUCKET_ORDER = ["Overdue", "Today", "Tomorrow", "This week", "Later"];

function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function dueDateBucket(dueDate: string, today: string): string {
  if (dueDate < today) return "Overdue";
  if (dueDate === today) return "Today";
  if (dueDate === addDaysISO(today, 1)) return "Tomorrow";
  if (dueDate <= addDaysISO(today, 6)) return "This week";
  return "Later";
}

function sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
  const copy = [...tasks];
  switch (sortBy) {
    case "dueDate":
      return copy.sort((a, b) => a.due_date.localeCompare(b.due_date));
    case "recentlyAdded":
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "category":
      return copy.sort((a, b) => a.category.localeCompare(b.category));
  }
}

export function groupAndSortTasks(tasks: Task[], options: TaskViewOptions): TaskGroup[] {
  const { groupBy, sortBy, categoryFilter, statusFilter } = options;

  const filtered = tasks.filter((task) => {
    // categoryFilter is always the authoritative inclusion list — callers
    // pass the full CATEGORIES array to mean "show everything", so an empty
    // array here correctly means "nothing selected, show nothing" rather
    // than being special-cased as "no filter."
    if (!categoryFilter.includes(task.category)) return false;
    if (statusFilter === "active" && task.done) return false;
    if (statusFilter === "done" && !task.done) return false;
    return true;
  });

  if (groupBy === "none") {
    return [{ label: "", tasks: sortTasks(filtered, sortBy) }];
  }

  if (groupBy === "category") {
    return CATEGORIES.map((category) => ({
      label: category,
      tasks: sortTasks(
        filtered.filter((t) => t.category === category),
        sortBy
      ),
    })).filter((group) => group.tasks.length > 0);
  }

  if (groupBy === "status") {
    return [
      {
        label: "Active",
        tasks: sortTasks(
          filtered.filter((t) => !t.done),
          sortBy
        ),
      },
      {
        label: "Done",
        tasks: sortTasks(
          filtered.filter((t) => t.done),
          sortBy
        ),
      },
    ].filter((group) => group.tasks.length > 0);
  }

  // groupBy === "dueDate"
  const today = todayISODate();
  const buckets = new Map<string, Task[]>();
  for (const task of filtered) {
    const bucket = dueDateBucket(task.due_date, today);
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(task);
  }
  return DUE_DATE_BUCKET_ORDER.filter((bucket) => buckets.has(bucket)).map((bucket) => ({
    label: bucket,
    tasks: sortTasks(buckets.get(bucket)!, sortBy),
  }));
}
