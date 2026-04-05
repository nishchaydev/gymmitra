#!/bin/bash
# automated database backup script for GymMitra ERP

# Ensure the script stops if any command fails
set -e

BACKUP_DIR="database_backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/gymmitra_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup to $BACKUP_FILE..."

# Default to warning if DIRECT_URL is not set as we need raw Postgres connection
if [ -z "$DIRECT_URL" ]; then
    echo "Warning: No DIRECT_URL environment variable found. Please ensure it is set or provide it."
    echo "Example: DIRECT_URL=\"postgresql://user:pass@host:5432/db\" ./scripts/backup.sh"
    exit 1
fi

# Run pg_dump (requires PostgreSQL client tools installed locally)
if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$DIRECT_URL" > "$BACKUP_FILE"
    echo "✅ Backup completed successfully: $BACKUP_FILE"
    
    # Optional: Keep only the last 7 backups to save space
    echo "Cleaning up old backups (keeping last 7)..."
    ls -t "$BACKUP_DIR"/gymmitra_backup_*.sql | tail -n +8 | xargs -I {} rm -- {} 2>/dev/null || true
    echo "Cleanup complete."
else
    echo "❌ Error: pg_dump is not installed or not in PATH."
    echo "Please install PostgreSQL client tools (e.g., 'sudo apt install postgresql-client' or via Homebrew on Mac)."
    exit 1
fi
