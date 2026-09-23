import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";

export type ProductWeight = "3kg" | "5kg" | "10kg";
export type PublicInventory = Record<ProductWeight, number | null>;

const fallback: PublicInventory = { "3kg": null, "5kg": null, "10kg": null };

export async function getPublicInventory(): Promise<PublicInventory> {
  const config = getSupabaseServerConfig();
  if (!config) return fallback;
  const query = new URLSearchParams({ select: "product_weight,total_boxes,reserved_boxes" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_inventory?${query}`, {
      headers: getSupabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) return fallback;
    const rows = (await response.json()) as Array<{ product_weight: ProductWeight; total_boxes: number; reserved_boxes: number }>;
    return rows.reduce<PublicInventory>((stock, row) => {
      if (row.product_weight in stock) stock[row.product_weight] = Math.max(0, row.total_boxes - row.reserved_boxes);
      return stock;
    }, { ...fallback });
  } catch {
    return fallback;
  }
}
