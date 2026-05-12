# Backup script for SQLite database

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
DB_FILE="./server/prisma/dev.db"

mkdir -p $BACKUP_DIR

cp $DB_FILE "$BACKUP_DIR/backup_$TIMESTAMP.db"

echo "✅ Database backup created: $BACKUP_DIR/backup_$TIMESTAMP.db"
