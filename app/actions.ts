"use server";

import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";

type OrderInput = {
  weight: "3kg" | "5kg" | "10kg";
  quantity: number;
  orderer: string;
  ordererPhone: string;
  recipient: string;
  recipientPhone: string;
  postcode: string;
  address: string;
  detailAddress: string;
  memo: string;
  regionConfirmed: boolean;
  privacyAgreed: boolean;
};

type OrderResult =
  | { ok: true; orderNumber: string; total: number; paymentGuide: string }
  | { ok: false; message: string };

type PaymentReportResult = { ok: true } | { ok: false; message: string };

const prices = { "3kg": 11500, "5kg": 15500, "10kg": 25500 } as const;
const phonePattern = /^01[016789]-?\d{3,4}-?\d{4}$/;

function clean(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const unitPrice = prices[input.weight];
  const quantity = Number(input.quantity);
  const orderer = clean(input.orderer, 40);
  const ordererPhone = clean(input.ordererPhone, 20);
  const recipient = clean(input.recipient, 40);
  const recipientPhone = clean(input.recipientPhone, 20);
  const postcode = clean(input.postcode, 5);
  const address = clean(input.address, 150);
  const detailAddress = clean(input.detailAddress, 100);
  const memo = clean(input.memo, 100);

  if (!unitPrice || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return { ok: false, message: "상품과 수량을 다시 확인해 주세요." };
  if (!orderer || !recipient || !phonePattern.test(ordererPhone) || !phonePattern.test(recipientPhone)) return { ok: false, message: "이름과 연락처를 다시 확인해 주세요." };
  if (!/^\d{5}$/.test(postcode) || !address || !detailAddress || /제주/.test(address)) return { ok: false, message: "배송지 정보를 다시 확인해 주세요. 제주·도서산간은 주문할 수 없습니다." };
  if (!input.regionConfirmed || !input.privacyAgreed) return { ok: false, message: "배송지역 확인과 개인정보 수집 동의가 필요합니다." };

  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "주문 저장 설정 전입니다. 관리자에게 문의해 주세요." };

  const orderNumber = `SP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const total = unitPrice * quantity;

  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders`, {
      method: "POST",
      headers: getSupabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify({ order_number: orderNumber, product_weight: input.weight, quantity, unit_price: unitPrice, total_price: total, orderer_name: orderer, orderer_phone: ordererPhone, recipient_name: recipient, recipient_phone: recipientPhone, postcode, address, detail_address: detailAddress, delivery_memo: memo || null, privacy_agreed_at: new Date().toISOString() }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Order insert failed", response.status, await response.text());
      return { ok: false, message: "주문 저장 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." };
    }
    return { ok: true, orderNumber, total, paymentGuide: process.env.BANK_TRANSFER_GUIDE || "카카오뱅크 입금 계좌를 준비 중입니다." };
  } catch (error) {
    console.error("Order insert request failed", error);
    return { ok: false, message: "주문 저장 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function reportPayment(orderNumberInput: string, phoneInput: string, depositorInput: string): Promise<PaymentReportResult> {
  const orderNumber = clean(orderNumberInput, 40);
  const phone = clean(phoneInput, 20);
  const depositorName = clean(depositorInput, 40);
  if (!/^SP-\d{8}-[A-F0-9]{6}$/.test(orderNumber) || !phonePattern.test(phone) || !depositorName) {
    return { ok: false, message: "입금자명을 확인해 주세요." };
  }

  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, message: "입금 확인 설정 전입니다. 관리자에게 문의해 주세요." };

  const query = new URLSearchParams({ order_number: `eq.${orderNumber}`, orderer_phone: `eq.${phone}`, order_status: "eq.received", select: "id" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, {
      method: "PATCH",
      headers: getSupabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({ order_status: "payment_reported", depositor_name: depositorName, payment_reported_at: new Date().toISOString() }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Payment report failed", response.status);
      return { ok: false, message: "입금 알림 저장 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." };
    }
    const updated = (await response.json()) as Array<{ id: string }>;
    if (updated.length !== 1) return { ok: false, message: "주문을 찾지 못했거나 이미 입금 알림이 접수되었습니다." };
    return { ok: true };
  } catch (error) {
    console.error("Payment report request failed", error);
    return { ok: false, message: "입금 알림 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
