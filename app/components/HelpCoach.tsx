"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type HelpMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions: Record<number, string[]> = {
  1: ["What should I enter on this page?", "How do I choose a strong book idea?", "What if I do not know my title yet?"],
  2: ["What should I do with my blueprint?", "Can I change my chapters?", "Should I add or delete chapters?"],
  3: ["How do I start writing a chapter?", "How much should I write?", "How do I continue if I get stuck?"],
  4: ["What should I review here?", "How do I improve my manuscript?", "What should I fix before formatting?"],
  5: ["What additional pages do I need?", "Do I need an About the Author page?", "What should go in acknowledgments?"],
  6: ["Which formatting options should I choose?", "What trim size should I use?", "How do I prepare for Amazon KDP?"],
  7: ["Which file should I download?", "Is this ready for Amazon KDP?", "What should I check before publishing?"],
  8: ["What cover do I need for KDP?", "What is the difference between Kindle and paperback covers?", "How should I design my cover?"],
  9: ["How do I publish on Amazon?", "What should I know before uploading to KDP?", "What file do I upload first?"],
};

export default function HelpCoach({
  currentStep,
  isOpen,
  onOpenChange,
}: {
  currentStep?: number;
  projectId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<HelpMessage[]>([
    {
      role: "assistant",
      content:
        "Need help? Ask me what to do on this page, how this step works, or what to do next.",
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const questions =
    suggestedQuestions[currentStep || 0] || [
      "What should I do on this page?",
      "How does this part of 9 Day Author work?",
      "What should I do next?",
    ];

  async function sendMessage(messageOverride?: string) {
    const messageToSend = (messageOverride || input).trim();
    if (!messageToSend || isThinking) return;

    setInput("");
    setErrorMessage("");
    setIsThinking(true);

    const nextMessages: HelpMessage[] = [
      ...messages,
      { role: "user", content: messageToSend },
    ];

    setMessages(nextMessages);

    try {
      const response = await fetch("/api/help-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          currentStep,
          currentPage: pathname,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Help Coach could not respond.");
        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.reply || "I can help you understand what to do next.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong opening Help Coach.");
    } finally {
      setIsThinking(false);
    }
  }

  if (!mounted || !isOpen) return null;

  return createPortal(
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 999999999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.55)",
      padding: "16px",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "440px",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "28px",
        background: "white",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      }}
    >
      <div className="flex items-center justify-between bg-black px-5 py-4 text-white">
        <div>
          <div className="text-sm font-black text-[#d4af37]">
            9 Day Author Help
          </div>
          <div className="text-xs text-white/50">Ask about this page</div>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-full bg-white/10 px-3 py-1 text-sm font-black"
        >
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#faf8f3] p-4">
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-black text-white"
                    : "bg-white text-black/70"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isThinking ? (
            <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black/45">
              Thinking...
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-black/10 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {questions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => sendMessage(question)}
              className="rounded-full border border-black/10 bg-[#faf8f3] px-3 py-2 text-xs font-bold text-black/60 hover:border-[#d4af37]"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask for help..."
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
          />

          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={isThinking || !input.trim()}
            className="rounded-xl bg-black px-4 py-3 text-sm font-black text-[#d4af37] disabled:opacity-40"
          >
            Send
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-3 text-sm font-bold text-red-600">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </div>
  </div>,
  document.body
);
}