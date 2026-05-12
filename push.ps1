# 自动化上传脚本 (push.ps1)

# 1. 检查是否有未提交的更改
$status = git status --porcelain
if (-not $status) {
    Write-Host "没有任何更改需要上传。" -ForegroundColor Cyan
    exit
}

# 2. 自动添加所有更改
git add .

# 3. 获取提交消息（如果没有传参数，默认使用当前时间）
$commitMsg = $args[0]
if (-not $commitMsg) {
    $currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMsg = "Update: $currentTime"
}

# 4. 提交
git commit -m "$commitMsg"

# 5. 推送
Write-Host "正在上传到 GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "上传成功！" -ForegroundColor Green
} else {
    Write-Host "上传失败，请检查网络或冲突。" -ForegroundColor Red
}
