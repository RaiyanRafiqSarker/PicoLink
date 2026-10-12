-- URL Shortener Database Initialization Script
-- Starts sequence at 100,000,000 to guarantee consistent 5-6 character Base62 codes

CREATE TABLE IF NOT EXISTS urls (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(64) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Set sequence start offset to 100,000,000 if below
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE sequencename = 'urls_id_seq' AND last_value >= 100000000
    ) THEN
        PERFORM setval('urls_id_seq', 100000000, false);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_is_active ON urls(is_active);

CREATE TABLE IF NOT EXISTS link_clicks (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(64) NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referrer VARCHAR(512) NULL,
    user_agent TEXT NULL,
    country_code CHAR(2) NULL
);

CREATE INDEX IF NOT EXISTS idx_link_clicks_short_code ON link_clicks(short_code);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_code_time ON link_clicks(short_code, clicked_at DESC);
