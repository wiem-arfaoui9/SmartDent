<#
.SYNOPSIS
  Crée le fichier .env de Docker Compose avec APP_KEY et mots de passe aléatoires.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\init-env.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\init-env.ps1 -Force   # régénère (efface les anciennes valeurs)
#>
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$root    = Split-Path -Parent $PSScriptRoot
$example = Join-Path $root '.env.example'
$target  = Join-Path $root '.env'

if ((Test-Path $target) -and -not $Force) {
    Write-Host ".env existe déjà : rien à faire (utilisez -Force pour le régénérer)." -ForegroundColor Yellow
    exit 0
}

function New-RandomBytes([int]$count) {
    $bytes = New-Object byte[] $count
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return ,$bytes
}

# Mot de passe alphanumérique (évite les caractères spéciaux problématiques dans .env / Compose)
function New-Secret([int]$length = 28) {
    $chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    $bytes = New-RandomBytes $length
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

$appKey = 'base64:' + [Convert]::ToBase64String((New-RandomBytes 32))

$content = (Get-Content -Raw -Path $example) -replace "`r`n", "`n"
$content = $content -replace '(?m)^APP_KEY=.*$',         "APP_KEY=$appKey"
$content = $content -replace '(?m)^DB_PASSWORD=.*$',      "DB_PASSWORD=$(New-Secret)"
$content = $content -replace '(?m)^DB_ROOT_PASSWORD=.*$', "DB_ROOT_PASSWORD=$(New-Secret)"

# UTF-8 sans BOM, fins de ligne LF
[System.IO.File]::WriteAllText($target, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ".env créé : $target" -ForegroundColor Green
Write-Host "Ne le commitez jamais (il est dans .gitignore)."
