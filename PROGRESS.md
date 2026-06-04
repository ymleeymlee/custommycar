# CustomMyCar 개발 진행 현황

## 프로젝트 정보
- **위치**: `/Users/macclaude/Desktop/custommycar`
- **스택**: Next.js 16 + TypeScript + Tailwind CSS + Supabase + 토스페이먼츠
- **Supabase 프로젝트**: `fivtimyeamhvuyhsnwkg`

## 완료된 작업

### ✅ 1. 프로젝트 생성 및 기본 설정
- Next.js 16 (App Router, Turbopack)
- Tailwind CSS, TypeScript
- `@supabase/supabase-js`, `@supabase/ssr`, `zustand` 설치

### ✅ 2. Supabase 연결
- `.env.local` 키 설정 완료
- Legacy JWT 키 사용 (새 `sb_publishable_` 형식은 REST API 비호환)

### ✅ 3. DB 스키마 적용
- `supabase-schema.sql` 실행 완료
- 테이블: `profiles`, `products`, `cart_items`, `orders`, `order_items`
- 샘플 제품 12개 삽입 완료 (vollkommen 브랜드)
- RLS 정책 적용

### ✅ 4. 인증 시스템
- 로그인 / 회원가입 / 승인대기 페이지 완성
- proxy.ts (Next.js 16 미들웨어) 로 승인 체크
- 이메일 확인 기능 OFF (Supabase 대시보드에서)

### ✅ 5. 관리자 계정
- 이메일: `leesta7@gmail.com`
- role: `admin`, approved: `true` (수동 설정 완료)

### ✅ 6. 제품 목록 페이지
- Grainger 스타일 (좌측 카테고리 + 그리드)
- 서버사이드 렌더링으로 데이터 페칭 (admin client 사용)
- 카테고리 필터, SKU/제품명 검색 기능

### ✅ 7. 장바구니 기능
- 수량 조절, 전체 삭제, 주문 요약

### ✅ 8. 결제 페이지 (토스페이먼츠)
- 배송지 입력 + 토스페이먼츠 결제창 연동 (UI 완성)
- 결제 완료 후 성공 페이지 (`/checkout/success`)
- **토스페이먼츠 실제 키는 아직 미설정** → `.env.local`에서 교체 필요

### ✅ 9. 주문/배송 현황 페이지
- 주문 목록, 배송 단계 프로그레스 바
- 운송장 번호 표시

### ✅ 10. 관리자 페이지
- `/admin` : 승인 대기 유저 승인/거절 + 최근 주문 현황
- `/admin/products` : 제품 활성/비활성, 삭제
- `/admin/products/new` : 제품 추가 폼

---

## 남은 작업

### ✅ 헤더 관리자 표시 문제 (해결)
- Header.tsx가 props로 `profile`을 받도록 변경
- `(shop)/layout.tsx`, `admin/layout.tsx`에서 서버사이드 + admin client로 profile 조회 후 전달

### ✅ 신규 가입자 profile 자동 생성 (해결)
- `/api/register` POST route 추가 — admin client로 `profiles` upsert
- register 페이지에서 signUp 후 해당 API 호출

### 🔲 토스페이먼츠 실제 연동
- `.env.local`에서 테스트 키 교체 필요:
  ```
  NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...실제키...
  TOSS_SECRET_KEY=test_sk_...실제키...
  ```
- 토스페이먼츠 개발자센터: https://developers.tosspayments.com

### 🔲 배포 (Vercel)
- `vercel deploy` 또는 Vercel 대시보드에서 GitHub 연결
- 환경변수 Vercel에도 동일하게 설정 필요

---

## 알려진 이슈 및 해결책

### RLS 정책 현황
```sql
-- products: 로그인 여부만 체크 (proxy가 승인 체크 담당)
CREATE POLICY "로그인된 유저 제품 조회" ON products FOR SELECT
  USING (is_active = TRUE AND auth.uid() IS NOT NULL);

-- profiles: 재귀 관리자 정책 제거됨 (버그 있었음)
-- 현재 유효한 정책: "본인 프로필 조회", "본인 프로필 수정", "본인 프로필 생성"
```

### 서버 실행
```bash
cd Desktop/custommycar && npm run dev
# 접속: http://localhost:3000
```

### 관리자 계정으로 로그인 후 관리자 페이지
```
http://localhost:3000/admin
```

---

## 파일 구조 요약
```
src/
  app/
    (auth)/login, register, pending    # 인증 페이지
    (shop)/products, cart, checkout, orders  # 쇼핑 페이지
    admin/                             # 관리자 페이지
    api/auth/callback, payments/confirm  # API 라우트
  components/Header.tsx                # 공통 헤더
  lib/supabase/client.ts               # 브라우저 클라이언트
  lib/supabase/server.ts               # 서버 클라이언트
  lib/supabase/admin.ts                # 서비스 롤 클라이언트
  lib/store/cartStore.ts               # 장바구니 상태
  proxy.ts                             # 인증/승인 미들웨어
  types/index.ts                       # 타입 정의
```
