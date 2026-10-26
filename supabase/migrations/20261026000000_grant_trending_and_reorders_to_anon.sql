-- Allow anonymous users to view aggregate trending dishes and repeat-order counts
-- on public browsing pages (Home and Restaurant menus) without triggering 42501.
grant execute on function public.trending_dishes(int, int) to anon;
grant execute on function public.highly_reordered_dishes(int, int) to anon;
