package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

// Bu dosya sadece admin hash'i oluşturmak için kullanılır
// Kullanım: go run create_admin_hash.go
func createHash() {
	password := "AdminPolat2024!Legal@Strong#Password$9876"

	// Bcrypt hash oluştur
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("🔐 Admin Şifre Hash Oluşturucu")
	fmt.Println("==============================")
	fmt.Println("Admin şifresi:", password)
	fmt.Println("Bcrypt hash:", string(hash))

	// Doğrulama testi
	err = bcrypt.CompareHashAndPassword(hash, []byte(password))
	if err != nil {
		log.Fatal("Hash doğrulama başarısız:", err)
	}

	fmt.Println("✅ Hash doğrulama başarılı!")
	fmt.Println()
	fmt.Println("SQL Komutu:")
	fmt.Printf("UPDATE admins SET password_hash = '%s' WHERE username = 'admin';\n", string(hash))
}

func main() {
	createHash()
}
