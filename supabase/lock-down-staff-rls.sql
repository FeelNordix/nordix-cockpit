begin;

revoke all on table
  public.customers,
  public.trips,
  public.travelers,
  public.payments,
  public.notes
from anon;

alter table public.customers enable row level security;
alter table public.trips enable row level security;
alter table public.travelers enable row level security;
alter table public.payments enable row level security;
alter table public.notes enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('customers', 'trips', 'travelers', 'payments', 'notes')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy "staff can select customers"
on public.customers
for select
using (public.is_nordix_staff());

create policy "staff can insert customers"
on public.customers
for insert
with check (public.is_nordix_staff());

create policy "staff can update customers"
on public.customers
for update
using (public.is_nordix_staff())
with check (public.is_nordix_staff());

create policy "staff can select trips"
on public.trips
for select
using (public.is_nordix_staff());

create policy "staff can insert trips"
on public.trips
for insert
with check (public.is_nordix_staff());

create policy "staff can update trips"
on public.trips
for update
using (public.is_nordix_staff())
with check (public.is_nordix_staff());

create policy "staff can select travelers"
on public.travelers
for select
using (public.is_nordix_staff());

create policy "staff can insert travelers"
on public.travelers
for insert
with check (public.is_nordix_staff());

create policy "staff can update travelers"
on public.travelers
for update
using (public.is_nordix_staff())
with check (public.is_nordix_staff());

create policy "staff can select payments"
on public.payments
for select
using (public.is_nordix_staff());

create policy "staff can insert payments"
on public.payments
for insert
with check (public.is_nordix_staff());

create policy "staff can update payments"
on public.payments
for update
using (public.is_nordix_staff())
with check (public.is_nordix_staff());

create policy "staff can select notes"
on public.notes
for select
using (public.is_nordix_staff());

create policy "staff can insert notes"
on public.notes
for insert
with check (public.is_nordix_staff());

create policy "staff can update notes"
on public.notes
for update
using (public.is_nordix_staff())
with check (public.is_nordix_staff());

commit;
