alter table public.sweet_potato_cost_settings
  add column if not exists sale_price integer;

update public.sweet_potato_cost_settings
set sale_price = case product_weight when '3kg' then 11500 when '5kg' then 15500 when '10kg' then 25500 end
where sale_price is null;

alter table public.sweet_potato_cost_settings
  alter column sale_price set not null;

alter table public.sweet_potato_cost_settings
  drop constraint if exists sweet_potato_cost_settings_sale_price_check;

alter table public.sweet_potato_cost_settings
  add constraint sweet_potato_cost_settings_sale_price_check
  check (sale_price between 500 and 1000000 and sale_price % 500 = 0);

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
  select settings.sale_price into v_unit_price
  from public.sweet_potato_cost_settings as settings
  where settings.product_weight = p_product_weight;

  if v_unit_price is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'invalid_product_or_quantity';
  end if;

  update public.sweet_potato_inventory
  set reserved_boxes = reserved_boxes + p_quantity, updated_at = now()
  where product_weight = p_product_weight
    and reserved_boxes + p_quantity <= total_boxes;
  if not found then raise exception 'insufficient_stock'; end if;

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

revoke all on function public.create_sweet_potato_order(text, integer, text, text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_sweet_potato_order(text, integer, text, text, text, text, text, text, text, text, timestamptz) to service_role;
