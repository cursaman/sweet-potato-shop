import Link from "next/link";
import heroImage from "@/public/images/sannae-farm-direct-sweet-potato.png";
import styles from "./page.module.css";
import refresh from "./homepage-refresh.module.css";
import FarmVideoSwiper from "./farm-video-swiper";
import ProductCatalog from "./product-catalog";
import { getPublicInventory, type ProductWeight } from "@/lib/public-inventory";
import { getCostSettings } from "@/lib/cost-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [inventory, costResult] = await Promise.all([getPublicInventory(), getCostSettings()]);
  const prices = Object.fromEntries(costResult.settings.map((item) => [item.product_weight, item.sale_price])) as Record<ProductWeight, number>;

  return (
    <main>
      <div className={`${styles.notice} ${refresh.notice}`}><strong>10월 5일 일괄 발송</strong><span>10월 3일까지 주문·입금 확인된 건</span></div>
      <header className={`${styles.header} ${refresh.header}`}>
        <a className={`${styles.brand} ${refresh.brand}`} href="#top">온기담은</a>
        <nav aria-label="주요 메뉴"><a href="#products">상품</a><a href="#farm-videos">농장 영상</a><Link href="/order">주문하기</Link><Link href="/order-status">주문조회</Link></nav>
      </header>

      <section className={`${styles.hero} ${refresh.hero}`} id="top">
        <div className={`${styles.heroCopy} ${refresh.heroCopy}`}>
          <p className={`${styles.eyebrow} ${refresh.eyebrow}`}>경북 경주 산내 · 2026년 수확</p>
          <h1>산내에서 직접 기른<br /><em>고구마입니다</em></h1>
          <p>농장에서 키우고 선별한 고구마를 5kg과 10kg 상자로 판매합니다. 제주·도서산간을 제외한 국내 일반지역으로 보냅니다.</p>
          <a className={`${styles.primaryButton} ${refresh.primaryButton}`} href="#products">상품과 가격 보기</a>
        </div>
        <div className={refresh.heroMedia}>
          <video autoPlay muted loop playsInline preload="metadata" poster={heroImage.src} aria-label="경주 산내 고구마밭 현지 영상">
            <source src="/videos/sannae-field-04.mp4" type="video/mp4" />
          </video>
          <p>경주 산내 재배 현장</p>
        </div>
      </section>

      <section className={`${styles.productSection} ${refresh.productSection}`} id="products">
        <div className={styles.sectionHeading}>
          <div><h2>판매 상품</h2></div>
          <p>특품 5kg과 10kg 두 종류입니다. 가격에는 배송비가 포함되어 있습니다.</p>
        </div>
        <ProductCatalog inventory={inventory} prices={prices} />
      </section>

      <section className={`${styles.videoSection} ${refresh.videoSection}`} id="farm-videos" aria-labelledby="farm-video-title">
        <div className={`${styles.videoHeading} ${refresh.videoHeading}`}>
          <div><h2 id="farm-video-title">재배 현장</h2></div>
          <p>경주 산내에서 촬영한 재배와 수확 영상입니다.</p>
        </div>
        <FarmVideoSwiper />
      </section>

      <section className={refresh.homeOrder} aria-labelledby="home-order-title">
        <div>
          <h2 id="home-order-title">주문하기</h2>
          <p>상품과 수량을 고르고 받는 분의 주소를 입력합니다. 결제는 카카오뱅크 계좌이체입니다.</p>
        </div>
        <div className={refresh.homeOrderLinks}>
          <Link href="/order">주문하기</Link>
          <Link href="/guide">배송·교환 안내</Link>
        </div>
      </section>

      <footer className={refresh.footer}>
        <strong>온기담은</strong><span>원산지: 국내산(경북 경주 산내)</span><Link href="/privacy">개인정보 처리방침</Link>
      </footer>
    </main>
  );
}
