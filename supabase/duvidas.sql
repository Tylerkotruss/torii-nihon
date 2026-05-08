-- public.faq + public.duvidas + public.duvida_mensagens
-- Rodar no SQL Editor do Supabase.
-- RLS/policies: passo separado (ver supabase/duvidas_rls.sql e supabase/admin_duvidas_rls.sql).

create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  pergunta text not null,
  resposta text not null,
  categoria text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists faq_ativo_idx on public.faq (ativo);
create index if not exists faq_categoria_ordem_idx on public.faq (categoria, ordem);
create index if not exists faq_ordem_idx on public.faq (ordem);

create or replace function public.set_faq_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists faq_set_atualizado_em on public.faq;
create trigger faq_set_atualizado_em
  before update on public.faq
  for each row
  execute function public.set_faq_atualizado_em();

create table if not exists public.duvidas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos (id) on delete cascade,
  assunto text not null,
  categoria text,
  status text not null default 'aberta',
  prioridade text not null default 'normal',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint duvidas_status_check check (status in ('aberta', 'respondida', 'fechada')),
  constraint duvidas_prioridade_check check (prioridade in ('baixa', 'normal', 'alta'))
);

create index if not exists duvidas_status_idx on public.duvidas (status);
create index if not exists duvidas_aluno_id_idx on public.duvidas (aluno_id);
create index if not exists duvidas_criado_em_idx on public.duvidas (criado_em desc);
create index if not exists duvidas_atualizado_em_idx on public.duvidas (atualizado_em desc);
create index if not exists duvidas_aluno_status_atualizado_idx
  on public.duvidas (aluno_id, status, atualizado_em desc);

create or replace function public.set_duvidas_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists duvidas_set_atualizado_em on public.duvidas;
create trigger duvidas_set_atualizado_em
  before update on public.duvidas
  for each row
  execute function public.set_duvidas_atualizado_em();

create table if not exists public.duvida_mensagens (
  id uuid primary key default gen_random_uuid(),
  duvida_id uuid not null references public.duvidas (id) on delete cascade,
  autor_id uuid not null references auth.users (id) on delete cascade,
  mensagem text not null,
  autor_tipo text not null,
  criado_em timestamptz not null default now(),

  constraint duvida_mensagens_autor_tipo_check check (autor_tipo in ('aluno', 'admin'))
);

create index if not exists duvida_mensagens_duvida_id_idx
  on public.duvida_mensagens (duvida_id);
create index if not exists duvida_mensagens_criado_em_idx
  on public.duvida_mensagens (criado_em asc);
create index if not exists duvida_mensagens_duvida_criado_idx
  on public.duvida_mensagens (duvida_id, criado_em asc);

-- Sempre que uma mensagem é inserida, atualiza `duvidas.atualizado_em`
-- (sem depender de o app fazer update manual).
create or replace function public.bump_duvida_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  update public.duvidas
    set atualizado_em = now()
  where id = new.duvida_id;
  return new;
end;
$$;

drop trigger if exists duvida_mensagens_bump_duvida_updated on public.duvida_mensagens;
create trigger duvida_mensagens_bump_duvida_updated
  after insert on public.duvida_mensagens
  for each row
  execute function public.bump_duvida_atualizado_em();

