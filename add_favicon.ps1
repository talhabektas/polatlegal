# Tüm HTML dosyalarına favicon ekleme scripti

$faviconLine = '    <!-- Favicon -->' + "`n" + '    <link rel="icon" type="image/png" href="assets/BU_LOGO-removebg-preview.png">' + "`n" + '    <link rel="shortcut icon" type="image/png" href="assets/BU_LOGO-removebg-preview.png">' + "`n"

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
        Write-Host "İşleniyor: $file"
        
        # Dosyayı oku
        $content = Get-Content $file -Raw
        
        # Eğer favicon zaten varsa atla
        if ($content -match "favicon") {
            Write-Host "  Favicon zaten mevcut, atlanıyor..."
            continue
        }
        
        # keywords satırından sonra favicon ekle
        $content = $content -replace '(<meta name="keywords"[^>]*>)', "`$1`n`n$faviconLine"
        
        # Dosyayı kaydet
        Set-Content $file $content -Encoding UTF8
        Write-Host "  Favicon eklendi!"
    }
    else {
        Write-Host "Dosya bulunamadı: $file"
    }
}

Write-Host "`nFavicon ekleme işlemi tamamlandı!"
Write-Host "Şimdi sunucuda dosyaları güncelleyin:"
Write-Host "docker cp frontend/ polatlegal-nginx:/var/www/html/"
Write-Host "docker cp admin/ polatlegal-nginx:/var/www/admin/"
