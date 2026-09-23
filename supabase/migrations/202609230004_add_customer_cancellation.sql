create or replace function public.cancel_sweet_potato_unpaid_order(
  p_order_number text,
  p_orderer_phone text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_weight text;
  v_quantity integer;
begin
  select id, product_weight, quantity
  into v_order_id, v_weight, v_quantity
  from public.sweet_potato_orders
  where order_number = upper(trim(p_order_number))
    and regexp_replace(orderer_phone, '[^0-9]', '', 'g') = regexp_replace(p_orderer_phone, '[^0-9]', '', 'g')
    and order_status = 'received'
  for update;

  if not found then return false; end if;

  update public.sweet_potato_orders
  set order_status = 'cancelled'
  where id = v_order_id;

  update public.sweet_potato_inventory
  set reserved_boxes = greatest(0, reserved_boxes - v_quantity),
      updated_at = now()
  where product_weight = v_weight;

  return true;
end;
$$;

revoke all on function public.cancel_sweet_potato_unpaid_order(text, text) from public, anon, authenticated;
grant execute on function public.cancel_sweet_potato_unpaid_order(text, text) to service_role;
