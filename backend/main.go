package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
)

// --- Veritabanı Modelleri ---

type Service struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IconClass   string `json:"icon_class"`
}

type TeamMember struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Title    string `json:"title"`
	Bio      string `json:"bio"`
	ImageURL string `json:"image_url"`
}

type Post struct {
	ID          int            `json:"id"`
	Title       string         `json:"title"`
	Content     string         `json:"content"`
	Author      sql.NullString `json:"author,omitempty"`
	CreatedAt   string         `json:"created_at"`
	ServiceID   sql.NullInt64  `json:"service_id,omitempty"`
	ServiceName sql.NullString `json:"service_name,omitempty"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// PostRequest, yeni/güncel post isteklerini ayrıştırmak için kullanılır
// çünkü sql.NullInt64 basit bir sayıdan/nulldan çözülemez.
type PostRequest struct {
	Title     string `json:"title"`
	Content   string `json:"content"`
	Author    string `json:"author"`
	ServiceID string `json:"service_id"` // String olarak al, parse ederiz
}

// --- Veritabanı Bağlantısı ---
var db *sql.DB

func initDB() {
	var err error
	// DSN (Data Source Name) formatı: username:password@tcp(127.0.0.1:3306)/database_name
	dsn := "root:61611616@tcp(127.0.0.1:3306)/polats?parseTime=true"
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Veritabanı bağlantısı açılamadı: %v", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatalf("Veritabanına bağlanılamadı: %v", err)
	}

	log.Println("Veritabanı bağlantısı başarılı!")

	// Ekip üyelerinin fotoğraflarını güncelle
	updateTeamPhotos()
}

func updateTeamPhotos() {
	// Çağrı Polat'ın fotoğrafını güncelle
	_, err := db.Exec("UPDATE team_members SET name = 'Av. Çağrı Polat', image_url = 'assets/cplt.jpg' WHERE id = 1")
	if err != nil {
		log.Printf("Çağrı Polat fotoğrafı güncellenirken hata: %v", err)
	}

	// Ertuğrul Polat'ın fotoğrafını güncelle
	_, err = db.Exec("UPDATE team_members SET name = 'Av. Ertuğrul Polat', image_url = 'assets/ert.jpg' WHERE id = 2")
	if err != nil {
		log.Printf("Ertuğrul Polat fotoğrafı güncellenirken hata: %v", err)
	}

	// Blog yazılarındaki yazar isimlerini güncelle
	_, err = db.Exec("UPDATE posts SET author_name = 'Çağrı Polat' WHERE author_id = 1")
	if err != nil {
		log.Printf("Çağrı Polat blog yazıları güncellenirken hata: %v", err)
	}

	_, err = db.Exec("UPDATE posts SET author_name = 'Ertuğrul Polat' WHERE author_id = 2")
	if err != nil {
		log.Printf("Ertuğrul Polat blog yazıları güncellenirken hata: %v", err)
	}

	log.Println("Ekip üyeleri fotoğrafları güncellendi!")
}

// --- JWT Ayarları ---
var jwtKey = []byte("my_secret_key") // Üretimde bunu güvenli bir yerden alın!

// --- API Handler'ları ---

func getServices(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, title, description, icon_class FROM services")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	services := []Service{}
	for rows.Next() {
		var s Service
		if err := rows.Scan(&s.ID, &s.Title, &s.Description, &s.IconClass); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		services = append(services, s)
	}

	json.NewEncoder(w).Encode(services)
}

func getTeamMembers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, title, bio, image_url FROM team_members")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	team := []TeamMember{}
	for rows.Next() {
		var t TeamMember
		if err := rows.Scan(&t.ID, &t.Name, &t.Title, &t.Bio, &t.ImageURL); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		team = append(team, t)
	}

	json.NewEncoder(w).Encode(team)
}

func getPosts(w http.ResponseWriter, r *http.Request) {
	// İlk önce author_name alanının var olup olmadığını kontrol et
	var columnExists bool
	checkQuery := `
		SELECT COUNT(*) > 0 as column_exists
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'polats' 
		AND TABLE_NAME = 'posts' 
		AND COLUMN_NAME = 'author_name'`

	err := db.QueryRow(checkQuery).Scan(&columnExists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var query string
	if columnExists {
		query = `
			SELECT 
				p.id, p.title, p.content, p.author_name, p.created_at, p.service_id, s.title as service_name
			FROM 
				posts p
			LEFT JOIN 
				services s ON p.service_id = s.id
			ORDER BY 
				p.created_at DESC`
	} else {
		query = `
			SELECT 
				p.id, p.title, p.content, NULL as author_name, p.created_at, p.service_id, s.title as service_name
			FROM 
				posts p
			LEFT JOIN 
				services s ON p.service_id = s.id
			ORDER BY 
				p.created_at DESC`
	}

	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.Title, &p.Content, &p.Author, &p.CreatedAt, &p.ServiceID, &p.ServiceName); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		posts = append(posts, p)
	}

	json.NewEncoder(w).Encode(posts)
}

func getPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	// İlk önce author_name alanının var olup olmadığını kontrol et
	var columnExists bool
	checkQuery := `
		SELECT COUNT(*) > 0 as column_exists
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'polats' 
		AND TABLE_NAME = 'posts' 
		AND COLUMN_NAME = 'author_name'`

	err := db.QueryRow(checkQuery).Scan(&columnExists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var query string
	if columnExists {
		query = `
			SELECT 
				p.id, p.title, p.content, p.author_name, p.created_at, p.service_id, s.title as service_name
			FROM 
				posts p
			LEFT JOIN 
				services s ON p.service_id = s.id
			WHERE 
				p.id = ?`
	} else {
		query = `
			SELECT 
				p.id, p.title, p.content, NULL as author_name, p.created_at, p.service_id, s.title as service_name
			FROM 
				posts p
			LEFT JOIN 
				services s ON p.service_id = s.id
			WHERE 
				p.id = ?`
	}

	var p Post
	err = db.QueryRow(query, id).Scan(&p.ID, &p.Title, &p.Content, &p.Author, &p.CreatedAt, &p.ServiceID, &p.ServiceName)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(p)
}

// --- API Handler'ları (Admin) ---

type LoginDetails struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var details LoginDetails
	if err := json.NewDecoder(r.Body).Decode(&details); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	log.Printf("Giriş denemesi alındı: Kullanıcı Adı='%s'", details.Username)

	var storedPassword string
	err := db.QueryRow("SELECT password_hash FROM admins WHERE TRIM(username) = ? AND username IS NOT NULL LIMIT 1", details.Username).Scan(&storedPassword)
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

	// HATA AYIKLAMA: Gelen ve veritabanındaki şifreleri terminale yazdır.
	log.Printf("Gelen Şifre: '%s'", details.Password)
	log.Printf("DB'deki Şifre: '%s'", storedPassword)

	// Düz metin şifre karşılaştırması (SADECE GELİŞTİRME İÇİN!)
	if details.Password != storedPassword {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

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

	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Token'ı Authorization header'ından al: "Bearer TOKEN"
		tokenStr := r.Header.Get("Authorization")
		if len(tokenStr) < 7 || tokenStr[:7] != "Bearer " {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		tokenStr = tokenStr[7:]

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Boş CRUD Handler'ları (Daha sonra doldurulacak)
func placeholderHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Endpoint not implemented yet.")
}

// Yeni admin handler'ları ekle
func adminGetServices(w http.ResponseWriter, r *http.Request) {
	getServices(w, r) // Public handler'ı yeniden kullanabiliriz
}
func adminGetTeam(w http.ResponseWriter, r *http.Request) {
	getTeamMembers(w, r) // Public handler'ı yeniden kullanabiliriz
}
func adminGetPosts(w http.ResponseWriter, r *http.Request) {
	getPosts(w, r) // Public handler'ı yeniden kullanabiliriz
}

// --- GERÇEK CRUD HANDLER'LARI ---

// Hizmet Ekle (POST /api/admin/services)
func createServiceHandler(w http.ResponseWriter, r *http.Request) {
	var s Service
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "INSERT INTO services (title, description, icon_class) VALUES (?, ?, ?)"
	res, err := db.Exec(query, s.Title, s.Description, s.IconClass)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	s.ID = int(id)
	json.NewEncoder(w).Encode(s)
}

// Hizmet Güncelle (PUT /api/admin/services/{id})
func updateServiceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var s Service
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "UPDATE services SET title=?, description=?, icon_class=? WHERE id=?"
	_, err := db.Exec(query, s.Title, s.Description, s.IconClass, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Güncellenmiş veriyi geri döndür
	idInt, _ := strconv.Atoi(id)
	s.ID = idInt
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

// Hizmet Sil (DELETE /api/admin/services/{id})
func deleteServiceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	_, err := db.Exec("DELETE FROM services WHERE id=?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Ekip Üyesi Ekle (POST /api/admin/team)
func createTeamMemberHandler(w http.ResponseWriter, r *http.Request) {
	var t TeamMember
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "INSERT INTO team_members (name, title, bio, image_url) VALUES (?, ?, ?, ?)"
	res, err := db.Exec(query, t.Name, t.Title, t.Bio, t.ImageURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	t.ID = int(id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

// Ekip Üyesi Güncelle (PUT /api/admin/team/{id})
func updateTeamMemberHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	var t TeamMember
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "UPDATE team_members SET name=?, title=?, bio=?, image_url=? WHERE id=?"
	_, err := db.Exec(query, t.Name, t.Title, t.Bio, t.ImageURL, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Güncellenmiş veriyi geri döndür
	idInt, _ := strconv.Atoi(id)
	t.ID = idInt
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

// Ekip Üyesi Sil (DELETE /api/admin/team/{id})
func deleteTeamMemberHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	_, err := db.Exec("DELETE FROM team_members WHERE id=?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Blog Yazısı Ekle (POST /api/admin/posts)
func createPostHandler(w http.ResponseWriter, r *http.Request) {
	var req PostRequest // Yeni request struct'ını kullan
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var serviceID sql.NullInt64
	if req.ServiceID != "" {
		if id, err := strconv.ParseInt(req.ServiceID, 10, 64); err == nil {
			serviceID.Valid = true
			serviceID.Int64 = id
		}
	}

	var author sql.NullString
	if req.Author != "" {
		author.Valid = true
		author.String = req.Author
	}

	// author_name alanının var olup olmadığını kontrol et
	var columnExists bool
	checkQuery := `
		SELECT COUNT(*) > 0 as column_exists
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'polats' 
		AND TABLE_NAME = 'posts' 
		AND COLUMN_NAME = 'author_name'`

	err := db.QueryRow(checkQuery).Scan(&columnExists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var query string
	var res sql.Result
	if columnExists {
		query = "INSERT INTO posts (title, content, author_name, service_id) VALUES (?, ?, ?, ?)"
		res, err = db.Exec(query, req.Title, req.Content, author, serviceID)
	} else {
		query = "INSERT INTO posts (title, content, service_id) VALUES (?, ?, ?)"
		res, err = db.Exec(query, req.Title, req.Content, serviceID)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	p := Post{
		ID:        int(id),
		Title:     req.Title,
		Content:   req.Content,
		Author:    author,
		ServiceID: serviceID,
	}
	json.NewEncoder(w).Encode(p)
}

// Blog Yazısı Güncelle (PUT /api/admin/posts/{id})
func updatePostHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req PostRequest // Yeni request struct'ını kullan
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var serviceID sql.NullInt64
	if req.ServiceID != "" {
		if id, err := strconv.ParseInt(req.ServiceID, 10, 64); err == nil {
			serviceID.Valid = true
			serviceID.Int64 = id
		}
	}

	var author sql.NullString
	if req.Author != "" {
		author.Valid = true
		author.String = req.Author
	}

	// author_name alanının var olup olmadığını kontrol et
	var columnExists bool
	checkQuery := `
		SELECT COUNT(*) > 0 as column_exists
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'polats' 
		AND TABLE_NAME = 'posts' 
		AND COLUMN_NAME = 'author_name'`

	err := db.QueryRow(checkQuery).Scan(&columnExists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var query string
	if columnExists {
		query = "UPDATE posts SET title = ?, content = ?, author_name = ?, service_id = ? WHERE id = ?"
		_, err = db.Exec(query, req.Title, req.Content, author, serviceID, id)
	} else {
		query = "UPDATE posts SET title = ?, content = ?, service_id = ? WHERE id = ?"
		_, err = db.Exec(query, req.Title, req.Content, serviceID, id)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	pID, _ := strconv.Atoi(id)
	p := Post{
		ID:        pID,
		Title:     req.Title,
		Content:   req.Content,
		Author:    author,
		ServiceID: serviceID,
	}
	json.NewEncoder(w).Encode(p)
}

// Blog Yazısı Sil (DELETE /api/admin/posts/{id})
func deletePostHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	_, err := db.Exec("DELETE FROM posts WHERE id=?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Dosya Yükleme Handler (POST /api/admin/upload)
func uploadFileHandler(w http.ResponseWriter, r *http.Request) {
	// 10MB limit
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Dosya çok büyük (max 10MB)", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Dosya alınamadı", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Dosya uzantısını kontrol et
	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		http.Error(w, "Sadece JPG, JPEG ve PNG dosyaları desteklenir", http.StatusBadRequest)
		return
	}

	// Assets klasörünün var olduğundan emin ol
	assetsDir := "../frontend/assets"
	if _, err := os.Stat(assetsDir); os.IsNotExist(err) {
		err := os.MkdirAll(assetsDir, 0755)
		if err != nil {
			http.Error(w, "Assets klasörü oluşturulamadı", http.StatusInternalServerError)
			return
		}
	}

	// Dosya yolu oluştur
	fileName := handler.Filename
	filePath := filepath.Join(assetsDir, fileName)

	// Dosyayı kaydet
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Dosya oluşturulamadı", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Dosya kopyalanamadı", http.StatusInternalServerError)
		return
	}

	// Başarılı response
	response := map[string]string{
		"message":  "Dosya başarıyla yüklendi",
		"filename": fileName,
		"url":      "assets/" + fileName,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	// Veritabanını başlat
	initDB()
	defer db.Close()

	// Router'ı oluştur
	r := mux.NewRouter()

	// API Rotaları
	apiPublic := r.PathPrefix("/api").Subrouter()
	apiPublic.HandleFunc("/services", getServices).Methods("GET")
	apiPublic.HandleFunc("/team", getTeamMembers).Methods("GET")
	apiPublic.HandleFunc("/posts/{id}", getPost).Methods("GET")
	apiPublic.HandleFunc("/posts", getPosts).Methods("GET")

	// Admin API Rotaları
	// 1. Korumasız Rota: Login
	r.HandleFunc("/api/admin/login", loginHandler).Methods("POST")

	// 2. Korumalı Rota Grubu
	apiAdminProtected := r.PathPrefix("/api/admin").Subrouter()
	apiAdminProtected.Use(authMiddleware) // Middleware sadece bu gruba uygulanacak

	// Korumalı Admin "GET" Rotaları
	apiAdminProtected.HandleFunc("/services", adminGetServices).Methods("GET")
	apiAdminProtected.HandleFunc("/team", adminGetTeam).Methods("GET")
	apiAdminProtected.HandleFunc("/posts", adminGetPosts).Methods("GET")

	// Korumalı Admin CRUD Rotaları
	apiAdminProtected.HandleFunc("/services", createServiceHandler).Methods("POST")
	apiAdminProtected.HandleFunc("/services/{id}", updateServiceHandler).Methods("PUT")
	apiAdminProtected.HandleFunc("/services/{id}", deleteServiceHandler).Methods("DELETE")

	apiAdminProtected.HandleFunc("/team", createTeamMemberHandler).Methods("POST")
	apiAdminProtected.HandleFunc("/team/{id}", updateTeamMemberHandler).Methods("PUT")
	apiAdminProtected.HandleFunc("/team/{id}", deleteTeamMemberHandler).Methods("DELETE")

	apiAdminProtected.HandleFunc("/posts", createPostHandler).Methods("POST")
	apiAdminProtected.HandleFunc("/posts/{id}", updatePostHandler).Methods("PUT")
	apiAdminProtected.HandleFunc("/posts/{id}", deletePostHandler).Methods("DELETE")

	// Dosya yükleme rotası
	apiAdminProtected.HandleFunc("/upload", uploadFileHandler).Methods("POST")

	// Admin panelini sun
	// /admin/ yolundan sonraki kısmı alıp ../admin dizininde arar.
	adminFileServer := http.FileServer(http.Dir("../admin"))
	r.PathPrefix("/admin/").Handler(http.StripPrefix("/admin/", adminFileServer))

	// Frontend dosyalarını sun (en sonda olmalı ki diğer rotaları ezmesin)
	frontendFileServer := http.FileServer(http.Dir("../frontend"))
	r.PathPrefix("/").Handler(frontendFileServer)

	// CORS Middleware
	corsHandler := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, multipart/form-data")
			w.Header().Set("Access-Control-Max-Age", "3600")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			h.ServeHTTP(w, r)
		})
	}

	log.Println("Sunucu http://localhost:8061 adresinde başlatılıyor...")
	err := http.ListenAndServe(":8061", corsHandler(r))
	if err != nil {
		log.Fatalf("Sunucu başlatılamadı: %s\n", err)
	}
}
