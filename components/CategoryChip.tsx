import { Category, CATEGORY_STYLES } from "@/lib/categories";

type CategoryChipProps = {
  category: Category;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
};

export default function CategoryChip({
  category,
  selected = true,
  onClick,
  size = "md",
}: CategoryChipProps) {
  const style = CATEGORY_STYLES[category];
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  const classes = `inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition ${padding} ${
    selected ? `${style.bg} ${style.text}` : "bg-stone-100 text-stone-400"
  }`;

  const content = (
    <>
      <span
        className={`${dotSize} rounded-full ${selected ? style.dot : "bg-stone-300"}`}
      />
      {category}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <span className={classes}>{content}</span>;
}
