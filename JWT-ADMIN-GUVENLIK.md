# 🔐 **JWT KEY ve ADMIN ŞİFRE GÜVENLİĞİ**

## 🔑 **1. JWT KEY OLUŞTURMA**

### **Seçenek 1: Online Generator (Kolay)**
1. **Git:** https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
2. **Seç:** 256-bit, Hex format
3. **Generate'e tıkla**
4. **Örnek çıktı:** `a8f5d2e7b9c4f1a6d8e3b7c9f2a5d8e1b4c7f0a3d6e9b2c5f8a1d4e7b0c3f6a9`

### **Seçenek 2: PowerShell (Windows)**
```powershell
# 64 karakterlik güçlü key
-join ((1..64) | ForEach {[char]((65..90) + (97..122) + (48..57) + (33..47) | Get-Random)})
```

### **Seçenek 3: Manuel Güçlü Key (Önerilen)**
```
PolAtLegal2024!JWT$Secret#Talha@Bektas*VerySecure%Key9876
```

---

## 🔒 **2. ADMIN ŞİFRE GÜÇLENDİRME**

### **Güçlü Şifre Örnekleri:**
```
AdminPolat2024!Legal@Strong#Password$9876
LegalAdmin$2024!Secure@Talha#Bektas
PolAtLegal!Admin@2024#VerySecure$Key
TalhaPolat$Admin2024!Strong@Password#
```

### **Şifre Kuralları:**
- ✅ **En az 12 karakter**
- ✅ **Büyük harf** (A-Z)
- ✅ **Küçük harf** (a-z)  
- ✅ **Rakam** (0-9)
- ✅ **Özel karakter** (!@#$%^&*)
- ✅ **Kişisel bilgi** (Polat, Legal, Talha)

---

## 🛡️ **3. BACKEND GÜVENLİK GÜNCELLEMESİ**

### **Adım 3.1: Go Bcrypt Paketi Ekle**
```bash
cd backend
go get golang.org/x/crypto/bcrypt
```

### **Adım 3.2: main.go'ya Bcrypt Ekle**
```go
package main

import (
    // ... mevcut importlar
    "golang.org/x/crypto/bcrypt"
)

// Şifre hash'leme fonksiyonu
func hashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

// Şifre doğrulama fonksiyonu  
func checkPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}

// Login handler'ı güncelle
func loginHandler(w http.ResponseWriter, r *http.Request) {
    var details LoginDetails
    if err := json.NewDecoder(r.Body).Decode(&details); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    log.Printf("Giriş denemesi alındı: Kullanıcı Adı='%s'", details.Username)

    var storedPasswordHash string
    err := db.QueryRow("SELECT password_hash FROM admins WHERE TRIM(username) = ? AND username IS NOT NULL LIMIT 1", details.Username).Scan(&storedPasswordHash)
    if err != nil {
        if err == sql.ErrNoRows {
            log.Println("Hata: Kullanıcı adı veritabanında bulunamadı.")
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        log.Printf("Veritabanı sorgu hatası: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    // Bcrypt ile şifre kontrolü
    if !checkPasswordHash(details.Password, storedPasswordHash) {
        log.Println("Şifre hatalı")
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // JWT token oluştur
    expirationTime := time.Now().Add(24 * time.Hour)
    claims := &Claims{
        Username: details.Username,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expirationTime),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString(jwtKey)
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    log.Printf("Başarılı giriş: %s", details.Username)
    json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}
```

### **Adım 3.3: Veritabanındaki Şifreyi Hash'le**

**Güçlü şifre seç:**
```
AdminPolat2024!Legal@Strong#Password$9876
```

**Hash oluşturucu Go script'i:**
```go
// hash_password.go
package main

import (
    "fmt"
    "golang.org/x/crypto/bcrypt"
)

func main() {
    password := "AdminPolat2024!Legal@Strong#Password$9876"
    hash, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Şifre: %s\n", password)
    fmt.Printf("Hash: %s\n", string(hash))
}
```

**Hash'i çalıştır:**
```bash
cd backend
go run hash_password.go
```

**Çıktı örneği:**
```
Şifre: AdminPolat2024!Legal@Strong#Password$9876
Hash: $2a$14$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Adım 3.4: Veritabanını Güncelle**
```sql
-- MySQL'de çalıştır
UPDATE admins 
SET password_hash = '$2a$14$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' 
WHERE username = 'admin';
```

---

## 🔧 **4. DOCKER-COMPOSE'A EKLE**

### **docker-compose.yml güncellemesi:**
```yaml
backend:
  environment:
    # ... mevcut environment'lar
    JWT_SECRET: PolAtLegal2024!JWT$Secret#Talha@Bektas*VerySecure%Key9876
    ADMIN_USERNAME: admin
    BCRYPT_ROUNDS: 14
```

### **.env dosyası güncellemesi:**
```env
JWT_SECRET=PolAtLegal2024!JWT$Secret#Talha@Bektas*VerySecure%Key9876
GMAIL_APP_PASSWORD=16_haneli_gmail_app_password
ADMIN_STRONG_PASSWORD=AdminPolat2024!Legal@Strong#Password$9876
```

---

## 🧪 **5. GÜVENLİK TESTLERİ**

### **Test 1: Yanlış Şifre**
```bash
curl -X POST https://polatlegal.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong_password"}'
```
**Beklenen:** `Unauthorized` (401)

### **Test 2: Doğru Şifre**
```bash
curl -X POST https://polatlegal.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminPolat2024!Legal@Strong#Password$9876"}'
```
**Beklenen:** JWT token

### **Test 3: JWT Token Kontrolü**
```bash
curl -H "Authorization: Bearer JWT_TOKEN_BURAYA" \
  https://polatlegal.com/api/admin/services
```

---

## 📊 **6. GÜVENLİK SEVİYELERİ**

| Güvenlik Seviyesi | Özellikler | Önerilen |
|-------------------|------------|----------|
| **🔴 ZAYIF** | Düz metin şifre, basit JWT | Asla! |
| **🟡 TEMEL** | Hash'li şifre, güçlü JWT | Başlangıç |
| **🟢 GÜÇLÜ** | Bcrypt + güçlü şifre + güçlü JWT | ✅ Önerilen |
| **🔵 PROFESYONel** | Yukarıdaki + 2FA + IP kısıtlama | İleri seviye |

---

## 🎯 **7. HIZLI UYGULAMA ADAMLARI**

### **Şu an yapılacaklar:**

**1. JWT Key belirle:** ✅ 
```
PolAtLegal2024!JWT$Secret#Talha@Bektas*VerySecure%Key9876
```

**2. Admin şifresi belirle:** ✅
```
AdminPolat2024!Legal@Strong#Password$9876
```

**3. Backend'i güncelle:**
- Bcrypt import ekle
- Login handler'ı güncelle
- Password hash fonksiyonları ekle

**4. Veritabanı güncelle:**
- Admin şifresini hash'li şekilde kaydet

**5. Environment güncelle:**
- JWT_SECRET ekle
- .env dosyasını güncelle

**6. Test et:**
- Yanlış şifre denemesi
- Doğru şifre ile giriş
- JWT token kontrolü

---

## ⚠️ **ÖNEMLİ GÜVENLİK NOTLARI**

1. **JWT Secret'ı ASLA GitHub'a pushla!** `.env` dosyası `.gitignore`'da olmalı.

2. **Admin şifresini güçlü tut** - minimum 12 karakter, karışık.

3. **Bcrypt rounds 14** yeterli - daha yüksek olursa çok yavaş olur.

4. **Production'da IP kısıtlaması** ekle (sadece senin IP'nden admin erişimi).

5. **JWT token süresini** makul tut (24 saat iyi bir başlangıç).

6. **Log'ları kontrol et** - şüpheli giriş denemeleri için.

---

## 🚀 **ÖZET**

**Bu rehberi takip edersen:**
- ✅ **Güçlü JWT key** (256-bit)
- ✅ **Güçlü admin şifresi** (12+ karakter, karışık)
- ✅ **Bcrypt hash** (düz metin yok)
- ✅ **Güvenli login** sistemi
- ✅ **Production-ready** güvenlik

**Siteniz artık profesyonel seviyede güvenli olacak!** 🔐🎯 