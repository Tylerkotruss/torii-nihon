-- Políticas RLS: admins podem ver e actualizar documentos (aprovar/recusar).
-- Não remove policies "documentos_*_own" do aluno.

drop policy if exists "documentos_select_admin" on public.documentos;
create policy "documentos_select_admin"
  on public.documentos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "documentos_update_admin" on public.documentos;
create policy "documentos_update_admin"
  on public.documentos
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
