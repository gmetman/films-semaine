-- Prizes for films of week 2026-11-04
-- Run once in Supabase SQL Editor after re-running the scraper.
-- The scraper now preserves prizes on re-runs.

UPDATE weekly_films SET prizes = 'Prix spécial du jury, Un Certain Regard, Cannes 2026 · Prix du jury, Prix du public & Prix Fondation Gan, Annecy 2026'
WHERE allocine_id = '321790' AND week_date = '2026-11-04';

UPDATE weekly_films SET prizes = 'Grand Prix Semaine de la Critique, Cannes 2026 · Prix d''Ornano-Valenti, Deauville 2026 · Grand Prix, Ghent 2026'
WHERE allocine_id = '318225' AND week_date = '2026-11-04';

UPDATE weekly_films SET prizes = 'Grand Prix, Cannes 2026 (Compétition officielle)'
WHERE allocine_id = '1000022205' AND week_date = '2026-11-04';

UPDATE weekly_films SET prizes = 'Prix du scénario, Cannes 2026 · Grand Prix, BRIFF 2026'
WHERE allocine_id = '1000007388' AND week_date = '2026-11-04';

UPDATE weekly_films SET prizes = 'Sélection Un Certain Regard, Cannes 2026'
WHERE allocine_id = '1000036932' AND week_date = '2026-11-04';

UPDATE weekly_films SET prizes = 'Sélection Séances spéciales, Cannes 2026 · Prix du jury & Prix du public, TAURON Young Horizons 2026'
WHERE allocine_id = '1000012316' AND week_date = '2026-11-04';
