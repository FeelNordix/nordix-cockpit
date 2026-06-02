"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAllCustomers } from "@/lib/customerStorage";
import { mockCustomers } from "@/lib/mockCustomers";
import type { Customer } from "@/types/customer";

export default function CustomerManager() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  useEffect(() => {
    setCustomers(getAllCustomers());
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
