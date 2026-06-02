"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-nordix-mist bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase text-nordix-pine">
        Inloggen
      </p>
      <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
        Nordix Cockpit
      </h2>

      <form onSubmit={login} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Wachtwoord</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
            required
          />
        </label>

        {errorMessage ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-nordix-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nordix-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Inloggen..." : "Inloggen"}
        </button>
      </form>
    </section>
  );
}
