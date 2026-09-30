import type { Metadata } from "next";
import Link from "next/link";
import OrderForm from "../order-form";
import homeStyles from "../page.module.css";
import refresh from "../homepage-refresh.module.css";
import styles from "./order-page.module.css";
import { getPublicInventory, type ProductWeight } from "@/lib/public-inventory";
import { getCostSettings } from "@/lib/cost-settings";

export const metadata: Metadata = { title: "주문하기 | 산내 온기담은 고구마" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ weight?: string }> };

export default async function OrderPage({ searchParams }: Props) {
  const [{ weight }, inventory, costResult] = await Promise.all([searchParams, getPublicInventory(), getCostSettings()]);
  const prices = Object.fromEntries(costResult.settings.map((item) => [item.product_weight, item.sale_price])) as Record<ProductWeight, number>;
  const initialWeight: ProductWeight | undefined = weight === "5kg" || weight === "10kg" ? weight : undefined;

  return (
    <main>
      <div className={`${homeStyles.notice} ${refresh.notice}`}><strong>10월 5일 일괄 발송</strong><span>10월 3일까지 주문·입금 확인된 건</span></div>
      <header className={`${homeStyles.header} ${refresh.header}`}>
        <Link className={`${homeStyles.brand} ${refresh.brand}`} href="/">온기담은</Link>
        <nav aria-label="주요 메뉴"><Link href="/">홈</Link><Link href="/#products">상품</Link><Link href="/guide">배송·교환</Link><Link href="/order-status">주문조회</Link></nav>
      </header>
      <div className={styles.intro}>
        <h1>주문하기</h1>
        <p>가격은 배송비 포함입니다. 주문서를 접수한 뒤 안내된 카카오뱅크 계좌로 입금해 주세요.</p>
      </div>
      <OrderForm inventory={inventory} prices={prices} initialWeight={initialWeight} />
    </main>
  );
}
