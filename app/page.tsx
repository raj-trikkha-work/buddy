"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  created_at: string;
};

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

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

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState("");

  const loadTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
  };

  useEffect(() => {
    // Fetch-on-mount: intentional. This page has no server-rendered data
    // to hydrate from — the task list only exists client-side via Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, []);

  const resetCapture = () => {
    setConversation([]);
    setPendingQuestion(null);
    setStatus("");
  };

  // Shared by both voice and typed input — either path produces plain text,
  // which is all this pipeline needs from here on.
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
      body: JSON.stringify({ messages: nextConversation }),
    });

    if (!res.ok) {
      setStatus("Something went wrong — try again.");
      return;
    }

    const result = await res.json();

    if (result.done) {
      setStatus("Saved.");
      resetCapture();
      loadTasks();
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
    const SpeechRecognitionCtor =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatus(
        "Voice input isn't supported in this browser — type below instead."
      );
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

  const toggleDone = async (task: Task) => {
    await supabase
      .from("tasks")
      .update({ done: !task.done })
      .eq("id", task.id);
    loadTasks();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-8 bg-neutral-50">
      <h1 className="text-2xl font-semibold mt-8">Buddy</h1>

      <button
        onClick={handleMicClick}
        className={`w-24 h-24 rounded-full text-white text-3xl flex items-center justify-center shadow-lg transition ${
          listening ? "bg-red-500 animate-pulse" : "bg-blue-600"
        }`}
      >
        🎤
      </button>

      <form onSubmit={handleTypedSubmit} className="w-full max-w-md flex gap-2">
        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder={
            pendingQuestion ? "Type your answer..." : "...or type a task here"
          }
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-800 text-white text-sm px-4 py-2"
        >
          Add
        </button>
      </form>

      {pendingQuestion && (
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-900">{pendingQuestion}</p>
          <button
            onClick={resetCapture}
            className="text-xs text-amber-700 underline mt-2"
          >
            Cancel this entry
          </button>
        </div>
      )}

      <p className="text-sm text-neutral-600 h-5">{status}</p>

      <div className="w-full max-w-md flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(task)}
              className="w-5 h-5"
            />
            <div className="flex-1">
              <p className={task.done ? "line-through text-neutral-400" : ""}>
                {task.title}
              </p>
              {task.due_date && (
                <p className="text-xs text-neutral-500">
                  Due {task.due_date}
                </p>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-neutral-400 text-sm mt-4">
            No tasks yet — tap the mic or type one below.
          </p>
        )}
      </div>
    </div>
  );
}
