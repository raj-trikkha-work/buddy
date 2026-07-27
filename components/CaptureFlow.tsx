"use client";

import { useState } from "react";
import { Category } from "@/lib/categories";
import { ConversationMessage, Task } from "@/lib/types";
import CategoryPicker from "@/components/CategoryPicker";

type SpeechRecognitionResultLike = {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

type SpeechRecognitionErrorLike = {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type Draft = {
  title: string;
  due_date: string;
  category: Category;
  raw_input: string;
};

type CaptureFlowProps = {
  presetCategory?: Category;
  onCaptured?: (task: Task) => void;
};

export default function CaptureFlow({ presetCategory, onCaptured }: CaptureFlowProps) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const resetCapture = () => {
    setConversation([]);
    setPendingQuestion(null);
    setStatus("");
    setDraft(null);
  };

  const submitEntry = async (text: string) => {
    setStatus(`"${text}"`);

    const nextConversation: ConversationMessage[] = [
      ...conversation,
      { role: "user", content: text },
    ];
    setConversation(nextConversation);

    const res = await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextConversation, presetCategory }),
    });

    if (!res.ok) {
      setStatus("Something went wrong — try again.");
      return;
    }

    const result = await res.json();

    if (result.status === "ready") {
      setDraft(result.draft);
      setPendingQuestion(null);
      setStatus("");
    } else {
      setPendingQuestion(result.follow_up_question);
      setConversation([
        ...nextConversation,
        { role: "assistant", content: result.follow_up_question },
      ]);
      setStatus("");
    }
  };

  const handleMicClick = () => {
    const win = window as SpeechWindow;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatus("Voice input isn't supported in this browser — type below instead.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      submitEntry(transcript);
    };

    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        "not-allowed":
          "Microphone permission is blocked for this site. Tap the lock icon next to the address bar → Permissions → Microphone → Allow.",
        "service-not-allowed":
          "Microphone permission is blocked for this site. Tap the lock icon next to the address bar → Permissions → Microphone → Allow.",
        "no-speech": "Didn't hear anything — tap the mic and try again.",
        network:
          "Network issue reaching the speech service — check your connection, or type below instead.",
        "audio-capture": "No microphone was found on this device.",
        aborted: "Listening was interrupted — try again.",
      };
      setStatus(
        messages[event.error] ??
          `Voice input error: "${event.error}" — try again, or type below instead.`
      );
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
    setStatus(pendingQuestion ? "Listening for your answer..." : "Listening...");
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typedInput.trim();
    if (!text) return;
    setTypedInput("");
    submitEntry(text);
  };

  const handleConfirm = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);

    if (!res.ok) {
      setStatus("Couldn't save that — try again.");
      return;
    }

    const { task } = await res.json();
    resetCapture();
    setStatus("Saved.");
    onCaptured?.(task);
  };

  if (draft) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs text-stone-400 mb-1">Does this look right?</p>
          <p className="text-lg font-medium text-stone-800">{draft.title}</p>
          <p className="text-sm text-stone-500">Due {draft.due_date}</p>
        </div>
        <CategoryPicker
          value={draft.category}
          onChange={(category) => setDraft({ ...draft, category })}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetCapture}
            className="flex-1 rounded-lg border border-stone-200 text-stone-600 text-sm py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 text-white text-sm py-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <button
        onClick={handleMicClick}
        className={`w-24 h-24 rounded-full text-white text-3xl flex items-center justify-center shadow-lg transition ${
          listening ? "bg-red-500 animate-pulse" : "bg-indigo-600"
        }`}
      >
        🎤
      </button>

      <form onSubmit={handleTypedSubmit} className="w-full max-w-md flex gap-2">
        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder={pendingQuestion ? "Type your answer..." : "...or type a task here"}
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-stone-800 text-white text-sm px-4 py-2"
        >
          Add
        </button>
      </form>

      {pendingQuestion && (
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-900">{pendingQuestion}</p>
          <button
            onClick={resetCapture}
            className="text-xs text-amber-700 underline mt-2"
          >
            Cancel this entry
          </button>
        </div>
      )}

      <p className="text-sm text-stone-500 h-5">{status}</p>
    </div>
  );
}
