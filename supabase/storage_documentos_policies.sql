-- Bucket privado "documentos" e policies em storage.objects
-- Path (storage.objects.name): {auth.uid()}/{segmento_tipo}/{timestamp}_{nome_seguro}
-- 1.º segmento = auth.uid() (deve ser igual a public.alunos.id / aluno_id na tabela documentos)

-- 1) Bucket (criar no Dashboard > Storage se o INSERT abaixo falhar; recomendado: limite 5MB no bucket)
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- 2) Reexecutável: remove policies anteriores com os mesmos nomes
drop policy if exists "documentos_storage_select_own" on storage.objects;
drop policy if exists "documentos_storage_insert_own" on storage.objects;
drop policy if exists "documentos_storage_update_own" on storage.objects;
drop policy if exists "documentos_storage_delete_own" on storage.objects;

-- 3) Acesso só à pasta cujo 1.º segmento = auth.uid()

create policy "documentos_storage_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documentos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "documentos_storage_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documentos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "documentos_storage_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'documentos'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'documentos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "documentos_storage_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documentos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
