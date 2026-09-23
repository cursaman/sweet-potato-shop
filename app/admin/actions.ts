"use server";

import { timingSafeEqual } from "node:crypto";
import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";

type AdminOrder = {
  id: string;
  order_number: string;
  product_weight: string;
  quantity: number;
  total_price: number;
  orderer_name: string;
  orderer_phone: string;
  recipient_name: string;
  recipient_phone: string;
  postcode: string;
  address: string;
  detail_address: string;
  depositor_name: string;
  payment_reported_at: string;
};

type AdminResult<T> = { ok: true; data: T } | { ok: false; message: string };

function isAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const suppliedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export async function getPaymentReports(password: string): Promise<AdminResult<AdminOrder[]>> {
  if (!isAdmin(password)) return { ok: false, message: "관리자 비밀번호를 확인해 주세요." };
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "데이터베이스 설정 전입니다." };

  const columns = "id,order_number,product_weight,quantity,total_price,orderer_name,orderer_phone,recipient_name,recipient_phone,postcode,address,detail_address,depositor_name,payment_reported_at";
  const query = new URLSearchParams({ select: columns, order_status: "eq.payment_reported", order: "payment_reported_at.asc" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, {
      headers: getSupabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Admin order list failed", response.status);
      return { ok: false, message: "입금 확인 목록을 불러오지 못했습니다." };
    }
    return { ok: true, data: (await response.json()) as AdminOrder[] };
  } catch (error) {
    console.error("Admin order list request failed", error);
    return { ok: false, message: "데이터베이스에 연결하지 못했습니다." };
  }
}

export async function confirmPayment(password: string, orderId: string): Promise<AdminResult<null>> {
  if (!isAdmin(password)) return { ok: false, message: "관리자 비밀번호를 확인해 주세요." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) return { ok: false, message: "주문 정보가 올바르지 않습니다." };
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "데이터베이스 설정 전입니다." };

  const query = new URLSearchParams({ id: `eq.${orderId}`, order_status: "eq.payment_reported", select: "id" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, {
      method: "PATCH",
      headers: getSupabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({ order_status: "payment_confirmed", payment_confirmed_at: new Date().toISOString() }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Admin payment confirmation failed", response.status);
      return { ok: false, message: "입금 확인 상태를 저장하지 못했습니다." };
    }
    const updated = (await response.json()) as Array<{ id: string }>;
    if (updated.length !== 1) return { ok: false, message: "이미 처리됐거나 찾을 수 없는 주문입니다." };
    return { ok: true, data: null };
  } catch (error) {
    console.error("Admin payment confirmation request failed", error);
    return { ok: false, message: "데이터베이스에 연결하지 못했습니다." };
  }
}
