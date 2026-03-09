-- =========================================================
-- Trigger de estadisticas: public.standings
-- Objetivo:
-- - Recalcular tabla standings por torneo cuando cambian partidos
-- - Considera solo partidos con status = 'finished'
-- - Incluye equipos sin partidos finalizados (valores en 0)
-- =========================================================

-- ---------------------------------------------------------
-- 1) Funcion de recalculo por torneo
-- ---------------------------------------------------------
create or replace function public.recalculate_standings_for_tournament(p_tournament_id uuid)
returns void
language plpgsql
as $$
begin
  -- Limpia clasificacion del torneo para reconstruirla completa
  delete from public.standings
  where tournament_id = p_tournament_id;

  -- Recalcula para todos los equipos del torneo (incluye equipos sin partidos)
  insert into public.standings (
    tournament_id,
    team_id,
    played,
    won,
    drawn,
    lost,
    goals_for,
    goals_against,
    goal_difference,
    points
  )
  select
    t.tournament_id,
    t.id as team_id,
    coalesce(sum(case when m.id is not null then 1 else 0 end), 0) as played,
    coalesce(sum(case
      when m.home_team_id = t.id and coalesce(m.home_score, 0) > coalesce(m.away_score, 0) then 1
      when m.away_team_id = t.id and coalesce(m.away_score, 0) > coalesce(m.home_score, 0) then 1
      else 0
    end), 0) as won,
    coalesce(sum(case
      when m.id is not null and coalesce(m.home_score, 0) = coalesce(m.away_score, 0) then 1
      else 0
    end), 0) as drawn,
    coalesce(sum(case
      when m.home_team_id = t.id and coalesce(m.home_score, 0) < coalesce(m.away_score, 0) then 1
      when m.away_team_id = t.id and coalesce(m.away_score, 0) < coalesce(m.home_score, 0) then 1
      else 0
    end), 0) as lost,
    coalesce(sum(case
      when m.home_team_id = t.id then coalesce(m.home_score, 0)
      when m.away_team_id = t.id then coalesce(m.away_score, 0)
      else 0
    end), 0) as goals_for,
    coalesce(sum(case
      when m.home_team_id = t.id then coalesce(m.away_score, 0)
      when m.away_team_id = t.id then coalesce(m.home_score, 0)
      else 0
    end), 0) as goals_against,
    coalesce(sum(case
      when m.home_team_id = t.id then coalesce(m.home_score, 0) - coalesce(m.away_score, 0)
      when m.away_team_id = t.id then coalesce(m.away_score, 0) - coalesce(m.home_score, 0)
      else 0
    end), 0) as goal_difference,
    coalesce(sum(case
      when m.home_team_id = t.id and coalesce(m.home_score, 0) > coalesce(m.away_score, 0) then 3
      when m.away_team_id = t.id and coalesce(m.away_score, 0) > coalesce(m.home_score, 0) then 3
      when m.id is not null and coalesce(m.home_score, 0) = coalesce(m.away_score, 0) then 1
      else 0
    end), 0) as points
  from public.teams t
  left join public.matches m
    on m.tournament_id = t.tournament_id
   and m.status = 'finished'
   and (m.home_team_id = t.id or m.away_team_id = t.id)
  where t.tournament_id = p_tournament_id
  group by t.tournament_id, t.id;
end;
$$;

-- ---------------------------------------------------------
-- 2) Trigger function para detectar cambios en matches
-- ---------------------------------------------------------
create or replace function public.trg_recalculate_standings_from_matches()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform public.recalculate_standings_for_tournament(new.tournament_id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Recalcula torneo anterior (siempre)
    perform public.recalculate_standings_for_tournament(old.tournament_id);

    -- Si cambió de torneo, recalcula tambien el nuevo
    if new.tournament_id is distinct from old.tournament_id then
      perform public.recalculate_standings_for_tournament(new.tournament_id);
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.recalculate_standings_for_tournament(old.tournament_id);
    return old;
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------
-- 3) Trigger idempotente sobre public.matches
-- ---------------------------------------------------------
drop trigger if exists recalculate_standings_on_matches on public.matches;

create trigger recalculate_standings_on_matches
after insert or update or delete on public.matches
for each row
execute function public.trg_recalculate_standings_from_matches();
