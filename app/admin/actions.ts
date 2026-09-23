"use server";

import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";
import { clearAdminSession, createAdminSession, hasAdminSession, verifyAdminPassword } from "@/lib/admin-session";

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
  depositor_name: string | null;
  payment_reported_at: string | null;
  payment_confirmed_at: string | null;
  order_status: "received" | "payment_reported" | "payment_confirmed" | "cancelled";
  created_at: string;
};

type AdminResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type AdminInventory = {
  product_weight: "3kg" | "5kg" | "10kg";
  total_boxes: number;
  reserved_boxes: number;
  updated_at: string;
};

export type SystemCheck = {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export async function loginAdmin(password: string): Promise<AdminResult<null>> {
  if (!verifyAdminPassword(password)) return { ok: false, message: "관리자 비밀번호를 확인해 주세요." };
  if (!await createAdminSession()) return { ok: false, message: "관리자 로그인 설정 전입니다." };
  return { ok: true, data: null };
}

export async function logoutAdmin(): Promise<AdminResult<null>> {
  await clearAdminSession();
  return { ok: true, data: null };
}

function getKeyCheck(key: string | undefined): SystemCheck {
  if (!key) return { label: "Supabase 서버 키", status: "fail", detail: "SUPABASE_SECRET_KEY가 없습니다." };
  if (key.startsWith("sb_secret_")) return { label: "Supabase 서버 키", status: "pass", detail: "서버 전용 secret key 형식입니다." };
  if (key.startsWith("sb_publishable_")) return { label: "Supabase 서버 키", status: "fail", detail: "publishable key입니다. secret key로 교체해야 합니다." };
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()) as { role?: string };
      return payload.role === "service_role"
        ? { label: "Supabase 서버 키", status: "pass", detail: "기존 service_role 키 형식입니다." }
        : { label: "Supabase 서버 키", status: "fail", detail: `${payload.role || "알 수 없는"} 권한 키입니다. service_role 키로 교체해야 합니다.` };
    } catch {
      return { label: "Supabase 서버 키", status: "fail", detail: "키 형식을 판별할 수 없습니다." };
    }
  }
  return { label: "Supabase 서버 키", status: "warn", detail: "알 수 없는 키 형식입니다. 연결 결과를 확인하세요." };
}

async function checkEndpoint(label: string, url: string, init: RequestInit, successDetail: string, expectedError?: string): Promise<SystemCheck> {
  try {
    const response = await fetch(url, { ...init, cache: "no-store" });
    const body = await response.text();
    if (response.ok || (expectedError && body.includes(expectedError))) return { label, status: "pass", detail: successDetail };
    if (response.status === 401) return { label, status: "fail", detail: "API 키가 올바르지 않거나 서버 권한이 없습니다." };
    if (response.status === 403) return { label, status: "fail", detail: "현재 키에 접근 권한이 없습니다." };
    if (response.status === 404 || body.includes("PGRST202")) return { label, status: "fail", detail: "필요한 SQL 마이그레이션이 적용되지 않았습니다." };
    return { label, status: "fail", detail: `Supabase 응답 오류(${response.status})가 발생했습니다.` };
  } catch {
    return { label, status: "fail", detail: "Supabase 서버에 연결할 수 없습니다." };
  }
}

export async function getSystemHealth(): Promise<AdminResult<SystemCheck[]>> {
  if (!await hasAdminSession()) return { ok: false, message: "관리자 로그인이 필요합니다." };

  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)?.trim();
  const checks: SystemCheck[] = [
    { label: "Supabase 주소", status: url ? "pass" : "fail", detail: url ? "SUPABASE_URL이 설정되어 있습니다." : "SUPABASE_URL이 없습니다." },
    getKeyCheck(key),
    { label: "입금 안내", status: process.env.BANK_TRANSFER_GUIDE ? "pass" : "warn", detail: process.env.BANK_TRANSFER_GUIDE ? "입금 계좌 안내가 설정되어 있습니다." : "BANK_TRANSFER_GUIDE가 없어 준비 중 문구가 표시됩니다." },
    { label: "관리자 비밀번호", status: process.env.ADMIN_PASSWORD ? "pass" : "fail", detail: process.env.ADMIN_PASSWORD ? "관리자 비밀번호가 설정되어 있습니다." : "ADMIN_PASSWORD가 없습니다." },
  ];

  if (!url || !key) return { ok: true, data: checks };
  const headers = getSupabaseHeaders(key, { "Content-Type": "application/json" });
  const orderColumns = new URLSearchParams({ select: "id,depositor_name,payment_reported_at,payment_confirmed_at", limit: "1" });
  const inventoryColumns = new URLSearchParams({ select: "product_weight,total_boxes,reserved_boxes", limit: "3" });
  checks.push(await checkEndpoint("주문 테이블", `${url}/rest/v1/sweet_potato_orders?${orderColumns}`, { headers }, "주문·입금 확인 구조가 준비되어 있습니다."));
  checks.push(await checkEndpoint("재고 테이블", `${url}/rest/v1/sweet_potato_inventory?${inventoryColumns}`, { headers }, "중량별 재고 구조가 준비되어 있습니다."));
  checks.push(await checkEndpoint("주문 생성 기능", `${url}/rest/v1/rpc/create_sweet_potato_order`, { method: "POST", headers, body: JSON.stringify({ p_product_weight: "3kg", p_quantity: 0, p_orderer_name: "점검", p_orderer_phone: "01000000000", p_recipient_name: "점검", p_recipient_phone: "01000000000", p_postcode: "00000", p_address: "점검", p_detail_address: "점검", p_delivery_memo: "", p_privacy_agreed_at: new Date().toISOString() }) }, "재고 연동 주문 생성 RPC가 준비되어 있습니다.", "invalid_product_or_quantity"));
  checks.push(await checkEndpoint("고객 취소 기능", `${url}/rest/v1/rpc/cancel_sweet_potato_unpaid_order`, { method: "POST", headers, body: JSON.stringify({ p_order_number: "SP-20000101-AAAAAA", p_orderer_phone: "01000000000" }) }, "고객 취소·재고 복구 RPC가 준비되어 있습니다."));
  return { ok: true, data: checks };
}

export async function getAdminOrders(): Promise<AdminResult<AdminOrder[]>> {
  if (!await hasAdminSession()) return { ok: false, message: "관리자 로그인이 필요합니다." };
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "데이터베이스 설정 전입니다." };

  const columns = "id,order_number,product_weight,quantity,total_price,orderer_name,orderer_phone,recipient_name,recipient_phone,postcode,address,detail_address,depositor_name,payment_reported_at,payment_confirmed_at,order_status,created_at";
  const query = new URLSearchParams({ select: columns, order: "created_at.desc", limit: "200" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, {
      headers: getSupabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Admin order list failed", response.status);
      return { ok: false, message: "주문 목록을 불러오지 못했습니다." };
    }
    return { ok: true, data: (await response.json()) as AdminOrder[] };
  } catch (error) {
    console.error("Admin order list request failed", error);
    return { ok: false, message: "데이터베이스에 연결하지 못했습니다." };
  }
}

export async function getAdminInventory(): Promise<AdminResult<AdminInventory[]>> {
  if (!await hasAdminSession()) return { ok: false, message: "관리자 로그인이 필요합니다." };
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "데이터베이스 설정 전입니다." };
  const query = new URLSearchParams({ select: "product_weight,total_boxes,reserved_boxes,updated_at", order: "product_weight.asc" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_inventory?${query}`, {
      headers: getSupabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, message: "재고를 불러오지 못했습니다." };
    return { ok: true, data: (await response.json()) as AdminInventory[] };
  } catch (error) {
    console.error("Admin inventory request failed", error);
    return { ok: false, message: "데이터베이스에 연결하지 못했습니다." };
  }
}

export async function updateInventoryTotal(productWeight: string, totalBoxes: number): Promise<AdminResult<AdminInventory>> {
  if (!await hasAdminSession()) return { ok: false, message: "관리자 로그인이 필요합니다." };
  if (!["3kg", "5kg", "10kg"].includes(productWeight) || !Number.isInteger(totalBoxes) || totalBoxes < 0 || totalBoxes > 10000) {
    return { ok: false, message: "총 판매 수량을 0~10,000 사이의 정수로 입력해 주세요." };
  }
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "데이터베이스 설정 전입니다." };
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/set_sweet_potato_inventory_total`, {
      method: "POST",
      headers: getSupabaseHeaders(config.key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ p_product_weight: productWeight, p_total_boxes: totalBoxes }),
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.text();
      if (body.includes("inventory_total_below_reserved")) return { ok: false, message: "예약된 수량보다 총수량을 낮출 수 없습니다." };
      if (response.status === 404 || body.includes("PGRST202")) return { ok: false, message: "재고 수정 SQL 마이그레이션을 먼저 적용해 주세요." };
      return { ok: false, message: "재고 총수량을 저장하지 못했습니다." };
    }
    const rows = (await response.json()) as AdminInventory[];
    if (!rows[0]) return { ok: false, message: "수정된 재고를 확인하지 못했습니다." };
    return { ok: true, data: rows[0] };
  } catch (error) {
    console.error("Admin inventory update failed", error);
    return { ok: false, message: "데이터베이스에 연결하지 못했습니다." };
  }
}

export async function cancelOrder(orderId: string): Promise<AdminResult<null>> {
  if (!await hasAdminSession()) return { ok: false, message: "관리자 로그인이 필요합니다." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) return { ok: false, message: "주문 정보가 올바르지 않습니다." };
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "데이터베이스 설정 전입니다." };
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/cancel_sweet_potato_order`, {
      method: "POST",
      headers: getSupabaseHeaders(config.key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ p_order_id: orderId }),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, message: "주문을 취소 처리하지 못했습니다." };
    const updated = (await response.json()) as boolean;
    if (!updated) return { ok: false, message: "이미 확정 또는 취소된 주문입니다." };
    return { ok: true, data: null };
  } catch (error) {
    console.error("Admin order cancellation request failed", error);
    return { ok: false, message: "데이터베이스에 연결하지 못했습니다." };
  }
}

export async function confirmPayment(orderId: string): Promise<AdminResult<null>> {
  if (!await hasAdminSession()) return { ok: false, message: "관리자 로그인이 필요합니다." };
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
