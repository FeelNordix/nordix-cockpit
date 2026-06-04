create table if not exists public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'employee',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_role_check check (role in ('owner', 'employee'))
);

insert into public.app_users (user_id, role, active)
values ('e35884d8-c1a1-47f4-9d17-64bc02171ed0', 'owner', true)
on conflict (user_id)
do update set
  role = excluded.role,
  active = excluded.active,
  updated_at = now();

alter table public.app_users enable row level security;

create or replace function public.is_nordix_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where user_id = auth.uid()
      and active = true
  );
$$;

alter table public.customers enable row level security;
alter table public.trips enable row level security;
alter table public.travelers enable row level security;
alter table public.payments enable row level security;
alter table public.notes enable row level security;

drop policy if exists "authenticated users can select customers" on public.customers;
drop policy if exists "authenticated users can insert customers" on public.customers;
drop policy if exists "authenticated users can update customers" on public.customers;
drop policy if exists "authenticated users can delete customers" on public.customers;
drop policy if exists "staff can select customers" on public.customers;
drop policy if exists "staff can insert customers" on public.customers;
drop policy if exists "staff can update customers" on public.customers;

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

drop policy if exists "authenticated users can select trips" on public.trips;
drop policy if exists "authenticated users can insert trips" on public.trips;
drop policy if exists "authenticated users can update trips" on public.trips;
drop policy if exists "authenticated users can delete trips" on public.trips;
drop policy if exists "staff can select trips" on public.trips;
drop policy if exists "staff can insert trips" on public.trips;
drop policy if exists "staff can update trips" on public.trips;

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

drop policy if exists "authenticated users can select travelers" on public.travelers;
drop policy if exists "authenticated users can insert travelers" on public.travelers;
drop policy if exists "authenticated users can update travelers" on public.travelers;
drop policy if exists "authenticated users can delete travelers" on public.travelers;
drop policy if exists "staff can select travelers" on public.travelers;
drop policy if exists "staff can insert travelers" on public.travelers;
drop policy if exists "staff can update travelers" on public.travelers;

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

drop policy if exists "authenticated users can select payments" on public.payments;
drop policy if exists "authenticated users can insert payments" on public.payments;
drop policy if exists "authenticated users can update payments" on public.payments;
drop policy if exists "authenticated users can delete payments" on public.payments;
drop policy if exists "staff can select payments" on public.payments;
drop policy if exists "staff can insert payments" on public.payments;
drop policy if exists "staff can update payments" on public.payments;

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

drop policy if exists "authenticated users can select notes" on public.notes;
drop policy if exists "authenticated users can insert notes" on public.notes;
drop policy if exists "authenticated users can update notes" on public.notes;
drop policy if exists "authenticated users can delete notes" on public.notes;
drop policy if exists "staff can select notes" on public.notes;
drop policy if exists "staff can insert notes" on public.notes;
drop policy if exists "staff can update notes" on public.notes;

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
