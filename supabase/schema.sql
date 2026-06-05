create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  company_name text,
  email text,
  phone text,
  street_address text,
  postal_code text,
  city text,
  country text,
  status text not null default 'Nieuwe aanvraag',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
add column if not exists street_address text,
add column if not exists postal_code text,
add column if not exists city text,
add column if not exists country text;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  brand text not null default 'Feel Nordix',
  offer_number text,
  trip_number text,
  invoice_number text,
  destination text,
  travel_period text,
  trip_name text,
  departure_date date,
  return_date date,
  quote_sent boolean not null default false,
  quote_sent_date date,
  quote_follow_up_date date,
  quote_confirmed boolean not null default false,
  quote_confirmed_date date,
  invoice_date date,
  travel_documents_prepare_from_date date,
  travel_documents_planned_send_date date,
  travel_documents_prepared boolean not null default false,
  travel_documents_sent boolean not null default false,
  travel_documents_sent_date date,
  post_trip_contacted boolean not null default false,
  post_trip_contact_date date,
  google_review_link_sent boolean not null default false,
  google_review_link_sent_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_brand_check check (brand in ('Feel Nordix', 'Feel Dutch')),
  constraint trips_offer_number_unique unique (offer_number),
  constraint trips_trip_number_unique unique (trip_number),
  constraint trips_invoice_number_unique unique (invoice_number)
);

alter table public.trips
add column if not exists brand text not null default 'Feel Nordix';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trips_brand_check'
  ) then
    alter table public.trips
    add constraint trips_brand_check
    check (brand in ('Feel Nordix', 'Feel Dutch'));
  end if;
end;
$$;

create table if not exists public.travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date,
  traveler_type text not null default 'adult',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travelers_type_check check (traveler_type in ('adult', 'child'))
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  payment_type text not null,
  label text not null,
  total_amount numeric(12, 2),
  due_date date,
  received boolean not null default false,
  received_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_type_check check (payment_type in ('deposit', 'final', 'full'))
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_status_idx on public.customers(status);
create index if not exists trips_customer_id_idx on public.trips(customer_id);
create index if not exists trips_brand_idx on public.trips(brand);
create index if not exists trips_quote_follow_up_date_idx on public.trips(quote_follow_up_date);
create index if not exists trips_departure_date_idx on public.trips(departure_date);
create index if not exists trips_return_date_idx on public.trips(return_date);
create index if not exists travelers_trip_id_idx on public.travelers(trip_id);
create index if not exists payments_trip_id_idx on public.payments(trip_id);
create index if not exists payments_due_date_idx on public.payments(due_date);
create index if not exists notes_customer_id_idx on public.notes(customer_id);
create index if not exists notes_trip_id_idx on public.notes(trip_id);

create or replace trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create or replace trigger set_trips_updated_at
before update on public.trips
for each row
execute function public.set_updated_at();

create or replace trigger set_travelers_updated_at
before update on public.travelers
for each row
execute function public.set_updated_at();

create or replace trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

create or replace trigger set_notes_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.trips enable row level security;
alter table public.travelers enable row level security;
alter table public.payments enable row level security;
alter table public.notes enable row level security;
