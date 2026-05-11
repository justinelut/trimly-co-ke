"use client";

/**
 * Type-as-you-search filter. Push the query into the URL so the list is
 * shareable + refreshable, and so the server component re-renders with
 * the filtered set (the data adapter reads searchParams).
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ClientSearch({ initial }: { initial?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initial ?? "");

  // Debounce — push to URL 300ms after the last keystroke
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      router.replace(`/operator/clients?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
    // params/router intentionally omitted from deps; we drive URL from `value`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      className="t-search"
      placeholder="Search by name, email, phone, estate…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoComplete="off"
      aria-label="Search clients"
    />
  );
}
