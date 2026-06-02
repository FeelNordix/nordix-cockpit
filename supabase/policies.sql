do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'authenticated users can select customers'
  ) then
    create policy "authenticated users can select customers"
    on public.customers
    for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'authenticated users can insert customers'
  ) then
    create policy "authenticated users can insert customers"
    on public.customers
    for insert
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'authenticated users can update customers'
  ) then
    create policy "authenticated users can update customers"
    on public.customers
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'authenticated users can delete customers'
  ) then
    create policy "authenticated users can delete customers"
    on public.customers
    for delete
    using (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trips'
      and policyname = 'authenticated users can select trips'
  ) then
    create policy "authenticated users can select trips"
    on public.trips
    for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trips'
      and policyname = 'authenticated users can insert trips'
  ) then
    create policy "authenticated users can insert trips"
    on public.trips
    for insert
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trips'
      and policyname = 'authenticated users can update trips'
  ) then
    create policy "authenticated users can update trips"
    on public.trips
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trips'
      and policyname = 'authenticated users can delete trips'
  ) then
    create policy "authenticated users can delete trips"
    on public.trips
    for delete
    using (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'travelers'
      and policyname = 'authenticated users can select travelers'
  ) then
    create policy "authenticated users can select travelers"
    on public.travelers
    for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'travelers'
      and policyname = 'authenticated users can insert travelers'
  ) then
    create policy "authenticated users can insert travelers"
    on public.travelers
    for insert
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'travelers'
      and policyname = 'authenticated users can update travelers'
  ) then
    create policy "authenticated users can update travelers"
    on public.travelers
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'travelers'
      and policyname = 'authenticated users can delete travelers'
  ) then
    create policy "authenticated users can delete travelers"
    on public.travelers
    for delete
    using (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'authenticated users can select payments'
  ) then
    create policy "authenticated users can select payments"
    on public.payments
    for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'authenticated users can insert payments'
  ) then
    create policy "authenticated users can insert payments"
    on public.payments
    for insert
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'authenticated users can update payments'
  ) then
    create policy "authenticated users can update payments"
    on public.payments
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'authenticated users can delete payments'
  ) then
    create policy "authenticated users can delete payments"
    on public.payments
    for delete
    using (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notes'
      and policyname = 'authenticated users can select notes'
  ) then
    create policy "authenticated users can select notes"
    on public.notes
    for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notes'
      and policyname = 'authenticated users can insert notes'
  ) then
    create policy "authenticated users can insert notes"
    on public.notes
    for insert
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notes'
      and policyname = 'authenticated users can update notes'
  ) then
    create policy "authenticated users can update notes"
    on public.notes
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notes'
      and policyname = 'authenticated users can delete notes'
  ) then
    create policy "authenticated users can delete notes"
    on public.notes
    for delete
    using (auth.role() = 'authenticated');
  end if;
end;
$$;
