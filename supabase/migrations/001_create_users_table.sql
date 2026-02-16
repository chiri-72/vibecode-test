-- users 테이블 생성: auth.users와 자동 연동
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 활성화
alter table public.users enable row level security;

-- 본인 데이터만 조회 가능
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- 본인 데이터만 수정 가능
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- auth.users에 새 유저가 생길 때 public.users에 자동 삽입하는 함수
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- auth.users INSERT 시 트리거 실행
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at 자동 갱신 함수
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- public.users UPDATE 시 updated_at 자동 갱신
create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();
