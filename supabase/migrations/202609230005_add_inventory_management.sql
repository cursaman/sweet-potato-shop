create or replace function public.set_sweet_potato_inventory_total(
  p_product_weight text,
  p_total_boxes integer
)
returns table (
  product_weight text,
  total_boxes integer,
  reserved_boxes integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_product_weight not in ('3kg', '5kg', '10kg')
    or p_total_boxes is null
    or p_total_boxes < 0
    or p_total_boxes > 10000 then
    raise exception 'invalid_inventory_total';
  end if;

  return query
  update public.sweet_potato_inventory as inventory
  set total_boxes = p_total_boxes,
      updated_at = now()
  where inventory.product_weight = p_product_weight
    and p_total_boxes >= inventory.reserved_boxes
  returning inventory.product_weight, inventory.total_boxes, inventory.reserved_boxes, inventory.updated_at;

  if not found then
    if exists (select 1 from public.sweet_potato_inventory where sweet_potato_inventory.product_weight = p_product_weight) then
      raise exception 'inventory_total_below_reserved';
    end if;
    raise exception 'inventory_not_found';
  end if;
end;
$$;

revoke all on function public.set_sweet_potato_inventory_total(text, integer) from public, anon, authenticated;
grant execute on function public.set_sweet_potato_inventory_total(text, integer) to service_role;
