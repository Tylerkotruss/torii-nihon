-- Políticas RLS: admins (public.admin_profiles) podem gerenciar FAQ, dúvidas e mensagens.
-- Não remove policies do aluno (supabase/duvidas_rls.sql).

-- FAQ: admin CRUD
drop policy if exists "faq_select_admin" on public.faq;
create policy "faq_select_admin"
  on public.faq
  for select
  to authenticated
  using (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

drop policy if exists "faq_insert_admin" on public.faq;
create policy "faq_insert_admin"
  on public.faq
  for insert
  to authenticated
  with check (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

drop policy if exists "faq_update_admin" on public.faq;
create policy "faq_update_admin"
  on public.faq
  for update
  to authenticated
  using (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  )
  with check (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

drop policy if exists "faq_delete_admin" on public.faq;
create policy "faq_delete_admin"
  on public.faq
  for delete
  to authenticated
  using (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

-- Dúvidas: admin select/update/delete
drop policy if exists "duvidas_select_admin" on public.duvidas;
create policy "duvidas_select_admin"
  on public.duvidas
  for select
  to authenticated
  using (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

drop policy if exists "duvidas_update_admin" on public.duvidas;
create policy "duvidas_update_admin"
  on public.duvidas
  for update
  to authenticated
  using (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  )
  with check (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

drop policy if exists "duvidas_delete_admin" on public.duvidas;
create policy "duvidas_delete_admin"
  on public.duvidas
  for delete
  to authenticated
  using (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

-- Mensagens: admin select/insert
drop policy if exists "duvida_mensagens_select_admin" on public.duvida_mensagens;
create policy "duvida_mensagens_select_admin"
  on public.duvida_mensagens
  for select
  to authenticated
  using (
    exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

drop policy if exists "duvida_mensagens_insert_admin" on public.duvida_mensagens;
create policy "duvida_mensagens_insert_admin"
  on public.duvida_mensagens
  for insert
  to authenticated
  with check (
    autor_id = auth.uid()
    and autor_tipo = 'admin'
    and exists (select 1 from public.admin_profiles p where p.id = auth.uid())
  );

