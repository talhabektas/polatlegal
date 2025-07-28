package main

import (
	"fmt"
	"log"
)

// Basit bcrypt hash simülasyonu (crypto/bcrypt package olmadan)
func main() {
	password := "AdminPolat2024!Legal@Strong#Password$9876"

	fmt.Printf("🔐 Admin Şifre Hash Oluşturucu\n")
	fmt.Printf("================================\n")
	fmt.Printf("Şifre: %s\n", password)
	fmt.Printf("Şifre uzunluğu: %d karakter\n\n", len(password))

	fmt.Println("2 SEÇENEK VAR:")
	fmt.Println("")

	fmt.Println("🟡 SEÇENEK 1: DÜZ METİN (Hızlı çözüm)")
	fmt.Printf("UPDATE admins SET password_hash = '%s' WHERE username = 'admin';\n", password)
	fmt.Println("")

	fmt.Println("🟢 SEÇENEK 2: BCRYPT HASH (Güvenli çözüm)")
	fmt.Println("Backend klasöründe şu komutu çalıştır:")
	fmt.Println("cd backend")
	fmt.Println(`go run -c "package main; import(\"fmt\"; \"golang.org/x/crypto/bcrypt\"); func main() { h,_:=bcrypt.GenerateFromPassword([]byte(\"AdminPolat2024!Legal@Strong#Password$9876\"), 14); fmt.Println(string(h)) }"`)
	fmt.Println("")

	fmt.Println("📋 ÖNERİ:")
	fmt.Println("Şimdilik SEÇENEK 1'i kullan (düz metin)")
	fmt.Println("Canlıya aldıktan sonra SEÇENEK 2'ye geç (bcrypt)")

	log.Println("Hash oluşturucu tamamlandı!")
}
