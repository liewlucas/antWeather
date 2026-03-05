-- Rain event captures
CREATE TABLE IF NOT EXISTS captures (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    checked_at  TEXT NOT NULL,
    is_raining  INTEGER NOT NULL DEFAULT 0,
    max_mm      REAL NOT NULL DEFAULT 0,
    stations    TEXT,
    radar_key   TEXT,
    radar_bytes INTEGER DEFAULT 0,
    alert_sent  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_captures_checked ON captures(checked_at);
CREATE INDEX IF NOT EXISTS idx_captures_raining ON captures(is_raining);

-- Alert audit log
CREATE TABLE IF NOT EXISTS alert_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sent_at     TEXT NOT NULL,
    channel     TEXT NOT NULL DEFAULT 'telegram',
    rainfall_mm REAL DEFAULT 0,
    message     TEXT,
    success     INTEGER NOT NULL DEFAULT 1,
    error       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_sent ON alert_logs(sent_at);

-- Runtime settings (overrides env vars)
CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
