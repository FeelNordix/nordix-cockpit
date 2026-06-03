"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { customerDetailsDefaults, normalizeCustomer } from "@/lib/customerDefaults";
import { getAllCustomers, getStoredCustomers } from "@/lib/customerStorage";
import { mockCustomers } from "@/lib/mockCustomers";
import { createSupabaseClient } from "@/lib/supabaseClient";
import type { Customer } from "@/types/customer";

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
};

export default function CustomerManager() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [sourceCounts, setSourceCounts] = useState({
    supabase: 0,
    localStorage: 0,
    mock: mockCustomers.length
  });
  const [supabaseError, setSupabaseError] = useState("");

  useEffect(() => {
    const fallbackCustomers = getAllCustomers();
    const storedCustomers = getStoredCustomers();

    setCustomers(fallbackCustomers);
    setSourceCounts({
      supabase: 0,
      localStorage: storedCustomers.length,
      mock: mockCustomers.length
    });

    loadCustomersFromSupabase(fallbackCustomers, storedCustomers.length)
      .then(({ mergedCustomers, supabaseCount }) => {
        setCustomers(mergedCustomers);
        setSourceCounts({
          supabase: supabaseCount,
          localStorage: storedCustomers.length,
          mock: mockCustomers.length
        });
        setSupabaseError("");
      })
      .catch((error) => {
        setSupabaseError(
          error instanceof Error
            ? error.message
            : "Supabase is niet bereikbaar. Fallback data wordt getoond."
        );
      });
  }, []);

  const sortedCustomers = useMemo(
    () =>
      [...customers].sort((a, b) => {
        if (statusFilter) {
          const aMatches = a.status === statusFilter;
          const bMatches = b.status === statusFilter;

          if (aMatches !== bMatches) {
            return aMatches ? -1 : 1;
          }
        }

        return a.lastName.localeCompare(b.lastName);
      }),
    [customers, statusFilter]
  );

  const matchingCustomers = statusFilter
    ? customers.filter((customer) => customer.status === statusFilter)
    : customers;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-nordix-pine">
              Klanten
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
              Klantenoverzicht
            </h2>
          </div>
          <p className="text-sm text-slate-600">
            {statusFilter
              ? `${matchingCustomers.length} klanten met status ${statusFilter}`
              : `${customers.length} klanten in deze tijdelijke lijst`}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/customers/new"
            className="inline-flex rounded-md bg-nordix-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nordix-pine/90"
          >
            Nieuwe aanvraag
          </Link>
          {statusFilter ? (
            <Link
              href="/customers"
              className="inline-flex rounded-md border border-nordix-mist bg-white px-4 py-2.5 text-sm font-semibold text-nordix-ink shadow-sm transition hover:border-nordix-fjord hover:text-nordix-pine"
            >
              Toon alle klanten
            </Link>
          ) : null}
        </div>

        <section className="mt-5 rounded-lg border border-nordix-mist bg-white p-4 shadow-sm">
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <SourceCount label="Klanten uit Supabase" value={sourceCounts.supabase} />
            <SourceCount label="LocalStorage fallback" value={sourceCounts.localStorage} />
            <SourceCount label="Mock klanten" value={sourceCounts.mock} />
          </div>
          {supabaseError ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {supabaseError}
            </p>
          ) : null}
        </section>

        <div className="mt-6 overflow-hidden rounded-lg border border-nordix-mist bg-white shadow-sm">
          <div className="hidden grid-cols-[0.8fr_1.2fr_1.2fr_1fr_1fr] gap-4 border-b border-nordix-mist bg-nordix-snow px-4 py-3 text-sm font-semibold text-slate-700 md:grid">
            <span>Nummer</span>
            <span>Naam</span>
            <span>E-mail</span>
            <span>Bestemming</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-nordix-mist">
            {sortedCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className={`grid gap-3 px-4 py-4 text-sm transition hover:bg-nordix-snow md:grid-cols-[0.8fr_1.2fr_1.2fr_1fr_1fr] md:items-center ${
                  statusFilter && customer.status === statusFilter
                    ? "bg-nordix-snow"
                    : ""
                }`}
              >
                <p className="font-semibold text-nordix-pine">
                  {customer.offerNumber || customer.tripNumber || "-"}
                </p>
                <div>
                  <p className="font-semibold text-nordix-ink">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="mt-1 text-slate-500 md:hidden">{customer.phone}</p>
                </div>
                <p className="text-slate-700">{customer.email}</p>
                <p className="text-slate-700">{customer.destination}</p>
                <span className="w-fit rounded-md bg-nordix-mist px-2.5 py-1 text-xs font-semibold text-nordix-ink">
                  {customer.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

async function loadCustomersFromSupabase(
  fallbackCustomers: Customer[],
  _storedCustomerCount: number
) {
  const supabase = createSupabaseClient();
  const { data: supabaseCustomers, error: customersError } = await supabase
    .from("customers")
    .select("id,first_name,last_name,company_name,email,phone,status")
    .order("last_name", { ascending: true });

  if (customersError) {
    throw new Error(
      `Supabase klanten ophalen is mislukt. Fallback data wordt getoond. ${customersError.message}`
    );
  }

  const customerRows = (supabaseCustomers ?? []) as SupabaseCustomerRow[];
  const customerIds = customerRows.map((customer) => customer.id);
  let tripRows: SupabaseTripRow[] = [];

  if (customerIds.length > 0) {
    const { data: supabaseTrips, error: tripsError } = await supabase
      .from("trips")
      .select(
        "customer_id,brand,offer_number,trip_number,invoice_number,destination,travel_period,trip_name,departure_date,return_date"
      )
      .in("customer_id", customerIds);

    if (tripsError) {
      throw new Error(
        `Supabase reizen ophalen is mislukt. Fallback data wordt getoond. ${tripsError.message}`
      );
    }

    tripRows = (supabaseTrips ?? []) as SupabaseTripRow[];
  }

  const tripsByCustomerId = new Map<string, SupabaseTripRow>();

  tripRows.forEach((trip) => {
    if (trip.customer_id && !tripsByCustomerId.has(trip.customer_id)) {
      tripsByCustomerId.set(trip.customer_id, trip);
    }
  });

  const supabaseMappedCustomers = customerRows.map((customer) =>
    mapSupabaseCustomer(customer, tripsByCustomerId.get(customer.id))
  );

  const customersById = new Map<string, Customer>();
  fallbackCustomers.forEach((customer) => customersById.set(customer.id, customer));
  supabaseMappedCustomers.forEach((customer) =>
    customersById.set(customer.id, customer)
  );

  return {
    mergedCustomers: Array.from(customersById.values()),
    supabaseCount: supabaseMappedCustomers.length
  };
}

function mapSupabaseCustomer(
  customer: SupabaseCustomerRow,
  trip?: SupabaseTripRow
): Customer {
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
    notes: "Nog geen notities.",
    brand: normalizeBrand(trip?.brand),
    offerNumber: trip?.offer_number || "",
    tripNumber: trip?.trip_number || "",
    invoiceNumber: trip?.invoice_number || "",
    tripName: trip?.trip_name || "",
    departureDate: trip?.departure_date || "",
    returnDate: trip?.return_date || ""
  });
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

function SourceCount({ label, value }: { label: string; value: number }) {
  return (
    <p>
      <span className="font-medium text-nordix-ink">{label}:</span> {value}
    </p>
  );
}
