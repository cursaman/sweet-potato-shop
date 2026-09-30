import type { Metadata } from "next";
import Link from "next/link";
import homeStyles from "../page.module.css";
import refresh from "../homepage-refresh.module.css";
import styles from "./guide.module.css";

export const metadata: Metadata = { title: "배송·교환 안내 | 산내 온기담은 고구마" };

const items = [
  ["배송", "2026년 10월 3일까지 주문과 입금 확인이 끝난 상품은 10월 5일에 일괄 발송합니다. 우체국택배 또는 일반택배를 이용하며 제주·도서산간 지역은 주문을 받지 않습니다."],
  ["주문 취소", "입금 전에는 주문조회에서 직접 취소할 수 있습니다. 입금 후에는 배송 준비 전에 판매자에게 주문번호와 함께 취소를 요청해 주세요."],
  ["단순 변심 반품", "상품 수령일로부터 7일 이내 요청할 수 있으며 왕복 배송비는 고객이 부담합니다. 보관 부주의 등으로 농산물의 가치가 훼손된 경우 반품이 제한될 수 있습니다."],
  ["파손·상품 이상", "운송장과 상품 상태를 사진으로 남긴 뒤 상품을 버리거나 반송하기 전에 판매자에게 알려 주세요. 확인 후 재배송 또는 환불하며 배송비는 판매자가 부담합니다."],
  ["환불", "취소가 확정되거나 반품 상품을 확인한 날부터 3영업일 이내에 계좌이체 금액을 환불합니다. 일부 상품의 이상은 사진과 주문 내역을 확인해 해당 수량을 기준으로 처리합니다."],
] as const;

export default function GuidePage() {
  return (
    <main>
      <header className={`${homeStyles.header} ${refresh.header}`}>
        <Link className={`${homeStyles.brand} ${refresh.brand}`} href="/">온기담은</Link>
        <nav aria-label="주요 메뉴"><Link href="/">홈</Link><Link href="/order">주문하기</Link><Link href="/order-status">주문조회</Link></nav>
      </header>
      <article className={styles.guide}>
        <p className={styles.kicker}>구매 전 확인</p>
        <h1>배송·취소·교환 안내</h1>
        <div className={styles.list}>
          {items.map(([title, description]) => <section key={title}><h2>{title}</h2><p>{description}</p></section>)}
        </div>
        <div className={styles.links}><Link href="/order">주문하기</Link><Link href="/privacy">개인정보 처리방침</Link></div>
      </article>
    </main>
  );
}
