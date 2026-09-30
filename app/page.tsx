import Link from "next/link";
import heroImage from "@/public/images/sannae-farm-direct-sweet-potato.png";
import styles from "./page.module.css";
import refresh from "./homepage-refresh.module.css";
import OrderForm from "./order-form";
import FarmVideoSwiper from "./farm-video-swiper";
import ProductCatalog from "./product-catalog";
import { getPublicInventory, type ProductWeight } from "@/lib/public-inventory";
import { getCostSettings } from "@/lib/cost-settings";

export const dynamic = "force-dynamic";

type Product = {
  weight: ProductWeight;
  grade: "특품";
  label: string;
  description: string;
  price: number;
};

export default async function Home() {
  const [inventory, costResult] = await Promise.all([getPublicInventory(), getCostSettings()]);
  const prices = Object.fromEntries(costResult.settings.map((item) => [item.product_weight, item.sale_price])) as Record<ProductWeight, number>;
  const products: Product[] = [
    { weight: "5kg", grade: "특품", label: "가정용 추천", description: "매일 굽고 찌기 좋은 가장 실용적인 구성", price: prices["5kg"] },
    { weight: "10kg", grade: "특품", label: "넉넉한 실속형", description: "가족과 함께 오래 즐기는 대용량 구성", price: prices["10kg"] },
  ];
  return (
    <main>
      <div className={`${styles.notice} ${refresh.notice}`}><strong>2026년 10월 5일 일괄 발송</strong><span>10월 3일까지 주문·입금 확인이 완료된 고객 대상</span></div>
      <header className={`${styles.header} ${refresh.header}`}>
        <a className={`${styles.brand} ${refresh.brand}`} href="#top">온기담은</a>
        <nav aria-label="주요 메뉴"><a href="#farm-videos">현장</a><a href="#products">상품</a><a href="#pricing">가격</a><a href="#order">주문</a><Link href="/order-status">이용내역</Link></nav>
      </header>

      <section className={`${styles.hero} ${refresh.hero}`} id="top">
        <div className={`${styles.heroCopy} ${refresh.heroCopy}`}>
          <p className={`${styles.eyebrow} ${refresh.eyebrow}`}>첫 번째 이야기 · 경주 산내의 밭</p>
          <h1>밭에서 바로 담은<br /><em>달큰한 온기</em></h1>
          <p>상태를 살펴 선별하고, 이동 중 상처가 나지 않도록 정성껏 포장합니다. 국내 일반지역만 배송합니다.</p>
          <a className={`${styles.primaryButton} ${refresh.primaryButton}`} href="#farm-videos">농장 이야기 보기</a>
        </div>
        <div className={refresh.heroMedia}>
          <video autoPlay muted loop playsInline preload="metadata" poster={heroImage.src} aria-label="경주 산내 고구마밭 현지 영상">
            <source src="/videos/sannae-field-04.mp4" type="video/mp4" />
          </video>
          <div className={refresh.harvestBadge}><span>산내에서</span><strong>직접 재배</strong><small>2026 수확</small></div>
          <p>오늘의 산내 농장</p>
        </div>
      </section>

      <section className={`${styles.videoSection} ${refresh.videoSection}`} id="farm-videos" aria-labelledby="farm-video-title">
        <div className={`${styles.videoHeading} ${refresh.videoHeading}`}>
          <div><p className={styles.eyebrow}>두 번째 이야기 · 재배 현장</p><h2 id="farm-video-title">밭의 시간을<br />그대로 담았습니다</h2></div>
          <p>한 상자의 고구마가 식탁에 오기 전, 산내의 밭에서 자라고 수확되는 모습을 직접 촬영했습니다.</p>
        </div>
        <FarmVideoSwiper />
      </section>

      <section className={refresh.trustStrip} aria-label="산내 고구마 특징">
        <div><span aria-hidden="true">田</span><strong>산내 농가 직송</strong><p>직접 키운 고구마</p></div>
        <div><span aria-hidden="true">손</span><strong>한 상자씩 선별</strong><p>상태를 살펴 포장</p></div>
        <div><span aria-hidden="true">箱</span><strong>우체국택배 및 일반택배</strong><p>배송비 포함 · 5kg 5,000원 · 10kg 6,000원</p></div>
      </section>

      <section className={refresh.howSection} aria-labelledby="how-title">
        <p className={styles.eyebrow}>세 번째 이야기 · 수확에서 포장까지</p>
        <h2 id="how-title">산내 고구마가 오는 길</h2>
        <div className={refresh.howGrid}>
          <article><div><b>1</b><span aria-hidden="true">🌱</span></div><h3>직접 재배합니다</h3><p>경주 산내의 밭에서 살피며 정성껏 키웁니다.</p></article>
          <article><div><b>2</b><span aria-hidden="true">🍠</span></div><h3>꼼꼼히 선별합니다</h3><p>수확한 고구마의 상태를 보고 상자별로 나눕니다.</p></article>
          <article><div><b>3</b><span aria-hidden="true">📦</span></div><h3>안전하게 보냅니다</h3><p>이동 중 상처가 덜 나도록 포장해 일반지역으로 보냅니다.</p></article>
        </div>
      </section>

      <section className={`${styles.trial} ${refresh.trial}`} aria-label="시험 판매 안내">
        <div><span>판매 대상</span><strong>안내받은 지인 고객</strong><p>운영 흐름을 확인하기 위한 소규모 시험 판매입니다.</p></div>
        <div><span>결제 방법</span><strong>카카오뱅크 계좌이체</strong><p>입금 알림 후 판매자가 실제 내역을 확인합니다.</p></div>
        <div><span>이번 배송 일정</span><strong>10월 5일 일괄 발송</strong><p>2026년 10월 3일까지 주문과 입금 확인이 완료된 고객의 상품을 함께 발송합니다.</p></div>
        <div><span>주문 확인</span><strong>주문번호 보관</strong><p>주문번호와 연락처로 접수 상태를 확인할 수 있습니다.</p></div>
      </section>

      <section className={`${styles.productSection} ${refresh.productSection}`} id="products">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>네 번째 이야기 · 한 상자 고르기</p><h2>우리 집에 맞는 만큼<br />고르세요</h2></div>
          <p>5kg과 10kg 두 가지로 준비합니다. 실제 수확량과 선별 결과에 따라 주문 가능한 수량은 달라질 수 있습니다.</p>
        </div>
        <ProductCatalog inventory={inventory} prices={prices} />
      </section>

      <section className={styles.pricing} id="pricing">
        <div><p className={styles.eyebrow}>다섯 번째 이야기 · 가격 확인</p><h2>간단하고 투명하게</h2></div>
        <div className={styles.priceRows}>
          {products.map((product) => <div key={product.weight}><strong>{product.weight}</strong><span>{inventory[product.weight] === 0 ? "품절" : `${product.grade} · ${product.label}`}</span><b>{product.price.toLocaleString("ko-KR")}원<small>원산지: 국내산(경북 경주 산내)</small></b></div>)}
        </div>
      </section>

      <section className={styles.orderSummary} aria-label="주문 상품 가격과 배송 조건 요약">
        <strong>이제 주문할 차례입니다</strong>
        {products.map((product) => (
          <span key={product.weight}><b>특품 {product.weight}</b> {product.price.toLocaleString("ko-KR")}원 · 배송비 포함 <em>원산지: 국내산(경북 경주 산내)</em></span>
        ))}
        <small>10월 3일까지 주문·입금 확인 완료 시 10월 5일 일괄 발송 · 우체국택배 및 일반택배 · 제주·도서산간 제외</small>
      </section>

      <OrderForm inventory={inventory} prices={prices} />

      <section className={styles.guide} id="guide">
        <p className={styles.eyebrow}>마지막 이야기 · 주문 후에도 안심</p>
        <h2>받으시는 순간까지 살핍니다.</h2>
        <p>2026년 10월 3일까지 주문과 입금 확인이 완료된 상품은 10월 5일에 일괄 발송합니다. 제주 및 도서산간 지역은 주문을 받지 않습니다.</p>
        <div className={styles.supportGrid}>
          <article><strong>주문 취소</strong><p>입금 전에는 주문조회에서 직접 취소할 수 있습니다. 입금 후 배송 준비 전에는 판매자에게 주문번호와 함께 취소를 요청해 주세요. 이미 발송된 주문은 반품 절차로 처리합니다.</p></article>
          <article><strong>단순 변심 반품</strong><p>상품 수령일로부터 7일 이내 요청할 수 있으며 왕복 배송비는 고객이 부담합니다. 농산물의 가치가 훼손되었거나 보관 부주의로 상태가 변한 경우에는 반품이 제한될 수 있습니다.</p></article>
          <article><strong>파손·상품 이상</strong><p>상품이 표시 내용과 다르거나 파손·부패한 경우 수령 후 즉시 운송장과 상품 사진을 남겨 판매자에게 알려 주세요. 확인 후 재배송 또는 환불하며 배송비는 판매자가 부담합니다.</p></article>
          <article><strong>환불 처리</strong><p>취소가 확정되거나 반품 상품을 확인한 날부터 3영업일 이내에 결제한 계좌이체 금액을 환불합니다. 부분 이상은 사진과 주문 내역을 확인해 해당 수량 기준으로 협의합니다.</p></article>
          <article><strong>교환·반품 방법</strong><p>상품을 임의로 폐기하거나 반송하기 전에 주문번호를 준비해 안내받은 판매자 연락처로 접수해 주세요. 반송지와 이용 택배사를 확인한 뒤 보내 주세요.</p></article>
          <article><strong>배송 제외 지역</strong><p>국내 일반지역만 배송하며 제주·도서산간 주문은 받지 않습니다. 품절 또는 배송 불가가 확인되면 고객에게 알리고 이미 받은 금액은 전액 환불합니다.</p></article>
        </div>
        <Link href="/privacy">개인정보 처리방침 보기 →</Link>
      </section>
    </main>
  );
}
