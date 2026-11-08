ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_choice_check;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_choice_check
  CHECK (choice IN ('vu', 'no', 'prefere', 'pourquoi_pas'));
