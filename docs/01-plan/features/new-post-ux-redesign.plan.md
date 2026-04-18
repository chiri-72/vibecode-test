# Plan: new-post-ux-redesign

> 새 글 작성 페이지(`/dashboard/new`) UX/UI 전면 개편

## 1. 서비스 맥락 (Context Analysis)

### 서비스 개요
- **서비스명**: Chiriative (contentyAI) - AI 블로그 글 생성 서비스
- **스택**: Next.js App Router + Supabase + Google Gemini AI
- **인증**: Supabase Auth (Google OAuth)
- **DB**: Supabase PostgreSQL (`posts` 테이블)
- **AI**: Gemini 2.5 Flash (텍스트), Gemini Image Models (썸네일)

### 현재 플로우
```
/dashboard/new → 프롬프트 입력 + 토글 옵션 → DB에 draft 저장
    → /dashboard/posts/[id] → 텍스트 생성 버튼 클릭 → 썸네일 자동 생성
```

### 현재 문제점
1. **옵션 입력이 숨겨져 있음**: `PromptArea` 컴포넌트에서 "옵션 추가" Popover 토글로 키워드/비평/참고자료/출처를 추가해야 함 → 어떤 옵션이 있는지 한눈에 파악 불가
2. **아티클/썸네일 생성 분리 불가**: 현재는 프롬프트 하나만 입력하고, 같은 prompt를 텍스트/썸네일 생성에 공용으로 사용
3. **2단계 프로세스**: 새 글 페이지에서는 입력만, 생성은 상세 페이지에서 별도 클릭 필요

## 2. 요구사항

### FR-01: 한 페이지 통합 입력 폼
- `/dashboard/new` 페이지에서 모든 정보를 한 눈에 볼 수 있는 폼으로 변경
- 토글/Popover 방식 제거 → 섹션별 고정 필드 노출

### FR-02: 3 섹션 구분 입력
입력 필드를 용도별로 3개 섹션으로 분리:

#### 섹션 1: 공통 정보 (Common)
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| prompt | textarea | O | 블로그 주제/아이디어 (메인 프롬프트) |
| keywords | text | X | SEO 키워드 |

#### 섹션 2: 아티클 생성 옵션 (Article)
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| critique | textarea | X | 작성자 관점/비평 |
| reference_materials | textarea | X | 참고 자료 내용 |
| sources | text | X | 출처 URL/자료명 |

#### 섹션 3: 썸네일 생성 옵션 (Thumbnail)
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| thumbnail_prompt | textarea | X | 썸네일 전용 프롬프트 (비어있으면 공통 prompt 사용) |
| thumbnail_style | select | X | 스타일 선택 (미니멀, 일러스트, 사진풍 등) |

### FR-03: DB 스키마 확장
- `posts` 테이블에 `thumbnail_prompt`, `thumbnail_style` 컬럼 추가
- 기존 데이터 호환성 유지 (nullable)

### FR-04: 썸네일 생성 API 개선
- `/api/generate-thumbnail` 에서 `thumbnail_prompt` 필드 활용
- `thumbnail_style` 에 따른 프롬프트 변형 적용

### FR-05: 한 페이지 완결 (Optional - 후속 개선)
- 현재: 입력 → 저장 → 상세 페이지 이동 → 생성 버튼
- 개선 고려: 입력 + 생성까지 한 페이지에서 처리
- 단, 이번 스코프에서는 **입력 UX 개선에 집중**

## 3. 영향 범위 (Impact Analysis)

### 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `app/dashboard/new/page.tsx` | 전면 개편 - 3섹션 폼 레이아웃 |
| `components/prompt/PromptArea.tsx` | 삭제 또는 대폭 수정 (기존 토글 UI 제거) |
| `app/api/generate-thumbnail/route.ts` | thumbnail_prompt, thumbnail_style 필드 활용 |
| `app/dashboard/posts/[id]/page.tsx` | Post 타입에 새 필드 반영 |
| DB migration | thumbnail_prompt, thumbnail_style 컬럼 추가 |

### 변경 없는 파일
| 파일 | 이유 |
|------|------|
| `app/api/generate/route.ts` | 기존 필드만 사용, 변경 불필요 |
| `app/dashboard/page.tsx` | 대시보드 메인, 영향 없음 |
| `contexts/AuthContext.tsx` | 인증 로직 무관 |
| `lib/supabase/*` | 클라이언트 설정 무관 |

## 4. 기술 의사결정

### D-01: PromptArea 컴포넌트 처리
- **결정**: 삭제하고 `new/page.tsx`에 직접 폼 구현
- **이유**: 기존 컴포넌트는 ChatGPT 스타일 프롬프트 입력에 최적화되어 있어 섹션형 폼으로 재활용 어려움

### D-02: 폼 레이아웃
- **결정**: 세로 스크롤 단일 컬럼 (모바일 우선)
- 각 섹션을 카드형 컨테이너로 구분
- 섹션 헤더에 아이콘 + 설명 포함

### D-03: 제출 후 동작
- **결정**: 기존과 동일하게 DB 저장 → `/dashboard/posts/[id]`로 이동
- 입력 UX 개선이 이번 스코프의 핵심

## 5. 구현 순서

```
Step 1: DB 마이그레이션 (thumbnail_prompt, thumbnail_style 추가)
Step 2: /dashboard/new/page.tsx 전면 개편 (3섹션 폼)
Step 3: /api/generate-thumbnail/route.ts 수정 (새 필드 활용)
Step 4: /dashboard/posts/[id]/page.tsx Post 타입 업데이트
Step 5: PromptArea.tsx 정리 (미사용 시 삭제)
```

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| 기존 포스트 데이터 호환 | 새 컬럼 nullable로 추가, 기존 로직 fallback 유지 |
| 썸네일 스타일 프롬프트 품질 | 스타일별 프롬프트 템플릿 사전 정의 |
| 폼이 길어져 UX 저하 | 섹션 구분 + 시각적 계층으로 가독성 확보 |
