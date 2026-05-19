-- Chinese full-text search (runs on first database init only)
CREATE EXTENSION IF NOT EXISTS zhparser;

CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = zhparser);

ALTER TEXT SEARCH CONFIGURATION chinese
  ADD MAPPING FOR n, v, a, i, e, l, j WITH simple;
