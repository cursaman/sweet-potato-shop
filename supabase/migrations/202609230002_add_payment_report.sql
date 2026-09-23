alter table public.sweet_potato_orders
  add column if not exists depositor_name text,
  add column if not exists payment_reported_at timestamptz,
  add column if not exists payment_confirmed_at timestamptz;

comment on column public.sweet_potato_orders.depositor_name is '고객이 입력한 실제 입금자명';
comment on column public.sweet_potato_orders.payment_reported_at is '고객이 입금 완료 버튼을 누른 시각';
comment on column public.sweet_potato_orders.payment_confirmed_at is '관리자가 실제 입금을 확인한 시각';

alter table public.sweet_potato_orders
  drop constraint if exists sweet_potato_orders_payment_report_fields_check;
alter table public.sweet_potato_orders
  add constraint sweet_potato_orders_payment_report_fields_check
  check (
    order_status not in ('payment_reported', 'payment_confirmed')
    or (depositor_name is not null and payment_reported_at is not null)
  );
