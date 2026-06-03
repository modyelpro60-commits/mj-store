# Extract a clean, logo-only MJ Store mark (transparent background, no rectangle/effects)
# Creates: mj-store/public/logo/mj-logo-clean.png
#
# Pipeline:
# 1) Load mj-logo.png (wallpaper)
# 2) Set near-black pixels alpha=0
# 3) Crop to bbox of remaining opaque pixels
# 4) Estimate "background/rectangle" color from border pixels (mean RGB)
# 5) Set pixels close to that color alpha=0 (removes purple rectangle)
# 6) Crop again to final opaque bbox
# 7) Save as transparent PNG

param(
  [string]$InputPath = "mj-store\\public\\mj-logo.png",
  [string]$OutputPath = "mj-store\\public\\logo\\mj-logo-clean.png",
  [int]$DarkThreshold = 28,        # near-black => transparent
  [int]$BgColorTolerance = 65,    # distance threshold for rectangle background removal
  [int]$Padding = 10               # padding around detected bbox
)

Add-Type -AssemblyName System.Drawing

# Ensure output directory exists
$outDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function To32bppArgb([System.Drawing.Bitmap]$bmp) {
  if ($bmp.PixelFormat -eq [System.Drawing.Imaging.PixelFormat]::Format32bppArgb) { return $bmp }
  $tmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($tmp)
  $g.DrawImage($bmp, 0, 0)
  $g.Dispose()
  $bmp.Dispose()
  return $tmp
}

$src = [System.Drawing.Bitmap]::FromFile($InputPath)
$bmp = To32bppArgb $src

$width = $bmp.Width
$height = $bmp.Height

# Lock and zero near-black background
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $bmpData.Stride
$byteCount = $stride * $height
$bytes = New-Object byte[] $byteCount
[System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $bytes, 0, $byteCount)

for ($y = 0; $y -lt $height; $y++) {
  $rowOff = $y * $stride
  for ($x = 0; $x -lt $width; $x++) {
    $i = $rowOff + ($x * 4)
    $b = $bytes[$i]
    $g = $bytes[$i + 1]
    $r = $bytes[$i + 2]

    if ($r -lt $DarkThreshold -and $g -lt $DarkThreshold -and $b -lt $DarkThreshold) {
      $bytes[$i + 3] = 0
    } else {
      # keep opaque (we'll refine later)
      $bytes[$i + 3] = 255
    }
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $bmpData.Scan0, $byteCount)
$bmp.UnlockBits($bmpData)

# Find bbox of opaque pixels
$minX = $width; $minY = $height; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $height; $y++) {
  $rowOff = $y * $stride
  for ($x = 0; $x -lt $width; $x++) {
    $i = $rowOff + ($x * 4)
    $a = $bytes[$i + 3]
    if ($a -gt 0) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}

if ($maxX -lt 0 -or $maxY -lt 0) {
  throw "Failed to detect any opaque pixels after background removal."
}

$minX = [Math]::Max(0, $minX - $Padding)
$minY = [Math]::Max(0, $minY - $Padding)
$maxX = [Math]::Min($width - 1, $maxX + $Padding)
$maxY = [Math]::Min($height - 1, $maxY + $Padding)

$cropW = ($maxX - $minX + 1)
$cropH = ($maxY - $minY + 1)

$c1 = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
$cropped1 = $bmp.Clone($c1, $bmp.PixelFormat)
$bmp.Dispose()

# Now remove rectangle background by comparing to estimated border mean color.
$cw = $cropped1.Width
$ch = $cropped1.Height
$rect2 = New-Object System.Drawing.Rectangle(0, 0, $cw, $ch)
$data2 = $cropped1.LockBits($rect2, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride2 = $data2.Stride
$byteCount2 = $stride2 * $ch
$bytes2 = New-Object byte[] $byteCount2
[System.Runtime.InteropServices.Marshal]::Copy($data2.Scan0, $bytes2, 0, $byteCount2)

# Mean RGB from border pixels with alpha>0
$border = 6
$sumR = 0; $sumG = 0; $sumB = 0; $count = 0

for ($y = 0; $y -lt $ch; $y++) {
  for ($x = 0; $x -lt $cw; $x++) {
    $isBorder = ($x -lt $border -or $x -ge ($cw - $border) -or $y -lt $border -or $y -ge ($ch - $border))
    if (-not $isBorder) { continue }

    $i = ($y * $stride2) + ($x * 4)
    $a = $bytes2[$i + 3]
    if ($a -gt 0) {
      $sumB += $bytes2[$i]
      $sumG += $bytes2[$i + 1]
      $sumR += $bytes2[$i + 2]
      $count++
    }
  }
}

if ($count -lt 50) {
  # fallback: mean of all opaque pixels
  $sumR = 0; $sumG = 0; $sumB = 0; $count = 0
  for ($y = 0; $y -lt $ch; $y++) {
    for ($x = 0; $x -lt $cw; $x++) {
      $i = ($y * $stride2) + ($x * 4)
      $a = $bytes2[$i + 3]
      if ($a -gt 0) {
        $sumB += $bytes2[$i]
        $sumG += $bytes2[$i + 1]
        $sumR += $bytes2[$i + 2]
        $count++
      }
    }
  }
}

if ($count -lt 50) {
  $cropped1.Dispose()
  throw "Could not estimate rectangle background color (insufficient opaque pixels)."
}

$bgR = [int]([Math]::Round($sumR / $count))
$bgG = [int]([Math]::Round($sumG / $count))
$bgB = [int]([Math]::Round($sumB / $count))

# Remove pixels close to background color
for ($y = 0; $y -lt $ch; $y++) {
  $rowOff = $y * $stride2
  for ($x = 0; $x -lt $cw; $x++) {
    $i = $rowOff + ($x * 4)
    $a = $bytes2[$i + 3]
    if ($a -le 0) { continue }

    $r = [int]$bytes2[$i + 2]
    $g = [int]$bytes2[$i + 1]
    $b = [int]$bytes2[$i]

    $dr = $r - $bgR
    $dg = $g - $bgG
    $db = $b - $bgB
    $dist = [Math]::Sqrt(($dr * $dr) + ($dg * $dg) + ($db * $db))

    if ($dist -lt $BgColorTolerance) {
      $bytes2[$i + 3] = 0
    }
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes2, 0, $data2.Scan0, $byteCount2)
$cropped1.UnlockBits($data2)

# Find bbox of remaining opaque pixels
$minX2 = $cw; $minY2 = $ch; $maxX2 = -1; $maxY2 = -1
for ($y = 0; $y -lt $ch; $y++) {
  $rowOff = $y * $stride2
  for ($x = 0; $x -lt $cw; $x++) {
    $i = $rowOff + ($x * 4)
    $a = $bytes2[$i + 3]
    if ($a -gt 0) {
      if ($x -lt $minX2) { $minX2 = $x }
      if ($y -lt $minY2) { $minY2 = $y }
      if ($x -gt $maxX2) { $maxX2 = $x }
      if ($y -gt $maxY2) { $maxY2 = $y }
    }
  }
}

if ($maxX2 -lt 0 -or $maxY2 -lt 0) {
  $cropped1.Dispose()
  throw "All pixels removed during background removal; try increasing BgColorTolerance."
}

$minX2 = [Math]::Max(0, $minX2 - $Padding)
$minY2 = [Math]::Max(0, $minY2 - $Padding)
$maxX2 = [Math]::Min($cw - 1, $maxX2 + $Padding)
$maxY2 = [Math]::Min($ch - 1, $maxY2 + $Padding)

$finalW = ($maxX2 - $minX2 + 1)
$finalH = ($maxY2 - $minY2 + 1)

$c2 = New-Object System.Drawing.Rectangle($minX2, $minY2, $finalW, $finalH)
$finalBmp = $cropped1.Clone($c2, $cropped1.PixelFormat)
$cropped1.Dispose()

$finalBmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Dispose()

Write-Output ("OK: wrote {0} ({1}x{2}); bgRGB={3},{4},{5}" -f $OutputPath, $finalW, $finalH, $bgR, $bgG, $bgB)
