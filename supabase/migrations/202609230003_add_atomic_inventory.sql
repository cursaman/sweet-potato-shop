create table if not exists public.sweet_potato_inventory (
  product_weight text primary key check (product_weight in ('3kg', '5kg', '10kg')),
  total_boxes integer not null default 100 check (total_boxes >= 0),
  reserved_boxes integer not null default 0 check (reserved_boxes >= 0 and reserved_boxes <= total_boxes),
  updated_at timestamptz not null default now()
);

insert into public.sweet_potato_inventory (product_weight, total_boxes)
values ('3kg', 100), ('5kg', 100), ('10kg', 100)
on conflict (product_weight) do nothing;

with active as (
  select product_weight, coalesce(sum(quantity), 0)::integer as boxes
  from public.sweet_potato_orders
  where order_status <> 'cancelled'
  group by product_weight
)
update public.sweet_potato_inventory as inventory
set reserved_boxes = active.boxes,
    total_boxes = greatest(inventory.total_boxes, active.boxes),
    updated_at = now()
from active
where inventory.product_weight = active.product_weight;

alter table public.sweet_potato_inventory enable row level security;
revoke all on table public.sweet_potato_inventory from anon, authenticated;
grant select, update on table public.sweet_potato_inventory to service_role;

create or replace function public.create_sweet_potato_order(
  p_product_weight text,
  p_quantity integer,
  p_orderer_name text,
  p_orderer_phone text,
  p_recipient_name text,
  p_recipient_phone text,
  p_postcode text,
  p_address text,
  p_detail_address text,
  p_delivery_memo text,
  p_privacy_agreed_at timestamptz
)
returns table(created_order_number text, created_total_price integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_unit_price integer;
  v_order_number text;
begin
  v_unit_price := case p_product_weight when '3kg' then 11500 when '5kg' then 15500 when '10kg' then 25500 else null end;
  if v_unit_price is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'invalid_product_or_quantity';
  end if;

  update public.sweet_potato_inventory
  set reserved_boxes = reserved_boxes + p_quantity, updated_at = now()
  where product_weight = p_product_weight
    and reserved_boxes + p_quantity <= total_boxes;
  if not found then
    raise exception 'insufficient_stock';
  end if;

  v_order_number := 'SP-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.sweet_potato_orders (
    order_number, product_weight, quantity, unit_price, total_price,
    orderer_name, orderer_phone, recipient_name, recipient_phone,
    postcode, address, detail_address, delivery_memo, privacy_agreed_at
  ) values (
    v_order_number, p_product_weight, p_quantity, v_unit_price, v_unit_price * p_quantity,
    p_orderer_name, p_orderer_phone, p_recipient_name, p_recipient_phone,
    p_postcode, p_address, p_detail_address, nullif(p_delivery_memo, ''), p_privacy_agreed_at
  );

  return query select v_order_number, v_unit_price * p_quantity;
end;
$$;

create or replace function public.cancel_sweet_potato_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_weight text;
  v_quantity integer;
begin
  select product_weight, quantity into v_weight, v_quantity
  from public.sweet_potato_orders
  where id = p_order_id and order_status in ('received', 'payment_reported')
  for update;
  if not found then return false; end if;

  update public.sweet_potato_orders set order_status = 'cancelled' where id = p_order_id;
  update public.sweet_potato_inventory
  set reserved_boxes = greatest(0, reserved_boxes - v_quantity), updated_at = now()
  where product_weight = v_weight;
  return true;
end;
$$;

revoke all on function public.create_sweet_potato_order(text, integer, text, text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_sweet_potato_order(text, integer, text, text, text, text, text, text, text, text, timestamptz) to service_role;
revoke all on function public.cancel_sweet_potato_order(uuid) from public, anon, authenticated;
grant execute on function public.cancel_sweet_potato_order(uuid) to service_role;
