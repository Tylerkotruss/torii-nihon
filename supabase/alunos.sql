-- Crie a tabela "alunos" (id = auth.users.id)
create table if not exists public.alunos (
  id uuid primary key,
  nome_completo text,
  email text not null,
  created_at timestamp with time zone not null default now()
);

-- Recomendo habilitar RLS para garantir isolamento por usuário
alter table public.alunos enable row level security;

create policy "alunos_select_own"
on public.alunos
for select
to authenticated
using (auth.uid() = id);

create policy "alunos_insert_own"
on public.alunos
for insert
to authenticated
with check (auth.uid() = id);

create policy "alunos_update_own"
on public.alunos
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

