"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { btnPrimary } from "@/lib/styles";

/** فرم ورود پنل پذیرش — ثبت‌نشست فقط با کوکی httpOnly امضاشدهٔ سرور */
export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok) {
        // نشست در کوکی httpOnly تنظیم شد؛ پنل دوباره با نشست ساخته می‌شود
        router.replace("/admin");
        router.refresh();
        return;
      }
      setMessage(
        data !== null &&
          typeof data === "object" &&
          typeof (data as { message?: unknown }).message === "string"
          ? (data as { message: string }).message
          : "ورود ناموفق بود؛ دوباره تلاش کنید.",
      );
    } catch {
      setMessage("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) void submit();
      }}
    >
      <div>
        <label
          htmlFor="admin-username"
          className="block text-sm font-bold text-heading"
        >
          نام کاربری
        </label>
        <input
          id="admin-username"
          type="text"
          dir="ltr"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-left text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
        />
      </div>
      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-bold text-heading"
        >
          گذرواژه
        </label>
        <input
          id="admin-password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-left text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
        />
      </div>
      {message ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${btnPrimary} w-full disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        ورود به پنل
      </button>
    </form>
  );
}
