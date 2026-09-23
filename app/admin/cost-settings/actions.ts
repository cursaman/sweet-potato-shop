"use server";

import { hasAdminSession } from "@/lib/admin-session";
import { type CostSetting } from "@/lib/cost-settings";
import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";

type Result = { ok: true; data: CostSetting } | { ok: false; message: string };

export async function updateCostSetting(productWeight: string, cropCost: number, boxCost: number, shippingCost: number, salePrice: number): Promise<Result> {
  if (!await hasAdminSession()) return { ok: false, message: "관리자 로그인이 필요합니다." };
  const costs = [cropCost, boxCost, shippingCost];
  if (!["3kg", "5kg", "10kg"].includes(productWeight) || costs.some((cost) => !Number.isInteger(cost) || cost < 0 || cost > 1000000) || !Number.isInteger(salePrice) || salePrice < 500 || salePrice > 1000000 || salePrice % 500 !== 0) {
    return { ok: false, message: "비용은 정수로, 판매가는 500원 단위로 입력해 주세요." };
  }
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "데이터베이스 설정 전입니다." };
  const query = new URLSearchParams({ product_weight: `eq.${productWeight}`, select: "product_weight,crop_cost,box_cost,shipping_cost,sale_price,updated_at" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_cost_settings?${query}`, {
      method: "PATCH",
      headers: getSupabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({ crop_cost: cropCost, box_cost: boxCost, shipping_cost: shippingCost, sale_price: salePrice, updated_at: new Date().toISOString() }),
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.text();
      if (response.status === 404 || body.includes("PGRST205") || body.includes("sale_price")) return { ok: false, message: "판매가 설정 SQL 마이그레이션을 먼저 적용해 주세요." };
      return { ok: false, message: "비용 설정을 저장하지 못했습니다." };
    }
    const rows = (await response.json()) as CostSetting[];
    if (!rows[0]) return { ok: false, message: "비용 설정 행을 찾지 못했습니다." };
    return { ok: true, data: rows[0] };
  } catch (error) {
    console.error("Cost setting update failed", error);
    return { ok: false, message: "데이터베이스에 연결하지 못했습니다." };
  }
}
