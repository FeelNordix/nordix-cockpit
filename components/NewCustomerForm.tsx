"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { customerDetailsDefaults } from "@/lib/customerDefaults";
import { getNextOfferNumber, saveCustomer } from "@/lib/customerStorage";
import { getNextOfferNumberForTrips } from "@/lib/offerNumbers";
import { createSupabaseClient } from "@/lib/supabaseClient";
import type { Customer } from "@/types/customer";

const emptyForm = {
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phone: "",
  destination: "",
  travelPeriod: "",
  status: "Nieuwe aanvraag",
  brand: "Feel Nordix",
  notes: ""
};

type SupabaseTripNumberRow = {
  offer_number: string | null;
  trip_number: string | null;
  invoice_number: string | null;
};

export default function NewCustomerForm() {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedCustomerId, setSavedCustomerId] = useState("");

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSavedCustomerId("");
    setIsSaving(true);

    let offerNumber = "";

    try {
      offerNumber = await getNextOfferNumberFromSupabase();
    } catch {
      offerNumber = getNextOfferNumber();
    }

    const customer: Customer = {
      id: crypto.randomUUID(),
      ...customerDetailsDefaults,
      offerNumber,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      companyName: form.companyName.trim() || "Particulier",
      email: form.email.trim(),
      phone: form.phone.trim() || "Nog niet ingevuld",
      destination: form.destination.trim() || "Nog te bepalen",
      travelPeriod: form.travelPeriod.trim() || "Nog te bepalen",
      status: form.status as Customer["status"],
      brand: form.brand as Customer["brand"],
      notes: form.notes.trim() || "Nog geen notities."
    };

    saveCustomer(customer);
    setSavedCustomerId(customer.id);

    try {
      await saveCustomerToSupabase(customer);
      setSuccessMessage("Aanvraag opgeslagen.");
      setIsSaving(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nieuwe aanvraag is lokaal opgeslagen, maar Supabase opslaan is mislukt.";

      setErrorMessage(
        message
      );
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm font-medium text-nordix-ink shadow-sm transition hover:border-nordix-fjord hover:text-nordix-pine"
      >
        Terug naar klanten
      </Link>

      <section className="rounded-lg border border-nordix-mist bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-nordix-pine">
          Nieuwe aanvraag
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
          Nieuwe klant toevoegen
        </h2>

        <form onSubmit={addCustomer} className="mt-6 grid gap-4 md:grid-cols-2">
          <TextField label="Voornaam" value={form.firstName} onChange={(value) => updateField("firstName", value)} required />
          <TextField label="Achternaam" value={form.lastName} onChange={(value) => updateField("lastName", value)} required />
          <TextField label="Bedrijfsnaam" value={form.companyName} onChange={(value) => updateField("companyName", value)} />
          <TextField label="E-mail" type="email" value={form.email} onChange={(value) => updateField("email", value)} required />
          <TextField label="Telefoonnummer" value={form.phone} onChange={(value) => updateField("phone", value)} />
          <TextField label="Gewenste bestemming" value={form.destination} onChange={(value) => updateField("destination", value)} />
          <TextField label="Reisperiode" value={form.travelPeriod} onChange={(value) => updateField("travelPeriod", value)} />

          <BrandField value={form.brand as Customer["brand"]} onChange={(value) => updateField("brand", value)} />

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="mt-1 w-full rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
            >
              <option>Nieuwe aanvraag</option>
              <option>Intake gepland</option>
              <option>Reisvoorstel</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Opmerkingen/notities
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className="mt-1 min-h-32 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
              placeholder="Bijv. wensen, gezinssamenstelling, budget of praktische aandachtspunten."
            />
          </label>

          <div className="md:col-span-2">
            {successMessage ? (
              <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {successMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-nordix-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nordix-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </button>
            {successMessage && savedCustomerId ? (
              <Link
                href={`/customers/${savedCustomerId}`}
                className="ml-3 inline-flex rounded-md border border-nordix-mist bg-white px-4 py-2.5 text-sm font-semibold text-nordix-ink shadow-sm transition hover:border-nordix-fjord hover:text-nordix-pine"
              >
                Naar klantdossier
              </Link>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

async function saveCustomerToSupabase(customer: Customer) {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const hasSession = Boolean(sessionData.session);

  if (!hasSession) {
    throw new Error(
      "Nieuwe aanvraag is lokaal opgeslagen, maar er is geen actieve Supabase sessie."
    );
  }

  const { data: createdCustomer, error: customerError } = await supabase
    .from("customers")
    .insert({
      id: customer.id,
      first_name: customer.firstName,
      last_name: customer.lastName,
      company_name: customer.companyName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status
    })
    .select("id")
    .single();

  if (customerError || !createdCustomer) {
    throw new Error(
      customerError?.message ||
        "Nieuwe aanvraag is lokaal opgeslagen, maar customers aanmaken is mislukt."
    );
  }

  const { data: createdTrip, error: tripError } = await supabase
    .from("trips")
    .insert({
      customer_id: createdCustomer.id,
      brand: customer.brand,
      offer_number: customer.offerNumber,
      destination: customer.destination,
      travel_period: customer.travelPeriod,
      trip_name: customer.tripName,
      quote_sent: customer.quoteSent,
      quote_confirmed: customer.quoteConfirmed
    })
    .select("id")
    .single();

  if (tripError || !createdTrip) {
    throw new Error(
      tripError?.message ||
        "Nieuwe aanvraag is lokaal opgeslagen, maar trips aanmaken is mislukt."
    );
  }

  return {
    customerId: createdCustomer.id,
    tripId: createdTrip.id
  };
}

async function getNextOfferNumberFromSupabase() {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const hasSession = Boolean(sessionData.session);

  if (!hasSession) {
    throw new Error("Er is geen actieve Supabase sessie.");
  }

  const { data, error } = await supabase
    .from("trips")
    .select("offer_number,trip_number,invoice_number");

  if (error) {
    throw new Error(error.message || "Volgend offertenummer ophalen is mislukt.");
  }

  return getNextOfferNumberForTrips((data ?? []) as SupabaseTripNumberRow[]);
}

type BrandFieldProps = {
  value: Customer["brand"];
  onChange: (value: Customer["brand"]) => void;
};

function BrandField({ value, onChange }: BrandFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">Merk</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Customer["brand"])}
        className="mt-1 w-full rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
      >
        <option>Feel Nordix</option>
        <option>Feel Dutch</option>
      </select>
    </label>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
};

function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text"
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
        required={required}
      />
    </label>
  );
}
