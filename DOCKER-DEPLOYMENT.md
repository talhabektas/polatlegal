# 🐳 **POLAT LEGAL - DOCKER İLE CANLI YAYINA ALMA**

**Domain:** polatlegal.com (GoDaddy) ✅  
**VPS:** DigitalOcean ✅  
**Teknoloji:** Docker + Docker Compose 🐳  
**Avantaj:** 10x daha kolay deployment!

---

## 📋 **1. DigitalOcean VPS KURULUMU**

### **Adım 1.1: Droplet Oluştur**
**Aynı ayarlar, sadece daha basit:**
```
İşletim Sistemi: Ubuntu 22.04 LTS ✅
Plan: $24/ay - 2 vCPU, 4GB RAM ✅
Bölge: Frankfurt/Amsterdam ✅
Droplet Adı: polatlegal-docker ✅
```

### **Adım 1.2: SSH Bağlantısı**
```bash
ssh root@VPS_IP_ADRESI
```

---

## 🌐 **2. GODADDY DNS AYARLARI**
**(Aynı - değişiklik yok)**
```
A Record: @ → VPS_IP_ADRESI
A Record: www → VPS_IP_ADRESI
```

---

## 🐳 **3. DOCKER KURULUMU (SÜPER KOLAY)**

### **Adım 3.1: Sistem Güncelle**
```bash
apt update && apt upgrade -y
```

### **Adım 3.2: Docker Kurulumu**
```bash
# Docker'ı otomatik kur
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose'u kur
apt install docker-compose-plugin -y

# Docker'ı başlat
systemctl enable docker
systemctl start docker

# Test et
docker --version
docker compose version
```

### **Adım 3.3: Temel Gereksinimler**
```bash
# Sadece bunlar gerekli (MySQL, Nginx, Go YOK!)
apt install git nano ufw certbot -y
```

---

## 📁 **4. PROJE HAZIRLIĞI**

### **Adım 4.1: Proje İndir**
```bash
mkdir -p /var/www/polatlegal
cd /var/www/polatlegal
git clone https://github.com/talhabektas/polats.git .
```

### **Adım 4.2: Docker Dosyalarını Oluştur**

**Dockerfile (Backend için):**
```bash
nano Dockerfile
```

```dockerfile
# Go uygulaması için Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN go build -o polatlegal-backend main.go

# Production image
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/polatlegal-backend .
COPY --from=builder /app/.env .

# Güvenlik: non-root user
RUN adduser -D appuser
USER appuser

EXPOSE 8061
CMD ["./polatlegal-backend"]
```

**docker-compose.yml (Ana dosya):**
```bash
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  # MySQL Veritabanı
  mysql:
    image: mysql:8.0
    container_name: polatlegal-mysql
    restart: always
         environment:
       MYSQL_ROOT_PASSWORD: 61611616
       MYSQL_DATABASE: polats
       MYSQL_USER: root
       MYSQL_PASSWORD: 61611616
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - polatlegal-network
    command: --default-authentication-plugin=mysql_native_password

  # Go Backend
  backend:
    build: .
    container_name: polatlegal-backend
    restart: always
    depends_on:
      - mysql
         environment:
       DB_HOST: mysql
       DB_PORT: 3306
       DB_USER: root
       DB_PASSWORD: 61611616
       DB_NAME: polats
       JWT_SECRET: PolAtLegal2024!JWT$Secret#Talha@Bektas*VerySecure%Key9876
       GMAIL_EMAIL: polatlegal.noreply@gmail.com
       GMAIL_APP_PASSWORD: ${GMAIL_APP_PASSWORD}
       SEND_TO_EMAIL: avcagripolat@hotmail.com
       PORT: 8061
    networks:
      - polatlegal-network
    ports:
      - "8061:8061"

  # Nginx Web Server
  nginx:
    image: nginx:alpine
    container_name: polatlegal-nginx
    restart: always
    depends_on:
      - backend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend:/var/www/html
      - ./admin:/var/www/admin
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
    networks:
      - polatlegal-network

networks:
  polatlegal-network:
    driver: bridge

volumes:
  mysql_data:
    driver: local
```

**Environment dosyası:**
```bash
nano .env
```

```env
JWT_SECRET=PolAtLegal2024!JWT$Secret#Talha@Bektas*VerySecure%Key9876
GMAIL_APP_PASSWORD=16_HANELI_GMAIL_SIFRESI_BURAYA
ADMIN_PASSWORD=AdminPolat2024!Legal@Strong#Password$9876
```

---

## 🌐 **5. NGINX KONFIGÜRASYONU**

### **Adım 5.1: Nginx Klasörlerini Oluştur**
```bash
mkdir -p nginx/sites
mkdir -p ssl
```

### **Adım 5.2: Ana Nginx Config**
```bash
nano nginx/nginx.conf
```

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip sıkıştırma
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Log formatı
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
                    
    access_log /var/log/nginx/access.log main;
    
    # Site konfigürasyonları
    include /etc/nginx/conf.d/*.conf;
}
```

### **Adım 5.3: Site Config**
```bash
nano nginx/sites/polatlegal.conf
```

```nginx
server {
    listen 80;
    server_name polatlegal.com www.polatlegal.com;
    
    # Ana site
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:8061;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin paneli (IP kısıtlaması)
    location /admin/ {
        root /var/www;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
        
        # IP kısıtlaması
        allow 127.0.0.1;
        # allow SENIN_IP_ADRESIN;
        deny all;
    }
    
    # Static dosyalar
    location /assets/ {
        root /var/www/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔧 **6. BACKEND GÜNCELLEMESI**

### **Adım 6.1: Backend main.go Güncelle**
```bash
nano backend/main.go
```

**Veritabanı bağlantısını değiştir:**
```go
// Mevcut kod zaten doğru:
dsn := "root:61611616@tcp(127.0.0.1:3306)/polats?parseTime=true"

// Bunu Docker için şu şekilde değiştir:
func initDB() {
    var err error
    
    // Environment'tan değerleri al
    dbHost := os.Getenv("DB_HOST")
    if dbHost == "" {
        dbHost = "127.0.0.1" // fallback
    }
    
    dbUser := os.Getenv("DB_USER")
    if dbUser == "" {
        dbUser = "root"
    }
    
    dbPassword := os.Getenv("DB_PASSWORD")
    if dbPassword == "" {
        dbPassword = "61611616"
    }
    
    dbName := os.Getenv("DB_NAME")
    if dbName == "" {
        dbName = "polats"
    }
    
    dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?parseTime=true", 
        dbUser, dbPassword, dbHost, dbName)
    
    db, err = sql.Open("mysql", dsn)
    // ... geri kalan kod aynı
}
```

### **Adım 6.2: Environment Okuma ve Email Ayarı**
```go
// main.go başına ekle
import (
    "os"
    // ... diğer importlar
)

// JWT key'i environment'tan al
var jwtKey = []byte(os.Getenv("JWT_SECRET"))

// Email ayarlarını da environment'tan al
func contactFormHandler(w http.ResponseWriter, r *http.Request) {
    // ... mevcut kod ...
    
    // Email gönder - SEND_TO_EMAIL environment'ını kullan
    toEmail := os.Getenv("SEND_TO_EMAIL")
    if toEmail == "" {
        toEmail = "avcagripolat@hotmail.com" // fallback
    }
    
    err := sendEmail(toEmail, "İletişim Formu: "+form.Subject, emailBody)
    
    // ... geri kalan kod
}
```

---

## 🚀 **7. DOCKER İLE BAŞLATMA**

### **Adım 7.1: İlk Çalıştırma**
```bash
cd /var/www/polatlegal

# Container'ları build et ve başlat
docker compose up -d --build

# Durumu kontrol et
docker compose ps
```

### **Adım 7.2: Logları Kontrol Et**
```bash
# Tüm servislerin logları
docker compose logs -f

# Sadece backend
docker compose logs -f backend

# Sadece nginx
docker compose logs -f nginx
```

### **Adım 7.3: Test Et**
```bash
# API test
curl http://localhost/api/services

# Site test
curl http://localhost
```

---

## 🔒 **8. SSL SERTİFİKASI (LET'S ENCRYPT)**

### **Adım 8.1: DNS Yayılmasını Bekle**
```bash
nslookup polatlegal.com
```

### **Adım 8.2: Certbot ile SSL Al**
```bash
# Container'ları durdur
docker compose down

# SSL sertifikası al
certbot certonly --standalone -d polatlegal.com -d www.polatlegal.com

# Sertifikaları Docker'a kopyala
cp -L /etc/letsencrypt/live/polatlegal.com/* /var/www/polatlegal/ssl/
```

### **Adım 8.3: HTTPS Nginx Config Ekle**
```bash
nano nginx/sites/polatlegal.conf
```

**HTTPS server block ekle:**
```nginx
server {
    listen 443 ssl http2;
    server_name polatlegal.com www.polatlegal.com;
    
    # SSL sertifikaları
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Ana site
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:8061;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin panel
    location /admin/ {
        root /var/www;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
        
        allow 127.0.0.1;
        # allow SENIN_IP_ADRESIN;
        deny all;
    }
}

# HTTP'den HTTPS'e yönlendir
server {
    listen 80;
    server_name polatlegal.com www.polatlegal.com;
    return 301 https://$server_name$request_uri;
}
```

### **Adım 8.4: Docker'ı Yeniden Başlat**
```bash
docker compose up -d
```

---

## 🔐 **9. GÜVENLİK VE FIREWALL**

### **Adım 9.1: UFW Firewall**
```bash
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

ufw status
```

### **Adım 9.2: IP Kısıtlaması Güncelle**
```bash
# IP'nizi öğrenin
curl ipinfo.io/ip

# Nginx config'te IP'nizi ekleyin
nano nginx/sites/polatlegal.conf
```

---

## 📧 **10. EMAIL KURULUMU**

### **Adım 10.1: Gmail App Password Al**
**DİKKAT:** Email göndermek için Gmail SMTP kullanacağız, ancak mesajlar `avcagripolat@hotmail.com` adresine gidecek.

1. **Gmail hesabı oluştur:** `polatlegal.noreply@gmail.com` (sadece gönderim için)
2. **2FA aktifleştir**
3. **App Password oluştur** 
4. **16 haneli şifreyi kopyala**

**Backend'te email gönderim ayarı:**
- **Gönderen:** `polatlegal.noreply@gmail.com` (Gmail SMTP)
- **Alan:** `avcagripolat@hotmail.com` (senin email'in)

### **Adım 10.2: Environment Güncelle**
```bash
nano .env
```

```env
GMAIL_APP_PASSWORD=16_haneli_app_password_buraya
```

### **Adım 10.3: Docker'ı Yeniden Başlat**
```bash
docker compose down
docker compose up -d
```

---

## 🛠️ **11. DOCKER KOMUTLARI (GÜNLÜK KULLANIM)**

### **Temel Komutlar:**
```bash
# Başlat
docker compose up -d

# Durdur
docker compose down

# Yeniden başlat
docker compose restart

# Logları izle
docker compose logs -f

# Sadece backend'i yeniden başlat
docker compose restart backend

# Container'lara gir
docker exec -it polatlegal-backend sh
docker exec -it polatlegal-mysql mysql -u root -p

# Kullanılan kaynakları gör
docker stats
```

### **Güncelleme:**
```bash
# Git'ten son değişiklikleri çek
git pull origin main

# Sadece değişen container'ları rebuild et
docker compose up -d --build

# Kullanılmayan image'ları temizle
docker system prune -f
```

---

## 📊 **12. BACKUP VE RESTORE**

### **Adım 12.1: Backup Script**
```bash
nano /root/docker-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Veritabanı backup
docker exec polatlegal-mysql mysqldump -u root -p'61611616' polats > $BACKUP_DIR/db_$DATE.sql

# Docker volumes backup
docker run --rm -v polatlegal_mysql_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/mysql_volume_$DATE.tar.gz -C /data .

# Proje dosyaları backup
tar czf $BACKUP_DIR/project_$DATE.tar.gz /var/www/polatlegal --exclude=node_modules

echo "Backup completed: $DATE"
```

**Çalıştırılabilir yap:**
```bash
chmod +x /root/docker-backup.sh
```

### **Adım 12.2: Otomatik Backup (Crontab)**
```bash
crontab -e
```

```cron
0 2 * * * /root/docker-backup.sh >> /var/log/backup.log 2>&1
```

---

## 🧪 **13. TEST VE DOĞRULAMA**

### **Kontrol Listesi:**
```bash
# Container'lar çalışıyor mu?
docker compose ps

# Site açılıyor mu?
curl -I https://polatlegal.com

# API çalışıyor mu?
curl https://polatlegal.com/api/services

# SSL aktif mi?
curl -I https://polatlegal.com | grep "HTTP/2 200"

# Admin panel korumalı mı?
curl -I https://polatlegal.com/admin/
```

---

## ⚖️ **14. DOCKER vs GELENEKSEL KARŞILAŞTIRMA**

| Özellik | Docker 🐳 | Geleneksel 🛠️ |
|---------|-----------|----------------|
| **Kurulum Süresi** | 30 dakika | 2-3 saat |
| **Karmaşıklık** | Basit | Orta |
| **Güncelleme** | `docker compose up -d` | Manuel her servis |
| **Backup** | Container volumes | Tüm sistem |
| **Rollback** | Image değiştir | Manuel restore |
| **Kaynak Kullanımı** | Biraz fazla | Optimal |
| **Debugging** | Container logları | Sistem logları |
| **Taşınabilirlik** | Mükemmel | Zor |

---

## 🎉 **SONUÇ**

**Docker ile avantajlar:**
- ✅ **10x daha hızlı kurulum**
- ✅ **Tek komutla başlatma/durdurma**
- ✅ **Tutarlı environment**
- ✅ **Kolay backup/restore**
- ✅ **Hızlı güncelleme**
- ✅ **Temiz sistem** (host'a minimum müdahale)

**Hangi yöntemi seçmelisin?**
- **Docker:** Hız ve kolaylık istiyorsan
- **Geleneksel:** Maksimum performans ve kontrol istiyorsan

**Önerim:** Docker ile başla! Çok daha kolay ve hızlı. 🚀

Bu rehberi takip edersen 30 dakikada site canlı olur! 🎯

---

## 🔄 **15. CANLI SİTEDE DEĞİŞİKLİK YAPMA SÜRECİ**

**EVET!** Canlıya aldıktan sonra rahatça değişiklik yapabilirsin! İşte nasıl:

### **🖥️ Bilgisayarında Değişiklik Yap**

**Adım 1: Değişikliği yap**
```powershell
# Polatlar klasöründe
cd C:\Users\Pc\Desktop\polatlar

# İstediğin değişikliği yap (HTML, CSS, JS, Go kodu)
# Örnek: frontend/index.html dosyasını düzenle
```

**Adım 2: GitHub'a push et**
```powershell
git add .
git commit -m "Site içerik güncellemesi"
git push origin main
```

### **🚀 Canlı Sitede Güncelle**

**Adım 3: VPS'e bağlan ve güncelle**
```bash
# SSH ile bağlan
ssh root@VPS_IP_ADRESI

# Proje klasörüne git
cd /var/www/polatlegal

# GitHub'tan son değişiklikleri çek
git pull origin main

# Docker'ı yeniden başlat (değişiklikleri uygular)
docker compose up -d --build
```

### **⚡ TEK KOMUT GÜNCELLEMESİ:**
```bash
# Bu tek komut her şeyi yapar:
cd /var/www/polatlegal && git pull origin main && docker compose up -d --build
```

### **📝 HANGI DEĞİŞİKLİKLER NE KADAR SÜRER:**

| Değişiklik Türü | Süre | Komut |
|------------------|------|-------|
| **HTML/CSS/JS** | 10 saniye | `git pull && docker compose restart nginx` |
| **Go Backend** | 30 saniye | `git pull && docker compose up -d --build` |
| **Database** | 1 dakika | Manuel SQL + restart |
| **Config** | 15 saniye | `git pull && docker compose restart` |

### **🔥 HIZLI DEĞİŞİKLİK ÖRNEKLERİ:**

**Frontend değişikliği (HTML/CSS):**
```bash
git pull && docker compose restart nginx
```

**Backend değişikliği (Go kodu):**
```bash
git pull && docker compose up -d --build backend
```

**Tam yeniden başlatma:**
```bash
git pull && docker compose down && docker compose up -d --build
```

### **📊 Admin Panel Değişiklikleri**

**Admin panelinden yaptığın değişiklikler (hizmetler, ekip, blog) otomatik kaydedilir!**
- ✅ **Yeni blog yazısı** → Anında canlıda
- ✅ **Hizmet güncelle** → Anında canlıda  
- ✅ **Ekip üyesi ekle** → Anında canlıda
- ✅ **Fotoğraf yükle** → Anında canlıda

### **⚠️ DİKKAT EDİLECEKLER:**

1. **Backup al:**
```bash
# Değişiklik öncesi backup
/root/docker-backup.sh
```

2. **Test et:**
```bash
# Değişiklikten sonra test et
curl -I https://polatlegal.com
curl https://polatlegal.com/api/services
```

3. **Logları kontrol et:**
```bash
# Hata var mı kontrol et
docker compose logs -f
```

### **🛠️ HATA OLURSA GERİ AL:**

**Son commit'e geri dön:**
```bash
cd /var/www/polatlegal
git reset --hard HEAD~1
docker compose up -d --build
```

**Belirli commit'e geri dön:**
```bash
git log --oneline  # commit hash'leri gör
git reset --hard COMMIT_HASH
docker compose up -d --build
```

### **📱 CANLI İZLEME:**

**Site çalışıyor mu kontrol et:**
```bash
# Otomatik kontrol script'i
nano /root/check-site.sh
```

```bash
#!/bin/bash
if curl -f -s https://polatlegal.com > /dev/null; then
    echo "$(date): Site çalışıyor ✅"
else
    echo "$(date): Site DOWN! ❌"
    # Email gönder veya restart yap
    cd /var/www/polatlegal && docker compose restart
fi
```

**5 dakikada bir kontrol et:**
```bash
chmod +x /root/check-site.sh
crontab -e
# Ekle: */5 * * * * /root/check-site.sh >> /var/log/site-check.log
```

---

## 🎯 **ÖZET: DEĞIŞIKLIK SÜRECI**

```
1. Bilgisayarında değiştir
2. git push yap  
3. VPS'e bağlan
4. git pull && docker compose up -d --build
5. Test et
6. Bitti! 🚀
```

**Docker sayesinde değişiklik yapmak çok kolay! Saniyeler içinde canlıya yansır.** ⚡ 