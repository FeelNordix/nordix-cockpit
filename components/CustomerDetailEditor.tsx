"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  customerDetailsDefaults,
  getCustomerWorkflowState,
  getDefaultQuoteFollowUpDate,
  getDefaultTravelDocumentDates,
  normalizeCustomer,
  recalculateWorkflowDates,
  withConfirmedNumbers
} from "@/lib/customerDefaults";
import { getAllCustomers, saveCustomer } from "@/lib/customerStorage";
import { createSupabaseClient } from "@/lib/supabaseClient";
import type { Customer, Traveler } from "@/types/customer";

type CustomerDetailEditorProps = {
  id: string;
};

type DataSource = "Supabase" | "Fallback";

type SupabaseCustomerRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  status: Customer["status"] | string | null;
};

type SupabaseTripRow = {
  id: string;
  brand: Customer["brand"] | string | null;
  offer_number: string | null;
  trip_number: string | null;
  invoice_number: string | null;
  destination: string | null;
  travel_period: string | null;
  trip_name: string | null;
  departure_date: string | null;
  return_date: string | null;
  quote_sent: boolean | null;
  quote_sent_date: string | null;
  quote_follow_up_date: string | null;
  quote_confirmed: boolean | null;
  quote_confirmed_date: string | null;
  invoice_date: string | null;
  travel_documents_prepare_from_date: string | null;
  travel_documents_planned_send_date: string | null;
  travel_documents_prepared: boolean | null;
  travel_documents_sent: boolean | null;
  travel_documents_sent_date: string | null;
  post_trip_contacted: boolean | null;
  post_trip_contact_date: string | null;
  google_review_link_sent: boolean | null;
  google_review_link_sent_date: string | null;
};

type SupabaseNoteRow = {
  id: string;
  body?: string | null;
  note?: string | null;
};

type SupabaseTravelerRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  traveler_type: Traveler["type"] | string | null;
  notes: string | null;
};

type SupabasePaymentRow = {
  id: string;
  payment_type: "deposit" | "final" | "full" | string | null;
  label: string | null;
  total_amount: number | string | null;
  due_date: string | null;
  received: boolean | null;
  received_date: string | null;
};

type SupabasePaymentIds = {
  deposit: string;
  final: string;
  full: string;
};

const emptyPaymentIds: SupabasePaymentIds = {
  deposit: "",
  final: "",
  full: ""
};

export default function CustomerDetailEditor({ id }: CustomerDetailEditorProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("Fallback");
  const [supabaseTripId, setSupabaseTripId] = useState("");
  const [supabaseNoteId, setSupabaseNoteId] = useState("");
  const [supabasePaymentIds, setSupabasePaymentIds] =
    useState<SupabasePaymentIds>(emptyPaymentIds);
  const [deletedSupabaseTravelerIds, setDeletedSupabaseTravelerIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [adultsOpen, setAdultsOpen] = useState(false);
  const [childrenOpen, setChildrenOpen] = useState(false);

  useEffect(() => {
    setCustomer(null);
    setDataSource("Supabase");
    setSupabaseTripId("");
    setSupabaseNoteId("");
    setSupabasePaymentIds(emptyPaymentIds);
    setDeletedSupabaseTravelerIds([]);
    setAdultsOpen(false);
    setChildrenOpen(false);

    loadCustomerFromSupabase(id)
      .then((result) => {
        if (result) {
          setCustomer(result.customer);
          setDataSource("Supabase");
          setSupabaseTripId(result.tripId);
          setSupabaseNoteId(result.noteId);
          setSupabasePaymentIds(result.paymentIds);
          setDeletedSupabaseTravelerIds([]);
        }
      })
      .catch(() => {
        const foundCustomer = getAllCustomers().find((item) => item.id === id) ?? null;

        setCustomer(foundCustomer);
        setDataSource("Fallback");
      });
  }, [id]);

  function updateField<Field extends keyof Customer>(
    field: Field,
    value: Customer[Field]
  ) {
    setSaved(false);
    setSaveError("");
    setCustomer((current) => {
      if (!current) {
        return current;
      }

      const updatedCustomer = { ...current, [field]: value };

      if (field === "quoteConfirmed" && value === true) {
        return withConfirmedNumbers(updatedCustomer);
      }

      if (
        field === "quoteSentDate" &&
        typeof value === "string" &&
        value &&
        !updatedCustomer.quoteFollowUpDate
      ) {
        return {
          ...updatedCustomer,
          quoteFollowUpDate: getDefaultQuoteFollowUpDate(value)
        };
      }

      if (
        (field === "departureDate" || field === "invoiceDate") &&
        typeof value === "string" &&
        value
      ) {
        return recalculateWorkflowDates(updatedCustomer);
      }

      return updatedCustomer;
    });
  }

  function addTraveler() {
    setSaved(false);
    setSaveError("");
    setAdultsOpen(true);
    setCustomer((current) => {
      if (!current) {
        return current;
      }

      const traveler: Traveler = {
        id: crypto.randomUUID(),
        firstName: "",
        lastName: "",
        birthDate: "",
        type: "adult",
        notes: ""
      };

      return {
        ...current,
        travelers: [...current.travelers, traveler]
      };
    });
  }

  function updateTraveler<Field extends keyof Traveler>(
    travelerId: string,
    field: Field,
    value: Traveler[Field]
  ) {
    setSaved(false);
    setSaveError("");

    if (field === "type") {
      if (value === "child") {
        setChildrenOpen(true);
      } else {
        setAdultsOpen(true);
      }
    }

    setCustomer((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        travelers: current.travelers.map((traveler) =>
          traveler.id === travelerId ? { ...traveler, [field]: value } : traveler
        )
      };
    });
  }

  function removeTraveler(travelerId: string) {
    setSaved(false);
    setSaveError("");
    if (dataSource === "Supabase") {
      setDeletedSupabaseTravelerIds((current) =>
        current.includes(travelerId) ? current : [...current, travelerId]
      );
    }
    setCustomer((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        travelers: current.travelers.filter((traveler) => traveler.id !== travelerId)
      };
    });
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customer) {
      return;
    }

    setSaved(false);
    setSaveError("");
    setIsSaving(true);

    try {
      if (dataSource === "Supabase") {
        const savedNoteId = await saveCustomerToSupabase(
          customer,
          supabaseTripId,
          supabaseNoteId,
          supabasePaymentIds,
          deletedSupabaseTravelerIds
        );
        setSupabaseNoteId(savedNoteId.noteId);
        setSupabasePaymentIds(savedNoteId.paymentIds);
        setDeletedSupabaseTravelerIds([]);
      } else {
        saveCustomer(customer);
      }

      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Wijzigingen opslaan is mislukt."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Link
          href="/customers"
          className="inline-flex rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm font-medium text-nordix-ink shadow-sm transition hover:border-nordix-fjord hover:text-nordix-pine"
        >
          Terug naar klanten
        </Link>
        <section className="rounded-lg border border-nordix-mist bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-nordix-ink">
            Klant niet gevonden
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {dataSource === "Supabase"
              ? "Deze klant staat niet in Supabase."
              : "Deze klant staat niet in de fallback data."}
          </p>
          <p className="mt-4 text-sm font-semibold text-nordix-ink">
            Bron: {dataSource}
          </p>
        </section>
      </div>
    );
  }

  const workflowState = getCustomerWorkflowState(customer);
  const usesFullPayment = workflowState.paymentType === "full";
  const adultCount = customer.travelers.filter((traveler) => traveler.type === "adult").length;
  const childCount = customer.travelers.filter((traveler) => traveler.type === "child").length;
  const travelerCount = customer.travelers.length;
  const adultTravelers = customer.travelers.filter((traveler) => traveler.type === "adult");
  const childTravelers = customer.travelers.filter((traveler) => traveler.type === "child");
  const travelDocumentWarnings = getTravelDocumentDateWarnings(customer);

  function recalculateTravelDocumentDates() {
    setSaved(false);
    setSaveError("");
    setCustomer((current) => {
      if (!current?.departureDate) {
        return current;
      }

      const dates = getDefaultTravelDocumentDates(current.departureDate);

      return {
        ...current,
        travelDocumentsPrepareFromDate: dates.prepareFromDate,
        travelDocumentsPlannedSendDate: dates.plannedSendDate
      };
    });
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
          Klantdetail
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-nordix-ink">
              {customer.firstName} {customer.lastName}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {customer.offerNumber || "Nog geen nummer"} - {customer.brand} - {customer.destination}
            </p>
          </div>
          <span className="w-fit rounded-md bg-nordix-mist px-3 py-1.5 text-sm font-semibold text-nordix-ink">
            {customer.status}
          </span>
        </div>
        <p className="mt-4 text-sm font-semibold text-nordix-ink">
          Bron: {dataSource}
        </p>
      </section>

      <form
        onSubmit={saveChanges}
        className="space-y-5"
      >
        <SectionCard title="Samenvatting">
          <SummaryItem label="Hoofdboeker" value={`${customer.firstName} ${customer.lastName}`} />
          <SummaryItem label="Reis-/offertenummer" value={customer.tripNumber || customer.offerNumber || "-"} />
          <SummaryItem label="Reisnaam" value={customer.tripName || customer.destination || "Nog te bepalen"} />
          <SummaryItem label="Reisperiode" value={customer.travelPeriod || "Nog te bepalen"} />
          <SummaryItem label="Merk" value={customer.brand} />
          <SummaryItem label="Aantal reizigers" value={`${travelerCount}`} />
        </SectionCard>

        <SectionCard title="Nummers">
          <BrandField value={customer.brand} onChange={(value) => updateField("brand", value)} />
          <TextField label="Offertenummer" value={customer.offerNumber} onChange={(value) => updateField("offerNumber", value)} />
          <TextField label="Reisnummer" value={customer.tripNumber} onChange={(value) => updateField("tripNumber", value)} />
          <TextField label="Factuurnummer" value={customer.invoiceNumber} onChange={(value) => updateField("invoiceNumber", value)} />
          <p className="text-sm leading-6 text-slate-600 md:col-span-2">
            Automatisch voorgesteld, handmatig aanpasbaar. Bij bevestiging vult
            het systeem lege reis- en factuurnummers met het offertenummer.
          </p>
        </SectionCard>

        <SectionCard title="Klantgegevens">
          <TextField label="Voornaam" value={customer.firstName} onChange={(value) => updateField("firstName", value)} required />
          <TextField label="Achternaam" value={customer.lastName} onChange={(value) => updateField("lastName", value)} required />
          <TextField label="Bedrijfsnaam" value={customer.companyName} onChange={(value) => updateField("companyName", value)} />
          <TextField label="E-mail" type="email" value={customer.email} onChange={(value) => updateField("email", value)} required />
          <TextField label="Telefoonnummer" value={customer.phone} onChange={(value) => updateField("phone", value)} />
          <TextField label="Straat + huisnummer" value={customer.streetAddress} onChange={(value) => updateField("streetAddress", value)} />
          <TextField label="Postcode" value={customer.postalCode} onChange={(value) => updateField("postalCode", value)} />
          <TextField label="Plaats" value={customer.city} onChange={(value) => updateField("city", value)} />
          <TextField label="Land" value={customer.country} onChange={(value) => updateField("country", value)} />
          <TextField label="Reisperiode" value={customer.travelPeriod} onChange={(value) => updateField("travelPeriod", value)} />
          <StatusField value={customer.status} onChange={(value) => updateField("status", value)} />
        </SectionCard>

        <SectionCard title="Reizigers">
          <div className="md:col-span-2">
            <p className="mb-4 text-sm font-semibold text-nordix-ink">
              Bron reizigers: {dataSource}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <CountCard label="Totaal" value={travelerCount} />
              <CountCard
                label="Volwassenen"
                value={adultCount}
                open={adultsOpen}
                onClick={() => setAdultsOpen((current) => !current)}
              />
              <CountCard
                label="Kinderen"
                value={childCount}
                open={childrenOpen}
                onClick={() => setChildrenOpen((current) => !current)}
              />
            </div>

            {adultsOpen ? (
              <TravelerGroup
                title="Volwassenen"
                travelers={adultTravelers}
                updateTraveler={updateTraveler}
                removeTraveler={removeTraveler}
              />
            ) : null}

            {childrenOpen ? (
              <TravelerGroup
                title="Kinderen"
                travelers={childTravelers}
                updateTraveler={updateTraveler}
                removeTraveler={removeTraveler}
              />
            ) : null}

            <button
              type="button"
              onClick={addTraveler}
              className="mt-5 rounded-md bg-nordix-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nordix-pine/90"
            >
              Reiziger toevoegen
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Offerte">
          <BooleanField label="Offerte verstuurd" value={customer.quoteSent} onChange={(value) => updateField("quoteSent", value)} />
          <TextField label="Datum offerte verstuurd" type="date" value={customer.quoteSentDate} onChange={(value) => updateField("quoteSentDate", value)} />
          <TextField label="Opvolgdatum offerte" type="date" value={customer.quoteFollowUpDate} onChange={(value) => updateField("quoteFollowUpDate", value)} />
          <BooleanField label="Offerte bevestigd door klant" value={customer.quoteConfirmed} onChange={(value) => updateField("quoteConfirmed", value)} />
          <TextField label="Datum bevestiging" type="date" value={customer.quoteConfirmedDate} onChange={(value) => updateField("quoteConfirmedDate", value)} />
          <TextField label="Factuurdatum" type="date" value={customer.invoiceDate} onChange={(value) => updateField("invoiceDate", value)} />
        </SectionCard>

        {workflowState.showConfirmedSections ? (
          <>
            <SectionCard title="Reis">
              <TextField label="Reisnaam" value={customer.tripName} onChange={(value) => updateField("tripName", value)} />
              <TextField label="Vertrekdatum" type="date" value={customer.departureDate} onChange={(value) => updateField("departureDate", value)} />
              <TextField label="Terugkomstdatum" type="date" value={customer.returnDate} onChange={(value) => updateField("returnDate", value)} />
            </SectionCard>

            <SectionCard title="Betalingen">
              <p className="text-sm font-semibold text-nordix-ink md:col-span-2">
                Bron betalingen: {dataSource}
              </p>
              <TextField label="Totaalbedrag" type="number" value={customer.totalAmount} onChange={(value) => updateField("totalAmount", value)} />
              <PaymentTypeField value={customer.paymentType} onChange={(value) => updateField("paymentType", value)} />

              {usesFullPayment ? (
                <>
                  <TextField label="Volledige reissom vervaldatum" type="date" value={customer.fullPaymentDueDate} onChange={(value) => updateField("fullPaymentDueDate", value)} />
                  <BooleanField label="Volledige reissom ontvangen" value={customer.fullPaymentReceived} onChange={(value) => updateField("fullPaymentReceived", value)} />
                  <TextField label="Datum volledige betaling ontvangen" type="date" value={customer.fullPaymentDate} onChange={(value) => updateField("fullPaymentDate", value)} />
                </>
              ) : (
                <>
                  <TextField label="Aanbetaling vervaldatum" type="date" value={customer.depositDueDate} onChange={(value) => updateField("depositDueDate", value)} />
                  <BooleanField label="Aanbetaling ontvangen" value={customer.depositReceived} onChange={(value) => updateField("depositReceived", value)} />
                  <TextField label="Datum aanbetaling ontvangen" type="date" value={customer.depositDate} onChange={(value) => updateField("depositDate", value)} />
                  <TextField label="Restantbetaling vervaldatum" type="date" value={customer.finalPaymentDueDate} onChange={(value) => updateField("finalPaymentDueDate", value)} />
                  <BooleanField label="Restantbetaling ontvangen" value={customer.finalPaymentReceived} onChange={(value) => updateField("finalPaymentReceived", value)} />
                  <TextField label="Datum restantbetaling ontvangen" type="date" value={customer.finalPaymentDate} onChange={(value) => updateField("finalPaymentDate", value)} />
                </>
              )}
            </SectionCard>

            <SectionCard title="Reisdocumenten">
              <p className="text-sm font-semibold text-nordix-ink md:col-span-2">
                Bron reisdocumenten: {dataSource}
              </p>
              {travelDocumentWarnings.length > 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 md:col-span-2">
                  <p className="font-semibold">Controleer de reisdocumentdatums.</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {travelDocumentWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <TextField label="Reisdocumenten voorbereiden vanaf datum" type="date" value={customer.travelDocumentsPrepareFromDate} onChange={(value) => updateField("travelDocumentsPrepareFromDate", value)} />
              <TextField label="Geplande verzenddatum reisdocumenten" type="date" value={customer.travelDocumentsPlannedSendDate} onChange={(value) => updateField("travelDocumentsPlannedSendDate", value)} />
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={recalculateTravelDocumentDates}
                  disabled={!customer.departureDate}
                  className="rounded-md border border-nordix-fjord bg-white px-4 py-2.5 text-sm font-semibold text-nordix-ink shadow-sm transition hover:border-nordix-pine hover:text-nordix-pine disabled:cursor-not-allowed disabled:border-nordix-mist disabled:text-slate-400"
                >
                  Datums opnieuw berekenen
                </button>
                <p className="mt-2 text-sm text-slate-600">
                  Zet voorbereiden op 28 dagen voor vertrek en verzending op 21
                  dagen voor vertrek.
                </p>
              </div>
              <BooleanField label="Reisdocumenten voorbereid" value={customer.travelDocumentsPrepared} onChange={(value) => updateField("travelDocumentsPrepared", value)} />
              <BooleanField label="Reisbescheiden verstuurd" value={customer.travelDocumentsSent} onChange={(value) => updateField("travelDocumentsSent", value)} />
              <TextField label="Datum reisbescheiden verstuurd" type="date" value={customer.travelDocumentsSentDate} onChange={(value) => updateField("travelDocumentsSentDate", value)} />
            </SectionCard>

            <SectionCard title="Na de reis">
              <BooleanField label="Contact opgenomen na reis" value={customer.postTripContacted} onChange={(value) => updateField("postTripContacted", value)} />
              <TextField label="Datum contact na reis" type="date" value={customer.postTripContactDate} onChange={(value) => updateField("postTripContactDate", value)} />
              <BooleanField label="Google Review-link verstuurd" value={customer.googleReviewLinkSent} onChange={(value) => updateField("googleReviewLinkSent", value)} />
              <TextField label="Datum review-link verstuurd" type="date" value={customer.googleReviewLinkSentDate} onChange={(value) => updateField("googleReviewLinkSentDate", value)} />
            </SectionCard>
          </>
        ) : null}

        <SectionCard title="Notities / opmerkingen">
          <TextareaField label="Opmerkingen" value={customer.notes} onChange={(value) => updateField("notes", value)} />
        </SectionCard>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-nordix-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nordix-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
          {saved ? (
            <p className="text-sm font-medium text-nordix-pine">
              Wijzigingen opgeslagen.
            </p>
          ) : null}
          {saveError ? (
            <p className="text-sm font-medium text-red-700">
              {saveError}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

async function loadCustomerFromSupabase(id: string) {
  const supabase = createSupabaseClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id,first_name,last_name,company_name,email,phone,street_address,postal_code,city,country,status")
    .eq("id", id)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (!customer) {
    return null;
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select(
      "id,brand,offer_number,trip_number,invoice_number,destination,travel_period,trip_name,departure_date,return_date,quote_sent,quote_sent_date,quote_follow_up_date,quote_confirmed,quote_confirmed_date,invoice_date,travel_documents_prepare_from_date,travel_documents_planned_send_date,travel_documents_prepared,travel_documents_sent,travel_documents_sent_date,post_trip_contacted,post_trip_contact_date,google_review_link_sent,google_review_link_sent_date"
    )
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tripError) {
    throw new Error(tripError.message);
  }

  const tripRow = (trip as SupabaseTripRow | null) ?? null;
  let travelerRows: SupabaseTravelerRow[] = [];
  let paymentRows: SupabasePaymentRow[] = [];

  if (tripRow?.id) {
    const { data: travelers, error: travelersError } = await supabase
      .from("travelers")
      .select("id,first_name,last_name,birth_date,traveler_type,notes")
      .eq("trip_id", tripRow.id)
      .order("created_at", { ascending: true });

    if (travelersError) {
      throw new Error(travelersError.message);
    }

    travelerRows = (travelers ?? []) as SupabaseTravelerRow[];

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("id,payment_type,label,total_amount,due_date,received,received_date")
      .eq("trip_id", tripRow.id);

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }

    paymentRows = (payments ?? []) as SupabasePaymentRow[];
  }

  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (noteError) {
    throw new Error(noteError.message);
  }

  const noteRow = (note as SupabaseNoteRow | null) ?? null;

  return {
    customer: mapSupabaseCustomer(
      customer as SupabaseCustomerRow,
      tripRow,
      noteRow,
      travelerRows,
      paymentRows
    ),
    tripId: tripRow?.id || "",
    noteId: noteRow?.id || "",
    paymentIds: getPaymentIds(paymentRows)
  };
}

function mapSupabaseCustomer(
  customer: SupabaseCustomerRow,
  trip: SupabaseTripRow | null,
  note: SupabaseNoteRow | null,
  travelers: SupabaseTravelerRow[],
  payments: SupabasePaymentRow[]
): Customer {
  const paymentsByType = getPaymentsByType(payments);
  const depositPayment = paymentsByType.deposit;
  const finalPayment = paymentsByType.final;
  const fullPayment = paymentsByType.full;
  const paymentType: Customer["paymentType"] = fullPayment ? "full" : "deposit_and_final";
  const totalAmount =
    formatAmount(fullPayment?.total_amount) ||
    formatAmount(depositPayment?.total_amount) ||
    formatAmount(finalPayment?.total_amount);

  return normalizeCustomer({
    id: customer.id,
    ...customerDetailsDefaults,
    firstName: customer.first_name || "",
    lastName: customer.last_name || "",
    companyName: customer.company_name || "Particulier",
    email: customer.email || "",
    phone: customer.phone || "Nog niet ingevuld",
    streetAddress: customer.street_address || "",
    postalCode: customer.postal_code || "",
    city: customer.city || "",
    country: customer.country || "",
    destination: trip?.destination || "Nog te bepalen",
    travelPeriod: trip?.travel_period || "Nog te bepalen",
    status: normalizeStatus(customer.status),
    notes: note?.body || note?.note || "",
    brand: normalizeBrand(trip?.brand),
    offerNumber: trip?.offer_number || "",
    tripNumber: trip?.trip_number || "",
    invoiceNumber: trip?.invoice_number || "",
    tripName: trip?.trip_name || "",
    departureDate: trip?.departure_date || "",
    returnDate: trip?.return_date || "",
    quoteSent: trip?.quote_sent === true,
    quoteSentDate: trip?.quote_sent_date || "",
    quoteFollowUpDate: trip?.quote_follow_up_date || "",
    quoteConfirmed: trip?.quote_confirmed === true,
    quoteConfirmedDate: trip?.quote_confirmed_date || "",
    invoiceDate: trip?.invoice_date || "",
    travelDocumentsPrepareFromDate:
      trip?.travel_documents_prepare_from_date || "",
    travelDocumentsPlannedSendDate:
      trip?.travel_documents_planned_send_date || "",
    travelDocumentsPrepared: trip?.travel_documents_prepared === true,
    travelDocumentsSent: trip?.travel_documents_sent === true,
    travelDocumentsSentDate: trip?.travel_documents_sent_date || "",
    postTripContacted: trip?.post_trip_contacted === true,
    postTripContactDate: trip?.post_trip_contact_date || "",
    googleReviewLinkSent: trip?.google_review_link_sent === true,
    googleReviewLinkSentDate: trip?.google_review_link_sent_date || "",
    totalAmount,
    paymentType,
    depositDueDate: depositPayment?.due_date || "",
    depositReceived: depositPayment?.received === true,
    depositDate: depositPayment?.received_date || "",
    finalPaymentDueDate: finalPayment?.due_date || "",
    finalPaymentReceived: finalPayment?.received === true,
    finalPaymentDate: finalPayment?.received_date || "",
    fullPaymentDueDate: fullPayment?.due_date || "",
    fullPaymentReceived: fullPayment?.received === true,
    fullPaymentDate: fullPayment?.received_date || "",
    travelers: travelers.map(mapSupabaseTraveler)
  });
}

function getPaymentsByType(payments: SupabasePaymentRow[]) {
  return {
    deposit: payments.find((payment) => payment.payment_type === "deposit"),
    final: payments.find((payment) => payment.payment_type === "final"),
    full: payments.find((payment) => payment.payment_type === "full")
  };
}

function getPaymentIds(payments: SupabasePaymentRow[]): SupabasePaymentIds {
  const paymentsByType = getPaymentsByType(payments);

  return {
    deposit: paymentsByType.deposit?.id || "",
    final: paymentsByType.final?.id || "",
    full: paymentsByType.full?.id || ""
  };
}

function formatAmount(amount: number | string | null | undefined) {
  return amount === null || amount === undefined ? "" : String(amount);
}

function mapSupabaseTraveler(traveler: SupabaseTravelerRow): Traveler {
  return {
    id: traveler.id,
    firstName: traveler.first_name || "",
    lastName: traveler.last_name || "",
    birthDate: traveler.birth_date || "",
    type: traveler.traveler_type === "child" ? "child" : "adult",
    notes: traveler.notes || ""
  };
}

function normalizeStatus(status: string | null): Customer["status"] {
  if (
    status === "Nieuwe aanvraag" ||
    status === "Intake gepland" ||
    status === "Reisvoorstel" ||
    status === "Geannuleerd" ||
    status === "Op reis geweest"
  ) {
    return status;
  }

  return "Nieuwe aanvraag";
}

function normalizeBrand(brand: string | null | undefined): Customer["brand"] {
  return brand === "Feel Dutch" ? "Feel Dutch" : "Feel Nordix";
}

function getTravelDocumentDateWarnings(customer: Customer) {
  if (!customer.departureDate) {
    return [];
  }

  const warnings: string[] = [];
  const departureDate = parseIsoInputDate(customer.departureDate);

  if (!departureDate) {
    return ["De vertrekdatum is geen geldige ISO-datum in formaat YYYY-MM-DD."];
  }

  addTravelDocumentDateWarning(
    warnings,
    "Voorbereiden vanaf",
    customer.travelDocumentsPrepareFromDate,
    departureDate
  );
  addTravelDocumentDateWarning(
    warnings,
    "Geplande verzending",
    customer.travelDocumentsPlannedSendDate,
    departureDate
  );

  return warnings;
}

function addTravelDocumentDateWarning(
  warnings: string[],
  label: string,
  dateValue: string,
  departureDate: Date
) {
  if (!dateValue) {
    return;
  }

  const parsedDate = parseIsoInputDate(dateValue);

  if (!parsedDate) {
    warnings.push(
      `${label} is geen geldige ISO-datum. Gebruik YYYY-MM-DD. Huidige waarde: ${dateValue}.`
    );
    return;
  }

  const daysBeforeDeparture = getDayDifference(parsedDate, departureDate);

  if (daysBeforeDeparture < 0) {
    warnings.push(`${label} ligt na de vertrekdatum.`);
    return;
  }

  if (daysBeforeDeparture > 90) {
    warnings.push(
      `${label} ligt ${daysBeforeDeparture} dagen voor vertrek en lijkt onrealistisch vroeg.`
    );
  }
}

function parseIsoInputDate(dateValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getDayDifference(fromDate: Date, toDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay);
}

async function saveCustomerToSupabase(
  customer: Customer,
  tripId: string,
  noteId: string,
  paymentIds: SupabasePaymentIds,
  deletedTravelerIds: string[]
) {
  const supabase = createSupabaseClient();
  const { data: updatedCustomer, error: customerError } = await supabase
    .from("customers")
    .update({
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
    .eq("id", customer.id)
    .select("id")
    .maybeSingle();

  if (customerError || !updatedCustomer) {
    throw new Error(
      customerError?.message ||
        "Klantgegevens opslaan in Supabase is mislukt."
    );
  }

  const { data: updatedTrips, error: tripError } = await supabase
    .from("trips")
    .update({
      brand: customer.brand,
      offer_number: customer.offerNumber,
      trip_number: customer.tripNumber,
      invoice_number: customer.invoiceNumber,
      destination: customer.destination,
      travel_period: customer.travelPeriod,
      trip_name: customer.tripName,
      departure_date: emptyToNull(customer.departureDate),
      return_date: emptyToNull(customer.returnDate),
      quote_sent: customer.quoteSent,
      quote_sent_date: emptyToNull(customer.quoteSentDate),
      quote_follow_up_date: emptyToNull(customer.quoteFollowUpDate),
      quote_confirmed: customer.quoteConfirmed,
      quote_confirmed_date: emptyToNull(customer.quoteConfirmedDate),
      invoice_date: emptyToNull(customer.invoiceDate),
      travel_documents_prepare_from_date: emptyToNull(
        customer.travelDocumentsPrepareFromDate
      ),
      travel_documents_planned_send_date: emptyToNull(
        customer.travelDocumentsPlannedSendDate
      ),
      travel_documents_prepared: customer.travelDocumentsPrepared,
      travel_documents_sent: customer.travelDocumentsSent,
      travel_documents_sent_date: emptyToNull(customer.travelDocumentsSentDate),
      post_trip_contacted: customer.postTripContacted,
      post_trip_contact_date: emptyToNull(customer.postTripContactDate),
      google_review_link_sent: customer.googleReviewLinkSent,
      google_review_link_sent_date: emptyToNull(
        customer.googleReviewLinkSentDate
      )
    })
    .eq("customer_id", customer.id)
    .select("id");

  if (tripError || !updatedTrips || updatedTrips.length === 0) {
    throw new Error(
      tripError?.message ||
        "Reisgegevens opslaan in Supabase is mislukt."
    );
  }

  const savedPaymentIds = await savePaymentsToSupabase(
    customer,
    tripId,
    paymentIds
  );
  await saveTravelersToSupabase(customer.travelers, tripId, deletedTravelerIds);
  const savedNoteId = await saveNoteToSupabase(customer, tripId, noteId);

  return {
    noteId: savedNoteId,
    paymentIds: savedPaymentIds
  };
}

async function savePaymentsToSupabase(
  customer: Customer,
  tripId: string,
  paymentIds: SupabasePaymentIds
) {
  if (!tripId) {
    throw new Error("Betalingen opslaan in Supabase is mislukt: reis ontbreekt.");
  }

  if (customer.paymentType === "full") {
    const fullId = await savePaymentToSupabase({
      id: paymentIds.full,
      tripId,
      paymentType: "full",
      label: "Volledige reissom",
      totalAmount: customer.totalAmount,
      dueDate: customer.fullPaymentDueDate,
      received: customer.fullPaymentReceived,
      receivedDate: customer.fullPaymentDate
    });

    return {
      ...paymentIds,
      full: fullId
    };
  }

  const depositId = await savePaymentToSupabase({
    id: paymentIds.deposit,
    tripId,
    paymentType: "deposit",
    label: "Aanbetaling",
    totalAmount: customer.totalAmount,
    dueDate: customer.depositDueDate,
    received: customer.depositReceived,
    receivedDate: customer.depositDate
  });
  const finalId = await savePaymentToSupabase({
    id: paymentIds.final,
    tripId,
    paymentType: "final",
    label: "Restantbetaling",
    totalAmount: customer.totalAmount,
    dueDate: customer.finalPaymentDueDate,
    received: customer.finalPaymentReceived,
    receivedDate: customer.finalPaymentDate
  });

  return {
    ...paymentIds,
    deposit: depositId,
    final: finalId
  };
}

async function savePaymentToSupabase({
  id,
  tripId,
  paymentType,
  label,
  totalAmount,
  dueDate,
  received,
  receivedDate
}: {
  id: string;
  tripId: string;
  paymentType: "deposit" | "final" | "full";
  label: string;
  totalAmount: string;
  dueDate: string;
  received: boolean;
  receivedDate: string;
}) {
  const supabase = createSupabaseClient();
  const payload = {
    trip_id: tripId,
    payment_type: paymentType,
    label,
    total_amount: amountToNumber(totalAmount),
    due_date: emptyToNull(dueDate),
    received,
    received_date: emptyToNull(receivedDate)
  };

  if (id) {
    const { data, error } = await supabase
      .from("payments")
      .update(payload)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message || `${label} opslaan is mislukt.`);
    }

    return data.id as string;
  }

  const { data, error } = await supabase
    .from("payments")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || `${label} aanmaken is mislukt.`);
  }

  return data.id as string;
}

async function saveTravelersToSupabase(
  travelers: Traveler[],
  tripId: string,
  deletedTravelerIds: string[]
) {
  const supabase = createSupabaseClient();

  if (!tripId && (travelers.length > 0 || deletedTravelerIds.length > 0)) {
    throw new Error("Reizigers opslaan in Supabase is mislukt: reis ontbreekt.");
  }

  if (deletedTravelerIds.length > 0) {
    const { error } = await supabase
      .from("travelers")
      .delete()
      .in("id", deletedTravelerIds);

    if (error) {
      throw new Error(error.message || "Reiziger verwijderen is mislukt.");
    }
  }

  if (travelers.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("travelers")
    .upsert(
      travelers.map((traveler) => ({
        id: traveler.id,
        trip_id: tripId,
        first_name: traveler.firstName,
        last_name: traveler.lastName,
        birth_date: emptyToNull(traveler.birthDate),
        traveler_type: traveler.type,
        notes: traveler.notes
      }))
    )
    .select("id");

  if (error) {
    throw new Error(error.message || "Reizigers opslaan in Supabase is mislukt.");
  }
}

async function saveNoteToSupabase(
  customer: Customer,
  tripId: string,
  noteId: string
) {
  const supabase = createSupabaseClient();

  if (noteId) {
    const { data: updatedNote, error } = await supabase
      .from("notes")
      .update(getNotePayload(customer.notes, "both"))
      .eq("id", noteId)
      .select("id")
      .maybeSingle();

    if (error && isMissingNoteColumnError(error)) {
      return updateNoteWithFallbackColumn(customer.notes, noteId, error.message);
    }

    if (error || !updatedNote) {
      throw new Error(
        error?.message || "Notities opslaan in Supabase is mislukt."
      );
    }

    return updatedNote.id as string;
  }

  const { data: createdNote, error } = await supabase
    .from("notes")
    .insert({
      customer_id: customer.id,
      trip_id: tripId || null,
      ...getNotePayload(customer.notes, "both")
    })
    .select("id")
    .single();

  if (error && isMissingNoteColumnError(error)) {
    return createNoteWithFallbackColumn(
      customer,
      tripId,
      error.message
    );
  }

  if (error || !createdNote) {
    throw new Error(
      error?.message || "Notities aanmaken in Supabase is mislukt."
    );
  }

  return createdNote.id as string;
}

async function updateNoteWithFallbackColumn(
  notes: string,
  noteId: string,
  errorMessage: string
) {
  const supabase = createSupabaseClient();
  const column = getAvailableNoteColumn(errorMessage);
  const { data, error } = await supabase
    .from("notes")
    .update(getNotePayload(notes, column))
    .eq("id", noteId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Notities opslaan in Supabase is mislukt.");
  }

  return data.id as string;
}

async function createNoteWithFallbackColumn(
  customer: Customer,
  tripId: string,
  errorMessage: string
) {
  const supabase = createSupabaseClient();
  const column = getAvailableNoteColumn(errorMessage);
  const { data, error } = await supabase
    .from("notes")
    .insert({
      customer_id: customer.id,
      trip_id: tripId || null,
      ...getNotePayload(customer.notes, column)
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Notities aanmaken in Supabase is mislukt.");
  }

  return data.id as string;
}

function getNotePayload(notes: string, column: "body" | "note" | "both") {
  if (column === "body") {
    return { body: notes };
  }

  if (column === "note") {
    return { note: notes };
  }

  return {
    body: notes,
    note: notes
  };
}

function isMissingNoteColumnError(error: { message: string } | null) {
  return Boolean(error?.message.match(/column .* (body|note).* does not exist/i));
}

function getAvailableNoteColumn(errorMessage: string): "body" | "note" {
  return errorMessage.toLowerCase().includes("body") ? "note" : "body";
}

function emptyToNull(value: string) {
  return value || null;
}

function amountToNumber(value: string) {
  if (!value) {
    return null;
  }

  const amount = Number(value);
  return Number.isNaN(amount) ? null : amount;
}

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="rounded-lg border border-nordix-mist bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-nordix-ink">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 font-semibold text-nordix-ink">{value}</p>
    </div>
  );
}

type CountCardProps = {
  label: string;
  value: number;
  open?: boolean;
  onClick?: () => void;
};

function CountCard({ label, value, open, onClick }: CountCardProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        className="rounded-md border border-nordix-mist bg-white px-4 py-3 text-left transition hover:border-nordix-fjord hover:shadow-sm"
      >
        <p className="text-sm text-slate-600">{label}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold text-nordix-ink">{value}</p>
          <p className="text-sm font-semibold text-nordix-pine">
            {open ? "Inklappen" : "Bekijken"}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-md border border-nordix-mist bg-white px-4 py-3">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-nordix-ink">{value}</p>
    </div>
  );
}

type TravelerGroupProps = {
  title: string;
  travelers: Traveler[];
  updateTraveler: <Field extends keyof Traveler>(
    travelerId: string,
    field: Field,
    value: Traveler[Field]
  ) => void;
  removeTraveler: (travelerId: string) => void;
};

function TravelerGroup({
  title,
  travelers,
  updateTraveler,
  removeTraveler
}: TravelerGroupProps) {
  return (
    <section className="mt-5">
      <h4 className="text-sm font-semibold text-nordix-ink">{title}</h4>
      {travelers.length === 0 ? (
        <p className="mt-3 rounded-md bg-nordix-snow px-4 py-3 text-sm text-slate-600">
          Geen reizigers in deze groep.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {travelers.map((traveler) => (
            <details
              key={traveler.id}
              className="group rounded-lg border border-nordix-mist bg-nordix-snow"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className="block font-semibold text-nordix-ink">
                    {[traveler.firstName, traveler.lastName].filter(Boolean).join(" ") || "Nieuwe reiziger"}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {traveler.type === "child" ? "Kind" : "Volwassene"}
                    {traveler.birthDate ? ` - ${traveler.birthDate}` : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold text-nordix-pine group-open:hidden">
                  Uitklappen
                </span>
                <span className="hidden text-sm font-semibold text-nordix-pine group-open:inline">
                  Inklappen
                </span>
              </summary>
              <div className="border-t border-nordix-mist p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Voornaam" value={traveler.firstName} onChange={(value) => updateTraveler(traveler.id, "firstName", value)} />
                  <TextField label="Achternaam" value={traveler.lastName} onChange={(value) => updateTraveler(traveler.id, "lastName", value)} />
                  <TextField label="Geboortedatum" type="date" value={traveler.birthDate} onChange={(value) => updateTraveler(traveler.id, "birthDate", value)} />
                  <TravelerTypeField value={traveler.type} onChange={(value) => updateTraveler(traveler.id, "type", value)} />
                  <TextareaField label="Opmerkingen" value={traveler.notes} onChange={(value) => updateTraveler(traveler.id, "notes", value)} />
                </div>
                <button
                  type="button"
                  onClick={() => removeTraveler(traveler.id)}
                  className="mt-4 rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm font-medium text-nordix-ink transition hover:border-nordix-fjord hover:text-nordix-pine"
                >
                  Reiziger verwijderen
                </button>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
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
        step={type === "number" ? "0.01" : undefined}
        className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
        required={required}
      />
    </label>
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

type BooleanFieldProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function BooleanField({ label, value, onChange }: BooleanFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value ? "ja" : "nee"}
        onChange={(event) => onChange(event.target.value === "ja")}
        className="mt-1 w-full rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
      >
        <option value="nee">Nee</option>
        <option value="ja">Ja</option>
      </select>
    </label>
  );
}

type StatusFieldProps = {
  value: Customer["status"];
  onChange: (value: Customer["status"]) => void;
};

function StatusField({ value, onChange }: StatusFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">Status</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Customer["status"])}
        className="mt-1 w-full rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
      >
        <option>Nieuwe aanvraag</option>
        <option>Intake gepland</option>
        <option>Reisvoorstel</option>
        <option>Geannuleerd</option>
        <option>Op reis geweest</option>
      </select>
    </label>
  );
}

type PaymentTypeFieldProps = {
  value: Customer["paymentType"];
  onChange: (value: Customer["paymentType"]) => void;
};

function PaymentTypeField({ value, onChange }: PaymentTypeFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">Betalingsvorm</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Customer["paymentType"])}
        className="mt-1 w-full rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
      >
        <option value="deposit_and_final">Aanbetaling + restant</option>
        <option value="full">Volledige reissom</option>
      </select>
    </label>
  );
}

type TravelerTypeFieldProps = {
  value: Traveler["type"];
  onChange: (value: Traveler["type"]) => void;
};

function TravelerTypeField({ value, onChange }: TravelerTypeFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">Type reiziger</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Traveler["type"])}
        className="mt-1 w-full rounded-md border border-nordix-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
      >
        <option value="adult">Volwassene</option>
        <option value="child">Kind</option>
      </select>
    </label>
  );
}

type TextareaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextareaField({ label, value, onChange }: TextareaFieldProps) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-32 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
      />
    </label>
  );
}
