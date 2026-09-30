"use client";

import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Script from "next/script";
import { createOrder, reportPayment } from "./actions";
import styles from "./order-form.module.css";
import paymentStyles from "./payment.module.css";
import type { ProductWeight, PublicInventory } from "@/lib/public-inventory";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

function maskPhoneInput(event: FormEvent<HTMLInputElement>) {
  const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) event.currentTarget.value = digits;
  else if (digits.length <= 7) event.currentTarget.value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
  else if (digits.length === 10) event.currentTarget.value = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  else event.currentTarget.value = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

type OrderPreview = {
  weight: ProductWeight;
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

type PostcodeResult = {
  zonecode: string;
  userSelectedType: "R" | "J";
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: "Y" | "N";
};

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: { oncomplete: (data: PostcodeResult) => void }) => { open: () => void };
    };
  }
}

export default function OrderForm({ inventory, prices }: { inventory: PublicInventory; prices: Record<ProductWeight, number> }) {
  const products = (["5kg", "10kg"] as const).map((weight) => ({ weight, price: prices[weight] }));
  const initialWeight = inventory["5kg"] !== 0 ? "5kg" : products.find((product) => inventory[product.weight] !== 0)?.weight ?? "5kg";
  const [weight, setWeight] = useState<ProductWeight>(initialWeight);
  const [quantity, setQuantity] = useState(1);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [result, setResult] = useState<{ orderNumber: string; total: number; paymentGuide: string } | null>(null);
  const [error, setError] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [paymentReported, setPaymentReported] = useState(false);
  const [postcodeReady, setPostcodeReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const postcodeRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const detailAddressRef = useRef<HTMLInputElement>(null);
  const selectedProduct = products.find((product) => product.weight === weight) ?? products[0];
  const remaining = inventory[weight];
  const maximumQuantity = Math.min(10, remaining ?? 10);
  const allSoldOut = products.every((product) => inventory[product.weight] === 0);
  const total = selectedProduct.price * quantity;

  useEffect(() => {
    function selectProduct(event: Event) {
      const selected = (event as CustomEvent<{ weight?: ProductWeight }>).detail?.weight;
      if ((selected === "5kg" || selected === "10kg") && inventory[selected] !== 0) {
        setWeight(selected);
        setQuantity(1);
      }
    }
    window.addEventListener("select-sweet-potato", selectProduct);
    return () => window.removeEventListener("select-sweet-potato", selectProduct);
  }, [inventory]);

  function openPostcodeSearch() {
    if (!window.kakao?.Postcode) {
      setError("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
      return;
    }
    setError("");
    new window.kakao.Postcode({
      oncomplete(data) {
        let address = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        if (data.userSelectedType === "R") {
          const extras = [];
          if (data.bname && /[동로가]$/.test(data.bname)) extras.push(data.bname);
          if (data.buildingName && data.apartment === "Y") extras.push(data.buildingName);
          if (extras.length > 0) address += ` (${extras.join(", ")})`;
        }
        if (postcodeRef.current) postcodeRef.current.value = data.zonecode;
        if (addressRef.current) addressRef.current.value = address;
        detailAddressRef.current?.focus();
      },
    }).open();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    if (!form.checkValidity()) {
      setPreview(null);
      setError("필수 항목을 모두 입력하고 두 가지 확인 항목에 동의해 주세요.");
      form.reportValidity();
      form.querySelector<HTMLElement>(":invalid")?.focus();
      return;
    }
    const data = new FormData(form);
    const basicAddress = String(data.get("address") ?? "").trim();

    if (/제주/.test(basicAddress)) {
      setPreview(null);
      setError("제주 및 도서산간 지역은 현재 주문할 수 없습니다.");
      const addressField = form.elements.namedItem("address");
      if (addressField instanceof HTMLElement) addressField.focus();
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
      <Script id="kakao-postcode" src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" onLoad={() => setPostcodeReady(true)} />
      <div className={styles.heading}>
        <p>주문서 작성</p>
        <h2>받으실 정보를<br />확인해 주세요</h2>
        <span>주문 내용을 확인한 뒤 접수하면 서버에서 가격과 배송지역을 다시 검사해 저장합니다.</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend>1. 상품 선택</legend>
          <div className={styles.productChoices}>
            {products.map((product) => {
              const soldOut = inventory[product.weight] === 0;
              return (
              <label key={product.weight} className={`${weight === product.weight ? styles.selectedProduct : ""} ${soldOut ? styles.soldOutChoice : ""}`}>
                <input type="radio" name="weight" value={product.weight} checked={weight === product.weight} onChange={() => { setWeight(product.weight); setQuantity(1); }} disabled={soldOut} />
                <b className={styles.grade}>특품</b><strong>{product.weight}</strong><span>{formatPrice(product.price)}</span><small>{soldOut ? "품절" : product.weight === "10kg" ? "박스비 없음 · 배송비 6,000원 포함 · 우체국택배 및 일반택배" : "박스비·배송비 5,000원 포함 · 우체국택배 및 일반택배"}</small>
              </label>
            )})}
          </div>
          <label className={styles.quantity}>상자 수량
            <input type="number" name="quantity" min="1" max={maximumQuantity} value={quantity} onChange={(event) => setQuantity(Math.min(maximumQuantity, Math.max(1, Number(event.target.value) || 1)))} disabled={allSoldOut} required />
          </label>
          {remaining !== null && remaining > 0 ? <p className={styles.stockNotice}>현재 {weight} 주문 가능 수량: {remaining}상자</p> : null}
          {allSoldOut ? <p className={styles.soldOutNotice}>현재 모든 중량이 품절되어 주문을 잠시 받지 않습니다.</p> : null}
          <div className={styles.total}><span>결제 예정 금액</span><strong>{formatPrice(total)}</strong></div>
        </fieldset>

        <fieldset>
          <legend>2. 주문자와 받는 분</legend>
          <div className={styles.fields}>
            <label>주문자 이름 <span className={styles.required}>한글 2~10자 필수</span><input name="orderer" autoComplete="name" minLength={2} maxLength={10} pattern="[가-힣]{2,10}" title="한글 이름 2~10자를 입력해 주세요." placeholder="홍길동" required /></label>
            <label>주문자 연락처 <span className={styles.required}>필수</span><input name="ordererPhone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="010-1234-5678" pattern="01[016789]-[0-9]{3,4}-[0-9]{4}" maxLength={13} onInput={maskPhoneInput} title="휴대전화 번호를 입력해 주세요." required /></label>
            <label>받는 분 이름 <span className={styles.required}>한글 2~10자 필수</span><input name="recipient" autoComplete="shipping name" minLength={2} maxLength={10} pattern="[가-힣]{2,10}" title="한글 이름 2~10자를 입력해 주세요." placeholder="홍길동" required /></label>
            <label>받는 분 연락처 <span className={styles.required}>필수</span><input name="recipientPhone" type="tel" inputMode="numeric" autoComplete="shipping tel" placeholder="010-1234-5678" pattern="01[016789]-[0-9]{3,4}-[0-9]{4}" maxLength={13} onInput={maskPhoneInput} title="휴대전화 번호를 입력해 주세요." required /></label>
            <div className={styles.postcodeRow}><label className={styles.postcode}>우편번호 <span className={styles.required}>필수</span><input ref={postcodeRef} name="postcode" inputMode="numeric" autoComplete="shipping postal-code" maxLength={5} pattern="[0-9]{5}" placeholder="주소 검색" readOnly required /></label><button type="button" onClick={openPostcodeSearch} disabled={!postcodeReady}>{postcodeReady ? "우편번호 검색" : "검색 준비 중…"}</button></div>
            <label className={styles.fullWidth}>기본 주소 <span className={styles.required}>필수</span><input ref={addressRef} name="address" autoComplete="shipping street-address" placeholder="주소 검색으로 입력해 주세요" readOnly required /></label>
            <label className={styles.fullWidth}>상세 주소 <span className={styles.required}>필수</span><input ref={detailAddressRef} name="detailAddress" autoComplete="shipping address-line2" placeholder="동·호수 또는 위치 설명" required /></label>
            <label className={styles.fullWidth}>배송 메모<textarea name="memo" rows={3} maxLength={100} placeholder="예: 문 앞에 놓아 주세요" /></label>
          </div>
          <label className={styles.check}><input type="checkbox" name="regionConfirmed" required /> 제주·도서산간이 아닌 국내 일반지역 주소입니다. <span className={styles.required}>필수</span></label>
          <label className={styles.check}><input type="checkbox" name="privacyAgreed" required /><span>주문·입금 확인·배송을 위한 개인정보 수집과 5년 보관에 동의합니다. <Link href="/privacy" target="_blank">처리방침 보기</Link> <span className={styles.required}>필수</span></span></label>
        </fieldset>

        <button className={styles.submit} type="submit" disabled={allSoldOut}>{allSoldOut ? "현재 전체 품절" : "주문 내용 확인하기"}</button>
        {!preview && error ? <p className={styles.error} role="alert">{error}</p> : null}
      </form>

      {preview && (
        <aside className={styles.preview} aria-live="polite">
          <p>최종 주문 확인</p><h3>특품 {preview.weight} × {preview.quantity}상자</h3>
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
