# 🚀 **POLAT LEGAL SİTESİ CANLI YAYINA ALMA REHBERİ**

## 📋 **İHTİYAÇLAR**

### **1. Domain (Alan Adı)**
- ✅ **polatlegal.com** - domain satın alınacak
- Önerilen firmalar: **GoDaddy**, **Namecheap**, **Natro** veya **Turhost**

### **2. VPS/Sunucu**
- **En Az Gereksinimler:**
  - 2 vCPU, 4GB RAM, 50GB SSD
  - Ubuntu 20.04/22.04 LTS
- **Önerilen Firmalar:**
  - **DigitalOcean** - $20/ay (güvenilir)
  - **Linode** - $20/ay 
  - **Vultr** - $20/ay
  - **AWS EC2** - $25-30/ay (profesyonel)

---

## 🛠️ **ADIM ADIM KURULUM**

### **1. Sunucu Hazırlığı**

#### **Ubuntu'yu Güncelleyin:**
```bash
sudo apt update && sudo apt upgrade -y
```

#### **Gerekli Paketleri Yükleyin:**
```bash
# Go programlama dilini yükle
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# MySQL veritabanını yükle
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Nginx web server'ı yükle
sudo apt install nginx -y

# SSL sertifikası için Certbot yükle
sudo apt install certbot python3-certbot-nginx -y

# Git yükle
sudo apt install git -y
```

### **2. MySQL Veritabanı Kurulumu**

#### **MySQL'e Giriş:**
```bash
sudo mysql -u root -p
```

#### **Veritabanı ve Kullanıcı Oluştur:**
```sql
CREATE DATABASE polatlegal;
CREATE USER 'polatlegal_user'@'localhost' IDENTIFIED BY 'GucluSifre123!';
GRANT ALL PRIVILEGES ON polatlegal.* TO 'polatlegal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### **Veritabanı Tablolarını Oluştur:**
```bash
mysql -u polatlegal_user -p polatlegal < /home/ubuntu/polatlar/database/init.sql
```

### **3. Proje Dosyalarını Sunucuya Yükle**

#### **Proje Klasörünü Oluştur:**
```bash
sudo mkdir -p /var/www/polatlegal
sudo chown $USER:$USER /var/www/polatlegal
```

#### **Dosyaları Yükle (3 yöntem):**

**A) SCP ile (Windows'tan):**
```powershell
scp -r C:\Users\Pc\Desktop\polatlar\ root@SUNUCU_IP:/var/www/polatlegal/
```

**B) SFTP/FileZilla ile:**
- FileZilla'da sunucuya bağlan
- Tüm proje klasörünü `/var/www/polatlegal/` altına yükle

**C) Git ile:**
```bash
cd /var/www/polatlegal
git clone https://github.com/KULLANICI_ADI/polatlar.git .
```

### **4. Go Backend'i Yapılandır**

#### **Environment Değişkenlerini Ayarla:**
```bash
sudo nano /var/www/polatlegal/backend/.env
```

#### **.env dosyası içeriği:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=polatlegal_user
DB_PASSWORD=GucluSifre123!
DB_NAME=polatlegal
JWT_SECRET=CokGucluJWTSecret123!XyZ789
GMAIL_EMAIL=noreply@polatlegal.com
GMAIL_APP_PASSWORD=gmail_uygulama_sifresi
ADMIN_IPS=SENIN_IP_ADRESIN,BASKA_IP_ADRESI
PORT=8061
```

#### **Backend'i Derle ve Çalıştır:**
```bash
cd /var/www/polatlegal/backend
go mod tidy
go build -o polatlegal-backend main.go
```

### **5. Systemd Service Oluştur**

#### **Service dosyası oluştur:**
```bash
sudo nano /etc/systemd/system/polatlegal.service
```

#### **Service içeriği:**
```ini
[Unit]
Description=Polat Legal Backend
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

[Install]
WantedBy=multi-user.target
```

#### **Service'i Başlat:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable polatlegal
sudo systemctl start polatlegal
sudo systemctl status polatlegal
```

### **6. Nginx Konfigürasyonu**

#### **Nginx config dosyası oluştur:**
```bash
sudo nano /etc/nginx/sites-available/polatlegal.com
```

#### **Nginx config içeriği:**
```nginx
server {
    listen 80;
    server_name polatlegal.com www.polatlegal.com;
    
    # Frontend static files
    location / {
        root /var/www/polatlegal/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8061;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin panel
    location /admin/ {
        root /var/www/polatlegal;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
        
        # IP kısıtlaması (SENIN IP'NI BURAYA YAZ)
        allow SENIN_IP_ADRESI;
        allow 127.0.0.1;
        deny all;
    }
    
    # Static assets
    location /assets/ {
        root /var/www/polatlegal/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **Site'i aktifleştir:**
```bash
sudo ln -s /etc/nginx/sites-available/polatlegal.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **7. SSL Sertifikası (HTTPS)**

#### **Domain'i sunucuya yönlendir:**
- Domain yönetim panelinde A kaydını sunucu IP'sine yönlendir
- `polatlegal.com` → `SUNUCU_IP`
- `www.polatlegal.com` → `SUNUCU_IP`

#### **SSL sertifikası al:**
```bash
sudo certbot --nginx -d polatlegal.com -d www.polatlegal.com
```

### **8. Email Konfigürasyonu**

#### **Gmail App Password Al:**
1. Gmail hesabına giriş yap
2. Google hesap ayarları → Güvenlik
3. 2 faktörlü doğrulamayı aktifleştir
4. "Uygulama şifreleri" oluştur
5. Şifreyi `.env` dosyasındaki `GMAIL_APP_PASSWORD`'e yaz

#### **Backend'i yeniden başlat:**
```bash
sudo systemctl restart polatlegal
```

---

## 🔒 **GÜVENLİK AYARLARI**

### **1. IP Kısıtlaması**
Admin paneline sadece belirttiğin IP'lerden erişim:

#### **IP adresini öğren:**
```bash
curl ipinfo.io/ip
```

#### **Nginx config'te IP kısıtlaması:**
```nginx
location /admin/ {
    allow SENIN_IP_ADRESI;     # Senin IP'n
    allow BASKA_IP_ADRESI;     # Başka bir IP (isteğe bağlı)
    allow 127.0.0.1;           # Localhost
    deny all;                  # Geri kalan herkesi engelle
}
```

### **2. Firewall Ayarları**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3306  # MySQL (sadece localhost'tan erişim için)
```

### **3. Backend'te IP Kontrolü**
Backend kod tarafında da IP kontrolü aktif (zaten mevcut).

---

## 🔄 **PROJE GÜNCELLEMELERİ**

### **Yerel Değişiklikleri Canlıya Alma:**

#### **1. Dosyaları Yükle:**
```bash
# SCP ile
scp -r C:\Users\Pc\Desktop\polatlar\frontend\ root@SUNUCU_IP:/var/www/polatlegal/
scp -r C:\Users\Pc\Desktop\polatlar\backend\ root@SUNUCU_IP:/var/www/polatlegal/
```

#### **2. Backend'i Güncelle:**
```bash
cd /var/www/polatlegal/backend
go build -o polatlegal-backend main.go
sudo systemctl restart polatlegal
```

#### **3. Frontend'i Güncelle:**
Dosyalar zaten yerinde olacak, tarayıcı cache'ini temizle.

### **Git ile Otomatik Güncelleme (Gelişmiş):**

#### **1. GitHub/GitLab'a Push:**
```bash
git add .
git commit -m "Güncelleme açıklaması"
git push origin main
```

#### **2. Sunucuda Pull:**
```bash
cd /var/www/polatlegal
git pull origin main
cd backend && go build -o polatlegal-backend main.go
sudo systemctl restart polatlegal
```

---

## 📊 **KONTROL LİSTESİ**

### **Canlıya Alma Öncesi:**
- [ ] Domain satın alındı
- [ ] VPS kiralandı
- [ ] Email: avcagripolat@hotmail.com aktif
- [ ] IP adresleri belirlendi

### **Kurulum Sonrası Test:**
- [ ] `https://polatlegal.com` açılıyor
- [ ] `https://polatlegal.com/admin` sadece belirlenen IP'lerden açılıyor
- [ ] İletişim formundan email geliyor
- [ ] Admin panelinde CRUD işlemleri çalışıyor
- [ ] Responsive tasarım mobilde çalışıyor

---

## 🆘 **SORUN GİDERME**

### **Backend Çalışmıyor:**
```bash
sudo systemctl status polatlegal
sudo journalctl -u polatlegal -f
```

### **Nginx Hatası:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### **MySQL Bağlantı Hatası:**
```bash
mysql -u polatlegal_user -p polatlegal
```

### **SSL Sorunu:**
```bash
sudo certbot renew --dry-run
```

---

## 💰 **MALIYETLER (Aylık)**

- **Domain:** $10-15/yıl (ilk yıl)
- **VPS:** $20-30/ay
- **SSL:** Ücretsiz (Let's Encrypt)
- **Toplam:** ~$25-35/ay

---

## 📞 **DESTEK**

Kurulum sırasında sorun yaşarsan:
1. Hata loglarını kontrol et
2. Her adımı sırasıyla takip et  
3. IP adreslerini doğru ayarladığından emin ol
4. Email konfigürasyonunu test et

**Başarılar! Siteniz artık profesyonel bir şekilde canlıda olacak! 🚀** 