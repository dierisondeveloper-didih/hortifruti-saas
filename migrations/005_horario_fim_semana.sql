-- Adiciona colunas para horário de fim de semana na tabela configuracoes
alter table configuracoes add column if not exists horario_abertura_fds text;
alter table configuracoes add column if not exists horario_fechamento_fds text;

comment on column configuracoes.horario_abertura_fds is 'Horário de abertura aos sábados e domingos. Se nulo, usa o horário padrão.';
comment on column configuracoes.horario_fechamento_fds is 'Horário de fechamento aos sábados e domingos. Se nulo, usa o horário padrão.';
