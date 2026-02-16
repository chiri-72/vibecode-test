-- posts 테이블 생성: 블로그 글 입력/출력 정보 저장
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- 입력 정보 (사용자가 PromptArea에서 입력)
  prompt text not null,                    -- 메인 프롬프트 (블로그 아이디어)
  keywords text,                           -- 키워드
  critique text,                           -- 나의 비평/관점
  reference_materials text,                 -- 참고 자료
  sources text,                            -- 출처

  -- 출력 정보 (AI가 생성)
  title text,                              -- 생성된 블로그 제목
  content text,                            -- 생성된 블로그 본문
  summary text,                            -- 요약
  thumbnail_url text,                      -- 썸네일 이미지 URL (스토리지)

  -- 상태 관리
  status text default 'draft' check (status in ('draft', 'generating', 'generated', 'published')),

  -- 파일 저장
  file_url text,                           -- 스토리지에 저장된 파일 URL

  -- 타임스탬프
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

-- RLS 활성화
alter table public.posts enable row level security;

-- 본인 글만 조회 가능
create policy "Users can view own posts"
  on public.posts for select
  using (auth.uid() = user_id);

-- 본인만 글 작성 가능
create policy "Users can create own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

-- 본인 글만 수정 가능
create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id);

-- 본인 글만 삭제 가능
create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- updated_at 자동 갱신 함수 (없으면 생성)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- updated_at 자동 갱신 트리거
create trigger on_posts_updated
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- 인덱스: 사용자별 글 조회 최적화
create index idx_posts_user_id on public.posts(user_id);
create index idx_posts_status on public.posts(status);
create index idx_posts_created_at on public.posts(created_at desc);
