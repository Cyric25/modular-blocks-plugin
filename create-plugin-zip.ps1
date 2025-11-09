# PowerShell script to create WordPress plugin ZIP file

# Plugin name and version
$PluginName = "modular-blocks-plugin"
$Version = "1.0.0"
$ZipName = "$PluginName-$Version.zip"

Write-Host "Creating WordPress Plugin ZIP: $ZipName" -ForegroundColor Green
Write-Host "============================================"

# Remove old ZIP if exists
if (Test-Path $ZipName) {
    Write-Host "Removing old ZIP file..." -ForegroundColor Yellow
    Remove-Item $ZipName -Force
}

# Create temporary directory
$TempDir = $PluginName
if (Test-Path $TempDir) {
    Write-Host "Removing old temp directory..." -ForegroundColor Yellow
    Remove-Item $TempDir -Recurse -Force
}

Write-Host "Creating temporary directory..."
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy necessary files
Write-Host "Copying plugin files..."

# Core PHP file
Copy-Item "modular-blocks-plugin.php" -Destination "$TempDir/"

# Directories
Copy-Item "includes" -Destination "$TempDir/" -Recurse
Copy-Item "admin" -Destination "$TempDir/" -Recurse
Copy-Item "assets" -Destination "$TempDir/" -Recurse
Copy-Item "build" -Destination "$TempDir/" -Recurse

# Blocks directory (selective copy)
Write-Host "Copying blocks directory..."
New-Item -ItemType Directory -Path "$TempDir/blocks" | Out-Null

Get-ChildItem "blocks" -Directory | ForEach-Object {
    $blockName = $_.Name
    $blockSource = $_.FullName
    $blockDest = "$TempDir/blocks/$blockName"

    New-Item -ItemType Directory -Path $blockDest | Out-Null

    # Copy block.json
    if (Test-Path "$blockSource/block.json") {
        Copy-Item "$blockSource/block.json" -Destination "$blockDest/"
    }

    # Copy render.php
    if (Test-Path "$blockSource/render.php") {
        Copy-Item "$blockSource/render.php" -Destination "$blockDest/"
    }

    # Copy view.js
    if (Test-Path "$blockSource/view.js") {
        Copy-Item "$blockSource/view.js" -Destination "$blockDest/"
    }

    Write-Host "  ✓ Copied $blockName" -ForegroundColor Gray
}

# Optional files
if (Test-Path "languages") {
    Copy-Item "languages" -Destination "$TempDir/" -Recurse
}

if (Test-Path "README.md") {
    Copy-Item "README.md" -Destination "$TempDir/"
}

if (Test-Path "LICENSE.txt") {
    Copy-Item "LICENSE.txt" -Destination "$TempDir/"
} elseif (Test-Path "LICENSE") {
    Copy-Item "LICENSE" -Destination "$TempDir/"
}

Write-Host ""
Write-Host "Files copied. Creating ZIP archive..." -ForegroundColor Cyan

# Create ZIP file using .NET
Add-Type -Assembly System.IO.Compression.FileSystem
$compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
[System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $ZipName, $compressionLevel, $false)

# Clean up temporary directory
Write-Host "Cleaning up..."
Remove-Item $TempDir -Recurse -Force

# Get ZIP size
$ZipSize = (Get-Item $ZipName).Length
$ZipSizeMB = [math]::Round($ZipSize / 1MB, 2)

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✓ Plugin ZIP created successfully!" -ForegroundColor Green
Write-Host "  File: $ZipName"
Write-Host "  Size: $ZipSizeMB MB"
Write-Host ""
Write-Host "You can now upload this ZIP file to WordPress:" -ForegroundColor Cyan
Write-Host "  Plugins → Add New → Upload Plugin" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
