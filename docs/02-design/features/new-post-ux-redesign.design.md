# Design: new-post-ux-redesign

> Plan 문서: `docs/01-plan/features/new-post-ux-redesign.plan.md`

## 1. DB 스키마 변경

### Migration: `005_add_thumbnail_fields.sql`

```sql
ALTER TABLE posts
  ADD COLUMN thumbnail_prompt text,
  ADD COLUMN thumbnail_style text;
```

- 두 컬럼 모두 `nullable` — 기존 데이터 호환 유지
- `thumbnail_style` 값: `'minimal'`, `'illustration'`, `'photo'`, `'abstract'`, `'flat'` (앱 레벨 enum, DB 제약 없음)
- 기존 컬럼 변경 없음

## 2. UI 설계

### 2.1 페이지 레이아웃 (new/page.tsx)

```
┌──────────────────────────────────────────────┐
│ Header: ← Dashboard              새 글 작성  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─ 섹션 1: 공통 정보 ────────────────────┐  │
│  │ 📝 블로그 주제 *                        │  │
│  │ ┌────────────────────────────────────┐  │  │
│  │ │ textarea (auto-resize)            │  │  │
│  │ └────────────────────────────────────┘  │  │
│  │                                        │  │
│  │ 🏷️ 키워드                              │  │
│  │ ┌────────────────────────────────────┐  │  │
│  │ │ input text                        │  │  │
│  │ └────────────────────────────────────┘  │  │
│  │                                        │  │
│  │ [추천 주제 chips]                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ 섹션 2: 아티클 옵션 ──────────────────┐  │
│  │ 💬 나의 비평                            │  │
│  │ ┌────────────────────────────────────┐  │  │
│  │ │ textarea                          │  │  │
│  │ └────────────────────────────────────┘  │  │
│  │                                        │  │
│  │ 📚 참고 자료                            │  │
│  │ ┌────────────────────────────────────┐  │  │
│  │ │ textarea                          │  │  │
│  │ └────────────────────────────────────┘  │  │
│  │                                        │  │
│  │ 🔗 출처                                 │  │
│  │ ┌────────────────────────────────────┐  │  │
│  │ │ input text                        │  │  │
│  │ └────────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ 섹션 3: 썸네일 옵션 ──────────────────┐  │
│  │ 🖼️ 썸네일 프롬프트                      │  │
│  │ ┌────────────────────────────────────┐  │  │
│  │ │ textarea (비우면 공통 주제 사용)   │  │  │
│  │ └────────────────────────────────────┘  │  │
│  │                                        │  │
│  │ 🎨 썸네일 스타일                        │  │
│  │ ┌──────┐┌──────┐┌──────┐┌──────┐      │  │
│  │ │미니멀││일러스트││사진풍││추상  │      │  │
│  │ └──────┘└──────┘└──────┘└──────┘      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│         ┌──────────────────────┐             │
│         │   ✏️ 글 작성 시작     │             │
│         └──────────────────────┘             │
│                                              │
└──────────────────────────────────────────────┘
```

### 2.2 디자인 토큰 (기존 프로젝트 패턴 준수)

```
배경:        bg-[#181818] (페이지), bg-[#252525] (카드)
테두리:      border-white/[0.06], hover: border-white/[0.12]
텍스트:      text-white (제목), text-white/80 (본문), text-white/40 (보조)
액센트:      #22d3ee (CTA 버튼, 아이콘 하이라이트)
카드 모서리:  rounded-2xl
입력 필드:   rounded-xl bg-white/[0.03] border border-white/[0.06]
폰트:        Space Grotesk
```

### 2.3 썸네일 스타일 선택 UI

버튼 그룹 (radio-button 스타일):

| 값 | 레이블 | 설명 |
|----|--------|------|
| `minimal` | 미니멀 | 깔끔하고 간결한 스타일 |
| `illustration` | 일러스트 | 손그림/벡터 일러스트 스타일 |
| `photo` | 사진풍 | 실사 사진처럼 사실적인 스타일 |
| `abstract` | 추상 | 추상적/기하학적 아트 스타일 |
| `flat` | 플랫 | 플랫 디자인, 단순한 색면 |

- 선택하지 않으면 기존 기본 프롬프트 사용 (modern, clean 스타일)
- 선택 시 선택된 버튼에 `border-[#22d3ee]` + `bg-[#22d3ee]/10` 하이라이트

### 2.4 추천 주제 chips

기존 `PromptArea` 외부에 있던 suggestion chips를 섹션 1 내부로 이동.
클릭 시 prompt textarea에 직접 값 설정 (React state 기반, DOM 조작 제거).

## 3. 컴포넌트 상세 설계

### 3.1 NewPostPage 상태 관리

```typescript
// 폼 상태 (단일 state object)
type FormData = {
    // 공통
    prompt: string;
    keywords: string;
    // 아티클
    critique: string;
    reference_materials: string;
    sources: string;
    // 썸네일
    thumbnail_prompt: string;
    thumbnail_style: string; // '' | 'minimal' | 'illustration' | 'photo' | 'abstract' | 'flat'
};

const [form, setForm] = useState<FormData>({
    prompt: '',
    keywords: '',
    critique: '',
    reference_materials: '',
    sources: '',
    thumbnail_prompt: '',
    thumbnail_style: '',
});
const [submitting, setSubmitting] = useState(false);
```

### 3.2 handleSubmit 로직

```typescript
const handleSubmit = async () => {
    if (!form.prompt.trim() || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            prompt: form.prompt.trim(),
            keywords: form.keywords.trim() || null,
            critique: form.critique.trim() || null,
            reference_materials: form.reference_materials.trim() || null,
            sources: form.sources.trim() || null,
            thumbnail_prompt: form.thumbnail_prompt.trim() || null,
            thumbnail_style: form.thumbnail_style || null,
            status: 'draft',
        })
        .select('id')
        .single();

    if (error) {
        console.error('Post creation error:', error.message);
        setSubmitting(false);
        return;
    }

    router.push(`/dashboard/posts/${data.id}`);
};
```

### 3.3 SectionCard 패턴

각 섹션은 동일한 카드 패턴을 사용:

```tsx
{/* 섹션 카드 */}
<section className="rounded-2xl bg-[#252525] border border-white/[0.06] p-6">
    <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-white/30 ml-auto">{subtitle}</span>
    </div>
    <div className="flex flex-col gap-4">
        {children}
    </div>
</section>
```

### 3.4 입력 필드 패턴

```tsx
{/* 텍스트 입력 (textarea) */}
<div>
    <label className="block text-xs text-white/50 mb-2">{label}</label>
    <textarea
        rows={rows}
        value={value}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.06]
                   p-4 text-sm text-white placeholder:text-white/20
                   focus:border-white/[0.12] focus:outline-none transition-colors"
    />
</div>

{/* 텍스트 입력 (input) */}
<div>
    <label className="block text-xs text-white/50 mb-2">{label}</label>
    <input
        type="text"
        value={value}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06]
                   px-4 py-3 text-sm text-white placeholder:text-white/20
                   focus:border-white/[0.12] focus:outline-none transition-colors"
    />
</div>
```

## 4. API 변경 설계

### 4.1 generate-thumbnail/route.ts 변경

**변경 포인트**: `generateAndUploadThumbnail` 함수의 파라미터 확장

```typescript
// Before
async function generateAndUploadThumbnail({
    postId, userId, prompt, storageSupabase
})

// After
async function generateAndUploadThumbnail({
    postId, userId, prompt, thumbnailPrompt, thumbnailStyle, storageSupabase
}: {
    postId: string;
    userId: string;
    prompt: string;
    thumbnailPrompt: string | null;
    thumbnailStyle: string | null;
    storageSupabase: SupabaseClient;
})
```

**이미지 프롬프트 생성 로직**:

```typescript
// 스타일별 프롬프트 매핑
const stylePrompts: Record<string, string> = {
    minimal:      'minimalist, clean lines, simple composition, white space',
    illustration: 'digital illustration, hand-drawn style, vibrant colors, artistic',
    photo:        'photorealistic, high-resolution photography, natural lighting, cinematic',
    abstract:     'abstract art, geometric shapes, bold colors, artistic composition',
    flat:         'flat design, solid colors, simple shapes, modern graphic design',
};

// 최종 프롬프트 조합
const basePrompt = thumbnailPrompt?.trim() || prompt;
const styleHint = thumbnailStyle ? stylePrompts[thumbnailStyle] : 'modern, clean, and engaging';
const imagePrompt = `Create a high-quality, professional thumbnail image for a blog post about: ${basePrompt}. Style: ${styleHint}. Do not include any text in the image.`;
```

**POST 핸들러 변경**: DB에서 post 조회 시 `thumbnail_prompt`, `thumbnail_style` 필드 추가

```typescript
// Before
const { data: post } = await supabase
    .from('posts')
    .select('id, prompt')
    ...

// After
const { data: post } = await supabase
    .from('posts')
    .select('id, prompt, thumbnail_prompt, thumbnail_style')
    ...
```

### 4.2 generate/route.ts — 변경 없음

기존 아티클 생성 API는 `prompt`, `keywords`, `critique`, `reference_materials`, `sources` 필드만 사용하므로 변경 불필요.

## 5. posts/[id]/page.tsx 변경

### Post 타입 확장

```typescript
type Post = {
    // ... 기존 필드 ...
    thumbnail_prompt: string | null;   // 추가
    thumbnail_style: string | null;    // 추가
};
```

### 입력 정보 표시 영역 확장

```typescript
const inputFields = [
    { label: '키워드', value: post.keywords },
    { label: '나의 비평', value: post.critique },
    { label: '참고 자료', value: post.reference_materials },
    { label: '출처', value: post.sources },
    { label: '썸네일 프롬프트', value: post.thumbnail_prompt },     // 추가
    { label: '썸네일 스타일', value: post.thumbnail_style },         // 추가
].filter((f) => f.value);
```

## 6. 파일 변경/삭제 목록

| 파일 | 액션 | 설명 |
|------|------|------|
| `supabase/migrations/005_add_thumbnail_fields.sql` | **신규** | DB 마이그레이션 |
| `app/dashboard/new/page.tsx` | **전면 수정** | 3섹션 폼 UI |
| `app/api/generate-thumbnail/route.ts` | **수정** | thumbnailPrompt/thumbnailStyle 파라미터 활용 |
| `app/dashboard/posts/[id]/page.tsx` | **수정** | Post 타입 + 입력정보 표시 확장 |
| `components/prompt/PromptArea.tsx` | **삭제** | 더 이상 사용하지 않음 |

## 7. 구현 순서 (Implementation Order)

```
Step 1: DB 마이그레이션 적용
        → 005_add_thumbnail_fields.sql 실행

Step 2: app/dashboard/new/page.tsx 전면 개편
        → PromptArea import 제거
        → FormData state + 3섹션 카드 UI 구현
        → handleSubmit에 신규 필드 포함
        → suggestion chips를 섹션 1 내부로 이동 (React state 기반)

Step 3: app/api/generate-thumbnail/route.ts 수정
        → post select에 thumbnail_prompt, thumbnail_style 추가
        → generateAndUploadThumbnail에 새 파라미터 전달
        → 스타일별 프롬프트 매핑 적용

Step 4: app/dashboard/posts/[id]/page.tsx 수정
        → Post 타입에 thumbnail_prompt, thumbnail_style 추가
        → inputFields에 새 필드 표시 추가

Step 5: components/prompt/PromptArea.tsx 삭제
        → 더 이상 import하는 곳 없음 확인 후 삭제
```
