import { createSupabaseClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function SupabaseTestPage() {
  let message = "Supabase verbinding werkt";

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("customers").select("id").limit(1);

    if (error) {
      message = error.message;
    }
  } catch (error) {
    message = error instanceof Error ? error.message : "Onbekende Supabase fout";
  }

  return (
    <main className="rounded-lg border border-nordix-mist bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-nordix-ink">
        {message}
      </h2>
    </main>
  );
}
