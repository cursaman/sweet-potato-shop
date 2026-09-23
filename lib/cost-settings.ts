import "server-only";
import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";

export type CostSetting = {
  product_weight: "3kg" | "5kg" | "10kg";
  crop_cost: number;
  box_cost: number;
  shipping_cost: number;
  sale_price: number;
  updated_at: string | null;
};

export const fallbackCostSettings: CostSetting[] = [
  { product_weight: "3kg", crop_cost: 6000, box_cost: 500, shipping_cost: 4500, sale_price: 11500, updated_at: null },
  { product_weight: "5kg", crop_cost: 9000, box_cost: 1000, shipping_cost: 5000, sale_price: 15500, updated_at: null },
  { product_weight: "10kg", crop_cost: 16000, box_cost: 1500, shipping_cost: 7000, sale_price: 25500, updated_at: null },
];

export async function getCostSettings(): Promise<{ settings: CostSetting[]; saved: boolean }> {
  const config = getSupabaseServerConfig();
  if (!config) return { settings: fallbackCostSettings, saved: false };
  const query = new URLSearchParams({ select: "product_weight,crop_cost,box_cost,shipping_cost,sale_price,updated_at", order: "product_weight.asc" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_cost_settings?${query}`, { headers: getSupabaseHeaders(config.key), cache: "no-store" });
    if (!response.ok) {
      const legacyQuery = new URLSearchParams({ select: "product_weight,crop_cost,box_cost,shipping_cost,updated_at", order: "product_weight.asc" });
      const legacyResponse = await fetch(`${config.url}/rest/v1/sweet_potato_cost_settings?${legacyQuery}`, { headers: getSupabaseHeaders(config.key), cache: "no-store" });
      if (legacyResponse.ok) {
        const legacy = (await legacyResponse.json()) as Array<Omit<CostSetting, "sale_price">>;
        if (legacy.length === 3) return { settings: legacy.map((item) => ({ ...item, sale_price: fallbackCostSettings.find((fallback) => fallback.product_weight === item.product_weight)?.sale_price ?? 0 })), saved: true };
      }
      return { settings: fallbackCostSettings, saved: false };
    }
    const settings = (await response.json()) as CostSetting[];
    return settings.length === 3 ? { settings, saved: true } : { settings: fallbackCostSettings, saved: false };
  } catch {
    return { settings: fallbackCostSettings, saved: false };
  }
}
