# PowerShell script to add Windows Defender exclusions for faster Next.js development
# Run as Administrator: Right-click PowerShell and select "Run as Administrator"

$projectPath = Get-Location
$nodeModulesPath = Join-Path $projectPath "node_modules"
$nextPath = Join-Path $projectPath ".next"

Write-Host "Adding Windows Defender exclusions for faster development..." -ForegroundColor Green
Write-Host ""

try {
    # Add project root
    Add-MpPreference -ExclusionPath $projectPath
    Write-Host "[OK] Added exclusion: $projectPath" -ForegroundColor Green

    # Add node_modules
    if (Test-Path $nodeModulesPath) {
        Add-MpPreference -ExclusionPath $nodeModulesPath
        Write-Host "[OK] Added exclusion: $nodeModulesPath" -ForegroundColor Green
    }

    # Add .next
    if (Test-Path $nextPath) {
        Add-MpPreference -ExclusionPath $nextPath
        Write-Host "[OK] Added exclusion: $nextPath" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Windows Defender exclusions added successfully!" -ForegroundColor Green
    Write-Host "This should significantly improve Next.js dev server startup time." -ForegroundColor Yellow
}
catch {
    Write-Host "Error: Failed to add exclusions. Make sure you run this as Administrator." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
