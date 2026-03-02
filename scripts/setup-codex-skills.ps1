param(
  [string]$SourcePath = "",
  [string]$CodexHome = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")

if ([string]::IsNullOrWhiteSpace($SourcePath)) {
  $SourcePath = Join-Path $RepoRoot ".claude/skills"
}

if (-not (Test-Path $SourcePath)) {
  throw "Source skills directory not found: $SourcePath"
}

if ([string]::IsNullOrWhiteSpace($CodexHome)) {
  if (-not [string]::IsNullOrWhiteSpace($env:CODEX_HOME)) {
    $CodexHome = $env:CODEX_HOME
  } else {
    $CodexHome = Join-Path $HOME ".codex"
  }
}

$TargetPath = Join-Path $CodexHome "skills"
New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$linkedCount = 0

$skillDirs = Get-ChildItem -Path $SourcePath -Directory
foreach ($skillDir in $skillDirs) {
  $skillFile = Join-Path $skillDir.FullName "SKILL.md"
  if (-not (Test-Path $skillFile)) {
    continue
  }

  $linkPath = Join-Path $TargetPath $skillDir.Name

  if (Test-Path $linkPath) {
    $existing = Get-Item $linkPath -Force
    if ($existing.Attributes -band [IO.FileAttributes]::ReparsePoint) {
      Remove-Item $linkPath -Force
    } else {
      $backupPath = "$linkPath.backup.$timestamp"
      Move-Item -Path $linkPath -Destination $backupPath -Force
      Write-Host "Backed up existing $($skillDir.Name) to $backupPath"
    }
  }

  New-Item -ItemType Junction -Path $linkPath -Target $skillDir.FullName | Out-Null
  Write-Host "Linked $($skillDir.Name) -> $linkPath"
  $linkedCount++
}

if ($linkedCount -eq 0) {
  throw "No skills found in $SourcePath."
}

Write-Host "Codex skill activation complete. Linked $linkedCount skill(s) into $TargetPath."

