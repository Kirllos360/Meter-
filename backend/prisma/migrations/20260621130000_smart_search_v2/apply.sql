CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE OR REPLACE FUNCTION sim_system.normalize_arabic(text) RETURNS text AS ' SELECT lower(regexp_replace(regexp_replace('''', ''[\u0650-\u065F\u064B-\u0652]'', '''', ''g''), ''[\u0625\u0623\u0622]'', ''\u0627'', ''g'')); ' LANGUAGE SQL IMMUTABLE STRICT;
