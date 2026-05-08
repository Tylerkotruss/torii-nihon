-- RLS em FAQ + Dúvidas (visão do aluno)
-- Pré-requisito: tabelas existem (ver supabase/duvidas.sql).

alter table public.faq enable row level security;
alter table public.duvidas enable row level security;
alter table public.duvida_mensagens enable row level security;

-- FAQ: aluno autenticado pode ver somente FAQs ativas.
drop policy if exists "faq_select_active" on public.faq;
create policy "faq_select_active"
  on public.faq
  for select
  to authenticated
  using (ativo = true);

-- Dúvidas: aluno pode ver somente as próprias.
drop policy if exists "duvidas_select_own" on public.duvidas;
create policy "duvidas_select_own"
  on public.duvidas
  for select
  to authenticated
  using (aluno_id = auth.uid());

-- Dúvidas: aluno pode criar somente para si.
drop policy if exists "duvidas_insert_own" on public.duvidas;
create policy "duvidas_insert_own"
  on public.duvidas
  for insert
  to authenticated
  with check (aluno_id = auth.uid());

-- Mensagens: aluno pode ver mensagens das próprias dúvidas.
drop policy if exists "duvida_mensagens_select_own_duvidas" on public.duvida_mensagens;
create policy "duvida_mensagens_select_own_duvidas"
  on public.duvida_mensagens
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.duvidas d
      where d.id = duvida_mensagens.duvida_id
        and d.aluno_id = auth.uid()
    )
  );

-- Mensagens: aluno pode inserir mensagem apenas nas próprias dúvidas, com autor_id = auth.uid e autor_tipo='aluno'.
drop policy if exists "duvida_mensagens_insert_aluno_own" on public.duvida_mensagens;
create policy "duvida_mensagens_insert_aluno_own"
  on public.duvida_mensagens
  for insert
  to authenticated
  with check (
    autor_id = auth.uid()
    and autor_tipo = 'aluno'
    and exists (
      select 1
      from public.duvidas d
      where d.id = duvida_mensagens.duvida_id
        and d.aluno_id = auth.uid()
    )
  );

