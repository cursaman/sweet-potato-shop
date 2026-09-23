"use client";

import { type FormEvent, useState } from "react";
import styles from "./order-form.module.css";

const products = [
  { weight: "3kg", price: 11500 },
  { weight: "5kg", price: 15500 },
  { weight: "10kg", price: 25500 },
] as const;

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

type OrderPreview = {
  weight: string;
  quantity: number;
  total: number;
  orderer: string;
  ordererPhone: string;
  recipient: string;
  recipientPhone: string;
  address: string;
  memo: string;
};

export default function OrderForm() {
  const [weight, setWeight] = useState<(typeof products)[number]["weight"]>("5kg");
  const [quantity, setQuantity] = useState(1);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
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
      address: `(${String(data.get("postcode") ?? "")}) ${basicAddress} ${String(data.get("detailAddress") ?? "")}`.trim(),
      memo: String(data.get("memo") ?? "없음") || "없음",
    });
  }

  return (
    <section className={styles.orderSection} id="order">
      <div className={styles.heading}>
        <p>주문서 작성</p>
        <h2>받으실 정보를<br />확인해 주세요</h2>
        <span>3일차 시험 화면입니다. 입력 내용은 서버에 저장되거나 전송되지 않습니다.</span>
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
            <div><dt>배송지</dt><dd>{preview.address}</dd></div>
            <div><dt>배송 메모</dt><dd>{preview.memo}</dd></div>
          </dl>
          <div className={styles.paymentNotice}><strong>아직 주문이 접수되지 않았습니다.</strong><span>데이터베이스 연결 후 주문번호와 카카오뱅크 입금 안내가 이 단계에 표시됩니다.</span></div>
          <button type="button" onClick={() => setPreview(null)}>내용 수정하기</button>
        </aside>
      )}
    </section>
  );
}
