import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminSession } from "@/lib/admin-session";
import { getSupabaseHeaders, getSupabaseServerConfig } from "@/lib/supabase-server";
import PrintButton from "../print-button";
import styles from "./daily-summary.module.css";

type ConfirmedOrder = {
  product_weight: string;
  quantity: number;
  total_price: number;
  payment_confirmed_at: string;
};

type DailyRow = {
  date: string;
  orders: number;
  boxes: number;
  revenue: number;
  estimatedCost: number;
  estimatedBalance: number;
  weights: Record<string, number>;
};

export const metadata: Metadata = { title: "일일 정산표 | 온기담은 관리자" };

const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const costBasis: Record<string, { crop: number; box: number; shipping: number; total: number }> = {
  "3kg": { crop: 6000, box: 500, shipping: 4500, total: 11000 },
  "5kg": { crop: 9000, box: 1000, shipping: 5000, total: 15000 },
  "10kg": { crop: 16000, box: 1500, shipping: 7000, total: 24500 },
};

async function getConfirmedOrders(): Promise<{ orders: ConfirmedOrder[]; error?: string }> {
  const config = getSupabaseServerConfig();
  if (!config) return { orders: [], error: "데이터베이스 설정 전입니다." };
  const query = new URLSearchParams({
    select: "product_weight,quantity,total_price,payment_confirmed_at",
    order_status: "eq.payment_confirmed",
    payment_confirmed_at: "not.is.null",
    order: "payment_confirmed_at.desc",
    limit: "1000",
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/sweet_potato_orders?${query}`, {
      headers: getSupabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) return { orders: [], error: "정산할 주문을 불러오지 못했습니다." };
    return { orders: (await response.json()) as ConfirmedOrder[] };
  } catch (error) {
    console.error("Daily settlement request failed", error);
    return { orders: [], error: "데이터베이스에 연결하지 못했습니다." };
  }
}

export default async function DailySummaryPage() {
  if (!await hasAdminSession()) {
    return <main className={styles.notice}><h1>관리자 로그인이 필요합니다.</h1><Link href="/admin">관리자 로그인으로 이동</Link></main>;
  }

  const { orders, error } = await getConfirmedOrders();
  const dailyMap = new Map<string, DailyRow>();
  for (const order of orders) {
    const date = dateFormatter.format(new Date(order.payment_confirmed_at));
    const estimatedCost = (costBasis[order.product_weight]?.total ?? 0) * order.quantity;
    const row = dailyMap.get(date) ?? { date, orders: 0, boxes: 0, revenue: 0, estimatedCost: 0, estimatedBalance: 0, weights: { "3kg": 0, "5kg": 0, "10kg": 0 } };
    row.orders += 1;
    row.boxes += order.quantity;
    row.revenue += order.total_price;
    row.estimatedCost += estimatedCost;
    row.estimatedBalance += order.total_price - estimatedCost;
    row.weights[order.product_weight] = (row.weights[order.product_weight] ?? 0) + order.quantity;
    dailyMap.set(date, row);
  }
  const rows = [...dailyMap.values()].sort((a, b) => b.date.localeCompare(a.date));
  const totalBoxes = orders.reduce((sum, order) => sum + order.quantity, 0);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
  const totalEstimatedCost = orders.reduce((sum, order) => sum + (costBasis[order.product_weight]?.total ?? 0) * order.quantity, 0);
  const totalEstimatedBalance = totalRevenue - totalEstimatedCost;
  const generatedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <main className={styles.main}>
      <header>
        <div><p>온기담은 관리자</p><h1>일일 정산표</h1><span>입금 확인 완료 기준 · {generatedAt}</span></div>
        <nav><Link href="/admin">주문 관리로 돌아가기</Link><PrintButton /></nav>
      </header>
      {error ? <p className={styles.error}>{error}</p> : (
        <>
          <section className={styles.summary} aria-label="전체 정산 요약">
            <div><span>확정 주문</span><strong>{orders.length}건</strong></div>
            <div><span>확정 상자</span><strong>{totalBoxes}상자</strong></div>
            <div><span>확인 매출</span><strong>{formatPrice(totalRevenue)}</strong></div>
            <div><span>목표비용 합계</span><strong>{formatPrice(totalEstimatedCost)}</strong></div>
            <div><span>예상 잔액</span><strong>{formatPrice(totalEstimatedBalance)}</strong></div>
            <div><span>정산 일수</span><strong>{rows.length}일</strong></div>
          </section>
          <section className={styles.costBasis} aria-label="중량별 목표비용 기준">
            {Object.entries(costBasis).map(([weight, cost]) => <article key={weight}><strong>{weight}</strong><span>고구마 {formatPrice(cost.crop)}</span><span>박스 {formatPrice(cost.box)}</span><span>배송 {formatPrice(cost.shipping)}</span><b>합계 {formatPrice(cost.total)}</b></article>)}
          </section>
          {rows.length === 0 ? <p className={styles.empty}>입금 확인 완료 주문이 없습니다.</p> : (
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>입금 확인일</th><th>주문</th><th>3kg</th><th>5kg</th><th>10kg</th><th>전체 상자</th><th>확인 매출</th><th>목표비용</th><th>예상 잔액</th></tr></thead>
                <tbody>{rows.map((row) => <tr key={row.date}><th>{row.date}</th><td>{row.orders}건</td><td>{row.weights["3kg"]}상자</td><td>{row.weights["5kg"]}상자</td><td>{row.weights["10kg"]}상자</td><td><b>{row.boxes}상자</b></td><td>{formatPrice(row.revenue)}</td><td>{formatPrice(row.estimatedCost)}</td><td><strong>{formatPrice(row.estimatedBalance)}</strong></td></tr>)}</tbody>
                <tfoot><tr><th>합계</th><td>{orders.length}건</td><td colSpan={3}></td><td>{totalBoxes}상자</td><td>{formatPrice(totalRevenue)}</td><td>{formatPrice(totalEstimatedCost)}</td><td>{formatPrice(totalEstimatedBalance)}</td></tr></tfoot>
              </table>
            </div>
          )}
          <p className={styles.note}><strong>중요:</strong> 목표비용과 예상 잔액은 임시 시뮬레이션입니다. 실제 재배비·박스 구매가·택배 계약요금이 확정되면 반드시 기준을 수정해야 합니다. 확인 매출은 실제 계좌 거래내역과 함께 대조해 주세요.</p>
        </>
      )}
    </main>
  );
}
