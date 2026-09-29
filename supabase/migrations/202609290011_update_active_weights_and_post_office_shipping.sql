-- 판매 상품은 5kg·10kg만 노출하며, 과거 3kg 주문 데이터는 보존합니다.
update public.sweet_potato_cost_settings
set shipping_cost = 5000,
    updated_at = now()
where product_weight in ('5kg', '10kg');

update public.sweet_potato_cost_settings
set crop_cost = 30000,
    sale_price = 30000,
    updated_at = now()
where product_weight = '10kg';
