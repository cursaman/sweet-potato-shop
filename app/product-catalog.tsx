"use client";

import Image from "next/image";
import { useState } from "react";
import image5kg from "@/public/images/sweet-potato-5kg.png";
import image10kg from "@/public/images/sweet-potato-10kg.png";
import type { ProductWeight, PublicInventory } from "@/lib/public-inventory";
import styles from "./page.module.css";
import refresh from "./homepage-refresh.module.css";

const products = [
  { weight: "5kg" as const, label: "가정용 추천", description: "매일 굽고 찌기 좋은 가장 실용적인 구성", image: image5kg, shipping: "박스비·우체국 택배비 5,000원 포함" },
  { weight: "10kg" as const, label: "넉넉한 실속형", description: "가족과 함께 오래 즐기는 대용량 구성", image: image10kg, shipping: "박스비 없음 · 우체국 택배비 6,000원 포함" },
];

export default function ProductCatalog({ inventory, prices }: { inventory: PublicInventory; prices: Record<ProductWeight, number> }) {
  const [expanded, setExpanded] = useState<ProductWeight | null>(null);

  function selectForOrder(weight: ProductWeight) {
    window.dispatchEvent(new CustomEvent("select-sweet-potato", { detail: { weight } }));
  }

  return (
    <div className={`${styles.productGrid} ${refresh.productGrid}`}>
      {products.map((product) => {
        const soldOut = inventory[product.weight] === 0;
        const isExpanded = expanded === product.weight;
        const detailsId = `product-details-${product.weight}`;
        return (
          <article className={`${product.weight === "5kg" ? `${styles.featuredCard} ${refresh.featuredCard}` : `${styles.productCard} ${refresh.productCard}`} ${soldOut ? styles.soldOutCard : ""}`} key={product.weight}>
            <button className={styles.productToggle} type="button" aria-expanded={isExpanded} aria-controls={detailsId} onClick={() => setExpanded(isExpanded ? null : product.weight)}>
              <Image src={product.image} alt={`${product.weight} 산지 직송 고구마 포장`} sizes="(max-width: 800px) 100vw, 33vw" />
              <div><div className={refresh.cardMeta}><span className={refresh.gradeBadge}>특품</span><span>{soldOut ? "현재 품절" : product.label}</span></div><h3>{product.weight}</h3><p>{product.description}</p><strong>{prices[product.weight].toLocaleString("ko-KR")}원</strong><small>{soldOut ? "재고 준비 후 주문 가능" : product.shipping}</small><em>{isExpanded ? "상세정보 닫기 ↑" : "상세정보 보기 ↓"}</em></div>
            </button>
            {isExpanded ? (
              <div className={styles.productDetails} id={detailsId}>
                <dl>
                  <div><dt>생산지</dt><dd>경북 경주 산내</dd></div>
                  <div><dt>등급·중량</dt><dd>특품 · {product.weight}</dd></div>
                  <div><dt>판매가</dt><dd>{prices[product.weight].toLocaleString("ko-KR")}원 · 배송비 포함</dd></div>
                  <div><dt>구성 안내</dt><dd>수확과 선별 결과에 따라 크기와 모양이 조금씩 다를 수 있습니다.</dd></div>
                  <div><dt>보관 방법</dt><dd>수령 후 상자를 열고 통풍이 되는 서늘한 실내에 보관해 주세요.</dd></div>
                  <div><dt>배송 안내</dt><dd>국내 일반지역만 배송하며 제주·도서산간은 제외합니다.</dd></div>
                  <div><dt>상품 이상</dt><dd>운송장과 상품 상태를 사진으로 남긴 뒤 상품을 버리기 전에 판매자에게 알려 주세요.</dd></div>
                </dl>
                {soldOut ? <span className={styles.detailSoldOut}>현재 품절입니다.</span> : <a href="#order" onClick={() => selectForOrder(product.weight)}>이 상품 주문하기</a>}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
