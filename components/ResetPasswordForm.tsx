"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("De wachtwoorden komen niet overeen.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Je wachtwoord is aangepast. Je gaat zo naar de loginpagina.");
    await supabase.auth.signOut();
    setIsSubmitting(false);

    window.setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 1500);
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-nordix-mist bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase text-nordix-pine">
        Wachtwoord herstellen
      </p>
      <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
        Nieuw wachtwoord instellen
      </h2>

      <form onSubmit={updatePassword} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Nieuw wachtwoord
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
            minLength={8}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Herhaal wachtwoord
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
            minLength={8}
            required
          />
        </label>

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
          {isSubmitting ? "Opslaan..." : "Wachtwoord opslaan"}
        </button>
      </form>
    </section>
  );
}
