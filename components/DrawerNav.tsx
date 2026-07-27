"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, CATEGORY_SLUGS, CATEGORY_STYLES } from "@/lib/categories";

export default function DrawerNav() {
  const pathname = usePathname();

  const items = [
    { label: "All Tasks", href: "/dashboard" },
    ...CATEGORIES.map((category) => ({
      label: category,
      href: `/dashboard/${CATEGORY_SLUGS[category]}`,
    })),
  ];

  return (
    <nav className="w-full overflow-x-auto">
      <div className="flex gap-2 px-4 py-3 min-w-max">
        {items.map((item) => {
          const active = pathname === item.href;
          const style =
            item.label !== "All Tasks"
              ? CATEGORY_STYLES[item.label as (typeof CATEGORIES)[number]]
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                active
                  ? style
                    ? `${style.bg} ${style.text} ring-1 ${style.ring}`
                    : "bg-indigo-600 text-white"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
