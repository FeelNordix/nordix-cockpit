"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
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

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(
        "Het versturen van de herstelmail is niet gelukt. Probeer het later opnieuw."
      );
      return;
    }

    setSuccessMessage(
      "Als dit e-mailadres bekend is, ontvang je een link om je wachtwoord opnieuw in te stellen."
    );
  }

  function showPasswordReset() {
    setIsResettingPassword(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function showLogin() {
    setIsResettingPassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-nordix-mist bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase text-nordix-pine">
        {isResettingPassword ? "Wachtwoord herstellen" : "Inloggen"}
      </p>
      <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
        {isResettingPassword ? "Herstellink aanvragen" : "Nordix Cockpit"}
      </h2>

      <form
        onSubmit={isResettingPassword ? requestPasswordReset : login}
        className="mt-6 space-y-4"
      >
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

        {!isResettingPassword ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Wachtwoord
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
              required
            />
          </label>
        ) : null}

        {errorMessage ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-nordix-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nordix-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting
            ? isResettingPassword
              ? "Herstellink versturen..."
              : "Inloggen..."
            : isResettingPassword
              ? "Herstellink versturen"
              : "Inloggen"}
        </button>

        <button
          type="button"
          onClick={isResettingPassword ? showLogin : showPasswordReset}
          className="w-full text-sm font-semibold text-nordix-pine transition hover:text-nordix-fjord"
        >
          {isResettingPassword ? "Terug naar inloggen" : "Wachtwoord vergeten?"}
        </button>
      </form>
    </section>
  );
}
