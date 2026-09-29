update public.sweet_potato_cost_settings
set crop_cost = 30000,
    box_cost = 0,
    shipping_cost = 6000,
    sale_price = 30000,
    updated_at = now()
where product_weight = '10kg';
