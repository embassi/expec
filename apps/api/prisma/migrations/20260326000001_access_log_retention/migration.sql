-- Access Log Scaling: Retention + Archival Infrastructure
--
-- Strategy:
--   - Keep 90 days of logs in the hot `access_logs` table (indexed, fast)
--   - Archive older logs to `access_logs_archive` (cold storage, no FK constraints)
--   - A scheduled job (pg_cron or app-level cron) runs archival daily
--   - Partitioning by month is deferred until row count exceeds ~10M
--
-- Run: psql $DIRECT_URL < migration.sql

-- ─── 1. Archive table (cold storage, no FK constraints) ──────────────────────

CREATE TABLE IF NOT EXISTS "access_logs_archive" (
  LIKE "access_logs" INCLUDING DEFAULTS INCLUDING CONSTRAINTS
);

-- Indexes on archive — less aggressive than hot table (monthly range queries only)
CREATE INDEX IF NOT EXISTS "access_logs_archive_community_id_scanned_at_idx"
  ON "access_logs_archive" (community_id, scanned_at DESC);

-- ─── 2. Archival function — move logs older than 90 days ─────────────────────
--
-- Call this daily from a background job or pg_cron:
--   SELECT archive_old_access_logs();

CREATE OR REPLACE FUNCTION archive_old_access_logs()
RETURNS TABLE(archived_count bigint) AS $$
DECLARE
  cutoff TIMESTAMP := NOW() - INTERVAL '90 days';
  n BIGINT;
BEGIN
  -- Insert old records into archive
  WITH moved AS (
    DELETE FROM access_logs
    WHERE scanned_at < cutoff
    RETURNING *
  )
  INSERT INTO access_logs_archive SELECT * FROM moved;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN QUERY SELECT n;
END;
$$ LANGUAGE plpgsql;

-- ─── 3. Delete very old archive records (>1 year) ────────────────────────────
--
-- Keeps archive lean. Adjust retention to meet compliance requirements.

CREATE OR REPLACE FUNCTION purge_old_access_log_archive()
RETURNS TABLE(purged_count bigint) AS $$
DECLARE
  n BIGINT;
BEGIN
  DELETE FROM access_logs_archive
  WHERE scanned_at < NOW() - INTERVAL '365 days';

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN QUERY SELECT n;
END;
$$ LANGUAGE plpgsql;

-- ─── Notes ──────────────────────────────────────────────────────────────────
--
-- Partitioning strategy (when needed):
--   When access_logs reaches ~5–10M rows, migrate to monthly range partitions:
--   CREATE TABLE access_logs_2026_01 PARTITION OF access_logs
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
--   This defers complexity until traffic justifies it.
--
-- Monitoring query:
--   SELECT pg_size_pretty(pg_total_relation_size('access_logs')) AS hot_size,
--          pg_size_pretty(pg_total_relation_size('access_logs_archive')) AS archive_size,
--          (SELECT COUNT(*) FROM access_logs) AS hot_rows,
--          (SELECT COUNT(*) FROM access_logs_archive) AS archive_rows;
