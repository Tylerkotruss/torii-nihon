-- public.avisos + public.aviso_destinatarios
-- Rodar no SQL Editor do Supabase.
-- RLS/policies: passo separado (ver supabase/avisos_rls.sql e supabase/admin_avisos_rls.sql).

create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),

  titulo text not null,
  mensagem text not null,

  tipo text not null default 'informacao',
  status text not null default 'rascunho',
  fixado boolean not null default false,
  publico text not null default 'todos',

  publicado_em timestamptz,
  expira_em timestamptz,

  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint avisos_tipo_check check (tipo in ('informacao', 'importante', 'urgente')),
  constraint avisos_status_check check (status in ('rascunho', 'publicado')),
  constraint avisos_publico_check check (publico in ('todos', 'especificos'))
);

create index if not exists avisos_status_idx on public.avisos (status);
create index if not exists avisos_publicado_em_idx on public.avisos (publicado_em desc);
create index if not exists avisos_fixado_publicado_em_idx on public.avisos (fixado desc, publicado_em desc);
create index if not exists avisos_publico_idx on public.avisos (publico);

create or replace function public.set_avisos_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists avisos_set_atualizado_em on public.avisos;
create trigger avisos_set_atualizado_em
  before update on public.avisos
  for each row
  execute function public.set_avisos_atualizado_em();

create table if not exists public.aviso_destinatarios (
  id uuid primary key default gen_random_uuid(),
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  aluno_id uuid not null references public.alunos (id) on delete cascade,
  criado_em timestamptz not null default now(),

  constraint aviso_destinatarios_unique unique (aviso_id, aluno_id)
);

create index if not exists aviso_destinatarios_aviso_id_idx
  on public.aviso_destinatarios (aviso_id);
create index if not exists aviso_destinatarios_aluno_id_idx
  on public.aviso_destinatarios (aluno_id);

