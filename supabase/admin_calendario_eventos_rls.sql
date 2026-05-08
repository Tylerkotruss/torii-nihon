-- Políticas RLS: admins (public.admin_profiles) podem gerenciar calendário_eventos.
-- Não remove policy do aluno (supabase/calendario_eventos_rls.sql).

drop policy if exists "calendario_eventos_select_admin" on public.calendario_eventos;
create policy "calendario_eventos_select_admin"
  on public.calendario_eventos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "calendario_eventos_insert_admin" on public.calendario_eventos;
create policy "calendario_eventos_insert_admin"
  on public.calendario_eventos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "calendario_eventos_update_admin" on public.calendario_eventos;
create policy "calendario_eventos_update_admin"
  on public.calendario_eventos
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

drop policy if exists "calendario_eventos_delete_admin" on public.calendario_eventos;
create policy "calendario_eventos_delete_admin"
  on public.calendario_eventos
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

