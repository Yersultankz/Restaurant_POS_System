# Git Sync Script (push.ps1)
$ErrorActionPreference = "Continue"

Write-Host "--- Git Auto Sync Starting ---" -ForegroundColor Cyan

# 1. Add changes
git add .

# 2. Check for changes
$status = git status --porcelain
if ($status) {
    Write-Host "Changes detected, committing..." -ForegroundColor Yellow
    
    $commitMsg = $args[0]
    if (-not $commitMsg) {
        $currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMsg = "Update: $currentTime"
    }

    git commit -m "$commitMsg"
} else {
    Write-Host "No local changes to commit." -ForegroundColor Cyan
}

# 3. Push to remote
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success!" -ForegroundColor Green
} else {
    Write-Host "Failed. Check your network or conflicts." -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = [System.Console]::ReadKey()
