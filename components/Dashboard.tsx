"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDashboardActionGroups } from "@/lib/dashboardActions";
import { getAllCustomers } from "@/lib/customerStorage";
import { mockCustomers } from "@/lib/mockCustomers";
import { getTripStats } from "@/lib/tripRadar";
import type { Customer } from "@/types/customer";

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  useEffect(() => {
    setCustomers(getAllCustomers());
  }, []);

  const actionGroups = useMemo(
    () => getDashboardActionGroups(customers),
    [customers]
  );

  const totalActions =
    actionGroups.today.length +
    actionGroups.nextSevenDays.length +
    actionGroups.newRequests.length;
  const tripStats = useMemo(() => getTripStats(customers), [customers]);

  const stats = [
    { label: "Klanten", value: customers.length },
    { label: "Acties vandaag", value: actionGroups.today.length },
    { label: "Binnen 7 dagen", value: actionGroups.nextSevenDays.length },
    { label: "Nieuwe aanvragen", value: tripStats.newRequests },
    { label: "Openstaande betalingen", value: tripStats.openPayments }
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
              <ActionSection title="Vandaag aandacht voor" actions={actionGroups.today} />
              <ActionSection title="Binnen 7 dagen" actions={actionGroups.nextSevenDays} />
              <ActionSection title="Nieuwe aanvragen" actions={actionGroups.newRequests} />
            </div>
          )}
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/trips?filter=upcoming"
          className="block rounded-lg border border-nordix-mist bg-white p-5 shadow-sm transition hover:border-nordix-fjord hover:shadow-md"
        >
          <p className="text-sm text-slate-600">Reisradar</p>
          <h3 className="mt-2 text-xl font-semibold text-nordix-ink">
            Vertrek binnen 30 dagen
          </h3>
          <p className="mt-3 text-3xl font-semibold text-nordix-pine">
            {tripStats.upcomingWithin30Days}
          </p>
          <p className="mt-3 text-sm font-semibold text-nordix-pine">
            Bekijk reizen
          </p>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-nordix-mist bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-nordix-ink">{stat.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
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
