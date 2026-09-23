"use client";

import { type FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { createOrder, reportPayment } from "./actions";
import styles from "./order-form.module.css";
import paymentStyles from "./payment.module.css";

const products = [
  { weight: "3kg", price: 11500 },
  { weight: "5kg", price: 15500 },
  { weight: "10kg", price: 25500 },
] as const;

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

type OrderPreview = {
  weight: (typeof products)[number]["weight"];
  quantity: number;
  total: number;
  orderer: string;
  ordererPhone: string;
  recipient: string;
  recipientPhone: string;
  postcode: string;
  address: string;
  detailAddress: string;
  memo: string;
};

export default function OrderForm() {
  const [weight, setWeight] = useState<(typeof products)[number]["weight"]>("5kg");
  const [quantity, setQuantity] = useState(1);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [result, setResult] = useState<{ orderNumber: string; total: number; paymentGuide: string } | null>(null);
  const [error, setError] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [paymentReported, setPaymentReported] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedProduct = products.find((product) => product.weight === weight) ?? products[1];
  const total = selectedProduct.price * quantity;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const basicAddress = String(data.get("address") ?? "").trim();

    if (/제주/.test(basicAddress)) {
      alert("제주 및 도서산간 지역은 현재 주문할 수 없습니다.");
      return;
    }

    setPreview({
      weight,
      quantity,
      total,
      orderer: String(data.get("orderer") ?? ""),
      ordererPhone: String(data.get("ordererPhone") ?? ""),
      recipient: String(data.get("recipient") ?? ""),
      recipientPhone: String(data.get("recipientPhone") ?? ""),
      postcode: String(data.get("postcode") ?? ""),
      address: basicAddress,
      detailAddress: String(data.get("detailAddress") ?? ""),
      memo: String(data.get("memo") ?? "없음") || "없음",
    });
    setResult(null);
    setError("");
  }

  function submitOrder() {
    if (!preview) return;
    setError("");
    startTransition(async () => {
      const response = await createOrder({ ...preview, regionConfirmed: true, privacyAgreed: true });
      if (response.ok) setResult({ orderNumber: response.orderNumber, total: response.total, paymentGuide: response.paymentGuide });
      else setError(response.message);
    });
  }

  function submitPaymentReport() {
    if (!preview || !result) return;
    setError("");
    startTransition(async () => {
      const response = await reportPayment(result.orderNumber, preview.ordererPhone, depositorName);
      if (response.ok) setPaymentReported(true);
      else setError(response.message);
    });
  }

  return (
    <section className={styles.orderSection} id="order">
      <div className={styles.heading}>
        <p>주문서 작성</p>
        <h2>받으실 정보를<br />확인해 주세요</h2>
        <span>주문 내용을 확인한 뒤 접수하면 서버에서 가격과 배송지역을 다시 검사해 저장합니다.</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset>
          <legend>1. 상품 선택</legend>
          <div className={styles.productChoices}>
            {products.map((product) => (
              <label key={product.weight} className={weight === product.weight ? styles.selectedProduct : undefined}>
                <input type="radio" name="weight" value={product.weight} checked={weight === product.weight} onChange={() => setWeight(product.weight)} />
                <strong>{product.weight}</strong><span>{formatPrice(product.price)}</span><small>박스·일반지역 배송비 포함</small>
              </label>
            ))}
          </div>
          <label className={styles.quantity}>상자 수량
            <input type="number" name="quantity" min="1" max="10" value={quantity} onChange={(event) => setQuantity(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} required />
          </label>
          <div className={styles.total}><span>결제 예정 금액</span><strong>{formatPrice(total)}</strong></div>
        </fieldset>

        <fieldset>
          <legend>2. 주문자와 받는 분</legend>
          <div className={styles.fields}>
            <label>주문자 이름<input name="orderer" autoComplete="name" required /></label>
            <label>주문자 연락처<input name="ordererPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-1234-5678" pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}" required /></label>
            <label>받는 분 이름<input name="recipient" autoComplete="shipping name" required /></label>
            <label>받는 분 연락처<input name="recipientPhone" type="tel" inputMode="tel" autoComplete="shipping tel" placeholder="010-1234-5678" pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}" required /></label>
            <label className={styles.postcode}>우편번호<input name="postcode" inputMode="numeric" autoComplete="shipping postal-code" maxLength={5} pattern="[0-9]{5}" placeholder="5자리" required /></label>
            <label className={styles.fullWidth}>기본 주소<input name="address" autoComplete="shipping street-address" placeholder="도로명 주소" required /></label>
            <label className={styles.fullWidth}>상세 주소<input name="detailAddress" autoComplete="shipping address-line2" placeholder="동·호수 또는 위치 설명" required /></label>
            <label className={styles.fullWidth}>배송 메모<textarea name="memo" rows={3} maxLength={100} placeholder="예: 문 앞에 놓아 주세요" /></label>
          </div>
          <label className={styles.check}><input type="checkbox" required /> 제주·도서산간이 아닌 국내 일반지역 주소입니다.</label>
          <label className={styles.check}><input type="checkbox" required /> 주문 접수와 배송을 위한 개인정보 수집·이용에 동의합니다.</label>
        </fieldset>

        <button className={styles.submit} type="submit">주문 내용 확인하기</button>
      </form>

      {preview && (
        <aside className={styles.preview} aria-live="polite">
          <p>최종 주문 확인</p><h3>{preview.weight} × {preview.quantity}상자</h3>
          <dl>
            <div><dt>결제 예정 금액</dt><dd>{formatPrice(preview.total)}</dd></div>
            <div><dt>주문자</dt><dd>{preview.orderer} · {preview.ordererPhone}</dd></div>
            <div><dt>받는 분</dt><dd>{preview.recipient} · {preview.recipientPhone}</dd></div>
            <div><dt>배송지</dt><dd>({preview.postcode}) {preview.address} {preview.detailAddress}</dd></div>
            <div><dt>배송 메모</dt><dd>{preview.memo}</dd></div>
          </dl>
          {result ? (
            <div className={styles.paymentNotice}><strong>주문이 접수되었습니다.</strong><span>주문번호 {result.orderNumber} · {formatPrice(result.total)}<br />{result.paymentGuide}</span></div>
          ) : (
            <div className={styles.paymentNotice}><strong>아직 주문이 접수되지 않았습니다.</strong><span>아래 버튼을 누르면 주문 정보가 저장됩니다.</span></div>
          )}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {!result ? <button type="button" onClick={submitOrder} disabled={isPending}>{isPending ? "접수 중…" : "주문 접수하기"}</button> : null}
          {result && !paymentReported ? (
            <div className={paymentStyles.transferBox}>
              <label>실제 입금자명<input value={depositorName} onChange={(event) => setDepositorName(event.target.value)} maxLength={40} placeholder="통장에 표시되는 이름" /></label>
              <button type="button" onClick={submitPaymentReport} disabled={isPending || !depositorName.trim()}>{isPending ? "처리 중…" : "입금 완료 알리기"}</button>
              <small>버튼을 눌러도 입금이 자동 확인되지는 않습니다. 관리자가 카카오뱅크 내역을 확인해야 확정됩니다.</small>
            </div>
          ) : null}
          {paymentReported ? <div className={paymentStyles.paymentReported} role="status"><strong>입금 확인 요청이 접수되었습니다.</strong><span>관리자가 실제 입금 내역과 입금자명을 대조합니다.</span></div> : null}
          {result ? <Link className={paymentStyles.statusLink} href="/order-status">주문 상태 조회하기</Link> : null}
          <button type="button" onClick={() => { setPreview(null); setResult(null); setError(""); setDepositorName(""); setPaymentReported(false); }}>내용 수정하기</button>
        </aside>
      )}
    </section>
  );
}
