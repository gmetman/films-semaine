create table if not exists weekly_films (
  id              uuid primary key default gen_random_uuid(),
  week_date       date not null,
  title           text not null,
  original_title  text,
  allocine_id     text not null,
  allocine_url    text not null,
  trailer_url     text,
  poster_url      text,
  year            int,
  duration        text,
  genres          text[]  not null default '{}',
  age_rating      text,
  age_banned      boolean not null default false,
  countries       text[]  not null default '{}',
  director        text,
  actors          text[]  not null default '{}',
  press_score     numeric(3,1),
  audience_score  numeric(3,1),
  combined_score  numeric(5,2) not null,
  score_tier      text not null,
  prizes          text,
  cinemas         jsonb   not null default '[]',
  created_at      timestamptz not null default now(),
  constraint weekly_films_week_film unique (week_date, allocine_id)
);

create index if not exists weekly_films_week_date_idx on weekly_films (week_date desc);
create index if not exists weekly_films_score_idx     on weekly_films (combined_score desc);
