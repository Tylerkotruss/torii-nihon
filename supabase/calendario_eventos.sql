-- public.calendario_eventos
-- Rodar no SQL Editor do Supabase.
-- RLS/policies: passo separado (ver supabase/calendario_eventos_rls.sql e supabase/admin_calendario_eventos_rls.sql).

create table if not exists public.calendario_eventos (
  id uuid primary key default gen_random_uuid(),

  titulo text not null,
  descricao text,

  tipo text not null default 'evento',
  status text not null default 'publicado',
  destaque boolean not null default false,

  data_inicio timestamptz not null,
  data_fim timestamptz,

  cor text,

  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint calendario_eventos_tipo_check
    check (tipo in ('evento', 'prazo', 'reuniao', 'aula', 'feriado', 'aviso')),
  constraint calendario_eventos_status_check
    check (status in ('rascunho', 'publicado'))
);

create index if not exists calendario_eventos_status_idx
  on public.calendario_eventos (status);
create index if not exists calendario_eventos_data_inicio_idx
  on public.calendario_eventos (data_inicio);
create index if not exists calendario_eventos_destaque_idx
  on public.calendario_eventos (destaque);
create index if not exists calendario_eventos_destaque_data_inicio_idx
  on public.calendario_eventos (destaque desc, data_inicio asc);

create or replace function public.set_calendario_eventos_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists calendario_eventos_set_atualizado_em on public.calendario_eventos;
create trigger calendario_eventos_set_atualizado_em
  before update on public.calendario_eventos
  for each row
  execute function public.set_calendario_eventos_atualizado_em();

