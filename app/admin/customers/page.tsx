import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminSession } from "@/lib/admin-session";
import { getAdminOrders, type AdminOrder } from "../actions";
import styles from "./customers.module.css";

type Customer = {
  name: string;
  phone: string;
  orderCount: number;
  confirmedCount: number;
  totalBoxes: number;
  confirmedAmount: number;
  lastOrderedAt: string;
  weights: Set<string>;
  history: AdminOrder[];
};

export const metadata: Metadata = { title: "고객 관리 | 온기담은 관리자" };
export const dynamic = "force-dynamic";

const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const formatDate = (value: string) => new Date(value).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
const normalizePhone = (value: string) => value.replaceAll("-", "");
const statusLabels: Record<AdminOrder["order_status"], string> = { received: "주문 접수", payment_reported: "입금 확인 요청", payment_confirmed: "입금 확인 완료", cancelled: "취소" };

function groupCustomers(orders: AdminOrder[]) {
  const customers = new Map<string, Customer>();
  for (const order of orders) {
    if (order.product_weight !== "5kg" && order.product_weight !== "10kg") continue;
    const key = normalizePhone(order.orderer_phone);
    const customer = customers.get(key) ?? {
      name: order.orderer_name,
      phone: order.orderer_phone,
      orderCount: 0,
      confirmedCount: 0,
      totalBoxes: 0,
      confirmedAmount: 0,
      lastOrderedAt: order.created_at,
      weights: new Set<string>(),
      history: [],
    };
    customer.name = order.orderer_name;
    customer.phone = order.orderer_phone;
    customer.history.push(order);
    customer.weights.add(order.product_weight);
    if (order.order_status !== "cancelled") {
      customer.orderCount += 1;
      customer.totalBoxes += order.quantity;
      if (order.order_status === "payment_confirmed") {
        customer.confirmedCount += 1;
        customer.confirmedAmount += order.total_price;
      }
    }
    if (Date.parse(order.created_at) > Date.parse(customer.lastOrderedAt)) customer.lastOrderedAt = order.created_at;
    customers.set(key, customer);
  }
  return [...customers.values()].map((customer) => ({ ...customer, history: customer.history.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)) })).sort((a, b) => Date.parse(b.lastOrderedAt) - Date.parse(a.lastOrderedAt));
}

export default async function CustomersPage() {
  if (!await hasAdminSession()) return <main className={styles.notice}><h1>관리자 로그인이 필요합니다.</h1><Link href="/admin">관리자 로그인으로 이동</Link></main>;
  const result = await getAdminOrders();
  if (!result.ok) return <main className={styles.notice}><h1>고객 정보를 불러오지 못했습니다.</h1><p>{result.message}</p><Link href="/admin">주문 관리로 돌아가기</Link></main>;

  const customers = groupCustomers(result.data);
  const confirmedRevenue = customers.reduce((sum, customer) => sum + customer.confirmedAmount, 0);
  const totalBoxes = customers.reduce((sum, customer) => sum + customer.totalBoxes, 0);

  return (
    <main className={styles.main}>
      <header>
        <div><p>온기담은 관리자</p><h1>고객 관리</h1><span>주문자 연락처를 기준으로 같은 고객을 묶었습니다.</span></div>
        <Link href="/admin">주문 관리로 돌아가기</Link>
      </header>
      <section className={styles.summary} aria-label="고객 요약">
        <div><span>전체 고객</span><strong>{customers.length}명</strong></div>
        <div><span>유효 주문 상자</span><strong>{totalBoxes}상자</strong></div>
        <div><span>입금 확인 매출</span><strong>{formatPrice(confirmedRevenue)}</strong></div>
      </section>
      {customers.length === 0 ? <p className={styles.empty}>표시할 고객이 없습니다.</p> : (
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>고객</th><th>연락처</th><th>구매 중량</th><th>주문</th><th>상자</th><th>입금 확인</th><th>확인 매출</th><th>최근 주문</th><th>이용내역</th></tr></thead>
            <tbody>{customers.map((customer) => (
              <tr key={normalizePhone(customer.phone)}>
                <th>{customer.name}</th><td>{customer.phone}</td><td>{[...customer.weights].sort().join(" · ")}</td><td>{customer.orderCount}건</td><td>{customer.totalBoxes}상자</td><td>{customer.confirmedCount}건</td><td><strong>{formatPrice(customer.confirmedAmount)}</strong></td><td>{formatDate(customer.lastOrderedAt)}</td><td><details className={styles.history}><summary>{customer.history.length}건 보기</summary><div>{customer.history.map((order) => <p key={order.id}><span>{formatDate(order.created_at)}</span><b>{order.product_weight} × {order.quantity}상자</b><span>{formatPrice(order.total_price)}</span><em data-status={order.order_status}>{statusLabels[order.order_status]}</em></p>)}</div></details></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className={styles.note}>고객 합계에서는 취소 주문을 제외하고, 이용내역에는 취소 상태도 표시합니다. 개인정보는 주문 처리와 고객 응대 목적으로만 사용하세요.</p>
    </main>
  );
}
