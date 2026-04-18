-- AI 썸네일 저장용 public 버킷 생성
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own thumbnails" on storage.objects;
drop policy if exists "Anyone can view thumbnails" on storage.objects;
drop policy if exists "Users can update own thumbnails" on storage.objects;
drop policy if exists "Users can delete own thumbnails" on storage.objects;

-- 본인 폴더(user_id/...) 경로에만 업로드 가능
create policy "Users can upload own thumbnails"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 썸네일 조회는 공개 허용(public bucket)
create policy "Anyone can view thumbnails"
  on storage.objects for select
  using (
    bucket_id = 'thumbnails'
  );

-- 본인 파일만 수정/삭제 가능
create policy "Users can update own thumbnails"
  on storage.objects for update
  using (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own thumbnails"
  on storage.objects for delete
  using (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
