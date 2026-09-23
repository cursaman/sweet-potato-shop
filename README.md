# 온기담은 고구마

경주 산내에서 직접 재배한 고구마를 3kg·5kg·10kg 단위로 주문받는 Next.js 사이트입니다. 온라인 결제와 택배 추적은 포함하지 않으며, 제주·도서산간 주문은 받지 않습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

전체 검증은 `npm run verify`로 실행합니다.

## 주문 데이터베이스 연결

공유 Supabase 프로젝트 `edu-platform` 안에서 기존 서비스와 섞이지 않도록 `sweet_potato_orders` 전용 테이블을 사용합니다.

1. Supabase SQL Editor에서 `supabase/migrations`의 SQL 파일을 번호 순서대로 실행합니다.
2. `.env.example`을 참고해 `.env.local`에 Supabase 정보와 카카오뱅크 입금 안내 문구를 설정합니다.
3. 개발 서버를 다시 시작하고 시험 주문을 1건 접수합니다.
4. Supabase Table Editor에서 주문번호와 금액이 맞는지 확인한 뒤 시험 주문을 삭제합니다.

서비스 역할 키는 브라우저 코드, GitHub 또는 공개 환경변수에 넣으면 안 됩니다. 주문 입력값과 가격은 Next.js 서버에서 다시 검증하며, 익명 사용자와 일반 인증 사용자는 주문 테이블을 직접 읽거나 쓸 수 없습니다.
