-- Migration: 20261101010000_analytics_dashboard.sql
-- Description: Commission rates and KPI adjustments tables for Analytics Dashboard

-- 1. Commission rates table with historical effectivity support
create table if not exists public.commission_rates (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_name text not null,
  rate numeric(10, 2) not null default 0 check (rate >= 0),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

create index if not exists commission_rates_rest_cat_idx on public.commission_rates (restaurant_id, category_name);
create index if not exists commission_rates_effective_idx on public.commission_rates (effective_from, effective_to);

-- 2. KPI manual adjustments and audit history table
create table if not exists public.kpi_adjustments (
  id uuid primary key default gen_random_uuid(),
  kpi_key text not null check (kpi_key in ('total_collected', 'delivered_orders', 'commission_profit', 'orders_placed', 'items_sold')),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  restaurant_scope text not null default 'all',
  start_date date not null,
  end_date date not null,
  calculated_value numeric(12, 2) not null default 0,
  adjustment_amount numeric(12, 2) not null default 0,
  final_value numeric(12, 2) not null default 0,
  reason text not null,
  admin_id uuid not null references public.users(id),
  admin_name text not null,
  is_active boolean not null default true,
  superseded_by uuid references public.kpi_adjustments(id),
  created_at timestamptz not null default now()
);

create index if not exists kpi_adjustments_query_idx on public.kpi_adjustments (kpi_key, restaurant_id, start_date, end_date, is_active);

-- 3. Row Level Security and permissions
alter table public.commission_rates enable row level security;
alter table public.kpi_adjustments enable row level security;

create policy "Anyone authenticated can view commission rates" on public.commission_rates
  for select using (true);
create policy "Admins can insert commission rates" on public.commission_rates
  for insert with check (public.is_admin());
create policy "Admins can update commission rates" on public.commission_rates
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Admins can view kpi adjustments" on public.kpi_adjustments
  for select using (public.is_admin());
create policy "Admins can insert kpi adjustments" on public.kpi_adjustments
  for insert with check (public.is_admin());
create policy "Admins can update kpi adjustments" on public.kpi_adjustments
  for update using (public.is_admin()) with check (public.is_admin());

grant all on public.commission_rates to authenticated, service_role;
grant select on public.commission_rates to anon;
grant all on public.kpi_adjustments to authenticated, service_role;

-- 4. Initial seed for Biryani Nation default commission rates
insert into public.commission_rates (restaurant_id, category_name, rate, effective_from)
select r.id, v.category_name, v.rate, '2026-09-01 00:00:00+05:30'::timestamptz
from public.restaurants r
cross join (values
  ('Fulls',    40.00),
  ('Half',     20.00),
  ('Singles',  20.00),
  ('Starters', 30.00),
  ('Chinese',  10.00)
) as v(category_name, rate)
where r.name = 'Clg Bites Biryani Nation'
on conflict do nothing;
