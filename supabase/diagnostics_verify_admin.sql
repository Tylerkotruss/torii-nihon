-- Executar no SQL Editor (só diagnóstico / inserção manual de admin).
-- UUID de exemplo: fdc420ec-8e1e-418a-bade-8d2308abf583

-- 1) Confirmar se o utilizador está em admin_profiles
select *
from public.admin_profiles
where id = 'fdc420ec-8e1e-418a-bade-8d2308abf583';

-- 2) Inserir como admin (seguro: idempotente se já existir)
insert into public.admin_profiles (id)
values ('fdc420ec-8e1e-418a-bade-8d2308abf583')
on conflict (id) do nothing;
