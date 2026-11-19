#!/usr/bin/env bash
# Spins up a throwaway local Postgres INSIDE this project (.local-db/), applies the migrations
# on top of a minimal Supabase stub, and runs the SQL tests. Usage: bash supabase/tests/run-local.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="$ROOT/.local-db"
export LC_ALL=en_US.UTF-8 PGHOST=127.0.0.1 PGPORT=54329 PGUSER=postgres
mkdir -p "$DB"
if [ ! -d "$DB/data" ]; then initdb -D "$DB/data" -U postgres >/dev/null; fi
pg_ctl -D "$DB/data" status >/dev/null 2>&1 || pg_ctl -D "$DB/data" -o "-p $PGPORT -k $DB" -l "$DB/log" -w start >/dev/null
dropdb --if-exists ol; createdb ol
psql -q ol -f "$ROOT/supabase/tests/stub.sql" 2>/dev/null || true
for f in "$ROOT"/supabase/migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 ol -f "$f"; done
psql -q -v ROOT="$ROOT" ol -f "$ROOT/supabase/tests/rls_test.sql" 2>&1 | grep -E "ALL_SQL_TESTS_PASSED|ERROR" || { echo "SQL TESTS FAILED"; exit 1; }
