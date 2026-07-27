"use client";

import { Category } from "@/lib/categories";
import { Task } from "@/lib/types";
import CaptureFlow from "@/components/CaptureFlow";

type CaptureModalProps = {
  open: boolean;
  onClose: () => void;
  presetCategory?: Category;
  onCaptured?: (task: Task) => void;
};

export default function CaptureModal({
  open,
  onClose,
  presetCategory,
  onCaptured,
}: CaptureModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative w-full sm:max-w-md bg-stone-50 rounded-t-3xl sm:rounded-3xl p-6 pb-8 flex flex-col items-center gap-4 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-stone-300 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 text-sm"
        >
          Close
        </button>
        <CaptureFlow
          presetCategory={presetCategory}
          onCaptured={(task) => {
            onCaptured?.(task);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
