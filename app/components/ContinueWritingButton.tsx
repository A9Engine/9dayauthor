"use client";

import { useEffect, useState } from "react";

export default function ContinueWritingButton({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots((current) => (current >= 3 ? 1 : current + 1));
    }, 450);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <a
      href={`/chapters?id=${projectId}`}
      onClick={() => setIsLoading(true)}
      className="mt-6 block w-full cursor-pointer rounded-2xl bg-[#d4af37] px-6 py-4 text-center font-black text-black transition hover:-translate-y-0.5 hover:opacity-90"
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
    </a>
  );
}