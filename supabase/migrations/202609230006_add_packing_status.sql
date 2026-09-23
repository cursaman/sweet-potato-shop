alter table public.sweet_potato_orders
  add column if not exists packed_at timestamptz;

create index if not exists sweet_potato_orders_packing_queue_idx
  on public.sweet_potato_orders (payment_confirmed_at asc)
  where order_status = 'payment_confirmed' and packed_at is null;

comment on column public.sweet_potato_orders.packed_at is
  '관리자가 포장 완료로 확인한 시각. 배송 또는 운송장 상태는 포함하지 않는다.';
