import Link from "next/link";
import { mockTasks } from "@/lib/mockTasks";

type TasksPageProps = {
  searchParams: Promise<{
    type?: string;
  }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { type } = await searchParams;
  const tasks = type
    ? mockTasks.filter((task) => task.type === type)
    : mockTasks;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-nordix-pine">
            Taken
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-nordix-ink">
            Takenoverzicht
          </h2>
          {type ? (
            <p className="mt-2 text-sm text-slate-600">
              {tasks.length} taken voor {type}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              {tasks.length} open taken in deze mock-lijst
            </p>
          )}
        </div>

        {type ? (
          <Link
            href="/tasks"
            className="inline-flex rounded-md border border-nordix-mist bg-white px-4 py-2.5 text-sm font-semibold text-nordix-ink shadow-sm transition hover:border-nordix-fjord hover:text-nordix-pine"
          >
            Toon alle taken
          </Link>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-nordix-mist bg-white shadow-sm">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-4 border-b border-nordix-mist bg-nordix-snow px-4 py-3 text-sm font-semibold text-slate-700 md:grid">
          <span>Taak</span>
          <span>Type</span>
          <span>Klant</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-nordix-mist">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.4fr_1fr_1fr_0.8fr] md:items-center"
            >
              <div>
                <p className="font-semibold text-nordix-ink">{task.title}</p>
                <p className="mt-1 text-slate-500">Deadline: {task.dueDate}</p>
              </div>
              <p className="text-slate-700">{task.type}</p>
              <p className="text-slate-700">{task.customerName}</p>
              <span className="w-fit rounded-md bg-nordix-mist px-2.5 py-1 text-xs font-semibold text-nordix-ink">
                {task.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
