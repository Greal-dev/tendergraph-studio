#!/usr/bin/env pwsh
# Titan installer (Windows)
# Usage:
#   iwr -useb https://titan.tendergraph.app/install.ps1 | iex
#   iwr -useb https://titan.tendergraph.app/install.ps1 | iex -ArgumentList "-Version","1.14.22"
#
# Telecharge le binaire Windows publie sur GitHub Releases, l'installe sous
# %LOCALAPPDATA%\Titan\bin\titan.exe et ajoute le chemin au PATH utilisateur.

[CmdletBinding()]
param(
  [string]$Version = "",
  [string]$Repo = "Greal-dev/tendergraph-studio",
  [switch]$NoModifyPath,
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-Step($msg) { if (-not $Quiet) { Write-Host "==> $msg" -ForegroundColor Cyan } }
function Write-Info($msg) { if (-not $Quiet) { Write-Host "    $msg" -ForegroundColor Gray } }
function Write-Done($msg) { if (-not $Quiet) { Write-Host "[OK] $msg" -ForegroundColor Green } }

# 1. Detection architecture
$Arch = if ([Environment]::Is64BitOperatingSystem) {
  if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") { "arm64" } else { "x64" }
} else {
  throw "Titan ne supporte pas Windows 32-bit."
}
Write-Step "Architecture detectee : windows-$Arch"

# 2. Resolution version (latest si non fournie)
if ([string]::IsNullOrEmpty($Version)) {
  Write-Step "Recherche de la derniere release..."
  try {
    $release = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest" -UseBasicParsing
    $Version = $release.tag_name -replace "^v", ""
  } catch {
    throw "Impossible de joindre GitHub Releases pour $Repo : $_"
  }
} else {
  Write-Step "Version demandee : $Version"
}
Write-Info "Version cible : v$Version"

# 3. Telechargement de l'asset
$AssetName = "opencode-windows-$Arch.zip"
$DownloadUrl = "https://github.com/$Repo/releases/download/v$Version/$AssetName"
$TempZip = Join-Path $env:TEMP "titan-$Version-$Arch.zip"

Write-Step "Telechargement depuis $DownloadUrl"
try {
  Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempZip -UseBasicParsing
} catch {
  throw "Telechargement echoue : $_"
}

# 4. Extraction dans %LOCALAPPDATA%\Titan
$InstallDir = Join-Path $env:LOCALAPPDATA "Titan"
$BinDir = Join-Path $InstallDir "bin"
$ExtractDir = Join-Path $env:TEMP "titan-extract-$([guid]::NewGuid().Guid.Substring(0,8))"

Write-Step "Extraction dans $InstallDir"
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
New-Item -ItemType Directory -Force -Path $ExtractDir | Out-Null
Expand-Archive -Path $TempZip -DestinationPath $ExtractDir -Force

# 5. Localisation et copie du binaire (le build OpenCode produit dist/opencode-windows-x64/bin/opencode.exe)
$Source = Get-ChildItem -Path $ExtractDir -Filter "opencode.exe" -Recurse | Select-Object -First 1
if (-not $Source) {
  $Source = Get-ChildItem -Path $ExtractDir -Filter "titan.exe" -Recurse | Select-Object -First 1
}
if (-not $Source) {
  throw "Aucun binaire opencode.exe ou titan.exe trouve dans l'archive."
}
$Target = Join-Path $BinDir "titan.exe"
Copy-Item -Path $Source.FullName -Destination $Target -Force

# Copie aussi les fichiers auxiliaires eventuels (bunfs, dll, etc.) qui sont au meme niveau
$AuxFiles = Get-ChildItem -Path $Source.Directory.FullName -File | Where-Object { $_.Name -ne "opencode.exe" -and $_.Name -ne "titan.exe" }
foreach ($f in $AuxFiles) {
  Copy-Item -Path $f.FullName -Destination (Join-Path $BinDir $f.Name) -Force
}

Remove-Item -Recurse -Force $ExtractDir, $TempZip -ErrorAction SilentlyContinue

# 6. Ajout au PATH utilisateur
if (-not $NoModifyPath) {
  $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $entries = ($UserPath ?? "") -split ";" | Where-Object { $_ -ne "" }
  if ($entries -notcontains $BinDir) {
    Write-Step "Ajout de $BinDir au PATH utilisateur"
    $newPath = ((@($entries) + @($BinDir)) -join ";")
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    $env:Path += ";$BinDir"
  } else {
    Write-Info "$BinDir deja dans le PATH"
  }
}

# 7. Smoke test
Write-Step "Verification de l'installation"
try {
  $output = & $Target --version 2>&1
  Write-Info "titan --version : $output"
} catch {
  Write-Info "Le binaire est en place mais --version a echoue (peut etre normal selon la version)."
}

Write-Done "Titan v$Version installe dans $BinDir"
if (-not $Quiet) {
  Write-Host ""
  Write-Host "Lance " -NoNewline
  Write-Host "titan" -ForegroundColor Yellow -NoNewline
  Write-Host " dans une nouvelle fenetre PowerShell pour demarrer."
  Write-Host "Pour mettre a jour : " -NoNewline
  Write-Host "iwr -useb https://titan.tendergraph.app/install.ps1 | iex" -ForegroundColor Yellow
}
