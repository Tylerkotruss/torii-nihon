-- Políticas RLS: admins (public.admin_profiles) podem gerenciar avisos e destinatários.
-- Não remove policy do aluno (supabase/avisos_rls.sql).

-- public.avisos
drop policy if exists "avisos_select_admin" on public.avisos;
create policy "avisos_select_admin"
  on public.avisos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "avisos_insert_admin" on public.avisos;
create policy "avisos_insert_admin"
  on public.avisos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "avisos_update_admin" on public.avisos;
create policy "avisos_update_admin"
  on public.avisos
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "avisos_delete_admin" on public.avisos;
create policy "avisos_delete_admin"
  on public.avisos
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

-- public.aviso_destinatarios
drop policy if exists "aviso_destinatarios_select_admin" on public.aviso_destinatarios;
create policy "aviso_destinatarios_select_admin"
  on public.aviso_destinatarios
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "aviso_destinatarios_insert_admin" on public.aviso_destinatarios;
create policy "aviso_destinatarios_insert_admin"
  on public.aviso_destinatarios
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "aviso_destinatarios_update_admin" on public.aviso_destinatarios;
create policy "aviso_destinatarios_update_admin"
  on public.aviso_destinatarios
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "aviso_destinatarios_delete_admin" on public.aviso_destinatarios;
create policy "aviso_destinatarios_delete_admin"
  on public.aviso_destinatarios
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

