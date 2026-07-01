CREATE UNIQUE INDEX IF NOT EXISTS idx_game_user_user_game
    ON game_users (user_id, game_id);


CREATE INDEX IF NOT EXISTS idx_game_user_user_id
    ON game_users (user_id);

CREATE INDEX IF NOT EXISTS idx_game_user_updated_at
    ON game_users (updated_at DESC);