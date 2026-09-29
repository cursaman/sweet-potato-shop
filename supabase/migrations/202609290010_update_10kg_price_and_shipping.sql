update public.sweet_potato_cost_settings
set shipping_cost = 6000,
    sale_price = 30000,
    updated_at = now()
where product_weight = '10kg';
