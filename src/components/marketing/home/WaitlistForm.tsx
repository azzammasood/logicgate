"use client";

import { useState, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="hero-fade-up hero-fade-up-3 waitlist-confirm" role="status">
        ✓ You&apos;re on the list.
      </div>
    );
  }

  return (
    <>
      <form
        id="waitlist"
        onSubmit={handleSubmit}
        className="hero-fade-up hero-fade-up-3 waitlist-form"
        noValidate
      >
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="you@company.com"
          aria-label="Email address"
          aria-invalid={error ? true : undefined}
          autoComplete="email"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: "13.5px",
            color: "#eef0f6",
            padding: "11px 16px",
          }}
        />
        <button
          type="submit"
          style={{
            border: "none",
            cursor: "pointer",
            background: "#4ade80",
            color: "#060d08",
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            padding: "11px 20px",
            whiteSpace: "nowrap",
          }}
        >
          Join waitlist →
        </button>
      </form>
      {error ? (
        <p
          role="alert"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 8,
            fontSize: 12,
            color: "#f87171",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      ) : null}
    </>
  );
}
