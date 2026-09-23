import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import heroImage from "@/public/images/sannae-farm-direct-sweet-potato.png";
import image3kg from "@/public/images/sweet-potato-3kg.png";
import image5kg from "@/public/images/sweet-potato-5kg.png";
import image10kg from "@/public/images/sweet-potato-10kg.png";
import styles from "./page.module.css";
import OrderForm from "./order-form";
import { getPublicInventory, type ProductWeight } from "@/lib/public-inventory";
import { getCostSettings } from "@/lib/cost-settings";

export const dynamic = "force-dynamic";

type Product = {
  weight: ProductWeight;
  label: string;
  description: string;
  price: number;
  image: StaticImageData;
};

export default async function Home() {
  const [inventory, costResult] = await Promise.all([getPublicInventory(), getCostSettings()]);
  const prices = Object.fromEntries(costResult.settings.map((item) => [item.product_weight, item.sale_price])) as Record<ProductWeight, number>;
  const products: Product[] = [
    { weight: "3kg", label: "가볍게 맛보기", description: "첫 주문과 1~2인 가구에 알맞은 구성", price: prices["3kg"], image: image3kg },
    { weight: "5kg", label: "가정용 추천", description: "매일 굽고 찌기 좋은 가장 실용적인 구성", price: prices["5kg"], image: image5kg },
    { weight: "10kg", label: "넉넉한 실속형", description: "가족과 함께 오래 즐기는 대용량 구성", price: prices["10kg"], image: image10kg },
  ];
  return (
    <main>
      <div className={styles.notice}><strong>지인 대상 시험 판매 중</strong><span>실시간 재고 소진 시 중량별로 주문이 마감됩니다.</span></div>
      <header className={styles.header}>
        <a className={styles.brand} href="#top">온기담은</a>
        <nav aria-label="주요 메뉴"><a href="#products">상품</a><a href="#pricing">가격</a><a href="#order">주문</a><Link href="/order-status">주문조회</Link></nav>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>경주 산내에서 직접 재배합니다</p>
          <h1>밭에서 바로 담은<br /><em>달큰한 온기</em></h1>
          <p>상태를 살펴 선별하고, 이동 중 상처가 나지 않도록 정성껏 포장합니다. 국내 일반지역만 배송합니다.</p>
          <a className={styles.primaryButton} href="#order">시험 주문하기</a>
        </div>
        <div className={styles.heroImage}>
          <Image src={heroImage} alt="경주 산내 농장에서 수확해 상자에 담은 고구마" priority sizes="(max-width: 800px) 100vw, 52vw" />
        </div>
      </section>

      <section className={styles.trial} aria-label="시험 판매 안내">
        <div><span>판매 대상</span><strong>안내받은 지인 고객</strong><p>운영 흐름을 확인하기 위한 소규모 시험 판매입니다.</p></div>
        <div><span>결제 방법</span><strong>카카오뱅크 계좌이체</strong><p>입금 알림 후 판매자가 실제 내역을 확인합니다.</p></div>
        <div><span>배송 범위</span><strong>국내 일반지역</strong><p>박스와 배송비 포함, 제주·도서산간은 제외합니다.</p></div>
        <div><span>주문 확인</span><strong>주문번호 보관</strong><p>주문번호와 연락처로 접수 상태를 확인할 수 있습니다.</p></div>
      </section>

      <section className={styles.productSection} id="products">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>중량별 구성</p><h2>필요한 만큼<br />고르세요</h2></div>
          <p>3kg부터 10kg까지 준비합니다. 실제 수확량과 선별 결과에 따라 주문 가능한 수량은 달라질 수 있습니다.</p>
        </div>
        <div className={styles.productGrid}>
          {products.map((product) => {
            const soldOut = inventory[product.weight] === 0;
            return (
            <article className={`${product.weight === "5kg" ? styles.featuredCard : styles.productCard} ${soldOut ? styles.soldOutCard : ""}`} key={product.weight}>
              <Image src={product.image} alt={`${product.weight} 산지 직송 고구마 포장`} sizes="(max-width: 800px) 100vw, 33vw" />
              <div><span>{soldOut ? "현재 품절" : product.label}</span><h3>{product.weight}</h3><p>{product.description}</p><strong>{product.price.toLocaleString("ko-KR")}원</strong><small>{soldOut ? "재고 준비 후 주문 가능" : "박스·일반지역 배송비 포함"}</small></div>
            </article>
          )})}
        </div>
      </section>

      <section className={styles.pricing} id="pricing">
        <div><p className={styles.eyebrow}>가격 기준</p><h2>간단하고 투명하게</h2></div>
        <div className={styles.priceRows}>
          {products.map((product) => <div key={product.weight}><strong>{product.weight}</strong><span>{inventory[product.weight] === 0 ? "품절" : product.label}</span><b>{product.price.toLocaleString("ko-KR")}원</b></div>)}
        </div>
      </section>

      <OrderForm inventory={inventory} prices={prices} />

      <section className={styles.guide} id="guide">
        <p className={styles.eyebrow}>주문 전 안내</p>
        <h2>국내 일반지역만 배송합니다.</h2>
        <p>제주 및 도서산간 지역은 주문을 받지 않습니다. 온라인 결제 없이 주문 접수 후 안내받은 계좌로 입금하는 방식으로 준비하고 있습니다.</p>
        <Link href="/privacy">개인정보 처리방침 보기 →</Link>
      </section>
    </main>
  );
}
