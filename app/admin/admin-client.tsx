"use client";

import { type FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { confirmPayment, getPaymentReports } from "./actions";
import styles from "./admin.module.css";

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

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function AdminClient() {
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const response = await getPaymentReports(password);
      if (response.ok) setOrders(response.data);
      else setMessage(response.message);
    });
  }

  function approve(orderId: string, depositorName: string, total: number) {
    if (!window.confirm(`${depositorName} / ${formatPrice(total)} 입금 내역을 실제로 확인했습니까?`)) return;
    setMessage("");
    startTransition(async () => {
      const response = await confirmPayment(password, orderId);
      if (response.ok) {
        setOrders((current) => current?.filter((order) => order.id !== orderId) ?? []);
        setMessage("입금 확인을 완료했습니다.");
      } else setMessage(response.message);
    });
  }

  return (
    <main className={styles.main}>
      <header><Link href="/">← 판매 페이지</Link><p>온기담은 관리자</p><h1>입금 확인 요청</h1><span>카카오뱅크 거래내역의 입금자명과 금액을 직접 대조한 후 확인하세요.</span></header>
      <form className={styles.login} onSubmit={loadOrders}>
        <label>관리자 비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        <button disabled={isPending}>{isPending ? "확인 중…" : "목록 불러오기"}</button>
      </form>
      {message ? <p className={styles.message} role="status">{message}</p> : null}
      {orders ? (
        <section className={styles.orders} aria-label="입금 확인 요청 목록">
          <div className={styles.summary}><strong>{orders.length}건</strong><span>확인 대기 중</span></div>
          {orders.length === 0 ? <p className={styles.empty}>현재 입금 확인을 기다리는 주문이 없습니다.</p> : null}
          {orders.map((order) => (
            <article key={order.id}>
              <div className={styles.orderHead}><div><small>{order.order_number}</small><h2>{order.product_weight} × {order.quantity}상자</h2></div><strong>{formatPrice(order.total_price)}</strong></div>
              <dl>
                <div><dt>입금자명</dt><dd>{order.depositor_name}</dd></div>
                <div><dt>요청 시각</dt><dd>{new Date(order.payment_reported_at).toLocaleString("ko-KR")}</dd></div>
                <div><dt>주문자</dt><dd>{order.orderer_name} · {order.orderer_phone}</dd></div>
                <div><dt>받는 분</dt><dd>{order.recipient_name} · {order.recipient_phone}</dd></div>
                <div><dt>배송지</dt><dd>({order.postcode}) {order.address} {order.detail_address}</dd></div>
              </dl>
              <button onClick={() => approve(order.id, order.depositor_name, order.total_price)} disabled={isPending}>입금 확인 완료</button>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
