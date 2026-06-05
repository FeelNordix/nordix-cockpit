"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { customerDetailsDefaults, normalizeCustomer } from "@/lib/customerDefaults";
import { getDashboardActionGroups } from "@/lib/dashboardActions";
import { getAllCustomers } from "@/lib/customerStorage";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { getTripStats } from "@/lib/tripRadar";
import type { Customer } from "@/types/customer";

type DashboardSource = "Supabase" | "Fallback";

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

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboardSource, setDashboardSource] =
    useState<DashboardSource>("Fallback");
  const [supabaseError, setSupabaseError] = useState("");

  useEffect(() => {
    setCustomers([]);
    setDashboardSource("Supabase");

    loadDashboardCustomersFromSupabase()
      .then((supabaseCustomers) => {
        setCustomers(supabaseCustomers);
        setDashboardSource("Supabase");
        setSupabaseError("");
      })
      .catch((error) => {
        const fallbackCustomers = getAllCustomers();

        setCustomers(fallbackCustomers);
        setDashboardSource("Fallback");
        setSupabaseError(
          error instanceof Error
            ? error.message
            : "Supabase is niet bereikbaar. Fallback dashboard wordt getoond."
        );
      });
  }, []);

  const actionGroups = useMemo(
    () => getDashboardActionGroups(customers),
    [customers]
  );

  const totalActions =
    actionGroups.today.length +
    actionGroups.newRequests.length;
  const tripStats = useMemo(() => getTripStats(customers), [customers]);

  const kpis = [
    {
      label: "Openstaande offertes",
      value: tripStats.openQuotes,
      href: "/trips?filter=quote"
    },
    {
      label: "Openstaande betalingen",
      value: tripStats.openPayments,
      href: "/trips?filter=open-payments"
    },
    {
      label: "Vertrek binnen 30 dagen",
      value: tripStats.upcomingWithin30Days,
      href: "/trips?filter=upcoming"
    },
    {
      label: "Reizen in uitvoering",
      value: tripStats.activeTrips,
      href: "/trips?filter=active"
    }
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-4xl font-semibold tracking-normal text-nordix-ink">
                Dashboard
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
                Welkom terug. Dit vraagt vandaag je aandacht.
              </p>
              <p className="mt-3 text-sm font-semibold text-nordix-ink">
                Bron dashboard: {dashboardSource}
              </p>
              {supabaseError ? (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {supabaseError}
                </p>
              ) : null}
            </div>
            <Link
              href="/customers/new"
              className="inline-flex w-fit rounded-md bg-nordix-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nordix-pine/90"
            >
              + Nieuwe aanvraag
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-nordix-mist bg-white p-5 shadow-sm">
          {totalActions === 0 ? (
            <p className="rounded-md bg-nordix-snow px-4 py-4 text-sm font-medium text-slate-700">
              Geen openstaande acties. Lekker overzichtelijk.
            </p>
          ) : (
            <div className="space-y-6">
              <ActionSection title="Acties die uitgevoerd moeten worden" actions={actionGroups.today} />
              <ActionSection title="Nieuwe aanvragen" actions={actionGroups.newRequests} />
            </div>
          )}
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="block rounded-lg border border-nordix-mist bg-white p-5 shadow-sm transition hover:border-nordix-fjord hover:shadow-md"
          >
            <p className="text-sm text-slate-600">Reisradar</p>
            <h3 className="mt-2 text-lg font-semibold text-nordix-ink">
              {kpi.label}
            </h3>
            <p className="mt-3 text-3xl font-semibold text-nordix-pine">
              {kpi.value}
            </p>
            <p className="mt-3 text-sm font-semibold text-nordix-pine">
              Bekijk overzicht
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}

async function loadDashboardCustomersFromSupabase() {
  const supabase = createSupabaseClient();
  const { data: supabaseCustomers, error: customersError } = await supabase
    .from("customers")
    .select("id,first_name,last_name,company_name,email,phone,status");

  if (customersError) {
    throw new Error(
      `Supabase dashboard ophalen is mislukt. Fallback dashboard wordt getoond. ${customersError.message}`
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
        `Supabase reizen ophalen is mislukt. Fallback dashboard wordt getoond. ${tripsError.message}`
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
        `Supabase betalingen ophalen is mislukt. Fallback dashboard wordt getoond. ${paymentsError.message}`
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

    return mapSupabaseDashboardCustomer(customer, trip, payments);
  });
}

function mapSupabaseDashboardCustomer(
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

type ActionSectionProps = {
  title: string;
  actions: Array<{
    id: string;
    text: string;
    href: string;
    dueDate?: string;
  }>;
};

function ActionSection({ title, actions }: ActionSectionProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-base font-semibold text-nordix-ink">{title}</h3>
      <div className="mt-3 space-y-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="block cursor-pointer rounded-md border border-transparent bg-nordix-snow px-4 py-4 text-sm text-slate-700 transition hover:border-nordix-fjord hover:bg-white hover:shadow-sm"
          >
            <span className="font-semibold text-nordix-ink">{action.text}</span>
            {action.dueDate ? (
              <span className="mt-1 block text-slate-600">
                Datum: {action.dueDate}
              </span>
            ) : null}
            <span className="mt-3 block text-sm font-semibold text-nordix-pine">
              Open klantdossier
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
