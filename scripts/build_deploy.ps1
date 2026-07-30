param(
  [string]$OutputPath = "deploy\NSGlamour"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$out = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $root $OutputPath }

if (-not (Test-Path -LiteralPath (Join-Path $root "scripts\app.py"))) {
  throw "Cannot find project root from script path: $PSScriptRoot"
}

$script:copiedFiles = 0

if (Test-Path -LiteralPath $out) {
  Remove-Item -LiteralPath $out -Recurse -Force
}

New-Item -ItemType Directory -Path $out | Out-Null

function Copy-Dir {
  param([string]$RelativePath)
  $src = Join-Path $root $RelativePath
  $dst = Join-Path $out $RelativePath
  if (Test-Path -LiteralPath $src) {
    Get-ChildItem -LiteralPath $src -Recurse -Force -File | ForEach-Object {
      $relativeFile = $_.FullName.Substring($src.Length).TrimStart("\", "/")
      $targetFile = Join-Path $dst $relativeFile
      New-Item -ItemType Directory -Path (Split-Path -Parent $targetFile) -Force | Out-Null
      Copy-Item -LiteralPath $_.FullName -Destination $targetFile -Force
      $script:copiedFiles += 1
    }
  }
}

function Copy-File {
  param([string]$RelativePath)
  $src = Join-Path $root $RelativePath
  $dst = Join-Path $out $RelativePath
  if (Test-Path -LiteralPath $src) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $dst) -Force | Out-Null
    Copy-Item -LiteralPath $src -Destination $dst -Force
    $script:copiedFiles += 1
  }
}

Copy-File "requirements.txt"
Copy-File "README.md"
Copy-File "AGENTS.md"
Copy-File "start_8765_background.bat"
Copy-File "start_gui.bat"
Copy-File "update_mapping.bat"

Copy-Dir "scripts"
Copy-Dir "static"

Copy-File "templates\template.html"
Copy-File "templates\equipinfo.html"
Copy-File "templates\equipinfo-snapshot.html"

Copy-File "data\item_model_mapping.json"
Copy-File "data\ui-localization.json"

$css = Get-Content -LiteralPath (Join-Path $root "static\app.css") -Raw -Encoding UTF8
$fontFiles = New-Object System.Collections.Generic.HashSet[string]
foreach ($match in [regex]::Matches($css, 'url\("?\.\./font/([^")]+)"?\)')) {
  $decoded = [System.Uri]::UnescapeDataString($match.Groups[1].Value).Replace("/", "\")
  [void]$fontFiles.Add((Join-Path "font" $decoded))
}
foreach ($fontFile in $fontFiles) {
  Copy-File $fontFile
}

Get-ChildItem -LiteralPath $out -Recurse -Force -Directory -Filter "__pycache__" |
  Remove-Item -Recurse -Force
Get-ChildItem -LiteralPath $out -Recurse -Force -File |
  Where-Object { $_.Extension -in @(".pyc", ".pyo") -or $_.Name -eq ".DS_Store" } |
  Remove-Item -Force

$bytes = (Get-ChildItem -LiteralPath $out -Recurse -File | Measure-Object Length -Sum).Sum
if ($script:copiedFiles -eq 0 -or -not $bytes) {
  throw "Deploy bundle copied no files. Output path: $out"
}
$mb = [math]::Round($bytes / 1MB, 2)
Write-Host "Deploy bundle ready: $out ($mb MB, $script:copiedFiles copied files)"
