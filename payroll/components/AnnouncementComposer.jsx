"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnnouncementComposer({ endpoint = "/api/announcements" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = message.trim();

    if (!trimmed) {
      setError("Please enter an announcement.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to post announcement.");
      }

      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex gap-3 rounded-3xl border border-sage/35 bg-pakistan-green/92 p-4 shadow-xl shadow-black/10 backdrop-blur"
      >
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write an announcement..."
          className="min-w-0 flex-1 rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none transition placeholder:text-gray/70 focus:border-royal-purple focus:ring-2 focus:ring-royal-purple/25"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-royal-purple px-4 py-3 font-semibold text-lavender transition hover:bg-eminence disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Posting..." : "Post Announcement"}
        </button>
      </form>
      {error ? <p className="px-1 text-sm text-gray">{error}</p> : null}
    </div>
  );
}
