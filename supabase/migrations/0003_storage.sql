-- ============================================================================
-- TechBildAcess — Storage (bucket de banners de eventos)
-- Rode DEPOIS de 0002_rls.sql.
-- ============================================================================

-- Bucket público para banners de eventos
insert into storage.buckets (id, name, public)
values ('event-banners', 'event-banners', true)
on conflict (id) do nothing;

-- Políticas de storage
drop policy if exists "event_banners_public_read" on storage.objects;
drop policy if exists "event_banners_admin_write" on storage.objects;
drop policy if exists "event_banners_admin_update" on storage.objects;
drop policy if exists "event_banners_admin_delete" on storage.objects;

-- Leitura pública das imagens
create policy "event_banners_public_read" on storage.objects
  for select using (bucket_id = 'event-banners');

-- Apenas admin envia/atualiza/remove
create policy "event_banners_admin_write" on storage.objects
  for insert with check (bucket_id = 'event-banners' and public.is_admin());

create policy "event_banners_admin_update" on storage.objects
  for update using (bucket_id = 'event-banners' and public.is_admin());

create policy "event_banners_admin_delete" on storage.objects
  for delete using (bucket_id = 'event-banners' and public.is_admin());
