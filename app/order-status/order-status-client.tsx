"use client";

import { type FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { cancelCustomerOrder, lookupOrder } from "./actions";
import { reportPayment } from "@/app/actions";
import styles from "./order-status.module.css";
import payment from "./status-payment.module.css";

type FoundOrder = { orderNumber: string; weight: string; quantity: number; total: number; status: "received" | "payment_reported" | "payment_confirmed" | "cancelled"; createdAt: string; paymentGuide: string };
const statusCopy: Record<FoundOrder["status"], { label: string; detail: string }> = {
  received: { label: "주문 접수", detail: "주문이 저장되었습니다. 입금 후 판매자에게 입금 완료를 알려 주세요." },
  payment_reported: { label: "입금 확인 요청", detail: "입금 알림이 접수되었습니다. 판매자가 카카오뱅크 내역을 확인 중입니다." },
  payment_confirmed: { label: "입금 확인 완료", detail: "판매자가 실제 입금을 확인했습니다." },
  cancelled: { label: "주문 취소", detail: "취소 처리된 주문입니다." },
};

export default function OrderStatusClient() {
  const [order, setOrder] = useState<FoundOrder | null>(null);
  const [error, setError] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setOrder(null);
    startTransition(async () => {
      const response = await lookupOrder(String(data.get("orderNumber") || ""), String(data.get("phone") || ""));
      if (response.ok) {
        setOrder(response.order);
        setVerifiedPhone(String(data.get("phone") || ""));
      }
      else setError(response.message);
    });
  }

  function reportTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    setError("");
    startTransition(async () => {
      const response = await reportPayment(order.orderNumber, verifiedPhone, depositorName);
      if (response.ok) setOrder((current) => current ? { ...current, status: "payment_reported" } : null);
      else setError(response.message);
    });
  }

  function cancelUnpaidOrder() {
    if (!order || !window.confirm("아직 입금하지 않은 주문을 취소할까요? 취소 후에는 되돌릴 수 없습니다.")) return;
    setError("");
    startTransition(async () => {
      const response = await cancelCustomerOrder(order.orderNumber, verifiedPhone);
      if (response.ok) {
        setOrder((current) => current ? { ...current, status: "cancelled" } : null);
        setDepositorName("");
      } else setError(response.message);
    });
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <Link href="/">← 판매 페이지</Link>
        <p className={styles.eyebrow}>고객 주문 조회</p><h1>내 주문 상태</h1>
        <span className={styles.intro}>주문 접수 때 받은 주문번호와 주문자 연락처를 입력해 주세요.</span>
        <form onSubmit={submit}>
          <label>주문번호<input name="orderNumber" placeholder="SP-20260923-ABC123" autoCapitalize="characters" required /></label>
          <label>주문자 연락처<input name="phone" type="tel" inputMode="tel" placeholder="010-1234-5678" required /></label>
          <button disabled={isPending}>{isPending ? "조회 중…" : "주문 조회하기"}</button>
        </form>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {order ? <section className={styles.result} aria-live="polite"><small>{order.orderNumber}</small><strong>{statusCopy[order.status].label}</strong><p>{statusCopy[order.status].detail}</p><dl><div><dt>상품</dt><dd>{order.weight} × {order.quantity}상자</dd></div><div><dt>결제 예정 금액</dt><dd>{order.total.toLocaleString("ko-KR")}원</dd></div><div><dt>주문 일시</dt><dd>{new Date(order.createdAt).toLocaleString("ko-KR")}</dd></div></dl>{order.status === "received" ? <div className={payment.transfer}><p><b>입금 안내</b><span>{order.paymentGuide}</span></p><form onSubmit={reportTransfer}><label>실제 입금자명<input value={depositorName} onChange={(event) => setDepositorName(event.target.value)} maxLength={40} placeholder="통장에 표시되는 이름" required /></label><button disabled={isPending}>{isPending ? "처리 중…" : "입금 완료 알리기"}</button></form><small>입금 확정은 판매자가 실제 카카오뱅크 내역을 확인한 후 처리합니다.</small><button className={payment.cancelButton} type="button" onClick={cancelUnpaidOrder} disabled={isPending}>{isPending ? "처리 중…" : "미입금 주문 취소"}</button></div> : null}</section> : null}
      </div>
    </main>
  );
}
