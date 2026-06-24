-- Restrict proof storage uploads to images only
-- Videos should be submitted as links (YouTube, Xbox clip, Medal, TikTok, Streamable, etc.)
-- ----------------------------------------------------------------------------

drop policy if exists "authed users upload own proof" on storage.objects;

create policy "authed users upload own proof"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (metadata->>'mimetype') in ('image/png', 'image/jpeg', 'image/webp')
  );
