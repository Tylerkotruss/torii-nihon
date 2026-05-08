-- RLS em public.documentos
-- Pré-requisito: tabela public.documentos existe; aluno_id referencia public.alunos(id) e, no fluxo do app, alunos.id = auth.users.id (logo aluno_id = auth.uid() para o aluno logado)

alter table public.documentos enable row level security;

drop policy if exists "documentos_select_own" on public.documentos;
create policy "documentos_select_own"
  on public.documentos
  for select
  to authenticated
  using (aluno_id = auth.uid());

drop policy if exists "documentos_insert_own" on public.documentos;
create policy "documentos_insert_own"
  on public.documentos
  for insert
  to authenticated
  with check (aluno_id = auth.uid());

drop policy if exists "documentos_update_own" on public.documentos;
create policy "documentos_update_own"
  on public.documentos
  for update
  to authenticated
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());

drop policy if exists "documentos_delete_own" on public.documentos;
create policy "documentos_delete_own"
  on public.documentos
  for delete
  to authenticated
  using (aluno_id = auth.uid());
