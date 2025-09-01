# Tüm HTML dosyalarını JPG favicon kullanacak şekilde güncelle

$newFaviconLines = @'
    <!-- Favicon -->
    <link rel="icon" type="image/jpeg" href="assets/favicon.jpg">
    <link rel="shortcut icon" type="image/jpeg" href="assets/favicon.jpg">
'@

$newFaviconLinesAdmin = @'
    <!-- Favicon -->
    <link rel="icon" type="image/jpeg" href="../frontend/assets/favicon.jpg">
    <link rel="shortcut icon" type="image/jpeg" href="../frontend/assets/favicon.jpg">
'@

# Frontend HTML dosyaları
$frontendFiles = @(
    "frontend/hakkimizda.html",
    "frontend/calisma-alanlarimiz.html",
    "frontend/ekibimiz.html",
    "frontend/blog.html",
    "frontend/iletisim.html",
    "frontend/index-en.html",
    "frontend/about-en.html",
    "frontend/practice-areas-en.html",
    "frontend/team-en.html",
    "frontend/blog-en.html",
    "frontend/contact-en.html"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "Güncelleniyor: $file"
        
        # Dosyayı oku
        $content = Get-Content $file -Raw
        
        # Eski favicon tanımlarını kaldır (SVG ve PNG)
        $content = $content -replace '<!-- Favicon -->\s*<link[^>]*favicon[^>]*>\s*<link[^>]*favicon[^>]*>\s*<link[^>]*favicon[^>]*>', ''
        $content = $content -replace '<!-- Favicon -->\s*<link[^>]*favicon[^>]*>\s*<link[^>]*favicon[^>]*>', ''
        
        # Yeni favicon ekle (keywords satırından sonra)
        $content = $content -replace '(<meta name="keywords"[^>]*>)', "`$1`n`n$newFaviconLines"
        
        # Dosyayı kaydet
        Set-Content $file $content -Encoding UTF8
        Write-Host "  JPG favicon güncellendi!"
    }
    else {
        Write-Host "Dosya bulunamadı: $file"
    }
}

# Admin dosyasını güncelle
if (Test-Path "admin/index.html") {
    Write-Host "Güncelleniyor: admin/index.html"
    $content = Get-Content "admin/index.html" -Raw
    
    # Eski favicon tanımlarını kaldır
    $content = $content -replace '<!-- Favicon -->\s*<link[^>]*favicon[^>]*>\s*<link[^>]*favicon[^>]*>\s*<link[^>]*favicon[^>]*>', ''
    $content = $content -replace '<!-- Favicon -->\s*<link[^>]*favicon[^>]*>\s*<link[^>]*favicon[^>]*>', ''
    
    # Yeni favicon ekle (title satırından sonra)
    $content = $content -replace '(<title>[^<]*</title>)', "`$1`n`n$newFaviconLinesAdmin"
    
    Set-Content "admin/index.html" $content -Encoding UTF8
    Write-Host "  Admin JPG favicon güncellendi!"
}

Write-Host "`nTüm favicon güncellemeleri tamamlandı!"
Write-Host "Artık favicon.jpg kullanılıyor!"
Write-Host "Şimdi sunucuda dosyaları güncelleyin:"
Write-Host "docker cp frontend/ polatlegal-nginx:/var/www/html/"
Write-Host "docker cp admin/ polatlegal-nginx:/var/www/admin/"
