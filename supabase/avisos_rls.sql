-- RLS em public.avisos + public.aviso_destinatarios (visão do aluno)
-- Pré-requisito: tabelas existem (ver supabase/avisos.sql).

alter table public.avisos enable row level security;
alter table public.aviso_destinatarios enable row level security;

-- Aluno: pode ver apenas avisos publicados, não expirados e destinados a ele.
drop policy if exists "avisos_select_visible_to_aluno" on public.avisos;
create policy "avisos_select_visible_to_aluno"
  on public.avisos
  for select
  to authenticated
  using (
    status = 'publicado'
    and (publicado_em is null or publicado_em <= now())
    and (expira_em is null or expira_em > now())
    and (
      publico = 'todos'
      or (
        publico = 'especificos'
        and exists (
          select 1
          from public.aviso_destinatarios d
          where d.aviso_id = avisos.id
            and d.aluno_id = auth.uid()
        )
      )
    )
  );

-- Aluno: pode ver apenas os seus vínculos (apoia a policy acima sem expor outros).
drop policy if exists "aviso_destinatarios_select_own" on public.aviso_destinatarios;
create policy "aviso_destinatarios_select_own"
  on public.aviso_destinatarios
  for select
  to authenticated
  using (aluno_id = auth.uid());

