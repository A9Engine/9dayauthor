"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContinueWritingButton({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots((current) => (current >= 3 ? 1 : current + 1));
    }, 450);

    return () => clearInterval(interval);
  }, [isLoading]);

  async function handleContinue() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/create-chapters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        setErrorMessage(result.error || "Failed to create chapters.");
        return;
      }

      router.push(`/chapters?id=${projectId}`);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setErrorMessage("Something went wrong while opening chapters.");
    }
  }

  return (
    <div className="mt-6">
      {errorMessage ? (
        <div className="mb-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleContinue}
        disabled={isLoading}
        className="block w-full cursor-pointer rounded-2xl bg-[#d4af37] px-6 py-4 text-center font-black text-black transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <span className="inline-flex min-w-[180px] justify-center">
            <span>Opening Chapters</span>
            <span className="inline-block w-8 text-left">
              {".".repeat(dots)}
            </span>
          </span>
        ) : (
          "Continue Writing"
        )}
      </button>
    </div>
  );
}