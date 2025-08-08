# 🚀 **POLAT LEGAL SİTESİ CANLI YAYINA ALMA - TÜM DETAYLAR**

**Domain:** polatlegal.com (GoDaddy) ✅
**VPS:** DigitalOcean ✅
**Hedef:** Tam fonksiyonel hukuk bürosu sitesi

---

## 📋 **1. DigitalOcean'da DROPLET (VPS) OLUŞTUR**

### **Adım 1.1: DigitalOcean'a Giriş Yap**
- https://cloud.digitalocean.com/welcome adresine git
- Hesabına giriş yap

### **Adım 1.2: Droplet Oluştur**
1. **Sağ üstteki "Create" butonuna tıkla**
2. **"Droplets"ı seç**

### **Adım 1.3: Droplet Ayarları**

**İşletim Sistemi:**
```
Ubuntu 22.04 (LTS) x64 ✅
```

**Plan Seçimi:**
```
Basic Plan ✅
Regular Intel
$24/month - 2 vCPUs, 4GB RAM, 80GB SSD ✅
```

**Bölge Seçimi:**
```
Frankfurt (en yakın Avrupa) ✅
veya
Amsterdam ✅
```

**SSH Key (önemli!):**
```
"New SSH Key" butonuna tıkla
```

**SSH Key Oluşturma (Windows için):**
1. **PowerShell'i aç (Yönetici olarak)**
2. **Bu komutu çalıştır:**
```powershell
ssh-keygen -t rsa -b 4096 -C "polatlegal@email.com"
```
3. **Enter, Enter, Enter bas (şifresiz)**
4. **Public key'i kopyala:**
```powershell
Get-Content ~/.ssh/id_rsa.pub | Set-Clipboard
```
5. **DigitalOcean'a yapıştır**

**Droplet Adı:**
```
polatlegal-server
```

### **Adım 1.4: Droplet'i Oluştur**
- **"Create Droplet" butonuna tıkla**
- **2-3 dakika bekle**
- **IP adresini not et** (örn: 164.92.123.45)

---

## 🌐 **2. GODADDY'de DNS AYARLARI**

### **Adım 2.1: GoDaddy'e Giriş**
- https://sso.godaddy.com/ adresine git
- Hesabına giriş yap

### **Adım 2.2: DNS Yönetimi**
1. **"My Products" bölümüne git**
2. **"polatlegal.com" yanındaki "DNS" butonuna tıkla**
3. **"Manage DNS" seç**

### **Adım 2.3: A Record'ları Güncelle**

**Mevcut kayıtları sil ve bunları ekle:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 164.92.123.45 | 600 |
| A | www | 164.92.123.45 | 600 |

**(164.92.123.45 yerine kendi VPS IP'ni yaz)**

### **Adım 2.4: Değişiklikleri Kaydet**
- **"Save" butonuna tıkla**
- **DNS yayılması için 10-30 dakika bekle**

---

## 💻 **3. VPS'E BAĞLAN VE HAZIRLIK**

### **Adım 3.1: SSH ile Bağlan**
**PowerShell'i aç ve şunu çalıştır:**
```powershell
ssh root@164.92.123.45
```
**(IP'ni kendi IP'inle değiştir)**

**İlk bağlantıda "yes" yaz**

### **Adım 3.2: Sistemi Güncelle**
```bash
apt update && apt upgrade -y
```

### **Adım 3.3: Gerekli Yazılımları Yükle**
```bash
# Temel paketler
apt install nginx mysql-server git curl nano ufw fail2ban -y

# Certbot (SSL için)
apt install certbot python3-certbot-nginx -y
```

### **Adım 3.4: Go Programlama Dilini Yükle**
```bash
# Go'yu indir
cd /tmp
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz

# Mevcut Go'yu sil ve yeni sürümü yükle
rm -rf /usr/local/go
tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# PATH'e ekle
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Test et
go version
```

---

## 🗄️ **4. MYSQL VERİTABANI KURULUMU**

### **Adım 4.1: MySQL Güvenli Kurulum**
```bash
mysql_secure_installation
```

**Soruları şöyle yanıtla:**
```
Would you like to setup VALIDATE PASSWORD plugin? → N
Set root password? → Y
Password: GucluRootSifre123!
Remove anonymous users? → Y
Disallow root login remotely? → Y
Remove test database? → Y
Reload privilege tables? → Y
```

### **Adım 4.2: Veritabanı ve Kullanıcı Oluştur**
```bash
mysql -u root -p
```

**MySQL'de şunları çalıştır:**
```sql
CREATE DATABASE polatlegal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'polatlegal_user'@'localhost' IDENTIFIED BY 'PolAtLegal2024!Db';
GRANT ALL PRIVILEGES ON polatlegal.* TO 'polatlegal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **Adım 4.3: Bağlantıyı Test Et**
```bash
mysql -u polatlegal_user -p polatlegal
# Şifre: PolAtLegal2024!Db
# Başarılıysa EXIT; yaz
```

---

## 📁 **5. PROJE DOSYALARINI SUNUCUYA YÜKLE**

### **Adım 5.1: Proje Dizini Oluştur**
```bash
mkdir -p /var/www/polatlegal
cd /var/www/polatlegal
```

### **Adım 5.2: GitHub'dan Proje İndir** 
**ÖNCE BİLGİSAYARINDA:**
1. **GitHub'a git: https://github.com**
2. **"New Repository" oluştur**
3. **Adı: "polatlegal-website"**
4. **Public seç, README ekleme**

**Bilgisayarında (polatlar klasöründe):**
```powershell
cd C:\Users\Pc\Desktop\polatlar
git init
git add .
git commit -m "İlk commit - Polat Legal website"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/polatlegal-website.git
git push -u origin main
```

**VPS'te:**
```bash
cd /var/www/polatlegal
git clone https://github.com/KULLANICI_ADI/polatlegal-website.git .
```

### **Adım 5.3: Dosya İzinlerini Ayarla**
```bash
chown -R www-data:www-data /var/www/polatlegal
chmod -R 755 /var/www/polatlegal
```

---

## ⚙️ **6. BACKEND YAPILANDIRMASI**

### **Adım 6.1: Environment Dosyası Oluştur**
```bash
cd /var/www/polatlegal/backend
nano .env
```

**.env dosyasının içeriği:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=polatlegal_user
DB_PASSWORD=PolAtLegal2024!Db
DB_NAME=polatlegal
JWT_SECRET=PolAtLegal2024JWT!Secret9876
GMAIL_EMAIL=polatlegal.noreply@gmail.com
GMAIL_APP_PASSWORD=GMAIL_UYGULAMA_SIFRESI_BURAYA
PORT=8061
```

### **Adım 6.2: Backend Kodunu Güncelle**
```bash
nano main.go
```

**main.go'da veritabanı bağlantısını değiştir:**
Eski:
```go
dsn := "root:61611616@tcp(127.0.0.1:3306)/polats?parseTime=true"
```

Yeni:
```go
dsn := "polatlegal_user:PolAtLegal2024!Db@tcp(127.0.0.1:3306)/polatlegal?parseTime=true"
```

### **Adım 6.3: Go Bağımlılıklarını Yükle**
```bash
cd /var/www/polatlegal/backend
go mod tidy
```

### **Adım 6.4: Backend'i Derle**
```bash
go build -o polatlegal-backend main.go
```

### **Adım 6.5: Veritabanı Tablolarını Oluştur**
```bash
mysql -u polatlegal_user -p polatlegal < /var/www/polatlegal/database/init.sql
# Şifre: PolAtLegal2024!Db
```

---

## 🔧 **7. SYSTEMD SERVİSİ OLUŞTUR**

### **Adım 7.1: Service Dosyası Oluştur**
```bash
nano /etc/systemd/system/polatlegal.service
```

**Service dosyasının içeriği:**
```ini
[Unit]
Description=Polat Legal Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/polatlegal/backend
ExecStart=/var/www/polatlegal/backend/polatlegal-backend
Restart=always
RestartSec=5
Environment=PATH=/usr/local/go/bin:/usr/bin:/bin
EnvironmentFile=/var/www/polatlegal/backend/.env

# Güvenlik
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/polatlegal
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

### **Adım 7.2: Service'i Başlat**
```bash
systemctl daemon-reload
systemctl enable polatlegal
systemctl start polatlegal
systemctl status polatlegal
```

**Status "active (running)" göstermeli!**

---

## 🌐 **8. NGINX WEB SUNUCUSU YAPILANDIRMASI**

### **Adım 8.1: Default Site'ı Devre Dışı Bırak**
```bash
rm /etc/nginx/sites-enabled/default
```

### **Adım 8.2: Polat Legal Site Config'i Oluştur**
```bash
nano /etc/nginx/sites-available/polatlegal.com
```

**Nginx config içeriği:**
```nginx
server {
    listen 80;
    server_name polatlegal.com www.polatlegal.com;
    
    # Ana site dosyaları
    location / {
        root /var/www/polatlegal/frontend;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # API istekleri backend'e yönlendir
    location /api/ {
        proxy_pass http://localhost:8061;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
    }
    
    # Admin paneli
    location /admin/ {
        root /var/www/polatlegal;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
        
        # Güvenlik: Sadece belirli IP'lerden erişim
        # IP'nizi öğrenmek için: curl ipinfo.io/ip
        allow 127.0.0.1;
        # allow SENIN_IP_ADRESIN; # Bu satırı kendi IP'nizle değiştirin
        deny all;
    }
    
    # Static dosyalar (resimler, CSS, JS)
    location /assets/ {
        root /var/www/polatlegal/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        gzip_static on;
    }
    
    location /css/ {
        root /var/www/polatlegal/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    location /js/ {
        root /var/www/polatlegal/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # Gzip sıkıştırma
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/atom+xml image/svg+xml;
}
```

### **Adım 8.3: Site'i Aktifleştir**
```bash
ln -s /etc/nginx/sites-available/polatlegal.com /etc/nginx/sites-enabled/
```

### **Adım 8.4: Nginx Konfigürasyonunu Test Et**
```bash
nginx -t
```
**"test is successful" mesajı görmeli**

### **Adım 8.5: Nginx'i Yeniden Başlat**
```bash
systemctl reload nginx
systemctl status nginx
```

---

## 🔒 **9. SSL SERTİFİKASI KURULUMU (HTTPS)**

### **Adım 9.1: DNS Yayılmasını Kontrol Et**
```bash
# Domain'in IP'yi gösterip göstermediğini kontrol et
nslookup polatlegal.com
nslookup www.polatlegal.com
```

**Her ikisi de VPS IP'nizi göstermeli**

### **Adım 9.2: SSL Sertifikası Al**
```bash
certbot --nginx -d polatlegal.com -d www.polatlegal.com
```

**Soruları şöyle yanıtla:**
```
Email: avcagripolat@hotmail.com
Terms of Service: A (Agree)
Share email: N (No)
```

### **Adım 9.3: Otomatik Yenileme Test Et**
```bash
certbot renew --dry-run
```

**"Congratulations" mesajı görmeli**

---

## 📧 **10. EMAIL SİSTEMİ KURULUMU**

### **Adım 10.1: Gmail Hesabı Ayarla**

**Gmail hesabın yoksa:**
1. **Gmail hesabı oluştur: polatlegal.noreply@gmail.com**
2. **Güçlü şifre belirle**

### **Adım 10.2: Gmail 2FA ve App Password**

1. **Gmail'e giriş yap**
2. **Google Hesap Ayarları → Güvenlik**
3. **"2-Step Verification" aktifleştir**
4. **"App passwords" oluştur**
5. **"Mail" seç, "Other (custom name)" → "Polat Legal Website"**
6. **16 haneli şifreyi kopyala**

### **Adım 10.3: Backend'te Email Ayarlarını Güncelle**

```bash
nano /var/www/polatlegal/backend/.env
```

**.env dosyasında güncelle:**
```env
GMAIL_EMAIL=polatlegal.noreply@gmail.com
GMAIL_APP_PASSWORD=16_HANELI_UYGULAMA_SIFRESI
```

### **Adım 10.4: Backend'i Yeniden Başlat**
```bash
systemctl restart polatlegal
systemctl status polatlegal
```

---

## 🔐 **11. GÜVENLİK AYARLARI**

### **Adım 11.1: Firewall Ayarla**
```bash
# UFW'yi etkinleştir
ufw --force enable

# Temel kurallar
ufw default deny incoming
ufw default allow outgoing

# İzin verilen portlar
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# MySQL'i sadece localhost'tan eriş
ufw deny 3306

# Durumu kontrol et
ufw status verbose
```

### **Adım 11.2: IP Kısıtlaması (Admin Panel)**

**Kendi IP'nizi öğrenin:**
```bash
curl ipinfo.io/ip
```

**Nginx config'i güncelleyin:**
```bash
nano /etc/nginx/sites-available/polatlegal.com
```

**Admin location'ında şunu değiştirin:**
```nginx
location /admin/ {
    # IP kısıtlaması - multiple network aralığı (Dynamic IP çözümü)
    allow 127.0.0.1;          # Localhost
    allow 192.168.1.0/24;     # Yaygın home router aralığı
    allow 192.168.0.0/24;     # Alternatif home router aralığı
    allow 10.0.0.0/24;        # Alternatif aralık
    allow 172.16.0.0/12;      # Kurumsal/ISP aralığı (172.16.0.0 - 172.31.255.255)
    deny all;                 # Diğer tüm IP'leri reddet
    
    root /var/www;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
}

# Admin API rotalarını da kısıtla
location /api/admin/ {
    # IP kısıtlaması - multiple network aralığı (Dynamic IP çözümü)
    allow 127.0.0.1;          # Localhost
    allow 192.168.1.0/24;     # Yaygın home router aralığı
    allow 192.168.0.0/24;     # Alternatif home router aralığı
    allow 10.0.0.0/24;        # Alternatif aralık
    allow 172.16.0.0/12;      # Kurumsal/ISP aralığı (172.16.0.0 - 172.31.255.255)
    deny all;                 # Diğer tüm IP'leri reddet
    
    proxy_pass http://localhost:8061;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Nginx'i yeniden yükleyin:**
```bash
nginx -t
systemctl reload nginx
```

### **Adım 11.3: Fail2ban Yapılandır**
```bash
nano /etc/fail2ban/jail.local
```

**jail.local içeriği:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200
```

**Fail2ban'ı başlatın:**
```bash
systemctl enable fail2ban
systemctl start fail2ban
systemctl status fail2ban
```

---

## 🧪 **12. TEST VE DOĞRULAMA**

### **Adım 12.1: Backend API Test**
```bash
# Sunucuda API'yi test et
curl -I http://localhost:8061/api/services
curl -I https://polatlegal.com/api/services
```

### **Adım 12.2: Frontend Test**
```bash
# Ana sayfa test
curl -I https://polatlegal.com
curl -I https://www.polatlegal.com
```

### **Adım 12.3: Admin Panel Test**
```bash
# Admin panel test (sadece kendi IP'nden çalışmalı)
curl -I https://polatlegal.com/admin/
```

### **Adım 12.4: SSL Test**
- **https://www.ssllabs.com/ssltest/** adresine git
- **polatlegal.com** yaz ve test et
- **A veya A+** almalısın

### **Adım 12.5: Web Tarayıcısında Test**

**Bu URL'leri test et:**
- https://polatlegal.com ✅
- https://www.polatlegal.com ✅  
- https://polatlegal.com/admin/ ✅ (sadece senin IP'nden)
- https://polatlegal.com/api/services ✅
- İletişim formu gönderimi ✅

---

## 📊 **13. MONİTORİNG VE BAKIM**

### **Adım 13.1: Log Dosyalarını Kontrol Et**
```bash
# Backend logları
journalctl -u polatlegal -f

# Nginx logları
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Sistem logları
tail -f /var/log/syslog
```

### **Adım 13.2: Otomatik Backup Script'i**
```bash
nano /root/backup-polatlegal.sh
```

**Backup script içeriği:**
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup dizini oluştur
mkdir -p $BACKUP_DIR

# Veritabanı backup
mysqldump -u polatlegal_user -p'PolAtLegal2024!Db' polatlegal > $BACKUP_DIR/db_backup_$DATE.sql

# Dosya backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/polatlegal

# Eski backupları sil (7 günden eski)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Script'i çalıştırılabilir yap:**
```bash
chmod +x /root/backup-polatlegal.sh
```

**Crontab'a ekle (günlük backup):**
```bash
crontab -e
```

**Crontab'a şu satırı ekle:**
```
0 2 * * * /root/backup-polatlegal.sh >> /var/log/backup.log 2>&1
```

### **Adım 13.3: Sistem Kaynaklarını İzle**
```bash
# CPU ve RAM kullanımı
htop

# Disk kullanımı
df -h

# Servis durumları
systemctl status polatlegal nginx mysql
```

---

## 🔄 **14. GÜNCELLEME SÜRECİ**

### **Adım 14.1: Proje Güncellemeleri**

**Bilgisayarınızda:**
```powershell
cd C:\Users\Pc\Desktop\polatlar
git add .
git commit -m "Güncelleme açıklaması"
git push origin main
```

**VPS'te:**
```bash
cd /var/www/polatlegal
git pull origin main

# Backend güncellemesi varsa
cd backend
go build -o polatlegal-backend main.go
systemctl restart polatlegal

# Nginx reload
systemctl reload nginx
```

### **Adım 14.2: Sistem Güncellemeleri**
```bash
# Ayda bir kez çalıştır
apt update && apt upgrade -y
certbot renew
systemctl restart nginx
```

---

## 🆘 **15. SORUN GİDERME**

### **Problem: Site açılmıyor**
```bash
# DNS kontrolü
nslookup polatlegal.com

# Nginx durumu
systemctl status nginx
nginx -t

# Logları kontrol et
tail -f /var/log/nginx/error.log
```

### **Problem: API çalışmıyor**
```bash
# Backend durumu
systemctl status polatlegal
journalctl -u polatlegal -n 50

# Port kontrolü
netstat -tlnp | grep 8061
```

### **Problem: Admin paneli açılmıyor**
```bash
# IP kısıtlaması kontrol
curl ipinfo.io/ip

# Nginx config kontrol
nano /etc/nginx/sites-available/polatlegal.com
```

### **Problem: Email gönderilmiyor**
```bash
# Environment dosyası kontrol
cat /var/www/polatlegal/backend/.env | grep GMAIL

# Backend logları
journalctl -u polatlegal | grep -i email
```

---

## ✅ **16. BAŞARI KONTROLLERİ**

**Tüm bunlar çalışıyorsa başarılısın:**

- [ ] https://polatlegal.com açılıyor ✅
- [ ] https://www.polatlegal.com açılıyor ✅
- [ ] SSL sertifikası aktif (yeşil kilit) ✅
- [ ] Admin paneline sadece senin IP'nden erişim ✅
- [ ] İletişim formu email gönderiyor ✅
- [ ] Admin panelinde CRUD işlemleri çalışıyor ✅
- [ ] Mobil cihazlarda düzgün görünüyor ✅
- [ ] Site hızı normal ✅

---

## 💰 **17. MALİYET ÖZETİ**

| Hizmet | Aylık Maliyet | Yıllık Maliyet |
|--------|---------------|----------------|
| Domain (GoDaddy) | - | ~₺400 |
| VPS (DigitalOcean) | ~₺700 | ~₺8,400 |
| SSL Sertifikası | Ücretsiz | Ücretsiz |
| Email | Ücretsiz | Ücretsiz |
| **TOPLAM** | **₺700** | **₺8,800** |

---

## 🎉 **TEBRİKLER!**

Bu rehberi takip ettiysen **Polat Legal** sitesi artık canlıda! 

Profesyonel bir hukuk bürosu web sitesi ve admin paneline sahipsin. Müşteriler siteni ziyaret edebilir, iletişim kurabilir ve sen admin panelinden tüm içerikleri yönetebilirsin.

**Önemli Notlar:**
1. **Backup'ları düzenli kontrol et**
2. **Güncellemeleri ayda bir yap**  
3. **SSL sertifikası otomatik yenileniyor**
4. **Admin şifreni güçlü tut**
5. **IP kısıtlamasını aktif bırak**

**Başarılar! 🚀🎯** 