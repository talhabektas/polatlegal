# Basit favicon oluşturma scripti

Write-Host "Basit favicon oluşturuluyor..."

# SVG favicon oluştur (daha net görünür)
$svgContent = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="#1a365d" rx="4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">P</text>
</svg>
'@

# SVG dosyasını kaydet
$svgContent | Out-File -FilePath "frontend/assets/favicon.svg" -Encoding UTF8

# HTML için favicon tanımlarını güncelle
$faviconLines = @'
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
    <link rel="icon" type="image/png" href="assets/favicon.png">
    <link rel="shortcut icon" type="image/svg+xml" href="assets/favicon.svg">
'@

Write-Host "SVG favicon oluşturuldu: frontend/assets/favicon.svg"
Write-Host ""
Write-Host "Şimdi HTML dosyalarını güncelleyin:"
Write-Host "1. frontend/index.html"
Write-Host "2. admin/index.html"
Write-Host "3. Diğer tüm HTML dosyaları"
Write-Host ""
Write-Host "Favicon tanımları:"
Write-Host $faviconLines
