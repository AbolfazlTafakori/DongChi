#!/usr/bin/env bash
# =============================================================================
# DONGCHI (دنگ‌چی) AUTOMATED NIGHTLY BACKUP SCRIPT
# Backs up PostgreSQL DB and /data volume with 14-day rolling retention
# =============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/dongchi"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting DongChi automated backup..."

# 1. Backup PostgreSQL database inside container
DB_CONTAINER="dongchi-postgres"
DB_BACKUP_FILE="$BACKUP_DIR/dongchi_db_$TIMESTAMP.sql.gz"

if docker ps --format '{{.Names}}' | grep -q "^$DB_CONTAINER$"; then
    echo "Dumping PostgreSQL database from container: $DB_CONTAINER..."
    docker exec -t "$DB_CONTAINER" pg_dump -U "${POSTGRES_USER:-dongchi_app}" "${POSTGRES_DB:-dongchi}" | gzip > "$DB_BACKUP_FILE"
    echo "Database backup created: $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
else
    echo "WARNING: $DB_CONTAINER is not running. Skipping DB dump."
fi

# 2. Backup Application /data directory (system-config.json, JSON stores)
DATA_SOURCE="/var/www/dongchi/data"
DATA_BACKUP_FILE="$BACKUP_DIR/dongchi_data_$TIMESTAMP.tar.gz"

if [ -d "$DATA_SOURCE" ]; then
    echo "Archiving application data directory..."
    tar -czf "$DATA_BACKUP_FILE" -C "/var/www/dongchi" "data"
    echo "Data backup created: $DATA_BACKUP_FILE ($(du -h "$DATA_BACKUP_FILE" | cut -f1))"
fi

# 3. Prune backups older than 14 days
echo "Pruning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "dongchi_*" -mtime +"$RETENTION_DAYS" -exec rm -f {} \;

echo "[$TIMESTAMP] Backup process finished successfully."
