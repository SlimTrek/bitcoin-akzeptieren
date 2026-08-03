#Requires -Version 5.1
# Nach der Arbeit: Aenderungen committen und nach GitHub pushen (GitHub Pages).
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

function Get-GitIdentityArgs {
    $name = (git config user.name 2>$null)
    $email = (git config user.email 2>$null)
    if (-not [string]::IsNullOrWhiteSpace($name) -and -not [string]::IsNullOrWhiteSpace($email)) {
        return @()
    }
    # Notebook oft ohne globale Git-Identitaet — Fallback wie Home-PC-Commits
    Write-Host "Hinweis: Git user.name/email fehlt auf diesem PC." -ForegroundColor Yellow
    Write-Host "Einmalig empfohlen:" -ForegroundColor Yellow
    Write-Host '  git config --global user.name "SlimTrek"' -ForegroundColor DarkYellow
    Write-Host '  git config --global user.email "patrik.bal.work@gmail.com"' -ForegroundColor DarkYellow
    Write-Host "Dieser Commit nutzt den Projekt-Fallback." -ForegroundColor Yellow
    Write-Host ""
    return @(
        "-c", "user.name=SlimTrek",
        "-c", "user.email=patrik.bal.work@gmail.com"
    )
}

$scriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDir)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$repoRoot = Get-RepoRoot -StartDir $scriptDir
Set-Location -LiteralPath $repoRoot
Ensure-GitInPath

Write-Host ""
Write-Host "=== bitcoin-akzeptieren.ch - ENDE (commit und push) ===" -ForegroundColor Cyan
Write-Host "Ordner: $repoRoot"
Write-Host "Geraet: $env:COMPUTERNAME"
Write-Host ""

git add -A
$pending = @(git status --porcelain)
if ($pending.Count -eq 0) {
    Write-Host "Keine lokalen Aenderungen zum Commit." -ForegroundColor Yellow
} else {
    Write-Host "Geaenderte Dateien:" -ForegroundColor Yellow
    git status -sb
    Write-Host ""
    $msg = Read-Host "Kurze Beschreibung (Enter = automatischer Zeitstempel)"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = "Sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    $identityArgs = Get-GitIdentityArgs
    & git @identityArgs commit -m "$msg"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FEHLER bei git commit." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

git push
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "FEHLER bei git push. Zuerst Sync-Start (pull), dann erneut Sync-Ende." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "OK - Stand auf GitHub. GitHub Pages aktualisiert die Live-Site." -ForegroundColor Green
Write-Host "Anderes Geraet: dort Sync-Start ausfuehren." -ForegroundColor Green
Write-Host ""
