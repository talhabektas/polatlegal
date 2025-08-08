#!/bin/bash

# Admin Panel IP Güncelleyici Script
# Bu script, admin paneli için izin verilen IP aralığını günceller

echo "=== POLAT LEGAL ADMIN IP GÜNCELLEYİCİ ==="
echo "Mevcut IP bilgilerinizi alıyoruz..."

# Mevcut IP'yi tespit et
CURRENT_IP=$(hostname -I | awk '{print $1}')
if [ -z "$CURRENT_IP" ]; then
    CURRENT_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}')
fi

echo "Tespit edilen IP: $CURRENT_IP"

# IP aralığını belirle
if [[ $CURRENT_IP == 192.168.1.* ]]; then
    IP_RANGE="192.168.1.0/24"
    echo "IP aralığı: 192.168.1.x (1-254)"
elif [[ $CURRENT_IP == 192.168.0.* ]]; then
    IP_RANGE="192.168.0.0/24"
    echo "IP aralığı: 192.168.0.x (1-254)"
elif [[ $CURRENT_IP == 10.0.0.* ]]; then
    IP_RANGE="10.0.0.0/24"
    echo "IP aralığı: 10.0.0.x (1-254)"
else
    echo "Uyarı: Standart olmayan IP aralığı tespit edildi: $CURRENT_IP"
    echo "Manuel olarak IP aralığını girin (örn: 192.168.1.0/24):"
    read IP_RANGE
fi

echo "Kullanılacak IP aralığı: $IP_RANGE"

# Nginx konfigürasyonunu güncelle
NGINX_CONFIG="/etc/nginx/sites-available/polatlegal.com"

if [ -f "$NGINX_CONFIG" ]; then
    echo "Nginx konfigürasyonu güncelleniyor..."
    
    # Backup oluştur
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    # IP aralığını güncelle
    sed -i "s|allow 192\.168\.[0-9]\+\.0/24;|allow $IP_RANGE;|g" "$NGINX_CONFIG"
    sed -i "s|allow 10\.0\.[0-9]\+\.0/24;|allow $IP_RANGE;|g" "$NGINX_CONFIG"
    
    # Nginx konfigürasyonunu test et
    if nginx -t; then
        echo "✅ Nginx konfigürasyonu geçerli"
        echo "Nginx yeniden yükleniyor..."
        systemctl reload nginx
        echo "✅ Admin panel IP aralığı güncellendi: $IP_RANGE"
    else
        echo "❌ Nginx konfigürasyonu hatalı! Backup geri yükleniyor..."
        cp "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONFIG"
        echo "Backup geri yüklendi."
    fi
else
    echo "❌ Nginx konfigürasyonu bulunamadı: $NGINX_CONFIG"
    echo "Manuel olarak konfigürasyonu kontrol edin."
fi

echo "=== İŞLEM TAMAMLANDI ==="