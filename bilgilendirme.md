# 📋 Canlıya Alma Süreci - Detaylı Bilgilendirme


## 🚀 1. CANLIYA ALMA NEDİR?

**Şu anki durum:** 
- Proje sadece senin bilgisayarında çalışıyor (localhost:8061)
- İnternet üzerinden kimse erişemiyor

**Canlıya alınca:**
- İnternet üzerinden herkes erişebilecek
- Gerçek bir domain (örn: polatlarhukuk.com) 
- SSL sertifikası (https://)
- 7/24 açık kalacak

---

## 🏗️ 2. HOSTING SEÇENEKLERİ

### A) VPS (Virtual Private Server) - ÖNERİLEN
**Nedir:** Sana ait sanal sunucu
**Artıları:**
- Tam kontrol
- Go backend çalıştırabilir
- MySQL kurabilir
- Admin paneli kurabilir

**Önerilen Firmalar:**
- **DigitalOcean:** $5-10/ay, kolay kurulum
- **Vultr:** $5-10/ay, hızlı
- **Linode:** $5-10/ay, güvenilir
- **AWS Lightsail:** $5-15/ay, Amazon güvencesi

**Gereksinimler:**
- 1-2 CPU
- 2-4 GB RAM
- 20-50 GB SSD
- Ubuntu 20.04 LTS

### B) Shared Hosting - SINIRLARI VAR
**Nedir:** Başkalarıyla paylaşımlı sunucu
**Problemi:** Go backend çalıştıramaz
**Çözümü:** Frontend'i shared hosting'de, backend'i başka yerde

### C) Cloud Services - İLERİ SEVİYE
- **Frontend:** Netlify, Vercel (ücretsiz)
- **Backend:** Railway, Heroku ($5-15/ay)
- **Database:** PlanetScale, Supabase

---

## 🌐 3. DOMAIN ALMA SÜRECİ

### Domain Satın Alma
**Firmalar:**
- GoDaddy
- Namecheap 
- Turhost (Türkiye)

**Fiyatlar:**
- .com: $10-15/yıl
- .com.tr: ₺50-100/yıl

**Öneriler:**
- polatlarhukuk.com
- polatlar.com.tr
- polatlarhukukburosu.com

### DNS Ayarları
Domain'i sunucuna yönlendirmen gerekir:
```
A Record: @ → Sunucu IP'si
A Record: www → Sunucu IP'si
```

---

## 🔐 4. ADMİN PANELİ GÜVENLİĞİ

### Şu Anki Durum (Test)
- Username: `admin`
- Password: Veritabanındaki değer (basit)
- Hiçbir güvenlik yok
- Herkes deneyebilir

### Production İçin Güvenlik Seviyeleri

#### TEMEL GÜVENLİK (Minimum)
1. **Güçlü şifre**
   ```
   Şu anki: admin123 (örnek)
   Olmalı: Tr$%23KqL9#mP@2024
   ```

2. **HTTPS zorunlu**
   - HTTP'den admin paneline erişim engellenmeli
   - SSL sertifikası (Let's Encrypt ücretsiz)

#### ORTA SEVİYE GÜVENLİK
3. **IP kısıtlaması**
   - Sadece senin IP'nden admin erişimi
   - Nginx level'da:
   ```nginx
   location /admin/ {
       allow 92.123.45.67;  # Senin IP'in
       deny all;
   }
   ```

4. **Farklı port**
   - Admin paneli farklı portta (örn: 8062)
   - Firewall'da sadece senin IP'ne açık

#### İLERİ SEVİYE GÜVENLİK
5. **VPN zorunluluğu**
   - Admin paneline sadece VPN üzerinden erişim
   - WireGuard veya OpenVPN

6. **2FA (Two Factor Authentication)**
   - Google Authenticator entegrasyonu
   - SMS doğrulama

7. **Rate limiting**
   - 5 yanlış denemeden sonra IP blok
   - Fail2ban kullanımı

---

## 📧 5. EMAIL SİSTEMİ

### Şu Anki Durum
- İletişim formu çalışıyor
- Sadece console'da görünüyor
- Gerçek email göndermiyor

### Production Email Seçenekleri

#### A) Gmail SMTP (Kolay)
**Gereksinimler:**
1. Gmail hesabı (talhabektas6116@gmail.com)
2. 2-factor authentication aktif
3. App Password oluştur
4. Backend'e password ekle

**Artıları:** Ücretsiz, kolay kurulum
**Eksileri:** Günlük limit var (500 email)

#### B) SendGrid (Profesyonel)
**Fiyat:** İlk 100 email/gün ücretsiz
**Artıları:** Yüksek deliverability, analytics
**Kurulum:** API key gerekir

#### C) Kendi Mail Sunucusu
**Gereksinimler:** Postfix kurulumu
**Artıları:** Tam kontrol
**Eksileri:** Spam problemi, karmaşık

---

## 🛠️ 6. DEPLOYMENT SÜREÇLERİ

### A) MANUEL DEPLOYMENT (Öğrenme amaçlı)

#### 1. Sunucu Hazırlık
```bash
# VPS'e SSH ile bağlan
ssh root@your-server-ip

# Sistem güncelle
apt update && apt upgrade -y

# Gerekli paketler
apt install nginx mysql-server git curl
```

#### 2. Go Kurulumu
```bash
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
```

#### 3. Proje Upload
```bash
# Local'de zip oluştur
tar -czf proje.tar.gz backend/ frontend/ admin/ database/

# Sunucuya yükle
scp proje.tar.gz root@your-server:/var/www/
```

#### 4. Database Kurulum
```bash
mysql -u root -p
CREATE DATABASE polats;
CREATE USER 'polats_user'@'localhost' IDENTIFIED BY 'güçlü_şifre';
GRANT ALL PRIVILEGES ON polats.* TO 'polats_user'@'localhost';
```

#### 5. Nginx Ayarları
```nginx
server {
    listen 80;
    server_name polatlarhukuk.com;
    
    location / {
        root /var/www/polatlarhukuk/frontend;
        index index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8061;
    }
    
    location /admin/ {
        proxy_pass http://localhost:8061;
    }
}
```

### B) OTOMATİK DEPLOYMENT (Kolay)

#### Docker ile (Gelişmiş)
```dockerfile
FROM golang:1.21
WORKDIR /app
COPY backend/ .
RUN go build -o main
EXPOSE 8061
CMD ["./main"]
```

#### GitHub Actions (CI/CD)
- Git push yaptığında otomatik deploy
- Sıfır downtime deployment
- Backup alma

---

## 🔒 7. GÜVENLİK KONTROL LİSTESİ

### Sunucu Güvenliği
- [ ] Firewall aktif (UFW)
- [ ] SSH key-based authentication
- [ ] Root login devre dışı
- [ ] Fail2ban kurulu
- [ ] Auto updates aktif

### Uygulama Güvenliği
- [ ] HTTPS zorunlu
- [ ] Admin panel IP kısıtlı
- [ ] Güçlü şifreler
- [ ] SQL injection koruması
- [ ] XSS koruması
- [ ] CSRF token'ları

### Database Güvenliği
- [ ] Sadece localhost'tan bağlantı
- [ ] Güçlü database şifresi
- [ ] Otomatik backup
- [ ] Şifreli backup

---

## 📊 8. MONİTORİNG VE BAKIM

### Log Takibi
```bash
# Backend logları
journalctl -u polatlarhukuk -f

# Nginx logları
tail -f /var/log/nginx/access.log

# System logları
tail -f /var/log/syslog
```

### Backup Stratejisi
```bash
# Günlük database backup
mysqldump polats > backup_$(date +%Y%m%d).sql

# Haftalık dosya backup
tar -czf files_backup_$(date +%Y%m%d).tar.gz /var/www/polatlarhukuk
```

### Uptime Monitoring
- **UptimeRobot:** Ücretsiz, 5 dk interval
- **Pingdom:** Ücretli, detaylı raporlar
- **StatusCake:** Freemium

---

## 💰 9. MALIYET HESABI

### Aylık Maliyetler
```
VPS (DigitalOcean):     $5-10
Domain (.com):          $1 (yıllık $12)
SSL Sertifikası:        $0 (Let's Encrypt)
Email Service:          $0 (Gmail) veya $15 (SendGrid)
Backup Storage:         $2-5
Monitoring:             $0 (UptimeRobot)
---
TOPLAM:                 $8-31/ay
```

### Yıllık Maliyetler
```
Hosting:                $60-120
Domain:                 $12
Email (opsiyonel):      $180
Backup:                 $24-60
---
TOPLAM:                 $276-372/yıl
```

---

## ⚡ 10. HIZLI BAŞLANGAÇ PLANI

### 1. Hafta: Hazırlık
- [ ] VPS kirala (DigitalOcean)
- [ ] Domain satın al
- [ ] SSL kurulumu planla

### 2. Hafta: Kurulum
- [ ] Sunucu hazırlık
- [ ] Proje upload
- [ ] Database kurulum
- [ ] Basic deployment

### 3. Hafta: Güvenlik
- [ ] HTTPS kurulum
- [ ] Admin güvenliği
- [ ] Backup sistemi
- [ ] Monitoring

### 4. Hafta: Optimizasyon
- [ ] Performance tuning
- [ ] SEO ayarları
- [ ] Analytics kurulum
- [ ] Son testler

---

## 🆘 11. SIKÇA SORULAN SORULAR

### Q: Hiç Linux bilmiyorum, yapabilir miyim?
**A:** Evet! Digital Ocean'da 1-click app'ler var. Veya Heroku gibi PaaS kullan.

### Q: Admin paneli herkes görebilir mi?
**A:** Hayır, IP kısıtlaması ve şifre koruması ile sadece sen erişebilirsin.

### Q: Site çökerse ne olur?
**A:** Auto-restart servisi kurarız. Ayrıca monitoring ile anında bildirim alırsın.

### Q: Backup nasıl yaparım?
**A:** Otomatik günlük backup script'i kurarız. Hem database hem dosyalar.

### Q: SSL sertifikası pahalı mı?
**A:** Hayır! Let's Encrypt ücretsiz ve otomatik yenileniyor.

### Q: Email gönderimi çalışmayabilir mi?
**A:** Gmail SMTP ile %99.9 güvenilir. Alternatif olarak SendGrid var.

---

## 📞 12. SONUÇ VE ÖNERİLER

### Başlangıç için (Budget-friendly)
1. **DigitalOcean** $5/ay VPS
2. **Namecheap** domain
3. **Let's Encrypt** SSL
4. **Gmail SMTP** email
5. **IP kısıtlaması** admin güvenliği

### İleri seviye için (Professional)
1. **AWS/DigitalOcean** $20/ay VPS
2. **CloudFlare** CDN + security
3. **SendGrid** email service
4. **Automated backup** to cloud
5. **Full monitoring** suite

### Önemli Notlar
- **Test et:** Production'a geçmeden önce staging ortamda test
- **Backup al:** Deploy öncesi mevcut durumu backup'la
- **Dokümante et:** Tüm şifreleri ve ayarları not al
- **Güncelle:** Düzenli güvenlik güncellemeleri yap

---

*Bu döküman sadece bilgilendirme amaçlıdır. Hiçbir kod değişikliği yapmadan tüm detayları açıklamaya çalıştım. Hangi konuda daha detaylı bilgi istersen söyle!* 🚀 