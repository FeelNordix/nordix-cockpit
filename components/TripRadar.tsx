"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  filterTripRows,
  getTripRows,
  searchTripRows,
  type TripFilter
} from "@/lib/tripRadar";
import { getAllCustomers } from "@/lib/customerStorage";
import { mockCustomers } from "@/lib/mockCustomers";
import type { Customer } from "@/types/customer";

const filters: Array<{ label: string; value: TripFilter }> = [
  { label: "Alle reizen", value: "all" },
  { label: "Nieuwe aanvragen", value: "new" },
  { label: "Offertefase", value: "quote" },
  { label: "Bevestigd", value: "confirmed" },
  { label: "Vertrek binnen 30 dagen", value: "upcoming" },
  { label: "Vertrokken", value: "departed" },
  { label: "Afgerond", value: "completed" }
];

export default function TripRadar() {
  const searchParams = useSearchParams();
  const initialFilter = getFilterValue(searchParams.get("filter"));
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TripFilter>(initialFilter);

  useEffect(() => {
    setCustomers(getAllCustomers());
  }, []);

  useEffect(() => {
    setFilter(getFilterValue(searchParams.get("filter")));
  }, [searchParams]);

  const rows = useMemo(() => {
    const tripRows = getTripRows(customers);
    return searchTripRows(filterTripRows(tripRows, filter), query);
  }, [customers, filter, query]);

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
                  onClick={() => setFilter(item.value)}
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
        <div className="hidden grid-cols-[0.8fr_1fr_1.2fr_0.9fr_0.9fr_0.9fr_1fr_1fr] gap-4 border-b border-nordix-mist bg-nordix-snow px-4 py-3 text-sm font-semibold text-slate-700 lg:grid">
          <span>Reisnummer</span>
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
              className="grid gap-3 px-4 py-4 text-sm transition hover:bg-nordix-snow lg:grid-cols-[0.8fr_1fr_1.2fr_0.9fr_0.9fr_0.9fr_1fr_1fr] lg:items-center"
            >
              <p className="font-semibold text-nordix-pine">{row.tripNumber}</p>
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
    value === "departed" ||
    value === "completed"
  ) {
    return value;
  }

  return "all";
}
