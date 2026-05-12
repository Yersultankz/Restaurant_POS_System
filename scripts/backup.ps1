# PowerShell Backup script for SQLite database

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = ".\backups"
$DbFile = ".\server\prisma\dev.db"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir
}

Copy-Item -Path $DbFile -Destination "$BackupDir\backup_$Timestamp.db"

Write-Host "✅ Database backup created: $BackupDir\backup_$Timestamp.db" -ForegroundColor Green
