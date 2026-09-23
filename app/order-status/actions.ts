"use server";

import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";

type OrderStatusResult =
  | { ok: true; order: { orderNumber: string; weight: string; quantity: number; total: number; status: "received" | "payment_reported" | "payment_confirmed" | "cancelled"; createdAt: string; paymentGuide: string } }
  | { ok: false; message: string };

export async function lookupOrder(orderNumberInput: string, phoneInput: string): Promise<OrderStatusResult> {
  const orderNumber = orderNumberInput.trim().toUpperCase().slice(0, 40);
  const phone = phoneInput.replaceAll("-", "").trim();
  if (!/^SP-\d{8}-[A-F0-9]{6}$/.test(orderNumber) || !/^01[016789]\d{7,8}$/.test(phone)) {
    return { ok: false, message: "주문번호와 주문자 연락처를 확인해 주세요." };
  }
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "주문 조회 설정 전입니다." };

  const query = new URLSearchParams({ select: "order_number,product_weight,quantity,total_price,order_status,created_at,orderer_phone", order_number: `eq.${orderNumber}`, limit: "1" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, { headers: getSupabaseHeaders(config.key), cache: "no-store" });
    if (!response.ok) return { ok: false, message: "주문을 조회하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    const rows = (await response.json()) as Array<{ order_number: string; product_weight: string; quantity: number; total_price: number; order_status: "received" | "payment_reported" | "payment_confirmed" | "cancelled"; created_at: string; orderer_phone: string }>;
    const found = rows[0];
    if (!found || found.orderer_phone.replaceAll("-", "") !== phone) return { ok: false, message: "일치하는 주문을 찾지 못했습니다." };
    return { ok: true, order: { orderNumber: found.order_number, weight: found.product_weight, quantity: found.quantity, total: found.total_price, status: found.order_status, createdAt: found.created_at, paymentGuide: process.env.BANK_TRANSFER_GUIDE || "카카오뱅크 입금 계좌를 준비 중입니다." } };
  } catch (error) {
    console.error("Customer order lookup failed", error);
    return { ok: false, message: "주문 조회 서버에 연결하지 못했습니다." };
  }
}
