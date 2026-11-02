-- Migration: 20261102000000_cancel_my_order_function.sql
-- Description: RPC function allowing students to cancel their own pending orders

create or replace function public.cancel_my_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_status text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select status into v_status
  from public.orders
  where id = p_order_id and user_id = v_user_id;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_status <> 'pending' then
    raise exception 'order_not_cancellable';
  end if;

  update public.orders
  set status = 'cancelled', updated_at = now()
  where id = p_order_id and user_id = v_user_id and status = 'pending';

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.cancel_my_order(uuid) to authenticated, service_role;
