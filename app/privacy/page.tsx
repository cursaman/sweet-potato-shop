import type { Metadata } from "next";
import Link from "next/link";
import styles from "./privacy.module.css";

export const metadata: Metadata = { title: "개인정보 처리방침 | 온기담은 고구마" };

const sections = [
  { title: "1. 수집하는 개인정보", body: "주문자 이름·연락처, 받는 분 이름·연락처, 우편번호·주소·상세 주소, 배송 메모, 입금자명, 주문번호와 주문 처리 기록을 수집합니다." },
  { title: "2. 이용 목적", body: "상품 주문 접수, 입금 확인, 배송 준비, 주문 상태 안내, 취소 및 고객 문의 처리 목적으로만 이용합니다. 광고 문자나 제3자 판매 목적으로 이용하지 않습니다." },
  { title: "3. 보관기간", body: "주문 및 대금결제 관련 기록은 거래 확인과 법적 의무 이행을 위해 주문일로부터 5년간 보관한 뒤 파기합니다. 관계 법령에서 별도 기간을 요구하는 경우에는 해당 기간을 따릅니다." },
  { title: "4. 제3자 제공", body: "개인정보를 판매하거나 주문·배송 목적과 관계없는 제3자에게 제공하지 않습니다. 법령에 근거가 있거나 고객이 별도로 동의한 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다." },
  { title: "5. 개인정보 처리위탁", body: "사이트 운영과 주문 처리를 위해 아래 업체에 필요한 업무를 위탁합니다. 위탁업체가 개인정보를 안전하게 처리하도록 관리하며, 일반택배사를 이용하는 경우 실제 업체를 배송 전에 고객에게 안내합니다." },
  { title: "6. 파기 방법", body: "보관기간이 끝난 전자 기록은 복구하기 어렵도록 삭제합니다. 현재는 소규모 직접 운영 단계로 자동 삭제가 아닌 관리자 확인 후 수동 삭제 방식으로 관리합니다." },
  { title: "7. 고객의 권리", body: "고객은 본인의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 다만 법령상 보관 의무가 있는 거래 기록은 해당 기간 동안 삭제가 제한될 수 있습니다." },
  { title: "8. 안전성 확보", body: "주문 데이터는 서버 전용 키로만 접근하며, 관리자 기능은 비밀번호와 만료되는 보안 세션으로 보호합니다. 공개 주문 조회에는 주문번호와 주문자 연락처 확인이 필요합니다." },
  { title: "9. 문의", body: "개인정보 관련 요청은 주문을 안내받은 기존 판매자 연락처로 접수해 주세요. 요청자와 주문자 정보가 일치하는지 확인한 뒤 처리합니다." },
];

const processors = [
  { company: "Vercel Inc.", purpose: "웹사이트 호스팅 및 서비스 제공", data: "서비스 접속 기록과 전송되는 주문 정보", retention: "서비스 제공 및 계약 종료 시까지" },
  { company: "Supabase Inc.", purpose: "주문 데이터베이스 저장 및 관리", data: "주문·입금 확인·배송에 필요한 개인정보와 주문 처리 기록", retention: "법정 보관기간 또는 위탁계약 종료 시까지" },
  { company: "우정사업본부(우체국택배)", purpose: "상품 배송", data: "받는 분 이름·연락처·주소", retention: "배송 완료 및 관계 법령상 보관기간까지" },
  { company: "발송 건별 이용 일반택배사", purpose: "상품 배송", data: "받는 분 이름·연락처·주소", retention: "배송 완료 및 관계 법령상 보관기간까지" },
  { company: "카카오(우편번호 서비스)", purpose: "배송지 우편번호·주소 검색", data: "주소 검색 과정에서 입력한 검색어", retention: "해당 서비스의 처리방침에 따름" },
];

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <header><Link href="/">← 판매 페이지</Link><p>개인정보 안내</p><h1>개인정보 처리방침</h1><span>주문과 배송에 꼭 필요한 정보만 수집하고 정해진 목적 안에서 관리합니다.</span></header>
      <div className={styles.summary}><strong>핵심 안내</strong><p>주문·입금 확인·배송을 위해 개인정보를 수집하며 주문일로부터 5년간 보관 후 파기합니다.</p></div>
      <section className={styles.sections}>{sections.map((section) => <article key={section.title}><h2>{section.title}</h2><p>{section.body}</p>{section.title.startsWith("5.") ? <div className={styles.tableWrap}><table><thead><tr><th>수탁업체</th><th>위탁 업무</th><th>처리 항목</th><th>보유·이용기간</th></tr></thead><tbody>{processors.map((processor) => <tr key={processor.company}><td>{processor.company}</td><td>{processor.purpose}</td><td>{processor.data}</td><td>{processor.retention}</td></tr>)}</tbody></table><small>일반택배사 명칭은 운송장과 배송 안내에서 확인할 수 있습니다.</small></div> : null}</article>)}</section>
      <footer><p>시행일: 2026년 9월 30일</p><Link href="/">판매 페이지로 돌아가기</Link></footer>
    </main>
  );
}
