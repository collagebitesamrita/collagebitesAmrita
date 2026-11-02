-- Grant authenticated and service_role the required table privileges.
-- PostgREST checks table-level permissions before applying RLS policies.
-- In migration 20261026010000, only SELECT was granted to anon & authenticated,
-- and service_role had no permissions, which caused PostgREST to reject all
-- admin updates (e.g. restaurant turn off/on, menu updates) with 42501 (permission denied).
-- RLS policies on each table enforce that only admins (public.is_admin()) can perform admin writes.

-- 1. Full access for service_role across public schema
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- 2. Write permissions for authenticated users on tables governed by RLS
grant insert, update, delete on public.restaurants to authenticated;
grant insert, update, delete on public.dish_categories to authenticated;
grant insert, update, delete on public.dishes to authenticated;
grant update on public.app_settings to authenticated;
grant update, delete on public.orders to authenticated;
grant insert, update, delete on public.order_items to authenticated;
grant insert, update, delete on public.deleted_orders_log to authenticated;
grant insert, delete on public.milestone_rewards to authenticated;
grant update on public.users to authenticated;
