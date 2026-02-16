-- 블로그 콘텐츠 파일 저장용 스토리지 버킷 생성
insert into storage.buckets (id, name, public)
values ('posts-content', 'posts-content', false);

-- RLS 정책: 본인 폴더만 업로드 가능 (user_id/파일명 구조)
create policy "Users can upload own post files"
  on storage.objects for insert
  with check (
    bucket_id = 'posts-content'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 조회 가능
create policy "Users can view own post files"
  on storage.objects for select
  using (
    bucket_id = 'posts-content'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 수정 가능
create policy "Users can update own post files"
  on storage.objects for update
  using (
    bucket_id = 'posts-content'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 삭제 가능
create policy "Users can delete own post files"
  on storage.objects for delete
  using (
    bucket_id = 'posts-content'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
