-- public.documentos — rodar de uma vez no SQL Editor (Repositório: alunos já existe)
-- RLS e Storage: passo separado

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),

  aluno_id uuid not null
    references public.alunos (id) on delete cascade,

  tipo text not null,
  titulo text,
  nome_arquivo_original text not null,
  content_type text,
  tamanho_bytes bigint,

  storage_bucket text not null default 'documentos',
  storage_path text not null,

  status text not null default 'enviado',
  motivo_rejeicao text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint documentos_status_check
    check (
      status in (
        'enviado',
        'em_analise',
        'aprovado',
        'rejeitado'
      )
    )
);

create index if not exists documentos_aluno_id_idx
  on public.documentos (aluno_id);

create index if not exists documentos_aluno_id_status_idx
  on public.documentos (aluno_id, status);

create or replace function public.set_documentos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documentos_set_updated_at on public.documentos;

create trigger documentos_set_updated_at
  before update on public.documentos
  for each row
  execute function public.set_documentos_updated_at();
