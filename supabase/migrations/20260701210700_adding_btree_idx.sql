CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_game_user_user_game
    ON game_user (user_id, game_id);


CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_user_user_id
    ON game_user (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_user_updated_at
    ON game_user (updated_at DESC);