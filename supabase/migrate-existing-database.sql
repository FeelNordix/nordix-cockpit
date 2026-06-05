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

alter table public.customers
add column if not exists id uuid default gen_random_uuid(),
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists company_name text,
add column if not exists email text,
add column if not exists phone text,
add column if not exists street_address text,
add column if not exists postal_code text,
add column if not exists city text,
add column if not exists country text,
add column if not exists status text default 'Nieuwe aanvraag',
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

alter table public.trips
add column if not exists id uuid default gen_random_uuid(),
add column if not exists customer_id uuid,
add column if not exists brand text default 'Feel Nordix',
add column if not exists offer_number text,
add column if not exists trip_number text,
add column if not exists invoice_number text,
add column if not exists destination text,
add column if not exists travel_period text,
add column if not exists trip_name text,
add column if not exists departure_date date,
add column if not exists return_date date,
add column if not exists quote_sent boolean default false,
add column if not exists quote_sent_date date,
add column if not exists quote_follow_up_date date,
add column if not exists quote_confirmed boolean default false,
add column if not exists quote_confirmed_date date,
add column if not exists invoice_date date,
add column if not exists travel_documents_prepare_from_date date,
add column if not exists travel_documents_planned_send_date date,
add column if not exists travel_documents_prepared boolean default false,
add column if not exists travel_documents_sent boolean default false,
add column if not exists travel_documents_sent_date date,
add column if not exists post_trip_contacted boolean default false,
add column if not exists post_trip_contact_date date,
add column if not exists google_review_link_sent boolean default false,
add column if not exists google_review_link_sent_date date,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

create table if not exists public.travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid,
  first_name text,
  last_name text,
  birth_date date,
  traveler_type text default 'adult',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments
add column if not exists id uuid default gen_random_uuid(),
add column if not exists trip_id uuid,
add column if not exists payment_type text,
add column if not exists label text,
add column if not exists total_amount numeric(12, 2),
add column if not exists due_date date,
add column if not exists received boolean default false,
add column if not exists received_date date,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

alter table public.notes
add column if not exists id uuid default gen_random_uuid(),
add column if not exists customer_id uuid,
add column if not exists trip_id uuid,
add column if not exists body text,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trips_brand_check'
  ) then
    alter table public.trips
    add constraint trips_brand_check
    check (brand in ('Feel Nordix', 'Feel Dutch'))
    not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'travelers_type_check'
  ) then
    alter table public.travelers
    add constraint travelers_type_check
    check (traveler_type in ('adult', 'child'))
    not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'payments_type_check'
  ) then
    alter table public.payments
    add constraint payments_type_check
    check (payment_type in ('deposit', 'final', 'full'))
    not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trips_customer_id_fkey'
  ) and exists (
    select 1
    from pg_attribute
    where attrelid = 'public.trips'::regclass
      and attname = 'customer_id'
      and atttypid = 'uuid'::regtype
  ) and exists (
    select 1
    from pg_constraint constraint_info
    join pg_attribute column_info
      on column_info.attrelid = constraint_info.conrelid
      and column_info.attname = 'id'
    where constraint_info.conrelid = 'public.customers'::regclass
      and constraint_info.contype in ('p', 'u')
      and array_length(constraint_info.conkey, 1) = 1
      and constraint_info.conkey[1] = column_info.attnum
      and column_info.atttypid = 'uuid'::regtype
  ) then
    alter table public.trips
    add constraint trips_customer_id_fkey
    foreign key (customer_id)
    references public.customers(id)
    on delete cascade
    not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'travelers_trip_id_fkey'
  ) and exists (
    select 1
    from pg_attribute
    where attrelid = 'public.travelers'::regclass
      and attname = 'trip_id'
      and atttypid = 'uuid'::regtype
  ) and exists (
    select 1
    from pg_constraint constraint_info
    join pg_attribute column_info
      on column_info.attrelid = constraint_info.conrelid
      and column_info.attname = 'id'
    where constraint_info.conrelid = 'public.trips'::regclass
      and constraint_info.contype in ('p', 'u')
      and array_length(constraint_info.conkey, 1) = 1
      and constraint_info.conkey[1] = column_info.attnum
      and column_info.atttypid = 'uuid'::regtype
  ) then
    alter table public.travelers
    add constraint travelers_trip_id_fkey
    foreign key (trip_id)
    references public.trips(id)
    on delete cascade
    not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'payments_trip_id_fkey'
  ) and exists (
    select 1
    from pg_attribute
    where attrelid = 'public.payments'::regclass
      and attname = 'trip_id'
      and atttypid = 'uuid'::regtype
  ) and exists (
    select 1
    from pg_constraint constraint_info
    join pg_attribute column_info
      on column_info.attrelid = constraint_info.conrelid
      and column_info.attname = 'id'
    where constraint_info.conrelid = 'public.trips'::regclass
      and constraint_info.contype in ('p', 'u')
      and array_length(constraint_info.conkey, 1) = 1
      and constraint_info.conkey[1] = column_info.attnum
      and column_info.atttypid = 'uuid'::regtype
  ) then
    alter table public.payments
    add constraint payments_trip_id_fkey
    foreign key (trip_id)
    references public.trips(id)
    on delete cascade
    not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'notes_customer_id_fkey'
  ) and exists (
    select 1
    from pg_attribute
    where attrelid = 'public.notes'::regclass
      and attname = 'customer_id'
      and atttypid = 'uuid'::regtype
  ) and exists (
    select 1
    from pg_constraint constraint_info
    join pg_attribute column_info
      on column_info.attrelid = constraint_info.conrelid
      and column_info.attname = 'id'
    where constraint_info.conrelid = 'public.customers'::regclass
      and constraint_info.contype in ('p', 'u')
      and array_length(constraint_info.conkey, 1) = 1
      and constraint_info.conkey[1] = column_info.attnum
      and column_info.atttypid = 'uuid'::regtype
  ) then
    alter table public.notes
    add constraint notes_customer_id_fkey
    foreign key (customer_id)
    references public.customers(id)
    on delete cascade
    not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'notes_trip_id_fkey'
  ) and exists (
    select 1
    from pg_attribute
    where attrelid = 'public.notes'::regclass
      and attname = 'trip_id'
      and atttypid = 'uuid'::regtype
  ) and exists (
    select 1
    from pg_constraint constraint_info
    join pg_attribute column_info
      on column_info.attrelid = constraint_info.conrelid
      and column_info.attname = 'id'
    where constraint_info.conrelid = 'public.trips'::regclass
      and constraint_info.contype in ('p', 'u')
      and array_length(constraint_info.conkey, 1) = 1
      and constraint_info.conkey[1] = column_info.attnum
      and column_info.atttypid = 'uuid'::regtype
  ) then
    alter table public.notes
    add constraint notes_trip_id_fkey
    foreign key (trip_id)
    references public.trips(id)
    on delete cascade
    not valid;
  end if;
end;
$$;

create index if not exists customers_status_idx on public.customers(status);
create index if not exists trips_customer_id_idx on public.trips(customer_id);
create index if not exists trips_brand_idx on public.trips(brand);
create index if not exists trips_offer_number_idx on public.trips(offer_number);
create index if not exists trips_trip_number_idx on public.trips(trip_number);
create index if not exists trips_invoice_number_idx on public.trips(invoice_number);
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
