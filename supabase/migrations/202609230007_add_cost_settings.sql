create table if not exists public.sweet_potato_cost_settings (
  product_weight text primary key check (product_weight in ('3kg', '5kg', '10kg')),
  crop_cost integer not null check (crop_cost >= 0 and crop_cost <= 1000000),
  box_cost integer not null check (box_cost >= 0 and box_cost <= 1000000),
  shipping_cost integer not null check (shipping_cost >= 0 and shipping_cost <= 1000000),
  updated_at timestamptz not null default now()
);

insert into public.sweet_potato_cost_settings (product_weight, crop_cost, box_cost, shipping_cost)
values
  ('3kg', 6000, 500, 4500),
  ('5kg', 9000, 1000, 5000),
  ('10kg', 16000, 1500, 7000)
on conflict (product_weight) do nothing;

alter table public.sweet_potato_cost_settings enable row level security;
revoke all on table public.sweet_potato_cost_settings from anon, authenticated;
grant select, update on table public.sweet_potato_cost_settings to service_role;

comment on table public.sweet_potato_cost_settings is
  '고구마 판매 전용 중량별 목표비용 설정. 다른 서비스 데이터와 분리한다.';
