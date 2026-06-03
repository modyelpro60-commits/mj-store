# Extract central MJ logo mark from splash wallpaper into a transparent PNG.
# Output: mj-store/public/mj-logo-transparent.png
# Usage: powershell -File .\mj-store\tmp_extract_mj_logo_transparent.ps1

param(
  [string]$InputPath = "mj-store/public/mj-logo.png",
  [string]$OutputPath = "mj-store/public/mj-logo-transparent.png",
  [int]$DarkThreshold = 30,   # near-black => transparent
  [int]$Padding = 16           # crop padding around detected logo
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile($InputPath)

# Ensure we work in 32bppArgb for alpha edits
$bmp = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($src, 0, 0)
$g.Dispose()
$src.Dispose()

$rect = New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)

$bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $bmpData.Stride
$height = $bmp.Height
$width = $bmp.Width

$byteCount = $stride * $height
$bytes = New-Object byte[] $byteCount

[System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $bytes, 0, $byteCount)

# Remove near-black background (set alpha=0)
for ($y = 0; $y -lt $height; $y++) {
  $rowOff = $y * $stride
  for ($x = 0; $x -lt $width; $x++) {
    $i = $rowOff + ($x * 4)
    $b = $bytes[$i]
    $gch = $bytes[$i + 1]
    $r = $bytes[$i + 2]
    # alpha is $bytes[$i+3] currently; we'll overwrite

    if ($r -lt $DarkThreshold -and $gch -lt $DarkThreshold -and $b -lt $DarkThreshold) {
      $bytes[$i + 3] = 0
    } else {
      $bytes[$i + 3] = 255
    }
  }
}

# Copy modified bytes back
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $bmpData.Scan0, $byteCount)
$bmp.UnlockBits($bmpData)

# Find bounding box of non-transparent pixels
$minX = $width
$minY = $height
$maxX = -1
$maxY = -1

$scanBytes = $bytes # alpha edits already applied in $bytes

for ($y = 0; $y -lt $height; $y++) {
  $rowOff = $y * $stride
  for ($x = 0; $x -lt $width; $x++) {
    $i = $rowOff + ($x * 4)
    $a = $scanBytes[$i + 3]
    if ($a -gt 0) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}

if ($maxX -lt 0 -or $maxY -lt 0) {
  throw "Failed to detect any non-transparent pixels for logo extraction."
}

$minX = [Math]::Max(0, $minX - $Padding)
$minY = [Math]::Max(0, $minY - $Padding)
$maxX = [Math]::Min($width - 1, $maxX + $Padding)
$maxY = [Math]::Min($height - 1, $maxY + $Padding)

$cropW = ($maxX - $minX + 1)
$cropH = ($maxY - $minY + 1)

$cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)

$cropped = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [System.Drawing.Graphics]::FromImage($cropped)
$g2.Clear([System.Drawing.Color]::Transparent)
$g2.DrawImage($bmp, (New-Object System.Drawing.Rectangle(0,0,$cropW,$cropH)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$g2.Dispose()

$cropped.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$cropped.Dispose()
$bmp.Dispose()

Write-Output "OK: wrote $OutputPath ($cropW x $cropH)"
