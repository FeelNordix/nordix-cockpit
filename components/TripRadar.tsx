"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerDetailsDefaults, normalizeCustomer } from "@/lib/customerDefaults";
import {
  filterTripRows,
  getTripRows,
  searchTripRows,
  type TripFilter
} from "@/lib/tripRadar";
import { getAllCustomers } from "@/lib/customerStorage";
import { createSupabaseClient } from "@/lib/supabaseClient";
import type { Customer } from "@/types/customer";

type TripRadarSource = "Supabase" | "Fallback";

type SupabaseCustomerRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  status: Customer["status"] | string | null;
};

type SupabaseTripRow = {
  id: string;
  customer_id: string | null;
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

type SupabasePaymentRow = {
  trip_id: string | null;
  payment_type: "deposit" | "final" | "full" | string | null;
  total_amount: number | string | null;
  due_date: string | null;
  received: boolean | null;
  received_date: string | null;
};

const filters: Array<{ label: string; value: TripFilter }> = [
  { label: "Alle reizen", value: "all" },
  { label: "Nieuwe aanvragen", value: "new" },
  { label: "Offertefase", value: "quote" },
  { label: "Bevestigd", value: "confirmed" },
  { label: "Vertrek binnen 30 dagen", value: "upcoming" },
  { label: "Reizen in uitvoering", value: "active" },
  { label: "Vertrokken", value: "departed" },
  { label: "Afgerond", value: "completed" },
  { label: "Openstaande betalingen", value: "open-payments" }
];

export default function TripRadar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const initialFilter = getFilterValue(filterParam);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TripFilter>(initialFilter);
  const [tripRadarSource, setTripRadarSource] =
    useState<TripRadarSource>("Fallback");
  const [supabaseError, setSupabaseError] = useState("");

  useEffect(() => {
    setCustomers([]);
    setTripRadarSource("Supabase");

    loadTripRadarCustomersFromSupabase()
      .then((supabaseCustomers) => {
        setCustomers(supabaseCustomers);
        setTripRadarSource("Supabase");
        setSupabaseError("");
      })
      .catch((error) => {
        const fallbackCustomers = getAllCustomers();

        setCustomers(fallbackCustomers);
        setTripRadarSource("Fallback");
        setSupabaseError(
          error instanceof Error
            ? error.message
            : "Supabase is niet bereikbaar. Fallback Reisradar wordt getoond."
        );
      });
  }, []);

  useEffect(() => {
    setFilter(getFilterValue(filterParam));
  }, [filterParam]);

  const rows = useMemo(() => {
    const tripRows = getTripRows(customers);
    return searchTripRows(filterTripRows(tripRows, filter), query);
  }, [customers, filter, query]);

  function selectFilter(value: TripFilter) {
    setFilter(value);
    router.replace(value === "all" ? "/trips" : `/trips?filter=${value}`);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-nordix-pine">
            Reisradar
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
            Reizen in beeld
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Zoek, filter en open direct het juiste klantdossier.
          </p>
          <p className="mt-3 text-sm font-semibold text-nordix-ink">
            Bron Reisradar: {tripRadarSource}
          </p>
          {supabaseError ? (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {supabaseError}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-nordix-mist bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Zoeken
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-1 w-full rounded-md border border-nordix-mist px-3 py-2 text-sm outline-none transition focus:border-nordix-fjord focus:ring-2 focus:ring-nordix-fjord/30"
              placeholder="Klantnaam, reisnummer of reisnaam"
            />
          </label>

          <div>
            <p className="text-sm font-medium text-slate-700">Filter</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => selectFilter(item.value)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    filter === item.value
                      ? "bg-nordix-pine text-white"
                      : "border border-nordix-mist bg-white text-nordix-ink hover:border-nordix-fjord hover:text-nordix-pine"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-nordix-mist bg-white shadow-sm">
        <div className="hidden grid-cols-[0.8fr_0.8fr_1fr_1.2fr_0.9fr_0.9fr_0.9fr_1fr_1fr] gap-4 border-b border-nordix-mist bg-nordix-snow px-4 py-3 text-sm font-semibold text-slate-700 lg:grid">
          <span>Reisnummer</span>
          <span>Merk</span>
          <span>Klantnaam</span>
          <span>Reisnaam</span>
          <span>Vertrekdatum</span>
          <span>Terugkomstdatum</span>
          <span>Status</span>
          <span>Betaling</span>
          <span>Documenten</span>
        </div>

        <div className="divide-y divide-nordix-mist">
          {rows.map((row) => (
            <Link
              key={row.customerId}
              href={`/customers/${row.customerId}`}
              className="grid gap-3 px-4 py-4 text-sm transition hover:bg-nordix-snow lg:grid-cols-[0.8fr_0.8fr_1fr_1.2fr_0.9fr_0.9fr_0.9fr_1fr_1fr] lg:items-center"
            >
              <p className="font-semibold text-nordix-pine">{row.tripNumber}</p>
              <p className="text-slate-700">{row.brand}</p>
              <p className="font-semibold text-nordix-ink">{row.customerName}</p>
              <p className="text-slate-700">{row.tripName}</p>
              <p className="text-slate-700">{row.departureDate || "-"}</p>
              <p className="text-slate-700">{row.returnDate || "-"}</p>
              <span className="w-fit rounded-md bg-nordix-mist px-2.5 py-1 text-xs font-semibold text-nordix-ink">
                {row.status}
              </span>
              <p className="text-slate-700">{row.paymentStatus}</p>
              <p className="text-slate-700">{row.travelDocumentsStatus}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function getFilterValue(value: string | null): TripFilter {
  if (
    value === "new" ||
    value === "quote" ||
    value === "confirmed" ||
    value === "upcoming" ||
    value === "active" ||
    value === "departed" ||
    value === "completed" ||
    value === "open-payments"
  ) {
    return value;
  }

  return "all";
}

async function loadTripRadarCustomersFromSupabase() {
  const supabase = createSupabaseClient();
  const { data: supabaseCustomers, error: customersError } = await supabase
    .from("customers")
    .select("id,first_name,last_name,company_name,email,phone,status");

  if (customersError) {
    throw new Error(
      `Supabase klanten ophalen is mislukt. Fallback Reisradar wordt getoond. ${customersError.message}`
    );
  }

  const customerRows = (supabaseCustomers ?? []) as SupabaseCustomerRow[];
  const customerIds = customerRows.map((customer) => customer.id);
  let tripRows: SupabaseTripRow[] = [];
  let paymentRows: SupabasePaymentRow[] = [];

  if (customerIds.length > 0) {
    const { data: supabaseTrips, error: tripsError } = await supabase
      .from("trips")
      .select(
        "id,customer_id,brand,offer_number,trip_number,invoice_number,destination,travel_period,trip_name,departure_date,return_date,quote_sent,quote_sent_date,quote_follow_up_date,quote_confirmed,quote_confirmed_date,invoice_date,travel_documents_prepare_from_date,travel_documents_planned_send_date,travel_documents_prepared,travel_documents_sent,travel_documents_sent_date,post_trip_contacted,post_trip_contact_date,google_review_link_sent,google_review_link_sent_date"
      )
      .in("customer_id", customerIds);

    if (tripsError) {
      throw new Error(
        `Supabase reizen ophalen is mislukt. Fallback Reisradar wordt getoond. ${tripsError.message}`
      );
    }

    tripRows = (supabaseTrips ?? []) as SupabaseTripRow[];
  }

  const tripIds = tripRows.map((trip) => trip.id);

  if (tripIds.length > 0) {
    const { data: supabasePayments, error: paymentsError } = await supabase
      .from("payments")
      .select("trip_id,payment_type,total_amount,due_date,received,received_date")
      .in("trip_id", tripIds);

    if (paymentsError) {
      throw new Error(
        `Supabase betalingen ophalen is mislukt. Fallback Reisradar wordt getoond. ${paymentsError.message}`
      );
    }

    paymentRows = (supabasePayments ?? []) as SupabasePaymentRow[];
  }

  const tripsByCustomerId = new Map<string, SupabaseTripRow>();

  tripRows.forEach((trip) => {
    if (trip.customer_id && !tripsByCustomerId.has(trip.customer_id)) {
      tripsByCustomerId.set(trip.customer_id, trip);
    }
  });

  const paymentsByTripId = new Map<string, SupabasePaymentRow[]>();

  paymentRows.forEach((payment) => {
    if (!payment.trip_id) {
      return;
    }

    const currentPayments = paymentsByTripId.get(payment.trip_id) ?? [];
    paymentsByTripId.set(payment.trip_id, [...currentPayments, payment]);
  });

  return customerRows.map((customer) => {
    const trip = tripsByCustomerId.get(customer.id);
    const payments = trip ? paymentsByTripId.get(trip.id) ?? [] : [];

    return mapSupabaseTripRadarCustomer(customer, trip, payments);
  });
}

function mapSupabaseTripRadarCustomer(
  customer: SupabaseCustomerRow,
  trip: SupabaseTripRow | undefined,
  payments: SupabasePaymentRow[]
): Customer {
  const paymentsByType = getPaymentsByType(payments);
  const fullPayment = paymentsByType.full;
  const depositPayment = paymentsByType.deposit;
  const finalPayment = paymentsByType.final;
  const paymentType: Customer["paymentType"] = fullPayment
    ? "full"
    : "deposit_and_final";
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
    destination: trip?.destination || "Nog te bepalen",
    travelPeriod: trip?.travel_period || "Nog te bepalen",
    status: normalizeStatus(customer.status),
    notes: "",
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
    fullPaymentDate: fullPayment?.received_date || ""
  });
}

function getPaymentsByType(payments: SupabasePaymentRow[]) {
  return {
    deposit: payments.find((payment) => payment.payment_type === "deposit"),
    final: payments.find((payment) => payment.payment_type === "final"),
    full: payments.find((payment) => payment.payment_type === "full")
  };
}

function formatAmount(amount: number | string | null | undefined) {
  return amount === null || amount === undefined ? "" : String(amount);
}

function normalizeStatus(status: string | null): Customer["status"] {
  if (
    status === "Nieuwe aanvraag" ||
    status === "Intake gepland" ||
    status === "Reisvoorstel"
  ) {
    return status;
  }

  return "Nieuwe aanvraag";
}

function normalizeBrand(brand: string | null | undefined): Customer["brand"] {
  return brand === "Feel Dutch" ? "Feel Dutch" : "Feel Nordix";
}
