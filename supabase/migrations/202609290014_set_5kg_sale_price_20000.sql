update public.sweet_potato_cost_settings
set sale_price = 20000,
    shipping_cost = 5000,
    updated_at = now()
where product_weight = '5kg';
