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
  streetAddress: "",
  postalCode: "",
  city: "",
  country: "",
  destination: "",
  travelPeriod: "",
  offerNumber: "",
  tripNumber: "",
  invoiceNumber: "",
  tripName: "",
  departureDate: "",
  returnDate: "",
  status: "Nieuwe aanvraag",
  brand: "Feel Nordix",
  notes: ""
};

type EntryType = "new" | "historical";

type SupabaseTripNumberRow = {
  customer_id: string | null;
  offer_number: string | null;
  trip_number: string | null;
  invoice_number: string | null;
};

type SupabaseCustomerMatchRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

class SupabaseSaveError extends Error {
  customerCreated: boolean;

  constructor(message: string, customerCreated = false) {
    super(message);
    this.customerCreated = customerCreated;
  }
}

export default function NewCustomerForm() {
  const [form, setForm] = useState(emptyForm);
  const [entryType, setEntryType] = useState<EntryType>("new");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [matchingCustomerId, setMatchingCustomerId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedCustomerId, setSavedCustomerId] = useState("");

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectEntryType(value: EntryType) {
    setEntryType(value);
    setErrorMessage("");
    setWarningMessage("");
    setMatchingCustomerId("");
    setSuccessMessage("");
    setSavedCustomerId("");
    setForm((current) => ({
      ...current,
      status: value === "historical" ? "Op reis geweest" : "Nieuwe aanvraag"
    }));
  }

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setWarningMessage("");
    setMatchingCustomerId("");
    setSuccessMessage("");
    setSavedCustomerId("");
    setIsSaving(true);

    const isHistorical = entryType === "historical";
    const historicalNumbers = {
      offerNumber: form.offerNumber.trim(),
      tripNumber: form.tripNumber.trim(),
      invoiceNumber: form.invoiceNumber.trim()
    };

    if (
      isHistorical &&
      !historicalNumbers.offerNumber &&
      !historicalNumbers.tripNumber &&
      !historicalNumbers.invoiceNumber
    ) {
      setErrorMessage(
        "Vul minimaal een offerte-, reis- of factuurnummer in voor het historische dossier."
      );
      setIsSaving(false);
      return;
    }

    if (isHistorical) {
      try {
        const duplicateCustomerId = await findCustomerIdByHistoricalNumber(
          historicalNumbers
        );

        if (duplicateCustomerId) {
          setErrorMessage(
            "Dit offerte-, reis- of factuurnummer bestaat al. Het historische dossier is niet opgeslagen."
          );
          setMatchingCustomerId(duplicateCustomerId);
          setIsSaving(false);
          return;
        }

        const customerMatch = await findMatchingCustomer(
          form.firstName,
          form.lastName,
          form.email
        );

        if (customerMatch) {
          setWarningMessage(
            "Er bestaat al een klant met dezelfde naam en hetzelfde e-mailadres. Controleer na opslaan of dit een aparte reis hoort te zijn."
          );
          setMatchingCustomerId(customerMatch.id);
        }
      } catch {
        setErrorMessage(
          "De controle op bestaande historische dossiers is mislukt. Er is niets opgeslagen."
        );
        setIsSaving(false);
        return;
      }
    }

    let offerNumber = historicalNumbers.offerNumber;

    if (!isHistorical) {
      try {
        offerNumber = await getNextOfferNumberFromSupabase();
      } catch {
        offerNumber = getNextOfferNumber();
      }
    }

    const customer: Customer = {
      id: crypto.randomUUID(),
      ...customerDetailsDefaults,
      offerNumber,
      tripNumber: isHistorical ? historicalNumbers.tripNumber : "",
      invoiceNumber: isHistorical ? historicalNumbers.invoiceNumber : "",
      tripName: isHistorical ? form.tripName.trim() : "",
      departureDate: isHistorical ? form.departureDate : "",
      returnDate: isHistorical ? form.returnDate : "",
      quoteConfirmed: isHistorical,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      companyName: form.companyName.trim() || "Particulier",
      email: form.email.trim(),
      phone: form.phone.trim() || "Nog niet ingevuld",
      streetAddress: form.streetAddress.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      destination: form.destination.trim() || "Nog te bepalen",
      travelPeriod: form.travelPeriod.trim() || "Nog te bepalen",
      status: form.status as Customer["status"],
      brand: form.brand as Customer["brand"],
      notes: form.notes.trim() || "Nog geen notities."
    };

    try {
      await saveCustomerToSupabase(customer);
      setSavedCustomerId(customer.id);
      setSuccessMessage(
        isHistorical ? "Historisch dossier opgeslagen." : "Aanvraag opgeslagen."
      );
      setIsSaving(false);
    } catch (error) {
      const customerAlreadyCreated =
        error instanceof SupabaseSaveError && error.customerCreated;

      if (!isHistorical && !customerAlreadyCreated) {
        saveCustomer(customer);
        setSavedCustomerId(customer.id);
        setErrorMessage(
          "Supabase opslaan mislukt. Aanvraag is tijdelijk lokaal opgeslagen."
        );
      } else {
        setSavedCustomerId(customerAlreadyCreated ? customer.id : "");
        setMatchingCustomerId(customerAlreadyCreated ? customer.id : "");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Opslaan is mislukt. Er is geen lokaal dossier aangemaakt."
        );
      }

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
          {entryType === "historical" ? "Historisch dossier" : "Nieuwe aanvraag"}
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
          {entryType === "historical"
            ? "Historisch dossier toevoegen"
            : "Nieuwe klant toevoegen"}
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <EntryTypeButton
            active={entryType === "new"}
            label="Nieuwe aanvraag"
            onClick={() => selectEntryType("new")}
          />
          <EntryTypeButton
            active={entryType === "historical"}
            label="Historisch dossier"
            onClick={() => selectEntryType("historical")}
          />
        </div>

        <form onSubmit={addCustomer} className="mt-6 grid gap-4 md:grid-cols-2">
          <TextField label="Voornaam" value={form.firstName} onChange={(value) => updateField("firstName", value)} required />
          <TextField label="Achternaam" value={form.lastName} onChange={(value) => updateField("lastName", value)} required />
          <TextField label="Bedrijfsnaam" value={form.companyName} onChange={(value) => updateField("companyName", value)} />
          <TextField label="E-mail" type="email" value={form.email} onChange={(value) => updateField("email", value)} required />
          <TextField label="Telefoonnummer" value={form.phone} onChange={(value) => updateField("phone", value)} />
          <TextField label="Straat + huisnummer" value={form.streetAddress} onChange={(value) => updateField("streetAddress", value)} />
          <TextField label="Postcode" value={form.postalCode} onChange={(value) => updateField("postalCode", value)} />
          <TextField label="Plaats" value={form.city} onChange={(value) => updateField("city", value)} />
          <TextField label="Land" value={form.country} onChange={(value) => updateField("country", value)} />
          <TextField label="Gewenste bestemming" value={form.destination} onChange={(value) => updateField("destination", value)} />
          <TextField label="Reisperiode" value={form.travelPeriod} onChange={(value) => updateField("travelPeriod", value)} />

          <BrandField value={form.brand as Customer["brand"]} onChange={(value) => updateField("brand", value)} />

          {entryType === "historical" ? (
            <>
              <TextField label="Offertenummer" value={form.offerNumber} onChange={(value) => updateField("offerNumber", value)} />
              <TextField label="Reisnummer" value={form.tripNumber} onChange={(value) => updateField("tripNumber", value)} />
              <TextField label="Factuurnummer" value={form.invoiceNumber} onChange={(value) => updateField("invoiceNumber", value)} />
              <TextField label="Reisnaam" value={form.tripName} onChange={(value) => updateField("tripName", value)} />
              <TextField label="Vertrekdatum" type="date" value={form.departureDate} onChange={(value) => updateField("departureDate", value)} />
              <TextField label="Terugkomstdatum" type="date" value={form.returnDate} onChange={(value) => updateField("returnDate", value)} />
              <p className="text-sm text-slate-600 md:col-span-2">
                Vul minimaal een offerte-, reis- of factuurnummer in. Historische
                datums mogen in het verleden liggen.
              </p>
            </>
          ) : null}

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
              <option>Geannuleerd</option>
              <option>Op reis geweest</option>
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
            {warningMessage ? (
              <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                {warningMessage}
              </p>
            ) : null}
            {matchingCustomerId ? (
              <Link
                href={`/customers/${matchingCustomerId}`}
                className="mb-3 inline-flex text-sm font-semibold text-nordix-pine transition hover:text-nordix-fjord"
              >
                Open bestaand klantdossier
              </Link>
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
    throw new SupabaseSaveError(
      "Opslaan is mislukt omdat er geen actieve Supabase-sessie is."
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
      street_address: emptyToNull(customer.streetAddress),
      postal_code: emptyToNull(customer.postalCode),
      city: emptyToNull(customer.city),
      country: emptyToNull(customer.country),
      status: customer.status
    })
    .select("id")
    .single();

  if (customerError || !createdCustomer) {
    throw new SupabaseSaveError(
      "Klantgegevens aanmaken in Supabase is mislukt. Er is niets lokaal opgeslagen."
    );
  }

  const { data: createdTrip, error: tripError } = await supabase
    .from("trips")
    .insert({
      customer_id: createdCustomer.id,
      brand: customer.brand,
      offer_number: emptyToNull(customer.offerNumber),
      trip_number: emptyToNull(customer.tripNumber),
      invoice_number: emptyToNull(customer.invoiceNumber),
      destination: customer.destination,
      travel_period: customer.travelPeriod,
      trip_name: customer.tripName,
      departure_date: emptyToNull(customer.departureDate),
      return_date: emptyToNull(customer.returnDate),
      quote_sent: customer.quoteSent,
      quote_confirmed: customer.quoteConfirmed
    })
    .select("id")
    .single();

  if (tripError || !createdTrip) {
    throw new SupabaseSaveError(
      "De klant is aangemaakt, maar het gekoppelde reisrecord kon niet worden opgeslagen. Er is geen lokaal duplicaat aangemaakt.",
      true
    );
  }

  return {
    customerId: createdCustomer.id,
    tripId: createdTrip.id
  };
}

function emptyToNull(value: string) {
  return value || null;
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

async function findCustomerIdByHistoricalNumber(numbers: {
  offerNumber: string;
  tripNumber: string;
  invoiceNumber: string;
}) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .select("customer_id,offer_number,trip_number,invoice_number");

  if (error) {
    throw new Error(error.message);
  }

  const values = new Set(
    [numbers.offerNumber, numbers.tripNumber, numbers.invoiceNumber].filter(Boolean)
  );
  const matchingTrip = ((data ?? []) as SupabaseTripNumberRow[]).find((trip) =>
    [trip.offer_number, trip.trip_number, trip.invoice_number].some(
      (number) => number && values.has(number)
    )
  );

  return matchingTrip?.customer_id || "";
}

async function findMatchingCustomer(
  firstName: string,
  lastName: string,
  email: string
) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id,first_name,last_name,email");

  if (error) {
    throw new Error(error.message);
  }

  const normalizedFirstName = normalizeMatchValue(firstName);
  const normalizedLastName = normalizeMatchValue(lastName);
  const normalizedEmail = normalizeMatchValue(email);

  return ((data ?? []) as SupabaseCustomerMatchRow[]).find((customer) => {
    return (
      normalizeMatchValue(customer.first_name) === normalizedFirstName &&
      normalizeMatchValue(customer.last_name) === normalizedLastName &&
      normalizeMatchValue(customer.email) === normalizedEmail
    );
  });
}

function normalizeMatchValue(value: string | null) {
  return (value || "").trim().toLowerCase();
}

type EntryTypeButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function EntryTypeButton({ active, label, onClick }: EntryTypeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? "border-nordix-pine bg-nordix-pine text-white"
          : "border-nordix-mist bg-white text-nordix-ink hover:border-nordix-fjord hover:text-nordix-pine"
      }`}
    >
      {label}
    </button>
  );
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
