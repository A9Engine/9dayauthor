"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteBookButton({
  projectId,
  bookTitle,
}: {
  projectId: string;
  bookTitle: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${bookTitle}"?\n\nThis will permanently remove this book project and its chapters.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      const response = await fetch("/api/delete-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Could not delete this book.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong deleting this book.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-4 flex w-full justify-center">
      <button
  type="button"
  onClick={handleDelete}
  disabled={isDeleting}
  title="Delete book"
  className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[11px] font-bold transition hover:bg-red-50 disabled:opacity-50"
  style={{ color: "#dc2626" }}
>
  {isDeleting ? "Deleting..." : "Delete Book"}
</button>
    </div>
  );
}