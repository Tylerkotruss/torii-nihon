-- Tabela de administradores: uma linha por auth user autorizado a aceder a /admin.
-- Executar no SQL Editor do Supabase (não desativa RLS noutras tabelas).
-- Para promover o primeiro admin (substituir o UUID):
--   insert into public.admin_profiles (id) values ('<uuid de auth.users>');

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

-- Cada admin pode ver apenas a sua própria linha (verificação no app).
drop policy if exists "admin_profiles_select_self" on public.admin_profiles;
create policy "admin_profiles_select_self"
  on public.admin_profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Sem insert/update público: novos admins via service role ou SQL manual.

comment on table public.admin_profiles is 'Utilizadores com acesso ao painel /admin.';
