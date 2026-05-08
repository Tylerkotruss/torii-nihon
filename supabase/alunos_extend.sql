-- Execute no SQL Editor do Supabase depois de public.alunos existir (id = auth.users.id).
-- Ajusta colunas para o insert do cadastro (nome_completo, nivel_*, etc.).

alter table public.alunos add column if not exists nome_completo text;
alter table public.alunos add column if not exists telefone_pessoal text;
alter table public.alunos add column if not exists nivel_senioridade text;
alter table public.alunos add column if not exists nivel_escolaridade text;
alter table public.alunos add column if not exists idioma text;
alter table public.alunos add column if not exists tipo_documento text;
alter table public.alunos add column if not exists nome_social text;
alter table public.alunos add column if not exists cpf text;
alter table public.alunos add column if not exists documento_internacional text;
alter table public.alunos add column if not exists telefone_contato text;
alter table public.alunos add column if not exists nome_contato text;
alter table public.alunos add column if not exists cep text;
alter table public.alunos add column if not exists endereco text;
alter table public.alunos add column if not exists estado_civil text;
alter table public.alunos add column if not exists area_atuacao text;
alter table public.alunos add column if not exists linkedin text;
alter table public.alunos add column if not exists instagram text;
alter table public.alunos add column if not exists cursos_yto jsonb;
alter table public.alunos add column if not exists cursos_outros_detalhe text;
alter table public.alunos add column if not exists pais text;
alter table public.alunos add column if not exists pais_codigo text;
