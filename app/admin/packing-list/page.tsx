import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminSession } from "@/lib/admin-session";
import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";
import PrintButton from "./print-button";
import styles from "./packing-list.module.css";

type PackingOrder = {
  id: string;
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

export const metadata: Metadata = { title: "포장 목록 | 온기담은 관리자" };

async function getPackingOrders(): Promise<{ orders: PackingOrder[]; error?: string }> {
  const config = getSupabaseServerConfig();
  if (!config) return { orders: [], error: "데이터베이스 설정 전입니다." };
  const columns = "id,order_number,product_weight,quantity,recipient_name,recipient_phone,postcode,address,detail_address,delivery_memo,payment_confirmed_at";
  const query = new URLSearchParams({ select: columns, order_status: "eq.payment_confirmed", order: "payment_confirmed_at.asc", limit: "1000" });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, {
      headers: getSupabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) return { orders: [], error: "주문 목록을 불러오지 못했습니다." };
    return { orders: (await response.json()) as PackingOrder[] };
  } catch (error) {
    console.error("Packing list request failed", error);
    return { orders: [], error: "데이터베이스에 연결하지 못했습니다." };
  }
}

export default async function PackingListPage() {
  if (!await hasAdminSession()) {
    return <main className={styles.notice}><h1>관리자 로그인이 필요합니다.</h1><Link href="/admin">관리자 로그인으로 이동</Link></main>;
  }

  const { orders, error } = await getPackingOrders();
  const weights = ["3kg", "5kg", "10kg"].map((weight) => ({
    weight,
    boxes: orders.filter((order) => order.product_weight === weight).reduce((sum, order) => sum + order.quantity, 0),
  }));
  const totalBoxes = orders.reduce((sum, order) => sum + order.quantity, 0);
  const printedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <main className={styles.main}>
      <header>
        <div><p>온기담은 관리자</p><h1>포장 목록</h1><span>입금 확인 완료 주문 · {printedAt} 기준</span></div>
        <nav><Link href="/admin">주문 관리로 돌아가기</Link><PrintButton /></nav>
      </header>
      {error ? <p className={styles.error}>{error}</p> : (
        <>
          <section className={styles.summary} aria-label="포장 수량 요약">
            <div><span>주문</span><strong>{orders.length}건</strong></div>
            <div><span>전체</span><strong>{totalBoxes}상자</strong></div>
            {weights.map((item) => <div key={item.weight}><span>{item.weight}</span><strong>{item.boxes}상자</strong></div>)}
          </section>
          {orders.length === 0 ? <p className={styles.empty}>입금 확인이 완료된 주문이 없습니다.</p> : (
            <section className={styles.list} aria-label="포장 대상 주문">
              {orders.map((order, index) => (
                <article key={order.id}>
                  <div className={styles.orderHead}><b>{index + 1}</b><div><small>{order.order_number}</small><h2>{order.product_weight} × {order.quantity}상자</h2></div></div>
                  <dl>
                    <div><dt>받는 분</dt><dd>{order.recipient_name} · {order.recipient_phone}</dd></div>
                    <div><dt>주소</dt><dd>({order.postcode}) {order.address} {order.detail_address}</dd></div>
                    <div><dt>배송 메모</dt><dd>{order.delivery_memo || "없음"}</dd></div>
                  </dl>
                  <label><input type="checkbox" /> 포장 확인</label>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
