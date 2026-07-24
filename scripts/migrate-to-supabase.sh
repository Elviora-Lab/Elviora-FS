#!/usr/bin/env bash
#
# One-way data migration: local Postgres -> Supabase.
#
# The SCHEMA is created by `prisma migrate deploy`, not by pg_dump, because the
# local server (PG 18) is newer than Supabase (PG 15/17) and a newer schema dump
# will not restore into an older server. Only DATA moves here, and it moves as
# portable INSERT statements rather than version-specific COPY output.
#
# Usage:
#   1. Put the Supabase URLs in .env (see the doc / README section).
#   2. bash scripts/migrate-to-supabase.sh            # dry run: shows the plan
#   3. bash scripts/migrate-to-supabase.sh --apply    # actually writes
#
set -euo pipefail

APPLY=false
[[ "${1:-}" == "--apply" ]] && APPLY=true

cd "$(dirname "$0")/.."

# --- config -----------------------------------------------------------------

# Local source. Override with LOCAL_URL=... if your dev DB moved.
LOCAL_URL="${LOCAL_URL:-postgresql://$(whoami)@localhost:5432/kitchenly}"

# Target comes from .env — DIRECT_URL (port 5432), never the pooled 6543 URL.
# PgBouncer in transaction mode cannot hold the session-level settings this
# restore needs.
set -a
# shellcheck disable=SC1091
[[ -f .env ]] && . ./.env
set +a
TARGET_URL="${DIRECT_URL:-}"

# psql rejects Prisma's ?schema=/?pgbouncer= query params.
strip_params() { echo "${1%%\?*}"; }
LOCAL=$(strip_params "$LOCAL_URL")
TARGET=$(strip_params "$TARGET_URL")

# Session/transient tables. These are per-browser state, not catalog — carrying
# them over would import dead carts and refresh tokens pointing at nothing.
SKIP_TABLES=(
  _prisma_migrations        # migrate deploy writes its own history
  carts
  cart_items
  refresh_tokens
  product_view_logs
  recently_viewed_products
)

# Tables that the MIGRATIONS themselves seed (the Spend & Save ladder, its
# master switch, and the WELCOME10 coupon). `migrate deploy` has already written
# these rows on the target, so importing them collides on the primary key.
# They're cleared first rather than skipped, because local is authoritative —
# an admin may have edited the tiers or the coupon since the seed ran.
SEEDED_TABLES=(app_settings coupons spend_discount_tiers)

# --- preflight --------------------------------------------------------------

if [[ -z "$TARGET" ]]; then
  echo "ERROR: DIRECT_URL is not set in .env — cannot find the Supabase target." >&2
  echo "       Supabase -> Project Settings -> Database -> Connection string." >&2
  exit 1
fi
if [[ "$TARGET" == *":6543"* ]]; then
  echo "ERROR: DIRECT_URL points at the pooled port 6543. Use the direct 5432 URL." >&2
  exit 1
fi

echo "source : $(echo "$LOCAL"  | sed -E 's#://[^:]*:?[^@]*@#://USER:PASS@#')"
echo "target : $(echo "$TARGET" | sed -E 's#://[^:]*:?[^@]*@#://USER:PASS@#')"
echo

psql "$LOCAL"  -q -c 'SELECT 1' >/dev/null || { echo "cannot reach local DB" >&2; exit 1; }
psql "$TARGET" -q -c 'SELECT 1' >/dev/null || { echo "cannot reach Supabase" >&2; exit 1; }
echo "both databases reachable."

TARGET_TABLES=$(psql "$TARGET" -q -t -A -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
if [[ "$TARGET_TABLES" == "0" ]]; then
  echo "target has no tables yet — run 'npx prisma migrate deploy' first." >&2
  exit 1
fi
echo "target schema present ($TARGET_TABLES tables)."

# Refuse to run twice: a second pass would collide on every primary key.
EXISTING=$(psql "$TARGET" -q -t -A -c "SELECT count(*) FROM products;" 2>/dev/null || echo 0)
if [[ "$EXISTING" != "0" ]]; then
  echo
  echo "ERROR: target already holds $EXISTING products. Refusing to double-import." >&2
  echo "       Wipe it first if you meant to re-run this." >&2
  exit 1
fi

# --- dump -------------------------------------------------------------------

EXCLUDE_ARGS=()
for t in "${SKIP_TABLES[@]}"; do EXCLUDE_ARGS+=(--exclude-table-data="public.$t"); done

DUMP=$(mktemp -t supabase-data-XXXXXX.sql)
trap 'rm -f "$DUMP"' EXIT

echo
echo "dumping data (excluding: ${SKIP_TABLES[*]})..."
# COPY format (pg_dump's default), NOT --column-inserts. Inserts are one network
# round-trip per row; against a pooler in another region that's ~3.7k round-trips
# and the connection times out mid-load. COPY streams each table in one go.
#
# Version skew isn't a concern here: the PG18 -> PG17 hazard is in SCHEMA dumps,
# and this dump carries no DDL — `prisma migrate deploy` built the schema.
#
# --no-owner/--no-privileges: Supabase roles differ from local ones.
pg_dump "$LOCAL" \
  --data-only --no-owner --no-privileges \
  "${EXCLUDE_ARGS[@]}" \
  > "$DUMP"

TABLES=$(grep -c '^COPY ' "$DUMP" || true)
echo "dump ready: $TABLES table streams, $(du -h "$DUMP" | cut -f1)"

if [[ "$APPLY" != true ]]; then
  echo
  echo "DRY RUN — nothing was written. Re-run with --apply to load into Supabase."
  exit 0
fi

# --- restore ----------------------------------------------------------------

# session_replication_role=replica disables FK triggers for this session, so the
# insert order in the dump doesn't matter. pg_dump does NOT guarantee
# FK-safe ordering for data-only output, and product_images would otherwise land
# before products. Wrapped in a single transaction: any failure rolls back the
# whole import rather than leaving a half-populated catalog.
echo
echo "loading into Supabase..."
# TCP keepalives stop an idle-looking connection being reaped mid-COPY by the
# pooler or any NAT in between. They belong on the connection string, not on -c:
# psql ignores stdin entirely when -c is present, so every statement below has
# to travel in the piped stream.
KEEPALIVE="keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=6"
TARGET_KA="$TARGET?$KEEPALIVE"

{
  echo "SET statement_timeout = 0;"
  echo "SET idle_in_transaction_session_timeout = 0;"
  echo "BEGIN;"
  echo "SET session_replication_role = 'replica';"
  for t in "${SEEDED_TABLES[@]}"; do
    echo "DELETE FROM \"public\".\"$t\";"
  done
  cat "$DUMP"
  echo "SET session_replication_role = 'origin';"
  echo "COMMIT;"
} | psql "$TARGET_KA" -q -v ON_ERROR_STOP=1

# --- verify -----------------------------------------------------------------

echo
echo "row counts (local -> supabase):"
for t in products product_variants product_images product_categories categories \
         brands users coupons spend_discount_tiers app_settings \
         flash_sales flash_sale_items; do
  a=$(psql "$LOCAL"  -q -t -A -c "SELECT count(*) FROM $t;" 2>/dev/null || echo '-')
  b=$(psql "$TARGET" -q -t -A -c "SELECT count(*) FROM $t;" 2>/dev/null || echo '-')
  flag=""; [[ "$a" != "$b" ]] && flag="   <-- MISMATCH"
  printf '  %-22s %6s -> %-6s%s\n' "$t" "$a" "$b" "$flag"
done

echo
echo "done."
