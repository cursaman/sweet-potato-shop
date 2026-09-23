import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminSession } from "@/lib/admin-session";
import { getCostSettings } from "@/lib/cost-settings";
import CostSettingsClient from "./cost-settings-client";
import styles from "./cost-settings.module.css";

export const metadata: Metadata = { title: "비용 설정 | 온기담은 관리자" };

export default async function CostSettingsPage() {
  if (!await hasAdminSession()) return <main className={styles.notice}><h1>관리자 로그인이 필요합니다.</h1><Link href="/admin">관리자 로그인으로 이동</Link></main>;
  const { settings, saved } = await getCostSettings();
  return <main className={styles.main}><header><Link href="/admin">← 주문 관리</Link><p>온기담은 관리자</p><h1>비용 기준 설정</h1><span>정산표의 목표비용과 예상 잔액 계산에 사용됩니다.</span></header><CostSettingsClient initialSettings={settings} initiallySaved={saved} /><p className={styles.note}>실제 재배비·박스 구매가·일반지역 택배 계약요금을 확인한 뒤 수정하세요. 판매가는 이 화면에서 변경되지 않습니다.</p></main>;
}
