export const CATEGORIES = [
  "Work",
  "Safarnama",
  "Personal",
  "Family & Partner",
  "Learning",
  "Finance",
  "Lifestyle",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_SLUGS: Record<Category, string> = {
  Work: "work",
  Safarnama: "safarnama",
  Personal: "personal",
  "Family & Partner": "family-partner",
  Learning: "learning",
  Finance: "finance",
  Lifestyle: "lifestyle",
};

export const SLUG_TO_CATEGORY: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [CATEGORY_SLUGS[c], c])
) as Record<string, Category>;

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

type CategoryStyle = {
  dot: string;
  bg: string;
  text: string;
  ring: string;
};

// Written out literally on purpose — Tailwind v4's JIT scanner statically
// greps source for class names, so a template string like `bg-${c}-500`
// would silently never generate the CSS.
export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
  Work: {
    dot: "bg-sky-500",
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-500",
  },
  Safarnama: {
    dot: "bg-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-700",
    ring: "ring-teal-500",
  },
  Personal: {
    dot: "bg-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-500",
  },
  "Family & Partner": {
    dot: "bg-pink-500",
    bg: "bg-pink-50",
    text: "text-pink-700",
    ring: "ring-pink-500",
  },
  Learning: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-500",
  },
  Finance: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-500",
  },
  Lifestyle: {
    dot: "bg-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-500",
  },
};
