"use client";

import { type FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { cancelOrder, confirmPayment, getAdminOrders, getSystemHealth, type SystemCheck } from "./actions";
import styles from "./admin.module.css";
import ops from "./admin-ops.module.css";

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
  order_status: OrderStatus;
  created_at: string;
};

type OrderStatus = "received" | "payment_reported" | "payment_confirmed" | "cancelled";

const statuses: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "전체" },
  { value: "received", label: "주문 접수" },
  { value: "payment_reported", label: "입금 확인 요청" },
  { value: "payment_confirmed", label: "입금 확인 완료" },
  { value: "cancelled", label: "취소" },
];
const statusLabels: Record<OrderStatus, string> = { received: "주문 접수", payment_reported: "입금 확인 요청", payment_confirmed: "입금 확인 완료", cancelled: "취소" };
const stockTargets = ["3kg", "5kg", "10kg"].map((weight) => ({ weight, target: 100 }));

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function AdminClient() {
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [message, setMessage] = useState("");
  const [systemChecks, setSystemChecks] = useState<SystemCheck[] | null>(null);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const response = await getAdminOrders(password);
      if (response.ok) setOrders(response.data);
      else setMessage(response.message);
    });
  }

  function inspectSystem() {
    setMessage("");
    startTransition(async () => {
      const response = await getSystemHealth(password);
      if (response.ok) setSystemChecks(response.data);
      else setMessage(response.message);
    });
  }

  function approve(orderId: string, depositorName: string, total: number) {
    if (!window.confirm(`${depositorName} / ${formatPrice(total)} 입금 내역을 실제로 확인했습니까?`)) return;
    setMessage("");
    startTransition(async () => {
      const response = await confirmPayment(password, orderId);
      if (response.ok) {
        setOrders((current) => current?.map((order) => order.id === orderId ? { ...order, order_status: "payment_confirmed", payment_confirmed_at: new Date().toISOString() } : order) ?? []);
        setMessage("입금 확인을 완료했습니다.");
      } else setMessage(response.message);
    });
  }

  function cancel(orderId: string, orderNumber: string) {
    if (!window.confirm(`${orderNumber} 주문을 취소 처리합니까?`)) return;
    setMessage("");
    startTransition(async () => {
      const response = await cancelOrder(password, orderId);
      if (response.ok) {
        setOrders((current) => current?.map((order) => order.id === orderId ? { ...order, order_status: "cancelled" } : order) ?? []);
        setMessage("주문을 취소 처리했습니다.");
      } else setMessage(response.message);
    });
  }

  const confirmedOrders = orders?.filter((order) => order.order_status === "payment_confirmed") ?? [];
  const confirmedRevenue = confirmedOrders.reduce((sum, order) => sum + order.total_price, 0);
  const confirmedBoxes = confirmedOrders.reduce((sum, order) => sum + order.quantity, 0);
  const waitingCount = orders?.filter((order) => order.order_status === "payment_reported").length ?? 0;
  const stock = stockTargets.map(({ weight, target }) => {
    const activeOrders = orders?.filter((order) => order.product_weight === weight && order.order_status !== "cancelled") ?? [];
    const reserved = activeOrders.reduce((sum, order) => sum + order.quantity, 0);
    const confirmed = activeOrders.filter((order) => order.order_status === "payment_confirmed").reduce((sum, order) => sum + order.quantity, 0);
    return { weight, target, reserved, confirmed, remaining: Math.max(0, target - reserved) };
  });
  const normalizedSearch = search.replaceAll("-", "").trim().toLowerCase();
  const visibleOrders = orders?.filter((order) => {
    if (filter !== "all" && order.order_status !== filter) return false;
    if (!normalizedSearch) return true;
    return [order.order_number, order.orderer_name, order.orderer_phone, order.recipient_name, order.recipient_phone, order.depositor_name || ""]
      .some((value) => value.replaceAll("-", "").toLowerCase().includes(normalizedSearch));
  }) ?? [];

  return (
    <main className={styles.main}>
      <header><Link href="/">← 판매 페이지</Link><p>온기담은 관리자</p><h1>주문 관리</h1><span>주문 접수부터 입금 확인 완료까지 상태를 확인합니다. 배송 추적은 포함하지 않습니다.</span></header>
      <form className={styles.login} onSubmit={loadOrders}>
        <label>관리자 비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        <button disabled={isPending}>{isPending ? "확인 중…" : "주문 목록 불러오기"}</button>
        <button type="button" className={ops.checkButton} onClick={inspectSystem} disabled={isPending || !password}>{isPending ? "점검 중…" : "운영 설정 점검"}</button>
      </form>
      {message ? <p className={styles.message} role="status">{message}</p> : null}
      {systemChecks ? <section className={ops.health} aria-label="운영 설정 점검 결과"><div><h2>운영 준비 상태</h2><span>비밀키 값은 화면에 표시하지 않습니다.</span></div><ul>{systemChecks.map((check) => <li key={check.label} className={ops[check.status]}><b>{check.label}</b><strong>{check.status === "pass" ? "정상" : check.status === "warn" ? "확인" : "조치 필요"}</strong><p>{check.detail}</p></li>)}</ul></section> : null}
      {orders ? (
        <section className={styles.orders} aria-label="전체 주문 목록">
          <div className={ops.metrics}>
            <div><span>전체 주문</span><strong>{orders.length}건</strong></div>
            <div><span>입금 확인 대기</span><strong>{waitingCount}건</strong></div>
            <div><span>확정 상자</span><strong>{confirmedBoxes}상자</strong></div>
            <div><span>입금 확인 매출</span><strong>{formatPrice(confirmedRevenue)}</strong></div>
          </div>
          <div className={ops.stockSection}>
            <div><p>중량별 재고</p><span>각 100상자 기준 · 취소 주문 제외</span></div>
            <div className={ops.stockGrid}>
              {stock.map((item) => (
                <article key={item.weight} className={item.remaining <= 10 ? ops.lowStock : undefined}>
                  <div><strong>{item.weight}</strong><span>{item.remaining <= 10 ? "재고 확인 필요" : "판매 가능"}</span></div>
                  <p><b>{item.remaining}</b><small>/ {item.target}상자 남음</small></p>
                  <dl><div><dt>주문 확보</dt><dd>{item.reserved}상자</dd></div><div><dt>입금 확인</dt><dd>{item.confirmed}상자</dd></div></dl>
                </article>
              ))}
            </div>
          </div>
          <label className={ops.search}>주문 검색<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="주문번호·이름·전화번호·입금자명" /></label>
          <div className={ops.filters} aria-label="주문 상태 필터">
            {statuses.map((status) => <button type="button" key={status.value} className={filter === status.value ? ops.activeFilter : undefined} onClick={() => setFilter(status.value)}>{status.label} <small>{status.value === "all" ? orders.length : orders.filter((order) => order.order_status === status.value).length}</small></button>)}
          </div>
          <div className={styles.summary}><strong>{visibleOrders.length}건</strong><span>검색 결과</span></div>
          {visibleOrders.length === 0 ? <p className={styles.empty}>조건에 맞는 주문이 없습니다.</p> : null}
          {visibleOrders.map((order) => (
            <article key={order.id}>
              <div className={styles.orderHead}><div><small>{order.order_number}</small><h2>{order.product_weight} × {order.quantity}상자</h2><span className={`${ops.status} ${ops[order.order_status]}`}>{statusLabels[order.order_status]}</span></div><strong>{formatPrice(order.total_price)}</strong></div>
              <dl>
                <div><dt>주문 시각</dt><dd>{new Date(order.created_at).toLocaleString("ko-KR")}</dd></div>
                <div><dt>입금자명</dt><dd>{order.depositor_name || "아직 입력되지 않음"}</dd></div>
                {order.payment_reported_at ? <div><dt>입금 알림</dt><dd>{new Date(order.payment_reported_at).toLocaleString("ko-KR")}</dd></div> : null}
                <div><dt>주문자</dt><dd>{order.orderer_name} · {order.orderer_phone}</dd></div>
                <div><dt>받는 분</dt><dd>{order.recipient_name} · {order.recipient_phone}</dd></div>
                <div><dt>배송지</dt><dd>({order.postcode}) {order.address} {order.detail_address}</dd></div>
              </dl>
              <div className={ops.actions}>
                {order.order_status === "payment_reported" ? <button type="button" onClick={() => approve(order.id, order.depositor_name || "입금자명 없음", order.total_price)} disabled={isPending}>입금 확인 완료</button> : null}
                {order.order_status === "received" || order.order_status === "payment_reported" ? <button type="button" className={ops.cancelButton} onClick={() => cancel(order.id, order.order_number)} disabled={isPending}>주문 취소</button> : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
