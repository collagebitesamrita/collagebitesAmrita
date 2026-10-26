-- Grant anon and authenticated roles SELECT on tables the student app reads
-- from client components and server components. Without these grants,
-- PostgREST rejects queries with 42501 (insufficient_privilege) before RLS
-- policies even run. The RLS policies control which rows are visible; these
-- grants just allow the roles to query the tables at all.

-- Settings (offer flags, ordering mode)
grant select on public.app_settings to anon, authenticated;

-- Public browsing: restaurants, menus, dishes
grant select on public.restaurants to anon, authenticated;
grant select on public.dish_categories to anon, authenticated;
grant select on public.dishes to anon, authenticated;

-- Orders: students read their own, admins read all (RLS handles the scoping)
grant select on public.orders to anon, authenticated;
grant select on public.order_items to anon, authenticated;

-- User profiles (students read their own)
grant select on public.users to anon, authenticated;

-- Features that appear on public pages
grant select on public.favorite_dishes to anon, authenticated;
grant select on public.taste_profiles to anon, authenticated;
grant select on public.milestone_rewards to anon, authenticated;
grant select on public.order_reviews to anon, authenticated;
grant select on public.push_subscriptions to anon, authenticated;
grant select on public.deleted_orders_log to anon, authenticated;
