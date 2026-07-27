import { Category } from "@/lib/categories";

export type Task = {
  id: string;
  title: string;
  due_date: string;
  done: boolean;
  category: Category;
  raw_input: string;
  created_at: string;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};
