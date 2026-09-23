import { hasAdminSession } from "@/lib/admin-session";
import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";

type DeliveryOrder = {
  order_number: string;
  product_weight: string;
  quantity: number;
  recipient_name: string;
  recipient_phone: string;
  postcode: string;
  address: string;
  detail_address: string;
  delivery_memo: string | null;
  payment_confirmed_at: string;
};

function csvCell(value: string | number | null) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  if (!await hasAdminSession()) {
    return new Response("관리자 로그인이 필요합니다.", { status: 401 });
  }

  const config = getSupabaseServerConfig();
  if (!config) return new Response("데이터베이스 설정 전입니다.", { status: 503 });

  const columns = "order_number,product_weight,quantity,recipient_name,recipient_phone,postcode,address,detail_address,delivery_memo,payment_confirmed_at";
  const query = new URLSearchParams({
    select: columns,
    order_status: "eq.payment_confirmed",
    order: "payment_confirmed_at.asc",
    limit: "1000",
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, {
      headers: getSupabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) return new Response("주문 목록을 불러오지 못했습니다.", { status: 502 });

    const orders = (await response.json()) as DeliveryOrder[];
    const header = ["주문번호", "상품중량", "수량(상자)", "받는분", "연락처", "우편번호", "주소", "상세주소", "배송메모", "입금확인시각"];
    const rows = orders.map((order) => [
      order.order_number,
      order.product_weight,
      order.quantity,
      order.recipient_name,
      order.recipient_phone,
      order.postcode,
      order.address,
      order.detail_address,
      order.delivery_memo,
      new Date(order.payment_confirmed_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

    return new Response(csv, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="sweet-potato-orders-${date}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Admin order CSV export failed", error);
    return new Response("데이터베이스에 연결하지 못했습니다.", { status: 502 });
  }
}
