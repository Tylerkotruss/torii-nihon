-- Políticas RLS: admins (public.admin_profiles) podem listar alunos.
-- Não remove nem altera as policies existentes "alunos_*_own" para o aluno.

drop policy if exists "alunos_select_admin" on public.alunos;
create policy "alunos_select_admin"
  on public.alunos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles p
      where p.id = auth.uid()
    )
  );
