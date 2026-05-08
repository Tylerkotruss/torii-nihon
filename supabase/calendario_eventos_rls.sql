-- RLS em public.calendario_eventos (visão do aluno)
-- Pré-requisito: tabela existe (ver supabase/calendario_eventos.sql).

alter table public.calendario_eventos enable row level security;

-- Aluno: pode ver apenas eventos publicados.
drop policy if exists "calendario_eventos_select_published" on public.calendario_eventos;
create policy "calendario_eventos_select_published"
  on public.calendario_eventos
  for select
  to authenticated
  using (status = 'publicado');

