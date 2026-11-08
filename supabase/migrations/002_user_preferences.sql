CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile text NOT NULL,
  allocine_id text NOT NULL,
  week_date date NOT NULL,
  choice text NOT NULL CHECK (choice IN ('vu', 'no')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile, allocine_id, week_date)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON user_preferences USING (true) WITH CHECK (true);
