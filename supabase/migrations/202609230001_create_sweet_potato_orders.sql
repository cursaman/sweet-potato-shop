create table if not exists public.sweet_potato_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  product_weight text not null check (product_weight in ('3kg', '5kg', '10kg')),
  quantity integer not null check (quantity between 1 and 10),
  unit_price integer not null check (unit_price >= 0),
  total_price integer not null check (total_price = unit_price * quantity),
  orderer_name text not null,
  orderer_phone text not null,
  recipient_name text not null,
  recipient_phone text not null,
  postcode text not null check (postcode ~ '^[0-9]{5}$'),
  address text not null,
  detail_address text not null,
  delivery_memo text,
  order_status text not null default 'received' check (order_status in ('received', 'payment_reported', 'payment_confirmed', 'cancelled')),
  privacy_agreed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sweet_potato_orders is '산내 고구마 판매 전용 주문 테이블. edu와 ai동호회 데이터와 분리한다.';
alter table public.sweet_potato_orders enable row level security;
revoke all on table public.sweet_potato_orders from anon, authenticated;
grant select, insert, update on table public.sweet_potato_orders to service_role;

create index if not exists sweet_potato_orders_created_at_idx on public.sweet_potato_orders (created_at desc);
create index if not exists sweet_potato_orders_status_idx on public.sweet_potato_orders (order_status, created_at desc);

create or replace function public.set_sweet_potato_order_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_sweet_potato_order_updated_at on public.sweet_potato_orders;
create trigger set_sweet_potato_order_updated_at before update on public.sweet_potato_orders
for each row execute function public.set_sweet_potato_order_updated_at();
