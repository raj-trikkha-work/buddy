import { CATEGORIES, Category } from "@/lib/categories";
import CategoryChip from "@/components/CategoryChip";

type CategoryPickerProps = {
  value: Category;
  onChange: (category: Category) => void;
};

export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <CategoryChip
          key={category}
          category={category}
          selected={category === value}
          onClick={() => onChange(category)}
          size="sm"
        />
      ))}
    </div>
  );
}
