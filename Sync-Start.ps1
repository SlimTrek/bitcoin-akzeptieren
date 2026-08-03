#Requires -Version 5.1
# Vor der Arbeit: neuesten Stand von GitHub holen (git pull).
# Pfad = Ordner dieser Datei (auch bei Leerzeichen / OneDrive / Notebook).
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
    param([Parameter(Mandatory = $true)][string]$StartDir)
    $dir = Get-Item -LiteralPath $StartDir
    while ($null -ne $dir) {
        if (Test-Path -LiteralPath (Join-Path $dir.FullName ".git")) {
            return $dir.FullName
        }
        $dir = $dir.Parent
    }
    throw "Kein Git-Repo (.git) gefunden ab: $StartDir"
}

function Ensure-GitInPath {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        return
    }
    $candidates = @(
        "${env:ProgramFiles}\Git\cmd",
        "${env:ProgramFiles(x86)}\Git\cmd"
    )
    foreach ($dir in $candidates) {
        if (Test-Path -LiteralPath (Join-Path $dir "git.exe")) {
            $env:Path = "$dir;$env:Path"
            break
        }
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "git nicht gefunden. Git for Windows installieren und PowerShell neu starten."
    }
}

$scriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDir)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$repoRoot = Get-RepoRoot -StartDir $scriptDir
Set-Location -LiteralPath $repoRoot
Ensure-GitInPath

Write-Host ""
Write-Host "=== bitcoin-akzeptieren.ch - START (git pull) ===" -ForegroundColor Cyan
Write-Host "Ordner: $repoRoot"
Write-Host "Geraet: $env:COMPUTERNAME"
Write-Host ""

$dirty = @(git status --porcelain)
if ($dirty.Count -gt 0) {
    Write-Host "Lokale Aenderungen blockieren den Pull:" -ForegroundColor Yellow
    git status -sb
    Write-Host ""
    Write-Host "Zuerst Sync-Ende (lokale Arbeit pushen), ODER versehentliche Aenderungen verwerfen." -ForegroundColor Yellow
    Write-Host "Verwerfen (Vorsicht):  git restore --staged --worktree ." -ForegroundColor DarkYellow
    exit 1
}

git pull --ff-only
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "FEHLER bei git pull. Netzwerk / GitHub-Login pruefen, oder zuerst Sync-Ende." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "OK - Stand aktuell. Lokal previewen: python -m http.server 8000" -ForegroundColor Green
Write-Host ""
