-- Permitir crear equipos sin enlazarlos de inmediato a un torneo
alter table if exists public.teams
  alter column tournament_id drop not null;

