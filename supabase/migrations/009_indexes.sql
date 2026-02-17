-- Performance indexes
CREATE INDEX idx_events_date             ON events (event_date);
CREATE INDEX idx_events_owner            ON events (owner, event_date);
CREATE INDEX idx_events_category         ON events (category_id);
CREATE INDEX idx_availability_date       ON availability (free_date);
CREATE INDEX idx_availability_person     ON availability (person, free_date);
CREATE INDEX idx_nudges_to              ON nudges (to_person, read_at);
CREATE INDEX idx_bucket_done            ON bucket_items (is_done, sort_order);
CREATE INDEX idx_date_log_date          ON date_log (date_date DESC);
